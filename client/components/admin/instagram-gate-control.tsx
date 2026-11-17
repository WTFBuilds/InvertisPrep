'use client';

import { useEffect, useState } from 'react';
import { Instagram, Loader2, AlertCircle, CheckCircle2, Mail, FileCheck2, Briefcase, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { settingsApi } from '@/lib/api';
import { useSWRConfig } from 'swr';
import type { PlatformSettings } from '@/types';

interface ToggleConfig {
  key: keyof PlatformSettings;
  icon: React.ReactNode;
  label: string;
  description: string;
  bgGradient: string;
  badgeActive: string;
  badgeInactive: string;
  updateFn: (enabled: boolean) => Promise<any>;
  successMsg: (enabled: boolean) => string;
}

const TOGGLE_CONFIGS: ToggleConfig[] = [
  {
    key: 'instagramPopupEnabled',
    icon: <Instagram className="h-6 w-6" />,
    label: 'Instagram Follow Popup',
    description: 'Prompt students to follow <span className="font-semibold text-slate-700">@invertisprep.in</span> on Instagram before opening PYQ papers. When disabled, the follow gate is bypassed platform-wide and papers open immediately.',
    bgGradient: 'from-amber-500 via-pink-500 to-purple-600',
    badgeActive: 'Active · Required',
    badgeInactive: 'Disabled · Bypassed',
    updateFn: (enabled) => settingsApi.updateInstagramPopup(enabled),
    successMsg: (enabled) =>
      enabled
        ? 'Instagram follow popup enabled for all students.'
        : 'Instagram follow popup disabled. Papers now open directly.',
  },
  {
    key: 'welcomeEmailEnabled',
    icon: <Mail className="h-6 w-6" />,
    label: 'Welcome Email',
    description: 'Send a welcome email to new users when they sign up. This introduces them to the platform and highlights key features.',
    bgGradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    badgeActive: 'Enabled',
    badgeInactive: 'Disabled',
    updateFn: (enabled) => settingsApi.updateWelcomeEmail(enabled),
    successMsg: (enabled) =>
      enabled
        ? 'Welcome email enabled for new signups.'
        : 'Welcome email disabled. New users will not receive welcome emails.',
  },
  {
    key: 'paperRequestAckEnabled',
    icon: <FileCheck2 className="h-6 w-6" />,
    label: 'Paper Request Acknowledgement',
    description: 'Send an immediate confirmation email when a student requests a paper. Confirms receipt and sets expectations.',
    bgGradient: 'from-indigo-500 via-blue-500 to-cyan-600',
    badgeActive: 'Enabled',
    badgeInactive: 'Disabled',
    updateFn: (enabled) => settingsApi.updatePaperRequestAck(enabled),
    successMsg: (enabled) =>
      enabled
        ? 'Paper request acknowledgement email enabled.'
        : 'Paper request acknowledgement email disabled.',
  },
  {
    key: 'paperRequestFulfilledEnabled',
    icon: <Users className="h-6 w-6" />,
    label: 'Paper Request Fulfilled Email',
    description: 'Send a notification when a requested paper is added to the library. Includes a direct link to view the paper.',
    bgGradient: 'from-violet-500 via-purple-500 to-pink-600',
    badgeActive: 'Enabled',
    badgeInactive: 'Disabled',
    updateFn: (enabled) => settingsApi.updatePaperRequestFulfilled(enabled),
    successMsg: (enabled) =>
      enabled
        ? 'Paper request fulfilled email enabled.'
        : 'Paper request fulfilled email disabled.',
  },
  {
    key: 'careerApplicationAckEnabled',
    icon: <Briefcase className="h-6 w-6" />,
    label: 'Career Application Acknowledgement',
    description: 'Send an immediate confirmation when someone applies for a career position. Includes role details and next steps.',
    bgGradient: 'from-rose-500 via-red-500 to-orange-600',
    badgeActive: 'Enabled',
    badgeInactive: 'Disabled',
    updateFn: (enabled) => settingsApi.updateCareerApplicationAck(enabled),
    successMsg: (enabled) =>
      enabled
        ? 'Career application acknowledgement email enabled.'
        : 'Career application acknowledgement email disabled.',
  },
];

function SettingToggle({ config }: { config: ToggleConfig }) {
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
          setEnabled(res.data[config.key]);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            `Failed to load ${config.label} setting.`;
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
      const res = await config.updateFn(nextState);
      if (res.success && res.data) {
        setEnabled(res.data[config.key]);
        setSuccessMessage(config.successMsg(nextState));
        mutate('public-settings');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(res.message || 'Failed to update setting.');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        `Failed to update ${config.label} setting.`;
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr {config.bgGradient} text-white shadow-xs">
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-slate-900">
                {config.label}
              </h2>
              <Badge
                className={
                  enabled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-100 text-slate-600'
                }
              >
                {enabled ? config.badgeActive : config.badgeInactive}
              </Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {config.description}
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
            aria-label={`Toggle ${config.label}`}
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

export function EmailSettingsControls() {
  return (
    <div className="grid grid-cols-1 gap-6 max-w-4xl">
      {TOGGLE_CONFIGS.map((config) => (
        <SettingToggle key={config.key} config={config} />
      ))}
    </div>
  );
}

// Keep the old export for backward compatibility
export function InstagramGateControl() {
  return (
    <SettingToggle
      config={TOGGLE_CONFIGS.find(c => c.key === 'instagramPopupEnabled')!}
    />
  );
}
