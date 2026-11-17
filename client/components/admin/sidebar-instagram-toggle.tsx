'use client';

import { useEffect, useState } from 'react';
import { Instagram, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { settingsApi } from '@/lib/api';
import { useSWRConfig } from 'swr';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

export function SidebarInstagramToggle() {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const { mutate } = useSWRConfig();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  useEffect(() => {
    let cancelled = false;
    const fetchSetting = async () => {
      setLoading(true);
      try {
        const res = await settingsApi.getAdmin();
        if (!cancelled && res.success && res.data) {
          setEnabled(res.data.instagramPopupEnabled);
        }
      } catch {
        // Fallback to default
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSetting();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = async (nextState: boolean) => {
    setSaving(true);
    try {
      const res = await settingsApi.updateInstagramPopup(nextState);
      if (res.success && res.data) {
        setEnabled(res.data.instagramPopupEnabled);
        mutate('public-settings');
        toast.success(
          nextState
            ? 'Instagram popup enabled'
            : 'Instagram popup disabled (papers open directly)'
        );
      } else {
        toast.error(res.message || 'Failed to update setting');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update setting';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => handleToggle(!enabled)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar hover:bg-sidebar-accent transition-colors"
            aria-label="Toggle Instagram follow popup"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin text-sidebar-foreground" />
            ) : (
              <Instagram
                className={`h-4 w-4 transition-colors ${
                  enabled ? 'text-pink-600' : 'text-sidebar-foreground/40'
                }`}
              />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-semibold text-xs">
            Instagram Popup: {enabled ? 'Active' : 'Disabled'}
          </p>
          <p className="text-[10px] text-muted-foreground">Click to toggle</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/30 px-2.5 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white transition-opacity ${
            enabled ? 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600' : 'bg-slate-400 opacity-60'
          }`}
        >
          <Instagram className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-sidebar-foreground">
            Instagram Popup
          </p>
          <p className="truncate text-[10px] text-sidebar-foreground/60">
            {saving ? 'Saving…' : enabled ? 'Gate active' : 'Bypassed'}
          </p>
        </div>
      </div>
      <Switch
        size="sm"
        checked={enabled}
        disabled={loading || saving}
        onCheckedChange={handleToggle}
        aria-label="Toggle Instagram follow popup"
      />
    </div>
  );
}
