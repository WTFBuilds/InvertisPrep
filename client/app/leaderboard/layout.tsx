import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Leaderboard – Top Quizzo Players",
  description:
    "See the top Quizzo players and highest quiz scores on InvertisPrep's leaderboard — weekly quiz rankings for Invertis University students.",
  keywords: [
    "InvertisPrep leaderboard",
    "Quizzo leaderboard",
    "Invertis quiz rankings",
    "quiz top scorers Invertis University",
  ],
  path: "/leaderboard",
});

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
