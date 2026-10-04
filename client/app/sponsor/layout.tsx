import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sponsor Us – Partner With InvertisPrep",
  description:
    "Sponsor InvertisPrep and put your brand in front of thousands of Invertis University students who use our free PYQ papers, study resources and Quizzo platform every day.",
  keywords: [
    "sponsor InvertisPrep",
    "InvertisPrep sponsors",
    "college platform sponsorship",
    "Invertis University student platform",
  ],
  path: "/sponsor",
});

export default function SponsorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
