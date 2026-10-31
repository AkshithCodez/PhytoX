import { notFound } from "next/navigation";
import { OfficerWorkspace } from "@/features/analytics/workspace";
import { SettingsView } from "@/features/auth/settings";
export default async function Page({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  if (view === "settings") return <SettingsView />;
  if (
    view !== "reports" &&
    view !== "map" &&
    view !== "monitoring" &&
    view !== "analytics"
  )
    notFound();
  return <OfficerWorkspace view={view} />;
}
