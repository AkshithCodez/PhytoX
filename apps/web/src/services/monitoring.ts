import "server-only";
import { serverClient } from "@/lib/supabase/server";
import { checkDb, ApiError } from "@/lib/server";

export interface PlotRecord {
  id: string;
  owner_id: string;
  name: string;
  crop: string;
  region_id: string;
  planting_date: string | null;
  plot_area: string;
  status: "active" | "archived";
  created_at: string;
  schedule?: {
    cadence: string;
    observation_days: string[];
    next_due_date: string;
  } | null;
  observations_count?: number;
  recent_observation?: {
    id: string;
    observation_date: string;
    image_path: string;
    image_url?: string;
    symptoms: string[];
    ai_assessment: any;
  } | null;
}

export interface ObservationRecord {
  id: string;
  plot_id: string;
  owner_id: string;
  observation_date: string;
  image_path: string;
  image_url?: string;
  symptoms: string[];
  notes: string;
  ai_assessment: any;
  status: "submitted" | "reviewed" | "flagged";
  created_at: string;
}

export interface MonitoringSignalRecord {
  id: string;
  plot_id: string;
  region_id: string;
  signal_type: "recurrent_disease" | "confidence_shift" | "symptom_progression" | "regional_cluster";
  severity: "low" | "medium" | "high";
  suspected_condition: string;
  notes: string;
  status: "open" | "reviewed" | "dismissed" | "advisory_issued";
  created_at: string;
  monitored_plots?: {
    name: string;
    crop: string;
    owner_id: string;
    user_profiles?: {
      display_name: string;
      village: string;
      phone: string;
    };
  };
  regions?: {
    name: string;
  };
}

export interface AdvisoryRecord {
  id: string;
  signal_id: string | null;
  plot_id: string;
  officer_id: string;
  farmer_id: string;
  advisory_text: string;
  recommendations: string[];
  created_at: string;
  officer?: {
    display_name: string;
  };
  plot?: {
    name: string;
    crop: string;
  };
}

function calculateNextDueDate(): string {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1 is Monday, 4 is Thursday
  let daysToAdd = 3;
  if (day >= 1 && day < 4) {
    // If Mon, Tue, Wed -> next is Thursday
    daysToAdd = 4 - day;
  } else if (day === 4) {
    // If Thursday -> next is Monday (4 days)
    daysToAdd = 4;
  } else if (day === 5) {
    // Friday -> Monday (3 days)
    daysToAdd = 3;
  } else if (day === 6) {
    // Saturday -> Monday (2 days)
    daysToAdd = 2;
  } else {
    // Sunday -> Monday (1 day)
    daysToAdd = 1;
  }
  const nextDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return nextDate.toISOString().split("T")[0];
}

export async function listFarmerPlots(farmerId: string): Promise<PlotRecord[]> {
  const db = await serverClient();
  const { data: plots, error } = await db
    .from("monitored_plots")
    .select(`
      *,
      monitoring_schedules (
        cadence,
        observation_days,
        next_due_date
      )
    `)
    .eq("owner_id", farmerId)
    .order("created_at", { ascending: false });

  checkDb(error);
  if (!plots) return [];

  // Fetch recent observations count and latest observation for each plot
  const enrichedPlots = await Promise.all(
    plots.map(async (p: any) => {
      const { data: obs } = await db
        .from("crop_observations")
        .select("*")
        .eq("plot_id", p.id)
        .order("observation_date", { ascending: false })
        .limit(1);

      let recent_observation = null;
      if (obs && obs.length > 0) {
        const item = obs[0];
        let signedUrl = undefined;
        if (item.image_path) {
          const { data: urlData } = await db.storage
            .from("crop-images")
            .createSignedUrl(item.image_path, 3600);
          signedUrl = urlData?.signedUrl;
        }
        recent_observation = {
          id: item.id,
          observation_date: item.observation_date,
          image_path: item.image_path,
          image_url: signedUrl,
          symptoms: item.symptoms || [],
          ai_assessment: item.ai_assessment || {},
        };
      }

      return {
        ...p,
        schedule: p.monitoring_schedules?.[0] || p.monitoring_schedules || null,
        recent_observation,
      };
    })
  );

  return enrichedPlots;
}

