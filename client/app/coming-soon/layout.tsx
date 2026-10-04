import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// Covers /coming-soon/[feature] — placeholder pages add no search value.
export const metadata: Metadata = buildMetadata({
  title: "Coming Soon",
  path: "/coming-soon",
  robotsIndex: false,
});

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
