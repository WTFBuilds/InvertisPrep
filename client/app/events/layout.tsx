import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Events – Invertis University",
  description:
    "Explore upcoming and past events at Invertis University — fests, technical events, workshops and student activities listed on InvertisPrep.",
  keywords: [
    "Invertis University events",
    "Invertis fests",
    "Invertis technical events",
    "InvertisPrep events",
  ],
  path: "/events",
});

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
