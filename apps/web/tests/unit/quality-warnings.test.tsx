// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LocaleProvider } from "@/components/locale";
import { QualityWarnings } from "@/features/diagnosis/result";
import { en, te, hi } from "@/lib/messages";
afterEach(() => { cleanup(); localStorage.clear(); });
for (const [language, messages] of Object.entries({ en, te, hi })) {
  it(`explains image problems in ${language} without exposing service codes`, async () => {
    localStorage.setItem("phytox-language", language);
    render(<LocaleProvider><QualityWarnings warnings={["low_resolution", "underexposed", "overexposed", "future_code"]} /></LocaleProvider>);
    for (const key of ["qualityLowResolution", "qualityUnderexposed", "qualityOverexposed", "qualityUnknown"] as const)
      expect(await screen.findByText(messages[key])).toBeTruthy();
    expect(screen.queryByText(/low_resolution|underexposed|overexposed|future_code/)).toBeNull();
  });
}
