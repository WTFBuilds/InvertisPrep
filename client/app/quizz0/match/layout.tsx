import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// Force dynamic rendering — these pages need client-side socket connections
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Quiz Match",
  path: "/quizz0/match",
  robotsIndex: false,
});

export default function MatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
