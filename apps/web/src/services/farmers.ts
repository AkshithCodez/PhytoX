import "server-only";
import { z } from "zod";
import { context, checkDb, ApiError, jsonBody } from "@/lib/server";
import { trustedClient } from "@/lib/supabase/trusted";
import { inviteFarmerSchema, updateFarmerStatusSchema, type Profile } from "@/lib/contracts";

export async function getOfficerJurisdiction(userId: string, isAdmin: boolean, db: any): Promise<string[]> {
  if (isAdmin) {
    const { data: allRegions, error } = await db.from("regions").select("id");
    checkDb(error);
    return (allRegions || []).map((r: { id: string }) => r.id);
  }
  const { data: assignments, error } = await db
    .from("officer_regions")
    .select("region_id")
    .eq("officer_id", userId);
  checkDb(error);
  return (assignments || []).map((a: { region_id: string }) => a.region_id);
}

export async function listFarmers(request: Request) {
  const { db, user, profile } = await context(true);
  const isAdmin = profile.role === "admin";
  const jurisdiction = await getOfficerJurisdiction(user.id, isAdmin, db);

  if (jurisdiction.length === 0) {
    return { farmers: [], total: 0 };
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.toLowerCase() || "";
  const statusFilter = url.searchParams.get("status");
  const regionFilter = url.searchParams.get("region");

  let query = db
    .from("user_profiles")
    .select("*, regions(id, name)")
    .eq("role", "farmer")
    .in("region_id", jurisdiction)
    .order("created_at", { ascending: false });

  if (regionFilter && jurisdiction.includes(regionFilter)) {
    query = query.eq("region_id", regionFilter);
  }

  if (statusFilter && ["invited", "pending_activation", "active", "suspended", "deactivated"].includes(statusFilter)) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query.limit(200);
  checkDb(error);

  let farmers = (data || []) as any[];

  if (q) {
    farmers = farmers.filter(
      (f) =>
        f.display_name?.toLowerCase().includes(q) ||
        f.village?.toLowerCase().includes(q) ||
        f.phone?.toLowerCase().includes(q)
    );
  }

  // Enrich with plot counts and email from auth admin
  const trusted = trustedClient();
  const farmerIds = farmers.map((f) => f.id);

  let plotCounts: Record<string, number> = {};
  if (farmerIds.length > 0) {
    const { data: plots } = await db
      .from("monitored_plots")
      .select("owner_id")
      .in("owner_id", farmerIds);
    if (plots) {
      for (const p of plots) {
        plotCounts[p.owner_id] = (plotCounts[p.owner_id] || 0) + 1;
      }
    }
  }

  const enriched = farmers.map((f) => ({
    ...f,
    plot_count: plotCounts[f.id] || 0,
  }));

  return { farmers: enriched, total: enriched.length };
}

export async function inviteFarmer(request: Request) {
  const { db, user, profile } = await context(true);
  const isAdmin = profile.role === "admin";
  const jurisdiction = await getOfficerJurisdiction(user.id, isAdmin, db);

  const body = await jsonBody(request);
  const payload = inviteFarmerSchema.parse(body);

  if (!jurisdiction.includes(payload.region_id)) {
    throw new ApiError(403, "forbidden_jurisdiction", "You do not have jurisdiction in the selected region.");
  }

  const trusted = trustedClient();

  // Check if an auth user with this email already exists
  let targetUserId: string | null = null;
  let actionLink = "";

  try {
    // Generate an invite link using Supabase Admin
    const { data: linkData, error: linkErr } = await trusted.auth.admin.generateLink({
      type: "invite",
      email: payload.email,
      options: {
        data: {
          display_name: payload.display_name,
        },
      },
    });

    if (linkErr) {
      // If user already registered, check if we can associate profile
      if (linkErr.message?.toLowerCase().includes("already registered") || linkErr.status === 422) {
        // Find existing user id
        const { data: usersData, error: listErr } = await trusted.auth.admin.listUsers();
        if (!listErr && usersData?.users) {
          const match = usersData.users.find((u) => u.email?.toLowerCase() === payload.email.toLowerCase());
          if (match) targetUserId = match.id;
        }
      } else {
        throw linkErr;
      }
    } else if (linkData?.user) {
      targetUserId = linkData.user.id;
      actionLink = linkData.properties?.action_link || "";
    }
  } catch (err: any) {
    // Fallback: create confirmed user with an ephemeral password setup token
    const ephemeralPass = `PhytoX_Setup_${Date.now()}_${Math.random().toString(36).slice(2)}!`;
    const { data: newUser, error: createErr } = await trusted.auth.admin.createUser({
      email: payload.email,
      password: ephemeralPass,
      email_confirm: true,
      user_metadata: {
        display_name: payload.display_name,
      },
    });
    if (createErr) {
      throw new ApiError(400, "user_creation_failed", createErr.message);
    }
    targetUserId = newUser.user.id;
  }

  if (!targetUserId) {
    throw new ApiError(500, "onboarding_failed", "Could not establish user identity in authentication provider.");
  }

  // Upsert profile in user_profiles
  const { error: profileErr } = await trusted.from("user_profiles").upsert({
    id: targetUserId,
    display_name: payload.display_name,
    role: "farmer",
    language: payload.language,
    region_id: payload.region_id,
    status: "invited",
    invited_by: user.id,
    phone: payload.phone || "",
    village: payload.village || "",
    farm_size: payload.farm_size || "",
  });
  checkDb(profileErr);

  // Record audit log
  await trusted.from("audit_logs").insert({
    actor_id: user.id,
    action: "farmer.invite",
    record_id: targetUserId,
    region_id: payload.region_id,
    details: {
      email: payload.email,
      display_name: payload.display_name,
      village: payload.village,
      language: payload.language,
    },
  });

  return {
    id: targetUserId,
    email: payload.email,
    display_name: payload.display_name,
    status: "invited",
    action_link: actionLink,
    message: "Farmer account successfully provisioned and linked to your jurisdiction.",
  };
}

export async function updateFarmer(farmerId: string, request: Request) {
  const { db, user, profile } = await context(true);
  const isAdmin = profile.role === "admin";
  const jurisdiction = await getOfficerJurisdiction(user.id, isAdmin, db);

  const { data: targetFarmer, error: findErr } = await db
    .from("user_profiles")
    .select("*, regions(name)")
    .eq("id", farmerId)
    .eq("role", "farmer")
    .single();
  checkDb(findErr);

  if (!targetFarmer) {
    throw new ApiError(404, "not_found", "Farmer record not found.");
  }

  if (!jurisdiction.includes(targetFarmer.region_id)) {
    throw new ApiError(403, "forbidden_jurisdiction", "You do not have jurisdiction over this farmer.");
  }

  const body = await jsonBody(request);
  const payload = updateFarmerStatusSchema.parse(body);

  const trusted = trustedClient();
  const { error: updateErr } = await trusted
    .from("user_profiles")
    .update({ status: payload.status })
    .eq("id", farmerId);
  checkDb(updateErr);

  // Record audit log
  await trusted.from("audit_logs").insert({
    actor_id: user.id,
    action: "farmer.status_change",
    record_id: farmerId,
    region_id: targetFarmer.region_id,
    details: {
      from: targetFarmer.status,
      to: payload.status,
      notes: payload.notes || "",
    },
  });

  return {
    id: farmerId,
    status: payload.status,
    message: `Farmer status updated to ${payload.status}.`,
  };
}
