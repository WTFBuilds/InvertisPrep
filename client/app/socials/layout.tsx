import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Socials – Connect With InvertisPrep",
  description:
    "Follow InvertisPrep on social media for PYQ updates, quiz announcements and Invertis University campus news — find all our official social links in one place.",
  keywords: [
    "InvertisPrep social media",
    "InvertisPrep Instagram",
    "InvertisPrep LinkedIn",
    "InvertisPrep social links",
  ],
  path: "/socials",
});

export default function SocialsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
