import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Login",
  path: "/login",
  robotsIndex: false,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
