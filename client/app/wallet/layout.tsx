import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "My Wallet",
  path: "/wallet",
  robotsIndex: false,
});

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return children;
}
