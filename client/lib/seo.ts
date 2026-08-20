import type { Metadata } from "next";

/**
 * Central SEO configuration for InvertisPrep.
 *
 * `url` is the canonical domain Google should index. If the primary domain
 * ever changes (e.g. back to the Vercel preview), update it here — every
 * canonical link, og:url, sitemap and robots reference derives from this.
 */
export const siteConfig: {
  name: string;
  url: string;
  title: string;
  description: string;
  keywords: string[];
  openGraphImage: string;
  themeColor: string;
} = {
  name: "InvertisPrep",
  url: "https://www.invertisprep.in",
  title: "InvertisPrep – Invertis University PYQ Papers & Free Resume Builder",
  description:
    "Free previous year question papers (PYQ) for Invertis University — B.Tech, BCA, BBA, MCA and more. Download semester-wise, branch-wise & subject-wise exam papers with a free ATS-friendly resume builder.",
  keywords: [
    "Invertis University PYQ",
    "Invertis previous year question papers",
    "InvertisPrep",
    "PYQ papers Invertis University",
    "Invertis University question bank",
    "Invertis University previous year questions",
    "Invertis University semester exam papers",
    "Invertis University B.Tech question papers",
    "Invertis University BCA question papers",
    "Invertis University BBA question papers",
    "Invertis University MCA question papers",
    "Invertis University mid-term papers",
    "Invertis University end-term papers",
    "Invertis University syllabus",
    "Invertis University resources",
    "free ATS resume builder",
    "ATS resume builder for students",
    "Invertis quiz",
    "Invertis University quiz",
    "previous year question papers PDF",
    "exam papers for Invertis students",
  ],
  openGraphImage: "/logo.jpeg",
  themeColor: "#4f46e5",
};

type SeoOverrides = {
  title?: string;
  description?: string;
  keywords?: string[];
  path?: string;
  robotsIndex?: boolean;
};

/** Build a page-level Metadata object that inherits site-wide defaults. */
export function buildMetadata(overrides: SeoOverrides = {}): Metadata {
  const {
    title,
    description = siteConfig.description,
    keywords = siteConfig.keywords,
    path = "/",
    robotsIndex = true,
  } = overrides;

  const canonicalUrl = `${siteConfig.url}${path === "/" ? "" : path}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: canonicalUrl,
      siteName: siteConfig.name,
      title: title ?? siteConfig.title,
      description,
      images: [{ url: siteConfig.openGraphImage, alt: `${siteConfig.name} logo` }],
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? siteConfig.title,
      description,
      images: [siteConfig.openGraphImage],
    },
    robots: {
      index: robotsIndex,
      follow: robotsIndex,
      googleBot: {
        index: robotsIndex,
        follow: robotsIndex,
      },
    },
  };
}
