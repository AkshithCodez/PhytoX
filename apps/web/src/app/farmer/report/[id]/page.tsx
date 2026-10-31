import { FarmerReport } from "@/features/diagnosis/result";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <FarmerReport id={(await params).id} />;
}
