import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sign In",
  path: "/auth/signin",
  robotsIndex: false,
});

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
