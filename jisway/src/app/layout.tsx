import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getAppBaseUrl } from "@/lib/baseUrl";
import { EventBeacon } from "@/components/EventBeacon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "JISWAY — JIS Fasteners Procurement",
    template: "%s — JISWAY",
  },
  metadataBase: new URL(getAppBaseUrl()),
  description:
    "Global procurement portal for JIS fasteners (bolts, nuts, washers). Ships worldwide. No inventory — procured after payment confirmation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content="FKmvd2HnASSbBIlGg5RhL8OG_yG1dNfxov97kaqa52g"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
          <SiteFooter />
        </div>
        <EventBeacon />
      </body>
    </html>
  );
}