export async function createMonitoredPlot(
  farmerId: string,
  regionId: string,
  input: {
    name: string;
    crop: string;
    planting_date?: string;
    plot_area?: string;
  }
): Promise<PlotRecord> {
  const db = await serverClient();
  const { data: plot, error } = await db
    .from("monitored_plots")
    .insert({
      owner_id: farmerId,
      region_id: regionId,
      name: input.name.trim(),
      crop: input.crop.trim(),
      planting_date: input.planting_date || null,
      plot_area: input.plot_area || "",
      status: "active",
    })
    .select()
    .single();

  checkDb(error);
  if (!plot) throw new ApiError(500, "create_failed", "Failed to create monitored plot.");

  // Create default observation schedule (Mon & Thu)
  const nextDue = calculateNextDueDate();
  await db.from("monitoring_schedules").insert({
    plot_id: plot.id,
    cadence: "twice_weekly",
    observation_days: ["monday", "thursday"],
    next_due_date: nextDue,
  });

  return {
    ...plot,
    schedule: {
      cadence: "twice_weekly",
      observation_days: ["monday", "thursday"],
      next_due_date: nextDue,
    },
  };
}

export async function recordCropObservation(
  farmerId: string,
  input: {
    plot_id: string;
    image_path: string;
    symptoms?: string[];
    notes?: string;
    ai_assessment?: any;
    observation_date?: string;
  }
): Promise<ObservationRecord> {
  const db = await serverClient();

  // Verify plot ownership
  const { data: plot, error: plotErr } = await db
    .from("monitored_plots")
    .select("id, region_id, crop, name")
    .eq("id", input.plot_id)
    .eq("owner_id", farmerId)
    .single();

  if (plotErr || !plot) {
    throw new ApiError(404, "plot_not_found", "Monitored plot not found or unauthorized.");
  }

  const observationDate = input.observation_date || new Date().toISOString().split("T")[0];

  const { data: obs, error: obsErr } = await db
    .from("crop_observations")
    .insert({
      plot_id: input.plot_id,
      owner_id: farmerId,
      observation_date: observationDate,
      image_path: input.image_path,
      symptoms: input.symptoms || [],
      notes: (input.notes || "").slice(0, 2000),
      ai_assessment: input.ai_assessment || {},
      status: "submitted",
    })
    .select()
    .single();

  checkDb(obsErr);

  // Update schedule next due date
  const nextDue = calculateNextDueDate();
  await db
    .from("monitoring_schedules")
    .update({ next_due_date: nextDue, updated_at: new Date().toISOString() })
    .eq("plot_id", input.plot_id);

  // Rule-based early warning signal evaluation
  try {
    const aiDiagnosis = input.ai_assessment?.disease || input.ai_assessment?.condition;
    if (aiDiagnosis && !aiDiagnosis.toLowerCase().includes("healthy")) {
      // Check prior observations on this plot in the last 14 days
      const { data: priorObs } = await db
        .from("crop_observations")
        .select("ai_assessment, observation_date")
        .eq("plot_id", input.plot_id)
        .neq("id", obs.id)
        .order("observation_date", { ascending: false })
        .limit(2);

      const hasRecurrent = priorObs?.some(
        (p: any) =>
          p.ai_assessment?.disease === aiDiagnosis ||
          p.ai_assessment?.condition === aiDiagnosis
      );

      if (hasRecurrent) {
        // Trigger recurrent disease early warning signal
        await db.from("monitoring_signals").insert({
          plot_id: input.plot_id,
          region_id: plot.region_id,
          signal_type: "recurrent_disease",
          severity: "high",
          suspected_condition: aiDiagnosis,
          notes: `Repeated detection of ${aiDiagnosis} on plot '${plot.name}' across sequential observation dates. Immediate officer review and preventive intervention recommended.`,
          status: "open",
        });
      }

      // Check regional clustering: 3+ observations with same disease in region over past 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: regionalPlots } = await db
        .from("monitored_plots")
        .select("id")
        .eq("region_id", plot.region_id);

      const plotIds = (regionalPlots || []).map((p: any) => p.id);
      if (plotIds.length > 0) {
        const { data: clusterObs } = await db
          .from("crop_observations")
          .select("id, plot_id, ai_assessment")
          .in("plot_id", plotIds)
          .gte("observation_date", sevenDaysAgo);

        const matchingObs = (clusterObs || []).filter(
          (o: any) =>
            o.ai_assessment?.disease === aiDiagnosis ||
            o.ai_assessment?.condition === aiDiagnosis
        );

        if (matchingObs.length >= 3) {
          // Trigger regional cluster early warning
          await db.from("monitoring_signals").insert({
            plot_id: input.plot_id,
            region_id: plot.region_id,
            signal_type: "regional_cluster",
            severity: "high",
            suspected_condition: aiDiagnosis,
            notes: `Cluster alert: ${matchingObs.length} distinct foliar observations indicating ${aiDiagnosis} in this regional zone within the last 7 days.`,
            status: "open",
          });
        }
      }
    }
  } catch (err) {
    // Non-fatal if signal evaluation fails
    console.error("Signal evaluation warning:", err);
  }

  let signedUrl = undefined;
  if (obs.image_path) {
    const { data: urlData } = await db.storage
      .from("crop-images")
      .createSignedUrl(obs.image_path, 3600);
    signedUrl = urlData?.signedUrl;
  }

  return {
    ...obs,
    image_url: signedUrl,
  };
}

