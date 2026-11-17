'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Plus,
  Trash2,
  ImagePlus,
  MoveUp,
  MoveDown,
  Link2,
  ChevronDown,
  Sparkles,
  Code2,
  LayoutTemplate,
  Wand2,
} from 'lucide-react';
import { adminMailApi } from '@/lib/api';
import { MAIL_PRESETS } from '@/lib/mail-presets';
import type { MailTemplate, MailTemplateSection } from '@/types';

// Easy email composer shared by Compose (broadcasts) and Automail (welcome).
// Three modes:
//   • Simple    — heading, message, optional button/banner, quick-start chips.
//                 Heavy controls live under "Advanced".
//   • Templates — pick a ready-made layout, then tweak in Simple.
//   • HTML      — paste raw HTML ({{name}} works) with a live preview.

const SECTION_TYPES: { value: MailTemplateSection['type']; label: string }[] = [
  { value: 'heading', label: 'Heading' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'image', label: 'Image' },
  { value: 'button', label: 'Button' },
  { value: 'divider', label: 'Divider' },
];

const newSection = (type: MailTemplateSection['type']): MailTemplateSection => ({
  type,
  text: '',
  align: 'left',
  fontSize: type === 'heading' ? 18 : 15,
  color: type === 'paragraph' ? '#475569' : '#0f172a',
  bgColor: '#0f172a',
});

export const blankTemplate = (): MailTemplate => ({
  bannerUrl: '',
  heading: 'Announcement',
  intro: 'Hi {{name}},',
  sections: [newSection('paragraph'), newSection('button')],
  footer: '— Team InvertisPrep',
  email: 'support@invertisprep.in',
});

// Quick-start intents — one click lays out a sensible structure so composing
// doesn't start from a blank canvas.
const INTENTS: { id: string; label: string; hint: string; build: () => MailTemplate }[] = [
  {
    id: 'announcement',
    label: 'Announcement',
    hint: 'Share an update or news with everyone.',
    build: () => ({
      bannerUrl: '',
      heading: 'An important update',
      intro: 'Hi {{name}},',
      sections: [
        { ...newSection('paragraph'), text: 'Write your announcement here. Keep it short and to the point.' },
        { ...newSection('button'), text: 'Learn more', url: 'https://invertisprep.in' },
      ],
      footer: '— Team InvertisPrep',
      email: 'support@invertisprep.in',
    }),
  },
  {
    id: 'new-papers',
    label: 'New papers',
    hint: 'Tell students fresh question papers are live.',
    build: () => ({
      bannerUrl: '',
      heading: 'New question papers are live 🎉',
      intro: 'Hi {{name}},',
      sections: [
        { ...newSection('paragraph'), text: 'Fresh previous-year papers have just been added. Grab what you need before your exams.' },
        { ...newSection('button'), text: 'Browse papers', url: 'https://invertisprep.in/pyq' },
      ],
      footer: '— Team InvertisPrep',
      email: 'support@invertisprep.in',
    }),
  },
  {
    id: 'event',
    label: 'Event invite',
    hint: 'Invite students to a campus event.',
    build: () => ({
      bannerUrl: '',
      heading: "You're invited 🎊",
      intro: 'Hi {{name}},',
      sections: [
        { ...newSection('paragraph'), text: 'Join us for our upcoming event — we would love to see you there.' },
        { ...newSection('heading'), text: 'Save the date' },
        { ...newSection('button'), text: 'View details', url: 'https://invertisprep.in/events' },
      ],
      footer: '— Team InvertisPrep',
      email: 'support@invertisprep.in',
    }),
  },
  {
    id: 'blank',
    label: 'Start blank',
    hint: 'Empty canvas — just a heading and message.',
    build: () => blankTemplate(),
  },
];

