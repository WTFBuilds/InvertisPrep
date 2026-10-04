import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "My Quiz History",
  path: "/quizz0/history",
  robotsIndex: false,
});

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