export async function listOfficerSignals(officerId: string): Promise<MonitoringSignalRecord[]> {
  const db = await serverClient();

  // Get officer's assigned regions
  const { data: assignments } = await db
    .from("officer_regions")
    .select("region_id")
    .eq("officer_id", officerId);

  const regionIds = (assignments || []).map((a: any) => a.region_id);
  if (regionIds.length === 0) return [];

  const { data: signals, error } = await db
    .from("monitoring_signals")
    .select(`
      *,
      monitored_plots (
        name,
        crop,
        owner_id,
        user_profiles:owner_id (
          display_name,
          village,
          phone
        )
      ),
      regions (
        name
      )
    `)
    .in("region_id", regionIds)
    .order("created_at", { ascending: false });

  checkDb(error);
  return (signals as MonitoringSignalRecord[]) || [];
}

export async function issueMonitoringAdvisory(
  officerId: string,
  input: {
    signal_id?: string | null;
    plot_id: string;
    farmer_id: string;
    advisory_text: string;
    recommendations?: string[];
  }
): Promise<AdvisoryRecord> {
  const db = await serverClient();

  const { data: advisory, error } = await db
    .from("monitoring_advisories")
    .insert({
      signal_id: input.signal_id || null,
      plot_id: input.plot_id,
      officer_id: officerId,
      farmer_id: input.farmer_id,
      advisory_text: input.advisory_text.trim(),
      recommendations: input.recommendations || [],
    })
    .select()
    .single();

  checkDb(error);

  if (input.signal_id) {
    await db
      .from("monitoring_signals")
      .update({
        status: "advisory_issued",
        reviewed_by: officerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", input.signal_id);
  }

  return advisory;
}

export async function listFarmerAdvisories(farmerId: string): Promise<AdvisoryRecord[]> {
  const db = await serverClient();
  const { data: advisories, error } = await db
    .from("monitoring_advisories")
    .select(`
      *,
      officer:officer_id (
        display_name
      ),
      plot:plot_id (
        name,
        crop
      )
    `)
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false });

  checkDb(error);
  return (advisories as AdvisoryRecord[]) || [];
}
