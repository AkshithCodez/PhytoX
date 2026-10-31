import { redirect } from "next/navigation";
import { context, ApiError } from "@/lib/server";
import { isConfigured } from "@/lib/supabase/config";
import { Setup } from "./ui";
import { LanguageGate } from "./locale";
import { Shell } from "./shell";
export async function PortalLayout({
  children,
  officer = false,
}: {
  children: React.ReactNode;
  officer?: boolean;
}) {
  if (!isConfigured())
    return (
      <LanguageGate>
        <Setup />
      </LanguageGate>
    );
  let name = "";
  try {
    const { profile } = await context(officer);
    name = profile.display_name;
  } catch (error) {
    if (error instanceof ApiError && error.status === 403)
      return (
        <main className="setup">
          <h1>Officer access required</h1>
          <p>
            Your account does not have an officer assignment. Ask your platform
            administrator.
          </p>
          <a className="button" href="/farmer">
            Farmer workspace
          </a>
        </main>
      );
    if (error instanceof ApiError && error.status === 401)
      redirect(`/auth/login?portal=${officer ? "officer" : "farmer"}`);
    throw error;
  }
  return (
    <Shell officer={officer} name={name}>
      {children}
    </Shell>
  );
}
