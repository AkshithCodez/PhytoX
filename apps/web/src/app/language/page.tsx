"use client";
import { LanguagePicker } from "@/components/locale";
import { useRouter } from "next/navigation";
export default function Page() {
  const router = useRouter();
  return <LanguagePicker onDone={() => router.push("/farmer")} />;
}
