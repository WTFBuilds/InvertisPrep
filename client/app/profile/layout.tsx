import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// Covers /profile and /profile/[userId] — user-specific pages, not for search engines.
export const metadata: Metadata = buildMetadata({
  title: "Profile",
  path: "/profile",
  robotsIndex: false,
});

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
