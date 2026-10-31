import { notFound } from "next/navigation";
import { AuthForm } from "@/features/auth/auth-form";
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
  return <AuthForm mode={mode} />;
}
