"use client";
import { Suspense } from "react";
import { LanguagePicker } from "@/components/locale";
import { useRouter, useSearchParams } from "next/navigation";
import { Loading } from "@/components/ui";

function LanguageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/farmer";

  return (
    <LanguagePicker
      onDone={() => {
        router.push(next);
      }}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <LanguageContent />
    </Suspense>
  );
}
