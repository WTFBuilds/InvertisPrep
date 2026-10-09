import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuizSocketProvider } from "@/contexts/QuizSocketContext";
import SiteShell from "@/components/layout/SiteShell";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/lib/seo";

// Using system font fallbacks instead of next/font to avoid Turbopack font-loader issues

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: "%s | InvertisPrep",
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.openGraphImage,
        width: 1200,
        height: 1200,
        alt: `${siteConfig.name} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.openGraphImage],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  // Google AdSense account verification. Next's Metadata API renders this as
  // <meta name="google-adsense-account" content="…"> in <head>.
  other: {
    "google-adsense-account": "ca-pub-5660199982106752",
  },
  // Google Search Console: set GOOGLE_SITE_VERIFICATION in the environment to
  // the value of the "google-site-verification" meta tag GSC offers.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased flex flex-col min-h-screen`}>
        {/* Google AdSense — account verification + Auto ads. Loaded
            afterInteractive so it never blocks first paint; present on every
            route because this is the root layout. */}
        <Script
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5660199982106752"
          crossOrigin="anonymous"
        />
        <AuthProvider>
          <QuizSocketProvider>
            <SiteShell>{children}</SiteShell>
          </QuizSocketProvider>
        </AuthProvider>
        {/* Vercel Analytics: no-ops in local dev; collects page views on the
            Vercel deployments (both domains share the same project). */}
        <Analytics />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
