import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// Covers all /view/[id] routes — viewer pages are user-specific, not for search engines.
export const metadata: Metadata = buildMetadata({
  title: "View Document",
  path: "/view",
  robotsIndex: false,
});

export default function ViewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
