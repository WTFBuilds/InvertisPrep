'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Download,
  Loader2,
  RefreshCw,
  Server,
  ShieldAlert,
  Upload,
} from 'lucide-react';

import { backupApi } from '@/lib/api';
import type { BackupCollectionResult, BackupJob, BackupStats, ImportPreviewSummary } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const errMsg = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  (err as Error)?.message ||
  fallback;

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const formatDuration = (ms?: number) => {
  if (!ms || ms < 0) return '';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
};

// Progress + result display shared by the "backup to URI" and "restore" jobs
function JobPanel({ job }: { job: BackupJob }) {
  const p = job.progress;
  const pct = p.docsTotal > 0 ? Math.round((p.docsDone / p.docsTotal) * 100) : 0;

  if (job.status === 'running') {
    return (
      <div className="mt-4 space-y-2 rounded-lg border bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Loader2 className="size-4 animate-spin" />
          {p.phase === 'connecting' || p.phase === 'reading'
            ? `${p.phase === 'reading' ? 'Reading backup file' : 'Connecting to target'}…`
            : `${p.phase === 'replacing' ? 'Restoring' : 'Copying'} collection ${p.collection ?? '…'} — ${p.collectionsDone}/${p.collectionsTotal}`}
        </div>
        <Progress value={pct} />
        <p className="text-xs text-slate-500">
          {p.docsDone.toLocaleString()} / {p.docsTotal.toLocaleString()} documents ({pct}%)
          {p.phase === 'connecting' || p.phase === 'reading' ? ' — preparing…' : ''}
        </p>
      </div>
    );
  }

  if (job.status === 'error') {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="size-4" />
        <AlertDescription>{job.error || 'The operation failed.'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-4 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="size-4" />
        Finished in {formatDuration(job.result?.durationMs)}
      </div>
      {job.result?.target && (
        <p className="mt-1 text-xs text-slate-500">
          Restored into <span className="font-mono">{job.result.target.database}</span> (
          {job.result.target.uri})
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Collection</TableHead>
            <TableHead className="text-right">{job.kind === 'import' ? 'In file' : 'Source'}</TableHead>
            <TableHead className="text-right">Written</TableHead>
            <TableHead className="text-right">In target now</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(job.result?.collections ?? []).map((c) => (
            <TableRow key={c.name}>
              <TableCell className="font-mono text-xs">{c.name}</TableCell>
              <TableCell className="text-right">{c.source.toLocaleString()}</TableCell>
              <TableCell className="text-right">{c.written.toLocaleString()}</TableCell>
              <TableCell className="text-right">
                {c.targetCount != null && c.targetCount >= 0 ? c.targetCount.toLocaleString() : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function BackupPage() {
  // Overview
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Export download
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  // Backup to another MongoDB URI
  const [uri, setUri] = useState('');
  const [dbName, setDbName] = useState('');
  const [dropTarget, setDropTarget] = useState(true);
  const [uriError, setUriError] = useState('');

  // Import / restore
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importError, setImportError] = useState('');
  const [preview, setPreview] = useState<ImportPreviewSummary | null>(null);
  const [previewUploadId, setPreviewUploadId] = useState('');
  const [mode, setMode] = useState<'replace' | 'merge'>('replace');
  const [confirmText, setConfirmText] = useState('');
  const [restoreError, setRestoreError] = useState('');

  // Shared long-operation job
  const [job, setJob] = useState<BackupJob | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const busy = exporting || uploading || parsing || job?.status === 'running';

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const res = await backupApi.stats();
      setStats(res.data ?? null);
    } catch (err) {
      setStatsError(errMsg(err, 'Failed to load database stats.'));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [fetchStats]);

  // Refresh the overview whenever a long operation completes.
  useEffect(() => {
    if (job?.status === 'done') fetchStats();
  }, [job?.status, fetchStats]);

  const pollJob = (jobId: string) => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    const tick = async () => {
      try {
        const res = await backupApi.getJob(jobId);
        if (!res.data) throw new Error(res.message || 'Lost track of the operation.');
        setJob(res.data);
        if (res.data.status === 'running') pollTimer.current = setTimeout(tick, 1500);
      } catch (err) {
        setJob((prev) =>
          prev ? { ...prev, status: 'error', error: errMsg(err, 'Lost connection to the operation.') } : prev
        );
      }
    };
    pollTimer.current = setTimeout(tick, 1200);
  };

  const doExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      const { blob, filename } = await backupApi.downloadExport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(errMsg(err, 'Export failed.'));
    } finally {
      setExporting(false);
    }
  };

  const startUriBackup = async () => {
    setUriError('');
    if (!/^mongodb(\+srv)?:\/\//i.test(uri.trim())) {
      setUriError('Enter a MongoDB URI starting with mongodb:// or mongodb+srv://');
      return;
    }
    try {
      const res = await backupApi.startToUri({ uri: uri.trim(), dbName: dbName.trim(), dropTarget });
      if (!res.data?.jobId) throw new Error(res.message || 'Could not start the backup.');
      setJob(null);
      pollJob(res.data.jobId);
    } catch (err) {
      setUriError(errMsg(err, 'Could not start the backup.'));
    }
  };

  const onFileChosen = async (chosen: File | null) => {
    setImportError('');
    setPreview(null);
    setPreviewUploadId('');
    setConfirmText('');
    setRestoreError('');
    setFile(chosen);
    if (!chosen) return;

    setUploading(true);
    setUploadPct(0);
    try {
      const up = await backupApi.uploadFile(chosen, setUploadPct);
      const uploadId = up.data?.uploadId;
      if (!uploadId) throw new Error(up.message || 'Upload failed.');
      setParsing(true);
      const parsed = await backupApi.parse(uploadId);
      if (!parsed.data?.summary) throw new Error(parsed.message || 'Could not read the backup file.');
      setPreview(parsed.data.summary);
      setPreviewUploadId(parsed.data.uploadId ?? uploadId);
    } catch (err) {
      setImportError(errMsg(err, 'Upload failed.'));
      setFile(null);
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const startRestore = async () => {
    setRestoreError('');
    if (mode === 'replace' && confirmText.trim().toUpperCase() !== 'RESTORE') {
      setRestoreError('Type RESTORE to confirm replacing the live database.');
      return;
    }
    try {
      const res = await backupApi.confirm(previewUploadId, mode);
      if (!res.data?.jobId) throw new Error(res.message || 'Could not start the restore.');
      setJob(null);
      pollJob(res.data.jobId);
    } catch (err) {
      setRestoreError(errMsg(err, 'Could not start the restore.'));
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
          <DatabaseBackup className="size-6" />
          Database Backup &amp; Restore
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Snapshot the whole database, copy it to another MongoDB URI, or restore a previous
          export. Super-admin only — restores are destructive.
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="size-4 text-slate-500" />
                Live database
              </CardTitle>
              <CardDescription className="mt-1 font-mono text-xs">
                {stats ? `${stats.database} @ ${stats.host}` : 'loading…'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStats} disabled={statsLoading}>
              {statsLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {statsError && (
            <Alert variant="destructive" className="mb-3">
              <AlertTriangle className="size-4" />
              <AlertDescription>{statsError}</AlertDescription>
            </Alert>
          )}
          {stats && (
            <>
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Collections</p>
                  <p className="text-xl font-bold text-slate-900">{stats.collections.length}</p>
                </div>
                <div className="rounded-lg border bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Documents</p>
                  <p className="text-xl font-bold text-slate-900">{stats.totalDocuments.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Data size</p>
                  <p className="text-xl font-bold text-slate-900">{formatBytes(stats.totalSize)}</p>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead>Collection</TableHead>
                      <TableHead className="text-right">Documents</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.collections.map((c) => (
                      <TableRow key={c.name}>
                        <TableCell className="font-mono text-xs">{c.name}</TableCell>
                        <TableCell className="text-right">{c.count.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatBytes(c.size)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Download export */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="size-4 text-slate-500" />
              Download full backup
            </CardTitle>
            <CardDescription>
              Every collection exported as a compressed JSON file (BSON types like ObjectIds and
              dates are preserved). PDFs and images stay on Cloudinary — this is the database only.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-end">
            <Button onClick={doExport} disabled={busy || !stats} className="w-full bg-slate-900 text-white hover:bg-slate-800">
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {exporting ? 'Exporting…' : 'Download backup (.json.gz)'}
            </Button>
            {stats && (
              <p className="mt-2 text-center text-xs text-slate-500">
                ~{formatBytes(stats.totalSize)} of data across {stats.collections.length} collections
              </p>
            )}
            {exportError && (
              <Alert variant="destructive" className="mt-3">
                <AlertTriangle className="size-4" />
                <AlertDescription>{exportError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Backup to URI */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DatabaseBackup className="size-4 text-slate-500" />
              Back up to a MongoDB URI
            </CardTitle>
            <CardDescription>
              Copies every collection of the live database into the MongoDB instance at the given
              URI. Useful for scheduled off-site copies or migrating hosts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="backup-uri">Target MongoDB URI</Label>
              <Input
                id="backup-uri"
                type="password"
                placeholder="mongodb+srv://user:password@host/?retryWrites=true"
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                disabled={busy}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="backup-db">Database name (only if the URI has none)</Label>
              <Input
                id="backup-db"
                placeholder="e.g. invertisprep-backup"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                disabled={busy}
                autoComplete="off"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="drop-target" className="text-sm">Drop target collections first</Label>
                <p className="text-xs text-slate-500">
                  Replace mode — the target ends up an exact copy. Off keeps existing docs and
                  skips duplicate ids.
                </p>
              </div>
              <Switch id="drop-target" checked={dropTarget} onCheckedChange={setDropTarget} disabled={busy} />
            </div>
            <Button
              onClick={startUriBackup}
              disabled={busy || !uri.trim()}
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
            >
              {job?.status === 'running' && job.kind === 'to-uri' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <DatabaseBackup className="size-4" />
              )}
              Start backup
            </Button>
            {uriError && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertDescription>{uriError}</AlertDescription>
              </Alert>
            )}
            {job && job.kind === 'to-uri' && <JobPanel job={job} />}
          </CardContent>
        </Card>
      </div>

      {/* Import / restore */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="size-4 text-slate-500" />
            Import / restore a backup
          </CardTitle>
          <CardDescription>
            Upload a backup downloaded above (or an off-site copy) and restore it into the live
            database. Files are uploaded in chunks, previewed, and only written once you confirm.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.gz,application/json,application/gzip"
            className="hidden"
            onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
          />

          {!file && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-8 text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <Upload className="size-6" />
              )}
              <span className="text-sm font-medium">
                {uploading ? `Uploading… ${uploadPct}%` : 'Choose a backup file (.json or .json.gz)'}
              </span>
              {uploading && <Progress value={uploadPct} className="w-48" />}
            </button>
          )}

          {file && (
            <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {formatBytes(file.size)}
                  {parsing && ' — reading & validating…'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              >
                Change file
              </Button>
            </div>
          )}

          {importError && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}

          {preview && (
            <>
              <div className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                  <span className="font-semibold text-slate-900">Preview</span>
                  <span className="text-slate-500">
                    Exported:{' '}
                    <span className="font-medium text-slate-700">
                      {preview.exportedAt ? new Date(preview.exportedAt).toLocaleString() : 'unknown'}
                    </span>
                  </span>
                  <span className="text-slate-500">
                    Source database: <span className="font-mono text-slate-700">{preview.database ?? 'unknown'}</span>
                  </span>
                  <span className="text-slate-500">
                    {preview.collections.length} collections,{' '}
                    {preview.totalDocuments.toLocaleString()} documents
                  </span>
                </div>
                <div className="mt-3 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                  {preview.collections.map((c) => (
                    <span
                      key={c.name}
                      className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600"
                    >
                      {c.name} · {c.count.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode('replace')}
                  disabled={busy}
                  className={`rounded-lg border-2 p-4 text-left transition-colors disabled:opacity-50 ${
                    mode === 'replace' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">Replace — exact restore</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Drops every collection in the file, then recreates documents and indexes.
                    Anything added since the backup is lost.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('merge')}
                  disabled={busy}
                  className={`rounded-lg border-2 p-4 text-left transition-colors disabled:opacity-50 ${
                    mode === 'merge' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">Merge — keep existing</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Adds only documents whose ids don&apos;t already exist. Nothing is deleted or
                    overwritten.
                  </p>
                </button>
              </div>

              {mode === 'replace' && (
                <Alert className="border-red-200 bg-red-50 text-red-900">
                  <ShieldAlert className="size-4 text-red-600" />
                  <AlertDescription>
                    <span className="font-semibold">This overwrites the live database.</span> Type{' '}
                    <span className="font-mono font-bold">RESTORE</span> below to confirm.
                  </AlertDescription>
                </Alert>
              )}

              {mode === 'replace' && (
                <div className="space-y-1.5">
                  <Label htmlFor="restore-confirm">Confirmation</Label>
                  <Input
                    id="restore-confirm"
                    placeholder="Type RESTORE"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    disabled={busy}
                    autoComplete="off"
                  />
                </div>
              )}

              <Button
                onClick={startRestore}
                disabled={busy || (mode === 'replace' && confirmText.trim().toUpperCase() !== 'RESTORE')}
                className="w-full bg-red-600 text-white hover:bg-red-700"
              >
                {job?.status === 'running' && job.kind === 'import' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {mode === 'replace' ? 'Restore database (replace everything)' : 'Merge backup into database'}
              </Button>

              {restoreError && (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertDescription>{restoreError}</AlertDescription>
                </Alert>
              )}
            </>
          )}

          {job && job.kind === 'import' && <JobPanel job={job} />}
        </CardContent>
      </Card>
    </div>
  );
}
