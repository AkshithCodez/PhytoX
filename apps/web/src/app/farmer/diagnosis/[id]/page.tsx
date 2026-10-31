import { ResultView } from "@/features/diagnosis/result";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ResultView id={(await params).id} />;
}
