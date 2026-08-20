import type { NextConfig } from "next";

// Backend URLs live in SERVER-ONLY env vars (API_URL, PDF_API_URL) — set them
// in the Vercel dashboard. They are never prefixed with NEXT_PUBLIC_, so they
// never appear in the browser bundle. The browser talks to same-origin paths
// and Next.js rewrites proxy the requests server-side.
const API_URL = process.env.API_URL ;
const PDF_API_URL = process.env.PDF_API_URL ;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async rewrites() {
    return [
      // /backend/* → main API server (auth, departments, syllabus, …)
      { source: '/backend/:path*', destination: `${API_URL}/:path*` },
      // /pdfapi/* → PDF microservice (PYQ CRUD, watermarked PDFs)
      { source: '/pdfapi/:path*', destination: `${PDF_API_URL}/:path*` },
    ];
  },
};

export default nextConfig;
