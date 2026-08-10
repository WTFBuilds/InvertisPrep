import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuizSocketProvider } from "@/contexts/QuizSocketContext";
import SiteShell from "@/components/layout/SiteShell";

// Using system font fallbacks instead of next/font to avoid Turbopack font-loader issues

export const metadata: Metadata = {
  title: "InvertisPrep - PYQ Management System",
  description: "Previous Year Question Papers for Invertis University",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased flex flex-col min-h-screen`}>
        <AuthProvider>
          <QuizSocketProvider>
            <SiteShell>{children}</SiteShell>
          </QuizSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
