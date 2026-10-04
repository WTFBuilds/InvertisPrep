import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Quizzo Leaderboard",
  path: "/quizz0/leaderboard",
  robotsIndex: false,
});

export default function Quizz0LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
