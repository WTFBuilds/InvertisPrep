import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// Server-only env var (no NEXT_PUBLIC_ prefix → never in the browser bundle).
const API_URL = process.env.API_URL;

type EventResponse = {
  data?: { title?: string; description?: string };
};

/**
 * Dynamic event metadata — uses the event's real title and description when
 * the API can serve them at request time, with a generic fallback so SEO
 * never breaks on a transient API failure.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/events/${id}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = (await res.json()) as EventResponse;
      const event = json.data;
      if (event?.title) {
        return buildMetadata({
          title: `${event.title} – Invertis University Events`,
          description:
            event.description?.slice(0, 157) ||
            `Details for ${event.title} — dates, venue and registration on InvertisPrep, the student platform for Invertis University events.`,
          keywords: [
            `${event.title}`,
            "Invertis University events",
            "InvertisPrep events",
          ],
          path: `/events/${id}`,
        });
      }
    }
  } catch {
    // Best-effort — fall through to generic metadata.
  }

  return buildMetadata({
    title: "Event Details – Invertis University",
    description:
      "Event details — dates, venue, organizer and registration information on InvertisPrep, the student platform for Invertis University events.",
    path: `/events/${id}`,
  });
}

export default function EventDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
