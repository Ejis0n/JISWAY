import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getAppBaseUrl } from "@/lib/baseUrl";
import { CookieBanner } from "@/components/CookieBanner";
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
  verification: {
    google: "FKmvd2HnASSbBIlGg5RhL8OG_yG1dNfxov97kaqa52g",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-78DN3QC4VK"
          strategy="beforeInteractive"
        />
        <Script id="google-analytics" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-78DN3QC4VK');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white focus:outline-none dark:focus:bg-white dark:focus:text-black"
        >
          Skip to main content
        </a>
        <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
          <SiteHeader />
          <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
        </div>
        <CookieBanner />
        <EventBeacon />
      </body>
    </html>
  );
}
