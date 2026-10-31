import { PortalLayout } from "@/components/portal-layout";
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <PortalLayout officer>{children}</PortalLayout>;
}
