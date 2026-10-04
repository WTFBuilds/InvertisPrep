import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

// Server-only env var (no NEXT_PUBLIC_ prefix → never in the browser bundle).
// Read server-side for SEO metadata; defaults to local dev.
const API_URL = process.env.API_URL;
const PDF_API_URL = process.env.PDF_API_URL;

type DepartmentResponse = {
  data?: { displayName?: string; name?: string };
};

async function fetchDepartmentName(departmentId: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/departments/${departmentId}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = (await res.json()) as DepartmentResponse;
      return json.data?.displayName || json.data?.name || null;
    }
  } catch {
    // Best-effort — fall through to null.
  }
  return null;
}

/**
 * Dynamic PYQ metadata — includes the department name in the title when it can
 * be fetched at request time. Falls back to generic PYQ metadata on any error
 * so SEO never breaks because of a transient API failure.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ departmentId: string }>;
}): Promise<Metadata> {
  const { departmentId } = await params;
  const departmentName = await fetchDepartmentName(departmentId);

  if (departmentName) {
    return buildMetadata({
      title: `${departmentName} Previous Year Question Papers (PYQ) – Invertis University`,
      description: `Free ${departmentName} previous year question papers (PYQ) for Invertis University — browse branch-wise, semester-wise and subject-wise mid-term and end-term exam papers. Download free PDFs.`,
      keywords: [
        `${departmentName} PYQ Invertis University`,
        `${departmentName} previous year question papers`,
        "Invertis University PYQ",
        "Invertis University question bank",
        "semester exam papers Invertis University",
      ],
      path: `/pyq/${departmentId}`,
    });
  }

  return buildMetadata({
    title: "Previous Year Question Papers (PYQ) – Invertis University",
    description:
      "Browse and download free previous year question papers (PYQ) for Invertis University by department, branch, semester and subject.",
    path: `/pyq/${departmentId}`,
  });
}

export default async function DepartmentPyqLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ departmentId: string }>;
}) {
  const { departmentId } = await params;
  const departmentName = await fetchDepartmentName(departmentId);

  return (
    <>
      <JsonLd
        schemas={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Previous Year Question Papers", path: "/pyq" },
            ...(departmentName
              ? [{ name: departmentName, path: `/pyq/${departmentId}` }]
              : []),
          ]),
        ]}
      />
      {children}
    </>
  );
}
