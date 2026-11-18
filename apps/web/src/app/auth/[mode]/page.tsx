import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AuthForm } from "@/features/auth/auth-form";
import { Loading } from "@/components/ui";

export default async function Page({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  if (
    mode !== "login" &&
    mode !== "register" &&
    mode !== "recovery" &&
    mode !== "update-password"
  )
    notFound();
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm mode={mode} />
    </Suspense>
  );
}
