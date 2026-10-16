'use client';

import useSWR from 'swr';
import { settingsApi } from '@/lib/api';

const SETTINGS_KEY = 'public-settings';

/**
 * Hook to read the public platform settings, specifically whether the
 * Instagram follow popup is enabled.
 * Default fallback is `true` so there is zero flash/layout-shift.
 */
export function useInstagramGateSetting() {
  const { data, error, isLoading, mutate } = useSWR(
    SETTINGS_KEY,
    async () => {
      const res = await settingsApi.getPublic();
      if (res.success && res.data) {
        return res.data;
      }
      return { instagramPopupEnabled: true };
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 30_000,
      fallbackData: { instagramPopupEnabled: true },
    }
  );

  return {
    enabled: data?.instagramPopupEnabled ?? true,
    isLoading,
    error,
    mutate,
  };
}
