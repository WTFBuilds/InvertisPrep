import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Play Quizzo",
  path: "/quizz0/play",
  robotsIndex: false,
});

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
