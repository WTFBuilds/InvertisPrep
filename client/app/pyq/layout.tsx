import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, buildMetadata, itemListSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Previous Year Question Papers (PYQ) – Invertis University",
  description:
    "Browse and download free previous year question papers (PYQ) for Invertis University by department, branch, semester and subject. Mid-term and end-term exam papers for B.Tech, BCA, BBA, MCA and more.",
  keywords: [
    "Invertis University PYQ",
    "Invertis previous year question papers",
    "PYQ papers Invertis University",
    "Invertis University question bank",
    "Invertis University semester exam papers",
    "Invertis University B.Tech question papers",
    "Invertis University BCA question papers",
  ],
  path: "/pyq",
});

// Server-only env var (no NEXT_PUBLIC_ prefix → never in the browser bundle).
const API_URL = process.env.API_URL;

type DepartmentsResponse = {
  data?: { id?: string; _id?: string; displayName?: string; name?: string; isActive?: boolean }[];
};

/**
 * Server-rendered JSON-LD for the PYQ hub: a breadcrumb trail plus an ItemList
 * of department routes so Google can crawl /pyq/<id> URLs even before the
 * client-rendered page has loaded its data. Best-effort — if the API is
 * unavailable the page still renders, just without the ItemList.
 */
async function pyqSchemas(): Promise<Record<string, unknown>[]> {
  const schemas: Record<string, unknown>[] = [
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Previous Year Question Papers", path: "/pyq" },
    ]),
  ];

  try {
    const res = await fetch(`${API_URL}/departments`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = (await res.json()) as DepartmentsResponse;
      const departments = (json.data || []).filter((d) => d.isActive !== false);
      if (departments.length > 0) {
        schemas.push(
          itemListSchema(
            "Invertis University PYQ Departments",
            departments
              .map((d) => ({
                name: d.displayName || d.name || "Department",
                path: `/pyq/${d.id || d._id}`,
              }))
              .filter((d) => !d.path.endsWith("/undefined")),
          ),
        );
      }
    }
  } catch {
    // API unavailable — breadcrumb schema alone is still valid.
  }

  return schemas;
}

export default async function PyqLayout({ children }: { children: React.ReactNode }) {
  const schemas = await pyqSchemas();
  return (
    <>
      <JsonLd schemas={schemas} />
      {children}
    </>
  );
}
