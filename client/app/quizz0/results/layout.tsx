import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// Force dynamic rendering — these pages need client-side state
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Quiz Results",
  path: "/quizz0/results",
  robotsIndex: false,
});

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
