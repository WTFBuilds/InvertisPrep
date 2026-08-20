import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuizSocketProvider } from "@/contexts/QuizSocketContext";
import SiteShell from "@/components/layout/SiteShell";
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
        <AuthProvider>
          <QuizSocketProvider>
            <SiteShell>{children}</SiteShell>
          </QuizSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
