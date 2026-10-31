import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/components/locale";
import { Pwa } from "@/components/pwa";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "PhytoX — Healthy crops. A clearer picture.",
    template: "%s · PhytoX",
  },
  description:
    "AI-assisted crop assessment and responsible regional agricultural intelligence.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#163f30",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <LocaleProvider>
          {children}
          <Pwa />
        </LocaleProvider>
      </body>
    </html>
  );
}
