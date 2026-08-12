import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type DepartmentResponse = {
  data?: { displayName?: string; name?: string };
};

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
  let departmentName: string | null = null;

  try {
    const res = await fetch(`${API_URL}/departments/${departmentId}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = (await res.json()) as DepartmentResponse;
      departmentName = json.data?.displayName || json.data?.name || null;
    }
  } catch {
    // Best-effort — fall through to generic metadata.
  }

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

export default function DepartmentPyqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
