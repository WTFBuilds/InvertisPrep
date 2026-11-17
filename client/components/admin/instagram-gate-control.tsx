'use client';

import { useEffect, useState } from 'react';
import { Instagram, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { settingsApi } from '@/lib/api';
import { useSWRConfig } from 'swr';

export function InstagramGateControl() {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    let cancelled = false;
    const fetchCurrentSetting = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await settingsApi.getAdmin();
        if (!cancelled && res.success && res.data) {
          setEnabled(res.data.instagramPopupEnabled);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to load Instagram follow popup setting.';
          setErrorMessage(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCurrentSetting();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = async (nextState: boolean) => {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await settingsApi.updateInstagramPopup(nextState);
      if (res.success && res.data) {
        setEnabled(res.data.instagramPopupEnabled);
        setSuccessMessage(
          nextState
            ? 'Instagram follow popup enabled for all students.'
            : 'Instagram follow popup disabled. Papers now open directly.'
        );
        // Refresh public SWR cache across any active subscribers
        mutate('public-settings');
        // Clear success message after 4s
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(res.message || 'Failed to update setting.');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update Instagram follow popup setting.';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white shadow-xs">
            <Instagram className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-slate-900">
                Instagram Follow Popup
              </h2>
              <Badge
                className={
                  enabled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-100 text-slate-600'
                }
              >
                {enabled ? 'Active · Required' : 'Disabled · Bypassed'}
              </Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Prompt students to follow <span className="font-semibold text-slate-700">@invertisprep.in</span> on
              Instagram before opening PYQ papers. When disabled, the follow gate is bypassed platform-wide and papers open immediately.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {saving && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving…</span>
            </div>
          )}
          <Switch
            checked={enabled}
            disabled={loading || saving}
            onCheckedChange={handleToggle}
            aria-label="Toggle Instagram follow popup"
          />
        </div>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-800 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
