import type { Metadata, Viewport } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "KHAM Cairo",
  description:
    "A curated marketplace of authentic beauty, wellness and lifestyle brands from Egypt, Morocco and around the world.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "KHAM Cairo",
    description:
      "A curated marketplace of authentic beauty, wellness and lifestyle brands from Egypt, Morocco and around the world.",
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#2A3128",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-cream text-ink">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
