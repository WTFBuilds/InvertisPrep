import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <a href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition">
                📚 InvertisPrep
              </a>
              <div className="flex gap-6 items-center">
                <a href="/" className="hover:text-primary transition">
                  Home
                </a>
                <a href="/pyq" className="hover:text-primary transition">
                  Browse PYQs
                </a>
                <a href="/admin/login" className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 transition">
                  Admin
                </a>
              </div>
            </div>
          </nav>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
