import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

// Server-only env var (no NEXT_PUBLIC_ prefix → never in the browser bundle).
const API_URL = process.env.API_URL;

type Department = {
  id?: string;
  _id?: string;
  displayName?: string;
  name?: string;
  isActive?: boolean;
};

type DepartmentsResponse = { data?: Department[] };

// Re-validate the department list once a day.
export const revalidate = 86400;

/**
 * Dynamic sitemap — static routes plus every /pyq/<departmentId> route fetched
 * from the API. Department URLs are the highest-value long-tail pages, so they
 * get 0.9 priority. If the API is unavailable the static entries ship anyway.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastmod = new Date();

  const entry = (
    path: string,
    priority: number,
    changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never",
  ): MetadataRoute.Sitemap[number] => ({
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    lastModified: lastmod,
    changeFrequency,
    priority,
  });

  const staticEntries: MetadataRoute.Sitemap = [
    entry("/", 1.0, "weekly"),
    entry("/pyq", 0.9, "weekly"),
    entry("/resume-builder", 0.9, "weekly"),
    entry("/about", 0.8, "monthly"),
    entry("/resources", 0.8, "weekly"),
    entry("/quizz0", 0.8, "weekly"),
    entry("/leaderboard", 0.7, "weekly"),
    entry("/resources/syllabus", 0.7, "monthly"),
    entry("/pyq/upload", 0.6, "monthly"),
    entry("/contact", 0.6, "monthly"),
    entry("/events", 0.6, "weekly"),
    entry("/our-team", 0.5, "yearly"),
    entry("/socials", 0.5, "monthly"),
    entry("/support", 0.4, "monthly"),
    entry("/sponsor", 0.4, "monthly"),
    entry("/report-bug", 0.4, "monthly"),
    entry("/privacy-policy", 0.2, "yearly"),
    entry("/terms-of-service", 0.2, "yearly"),
    entry("/cancellation-and-refunds", 0.2, "yearly"),
    entry("/shipping-policy", 0.2, "yearly"),
  ];

  const departmentEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/departments`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const json = (await res.json()) as DepartmentsResponse;
      for (const dept of json.data || []) {
        if (dept.isActive === false) continue;
        const id = dept.id || dept._id;
        if (!id) continue;
        departmentEntries.push(entry(`/pyq/${id}`, 0.9, "weekly"));
      }
    }
  } catch {
    // API unavailable — ship the static entries anyway.
  }

  return [...staticEntries, ...departmentEntries];
}
