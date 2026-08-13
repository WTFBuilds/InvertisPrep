import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Quizzo – Invertis University Quiz & 1v1 Trivia",
  description:
    "Play free general knowledge and academic quiz games on Quizzo by InvertisPrep — solo practice, 1v1 multiplayer matches and weekly leaderboards for Invertis University students.",
  keywords: [
    "Invertis quiz",
    "Quizzo InvertisPrep",
    "1v1 quiz game",
    "online quiz for students",
    "general knowledge quiz India",
    "Invertis University quiz",
  ],
  path: "/quizz0",
});

export default function Quizz0Layout({ children }: { children: React.ReactNode }) {
  return children;
}