export function MailTemplateEditor({
  value,
  onChange,
  showTemplates = true,
}: {
  value?: MailTemplate;
  onChange: (t: MailTemplate) => void;
  showTemplates?: boolean;
}) {
  const [tpl, setTpl] = useState<MailTemplate>(value ?? blankTemplate());
  const [mode, setMode] = useState<'simple' | 'templates' | 'html'>(
    value?.rawHtml ? 'html' : 'simple'
  );
  const [advanced, setAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Adopt an externally-loaded template (e.g. Automail's saved one) once, but
  // ignore the parent echoing our own edits back (identity check) so the user's
  // selected tab isn't yanked away mid-edit.
  const lastEmitted = useRef<MailTemplate | null>(null);
  useEffect(() => {
    if (value && value !== lastEmitted.current) {
      setTpl(value);
      setMode(value.rawHtml ? 'html' : 'simple');
    }
  }, [value]);

  const update = (patch: Partial<MailTemplate>) => {
    const next = { ...tpl, ...patch };
    lastEmitted.current = next;
    setTpl(next);
    onChange(next);
  };
  const applyTemplate = (t: MailTemplate) => {
    const next = { ...t };
    lastEmitted.current = next;
    setTpl(next);
    onChange(next);
    setMode('simple');
  };

  // ── Section helpers ──
  const patchSection = (i: number, patch: Partial<MailTemplateSection>) => {
    update({ sections: tpl.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
  };
  const addSection = (type: MailTemplateSection['type']) =>
    update({ sections: [...tpl.sections, newSection(type)] });
  const removeSection = (i: number) =>
    update({ sections: tpl.sections.filter((_, idx) => idx !== i) });
  const moveSection = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= tpl.sections.length) return;
    const sections = [...tpl.sections];
    [sections[i], sections[j]] = [sections[j], sections[i]];
    update({ sections });
  };

  // Simple mode binds to the first paragraph (the "message") and first button
  // (the "call to action"), creating them on demand.
  const paraIdx = tpl.sections.findIndex((s) => s.type === 'paragraph');
  const btnIdx = tpl.sections.findIndex((s) => s.type === 'button');
  const setMessage = (text: string) => {
    if (paraIdx === -1) update({ sections: [...tpl.sections, { ...newSection('paragraph'), text }] });
    else patchSection(paraIdx, { text });
  };
  const setCta = (patch: Partial<MailTemplateSection>) => {
    if (btnIdx === -1) update({ sections: [...tpl.sections, { ...newSection('button'), ...patch }] });
    else patchSection(btnIdx, patch);
  };

  const uploadBanner = async (file: File) => {
    setUploading(true);
    setUploadError('');
    try {
      const res = await adminMailApi.uploadBanner(file);
      if (res.success && res.data?.url) update({ bannerUrl: res.data.url });
      else setUploadError(res.message || 'Upload failed');
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const uploadSectionImage = async (i: number, file: File) => {
    setUploading(true);
    setUploadError('');
    try {
      const res = await adminMailApi.uploadBanner(file);
      if (res.success && res.data?.url) patchSection(i, { imageUrl: res.data.url });
      else setUploadError(res.message || 'Upload failed');
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const previewHtml = useMemo(() => renderPreview(tpl), [tpl]);

  const TABS: { id: 'simple' | 'templates' | 'html'; label: string; icon: any }[] = [
    { id: 'simple', label: 'Simple', icon: Wand2 },
    ...(showTemplates ? [{ id: 'templates' as const, label: 'Templates', icon: LayoutTemplate }] : []),
    { id: 'html', label: 'HTML', icon: Code2 },
  ];

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMode(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {mode === 'simple' && (
            <>
              {/* Quick-start intents */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-slate-600">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Quick start
                </Label>
                <div className="flex flex-wrap gap-2">
                  {INTENTS.map((intent) => (
                    <button
                      key={intent.id}
                      type="button"
                      title={intent.hint}
                      onClick={() => applyTemplate(intent.build())}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      {intent.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  Pick a starting point — you can edit everything below.
                </p>
              </div>

              <BannerField tpl={tpl} uploading={uploading} onUpload={uploadBanner} onClear={() => update({ bannerUrl: '' })} />

              <div className="space-y-1.5">
                <Label>Heading</Label>
                <Input value={tpl.heading} onChange={(e) => update({ heading: e.target.value })} placeholder="A short, clear subject line" />
              </div>

              <div className="space-y-1.5">
                <Label>Greeting</Label>
                <Input value={tpl.intro} onChange={(e) => update({ intro: e.target.value })} placeholder="Hi {{name}}," />
              </div>

              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea
                  value={paraIdx === -1 ? '' : tpl.sections[paraIdx].text || ''}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message…"
                  rows={5}
                />
                <p className="text-xs text-slate-400">Tip: use {'{{name}}'} to insert the reader&apos;s name.</p>
              </div>

              <div className="space-y-2">
                <Label>Button (optional)</Label>
                <Input
                  value={btnIdx === -1 ? '' : tpl.sections[btnIdx].text || ''}
                  onChange={(e) => setCta({ text: e.target.value })}
                  placeholder="Button label — e.g. Browse papers"
                />
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={btnIdx === -1 ? '' : tpl.sections[btnIdx].url || ''}
                    onChange={(e) => setCta({ url: e.target.value })}
                    placeholder="https://invertisprep.in/pyq"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Fill both the label and link to show a button. Leave blank for no button.
                </p>
              </div>

              {/* Advanced */}
              <button
                type="button"
                onClick={() => setAdvanced((a) => !a)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                <span>Advanced options</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${advanced ? 'rotate-180' : ''}`} />
              </button>

              {advanced && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-white/60 p-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Sign-off / footer</Label>
                    <Input value={tpl.footer} onChange={(e) => update({ footer: e.target.value })} placeholder="— Team InvertisPrep" />
                  </div>

                  <Label className="text-xs text-slate-600">All blocks</Label>
                  {tpl.sections.map((s, i) => (
                    <SectionEditor
                      key={i}
                      section={s}
                      uploading={uploading}
                      onMove={(dir) => moveSection(i, dir)}
                      onRemove={() => removeSection(i)}
                      onPatch={(p) => patchSection(i, p)}
                      onUploadImage={(f) => uploadSectionImage(i, f)}
                    />
                  ))}
                  <div className="flex flex-wrap gap-1.5">
                    {SECTION_TYPES.map((t) => (
                      <Button key={t.value} variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => addSection(t.value)}>
                        <Plus className="h-3.5 w-3.5" /> {t.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'templates' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Pick a template — it loads into the Simple editor for tweaks.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {MAIL_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyTemplate(p.template)}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-slate-300 hover:shadow-sm"
                  >
                    <p className="text-sm font-bold text-slate-900">{p.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'html' && (
            <div className="space-y-2">
              <Label>Paste your HTML</Label>
              <Textarea
                value={tpl.rawHtml || ''}
                onChange={(e) => update({ rawHtml: e.target.value })}
                placeholder="<!DOCTYPE html> … paste a full email template here"
                rows={16}
                className="font-mono text-xs"
              />
              <p className="text-xs text-slate-400">
                Sent as-is. Use {'{{name}}'} or {'{{email}}'} anywhere to personalize per recipient.
              </p>
            </div>
          )}

          {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
        </div>

        {/* Preview */}
        <div className="space-y-1.5">
          <Label>Preview</Label>
          <div className="overflow-auto rounded-xl border border-slate-200 bg-white" style={{ maxHeight: 640 }}>
            <iframe title="Email preview" sandbox="" srcDoc={previewHtml} className="h-[600px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Banner upload field ─────────────────────────────────────────────────────
function BannerField({
  tpl,
  uploading,
  onUpload,
  onClear,
}: {
  tpl: MailTemplate;
  uploading: boolean;
  onUpload: (f: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>Banner image (optional)</Label>
      {tpl.bannerUrl ? (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tpl.bannerUrl} alt="Banner" className="w-full object-cover" />
          <div className="flex items-center justify-between gap-2 p-2">
            <Button variant="ghost" size="sm" className="text-xs text-rose-600" onClick={onClear}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
            </Button>
            <label className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">
              Change
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
            </label>
          </div>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/60 py-6 text-sm text-slate-500 hover:border-slate-400 hover:bg-white">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          <span>{uploading ? 'Uploading…' : 'Click to upload a banner'}</span>
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </label>
      )}
    </div>
  );
}

// ── Advanced per-block editor ───────────────────────────────────────────────
function SectionEditor({
  section: s,
  uploading,
  onMove,
  onRemove,
  onPatch,
  onUploadImage,
}: {
  section: MailTemplateSection;
  uploading: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onPatch: (p: Partial<MailTemplateSection>) => void;
  onUploadImage: (f: File) => void;
}) {
  return (
    <Card className="border-slate-200 bg-white/70">
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(-1)}>
              <MoveUp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(1)}>
              <MoveDown className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <select
              value={s.type}
              onChange={(e) => onPatch({ type: e.target.value as MailTemplateSection['type'] })}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
            >
              {SECTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {s.type === 'heading' && (
          <Input value={s.text || ''} onChange={(e) => onPatch({ text: e.target.value })} placeholder="Section heading" />
        )}
        {(s.type === 'paragraph' || s.type === 'button') && (
          <>
            <Textarea
              value={s.text || ''}
              onChange={(e) => onPatch({ text: e.target.value })}
              placeholder={s.type === 'button' ? 'Button label' : 'Paragraph text'}
              rows={s.type === 'paragraph' ? 3 : 1}
            />
            {s.type === 'button' && (
              <div className="flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-slate-400" />
                <Input value={s.url || ''} onChange={(e) => onPatch({ url: e.target.value })} placeholder="https://…" />
              </div>
            )}
          </>
        )}
        {s.type === 'image' && (
          <div className="flex items-center gap-2">
            {s.imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <Button variant="ghost" size="sm" className="text-xs text-rose-600" onClick={() => onPatch({ imageUrl: '' })}>
                  Remove
                </Button>
              </>
            ) : (
              <label className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">
                {uploading ? 'Uploading…' : 'Upload section image'}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && onUploadImage(e.target.files[0])} />
              </label>
            )}
          </div>
        )}
        {s.type === 'divider' && <p className="text-xs text-slate-400">Horizontal divider</p>}

        {['heading', 'paragraph', 'button'].includes(s.type) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
            <select
              value={s.align || 'left'}
              onChange={(e) => onPatch({ align: e.target.value as MailTemplateSection['align'] })}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
            <select
              value={String(s.fontSize || 16)}
              onChange={(e) => onPatch({ fontSize: parseInt(e.target.value, 10) })}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
            >
              {[12, 14, 16, 18, 20, 24, 28].map((n) => (
                <option key={n} value={String(n)}>{n}px</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs text-slate-500">
              Text
              <input type="color" value={s.color || '#0f172a'} onChange={(e) => onPatch({ color: e.target.value })} className="h-7 w-8 cursor-pointer rounded border border-slate-200" />
            </label>
            {s.type === 'button' && (
              <label className="flex items-center gap-1 text-xs text-slate-500">
                Fill
                <input type="color" value={s.bgColor || '#0f172a'} onChange={(e) => onPatch({ bgColor: e.target.value })} className="h-7 w-8 cursor-pointer rounded border border-slate-200" />
              </label>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Preview renderer (mirrors the server-side output) ───────────────────────
function renderPreview(tpl: MailTemplate): string {
  if (tpl.rawHtml) return tpl.rawHtml;
  const alignMap = { left: 'left', center: 'center', right: 'right' } as const;
  const sections = tpl.sections
    .map((s) => {
      const align = alignMap[s.align || 'left'];
      switch (s.type) {
        case 'heading':
          return s.text ? `<h3 style="margin:14px 0 4px;font-size:${s.fontSize || 18}px;color:${s.color || '#0f172a'};text-align:${align};">${esc(s.text)}</h3>` : '';
        case 'image':
          return s.imageUrl ? `<img src="${esc(s.imageUrl)}" style="max-width:100%;border-radius:8px;display:block;margin:12px 0;" />` : '';
        case 'button':
          return s.url && s.text
            ? `<div style="text-align:${align};margin:10px 0;"><a href="${esc(s.url)}" style="display:inline-block;padding:12px 22px;background:${s.bgColor || '#0f172a'};color:#ffffff;border-radius:8px;font-weight:700;text-decoration:none;font-size:${s.fontSize || 14}px;">${esc(s.text)}</a></div>`
            : '';
        case 'divider':
          return `<hr style="border:none;border-top:1px solid #eef2f7;margin:14px 0;" />`;
        default:
          return s.text ? `<p style="color:${s.color || '#475569'};font-size:${s.fontSize || 15}px;line-height:1.6;margin:8px 0;text-align:${align};">${esc(s.text)}</p>` : '';
      }
    })
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body style="margin:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;padding:24px 12px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      ${tpl.bannerUrl ? `<img src="${esc(tpl.bannerUrl)}" style="width:100%;display:block;" />` : ''}
      <div style="padding:24px 28px;">
        <h1 style="font-size:22px;color:#0f172a;margin:0 0 8px;">${esc(tpl.heading)}</h1>
        <p style="color:#475569;font-size:15px;margin:0 0 12px;">${esc(tpl.intro)}</p>
        ${sections}
        <div style="margin-top:18px;font-size:12px;color:#94a3b8;border-top:1px solid #eef2f7;padding-top:12px;">${esc(tpl.footer)}</div>
      </div>
    </div></body></html>`;
}

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');