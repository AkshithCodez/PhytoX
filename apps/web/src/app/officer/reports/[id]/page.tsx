import { OfficerReview } from "@/features/reporting/officer-review";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <OfficerReview id={(await params).id} />;
}
