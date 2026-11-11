// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { LocaleProvider, LanguageGate, useLocale } from "@/components/locale";
function Content() {
  const { t } = useLocale();
  return <h1>{t("welcome")}</h1>;
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});
it("asks for a language before rendering the farmer experience and persists Telugu", async () => {
  render(
    <LocaleProvider>
      <LanguageGate>
        <Content />
      </LanguageGate>
    </LocaleProvider>,
  );
  expect(await screen.findByText("Grow in your language.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /తెలుగు/ }));
  fireEvent.click(screen.getByRole("button", { name: "కొనసాగించండి" }));
  expect(
    await screen.findByText("ఆరోగ్యకరమైన పంటకు జాగ్రత్తగా పరిశీలించండి."),
  ).toBeTruthy();
  expect(localStorage.getItem("phytox-language")).toBe("te");
  expect(document.documentElement.lang).toBe("te");
});
it("restores the selected language on a returning visit", async () => {
  localStorage.setItem("phytox-language", "hi");
  render(
    <LocaleProvider>
      <LanguageGate>
        <Content />
      </LanguageGate>
    </LocaleProvider>,
  );
  expect(
    await screen.findByText("स्वस्थ फसल की शुरुआत ध्यान से देखने से होती है।"),
  ).toBeTruthy();
  expect(screen.queryByText("Grow in your language.")).toBeNull();
});
it("keeps language selection usable when browser storage is disabled", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
  render(<LocaleProvider><LanguageGate><Content /></LanguageGate></LocaleProvider>);
  expect(await screen.findByText("Grow in your language.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /తెలుగు/ }));
  fireEvent.click(screen.getByRole("button", { name: "కొనసాగించండి" }));
  expect(await screen.findByText("ఆరోగ్యకరమైన పంటకు జాగ్రత్తగా పరిశీలించండి.")).toBeTruthy();
  expect(document.documentElement.lang).toBe("te");
});
