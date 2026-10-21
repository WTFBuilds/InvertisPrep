'use client';

import useSWR from 'swr';
import { clubApi } from '@/lib/api';
import { CLUB_LIST, CLUB_ICON_KEYS, type Club as StaticClub } from '@/lib/clubs';
import { fetcher } from '@/lib/fetcher';
import type { Club } from '@/types';

/**
 * Convert a static club (whose icon is a lucide component) into the API
 * shape (whose icon is a string key). This is what lets the static seed
 * act as a drop-in fallback for the API response.
 */
const toApiClub = (club: StaticClub): Club => ({
  ...club,
  icon: CLUB_ICON_KEYS[club.icon as unknown as string] || 'Users',
});

const STATIC_FALLBACK: Club[] = CLUB_LIST.map(toApiClub);

/**
 * Reads the club list from the API.
 *
 * The static list is the fallback: if the API is unreachable the public
 * page still renders the seeded content rather than an error, so a server
 * hiccup never blanks the page.
 */
export function useClubs() {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<{ success: boolean; data: Club[] }>('/clubs', fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: true,
  });

  const clubs = data?.data?.length ? data.data : STATIC_FALLBACK;
  const isFallback = !data?.data?.length;

  return {
    clubs,
    isFallback,
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Reads a single club from the API, with the static list as the fallback.
 */
export function useClub(id: string | undefined) {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<{ success: boolean; data: Club }>(
    id ? `/clubs/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const fallback = id ? STATIC_FALLBACK.find((c) => c.id === id) : undefined;
  const club = data?.data || fallback;
  const isFallback = !data?.data && !!fallback;

  return {
    club,
    isFallback,
    isLoading,
    error,
    refresh: mutate,
  };
}
