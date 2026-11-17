import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import { EJSON } from 'bson';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// ── DB Backup & Restore (super-admin only) ─────────────────────────────────
// Three capabilities:
//   1. GET  /stats            — per-collection counts/sizes for the live DB
//   2. GET  /export           — streaming gzipped EJSON download of every collection
//   3. POST /to-uri           — copy the whole live DB into another MongoDB URI
//   4. POST /import/*         — chunked upload → parse (preview) → confirm restore
//
// Long operations (to-uri, restore) run as in-memory jobs the client polls.
// Only one heavy operation may run at a time.

const EXPORT_FORMAT = 'invertisprep-db-backup';
const EXPORT_VERSION = 1;
const COPY_BATCH = 500;       // docs per insert batch during copy/restore
const CHUNK_MAX_AGE_MS = 24 * 60 * 60 * 1000; // stale upload parts cleanup
const JOB_TTL_MS = 30 * 60 * 1000;
const JOB_STALE_MS = 60 * 60 * 1000;          // force-fail jobs stuck "running"

const BACKUP_DIR = path.resolve('uploads', 'backups');
const ensureBackupDir = () => fs.mkdirSync(BACKUP_DIR, { recursive: true });

// ── Job registry ────────────────────────────────────────────────────────────
const jobs = new Map();

const pruneJobs = () => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    const endedAt = job.finishedAt ? Date.parse(job.finishedAt) : 0;
    if (job.status !== 'running' && endedAt && now - endedAt > JOB_TTL_MS) jobs.delete(id);
  }
  const finished = [...jobs.values()]
    .filter((j) => j.status !== 'running')
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  while (finished.length && jobs.size > 20) jobs.delete(finished.shift().id);
};

const createJob = (kind) => {
  pruneJobs();
  const running = [...jobs.values()].find((j) => j.status === 'running');
  if (running) {
    return {
      error: `Another database operation ("${running.kind}") is already running. Wait for it to finish or check its status.`,
    };
  }
  const job = {
    id: crypto.randomUUID(),
    kind,
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    error: null,
    progress: { phase: 'starting', collection: null, docsDone: 0, docsTotal: 0, collectionsDone: 0, collectionsTotal: 0 },
    result: null,
  };
  jobs.set(job.id, job);
  return { job };
};

const jobDone = (job, result) => {
  job.status = 'done';
  job.result = result;
  job.finishedAt = new Date().toISOString();
};

const jobFail = (job, err) => {
  job.status = 'error';
  job.error = err?.message || String(err);
  job.finishedAt = new Date().toISOString();
  console.error(`[Backup] job ${job.id} (${job.kind}) failed:`, err);
};

// ── Helpers ─────────────────────────────────────────────────────────────────
// Real collections only — skip views and system internals.
const listUserCollections = async (db) => {
  const cols = await db.listCollections({}, { nameOnly: false }).toArray();
  return cols.filter((c) => c.type !== 'view' && !c.name.startsWith('system.'));
};

const maskUri = (uri) => uri.replace(/\/\/[^@/]*@/, '//***@');

// { host, db } from a mongo URI, or null when unparseable.
const uriInfo = (raw) => {
  try {
    const u = new URL(String(raw).trim());
    return { host: u.host.toLowerCase(), db: decodeURIComponent(u.pathname.replace(/^\//, '')).replace(/\/+$/, '') };
  } catch {
    return null;
  }
};

const sanitizeUploadId = (value) => {
  const match = String(value || '').match(/^[a-f0-9-]{8,64}$/i);
  return match ? match[0] : null;
};

// Upload parts may be gzip (our own export download) or plain JSON.
const readFileMaybeGzip = async (filePath) => {
  const buf = await fs.promises.readFile(filePath);
  const isGzip = buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b;
  return (isGzip ? zlib.gunzipSync(buf) : buf).toString('utf8');
};

const validateExport = (parsed) => {
  if (!parsed || typeof parsed !== 'object') return 'File is not valid JSON.';
  if (parsed.format !== EXPORT_FORMAT) return 'This file is not an InvertisPrep database export.';
  if (!parsed.collections || typeof parsed.collections !== 'object') return 'Export file contains no collections.';
  return null;
};

const insertDocs = async (col, docs, { skipExisting = false, onBatch } = {}) => {
  let written = 0;
  for (let i = 0; i < docs.length; i += COPY_BATCH) {
    let batch = docs.slice(i, i + COPY_BATCH);
    if (skipExisting && batch.length) {
      const ids = batch.map((d) => d._id).filter(Boolean);
      let existing = new Set();
      if (ids.length) {
        const found = await col.find({ _id: { $in: ids } }, { projection: { _id: 1 } }).toArray();
        existing = new Set(found.map((d) => String(d._id)));
      }
      batch = batch.filter((d) => !d._id || !existing.has(String(d._id)));
    }
    if (batch.length) {
      const r = await col.insertMany(batch, { ordered: false });
      written += r.insertedCount ?? batch.length;
    }
    onBatch?.(Math.min(i + COPY_BATCH, docs.length));
  }
  return written;
};

const restoreIndexes = async (col, indexes) => {
  for (const ix of Array.isArray(indexes) ? indexes : []) {
    if (!ix || ix.name === '_id_' || !ix.key) continue;
    try {
      const { key, name, v, background, ...options } = ix;
      await col.createIndex(key, { ...options, name: name || undefined });
    } catch (err) {
      console.warn(`[Backup] index "${ix?.name}" not restored: ${err?.message}`);
    }
  }
};

const copyIndexes = async (srcCol, dstCol) => {
  let indexes = [];
  try {
    indexes = await srcCol.listIndexes().toArray();
  } catch {
    return;
  }
  await restoreIndexes(dstCol, indexes);
};

// Stream a source collection into a target one in batches. With `replace`
// semantics docs are plain inserts (target collection was dropped); otherwise
// existing _ids are skipped so a partially-filled target isn't duplicated.
const streamCopy = async (srcCol, dstCol, replace, onProgress) => {
  let written = 0;
  let batch = [];
  const flush = async () => {
    if (!batch.length) return;
    if (replace) {
      const r = await dstCol.insertMany(batch, { ordered: false });
      written += r.insertedCount ?? batch.length;
    } else {
      written += await insertDocs(dstCol, batch, { skipExisting: true });
    }
    onProgress?.(written);
    batch = [];
  };
  const cursor = srcCol.find({}, { batchSize: COPY_BATCH });
  try {
    for await (const doc of cursor) {
      batch.push(doc);
      if (batch.length >= COPY_BATCH) await flush();
    }
    await flush();
  } finally {
    await cursor.close().catch(() => {});
  }
  return written;
};

// ── GET /stats — live DB overview ───────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const cols = await listUserCollections(db);

    const collections = [];
    let totalDocuments = 0;
    let totalSize = 0;
    for (const c of cols) {
      let count = 0;
      let size = 0;
      try {
        const s = await db.command({ collStats: c.name });
        count = s.count ?? 0;
        size = s.size ?? 0;
      } catch {
        try {
          count = await db.collection(c.name).estimatedDocumentCount();
        } catch { /* collection dropped mid-scan */ }
      }
      collections.push({ name: c.name, count, size });
      totalDocuments += count;
      totalSize += size;
    }
    collections.sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: {
        database: db.databaseName,
        host: mongoose.connection.host,
        collections,
        totalDocuments,
        totalSize,
      },
    });
  } catch (err) {
    console.error('[Backup] stats failed:', err);
    res.status(500).json({ success: false, message: 'Failed to read database stats.' });
  }
};

// ── POST /to-uri — copy the live DB into another MongoDB URI (async job) ────
const runCopyJob = async (job, uri, dbName, dropTarget) => {
  let client = null;
  const started = Date.now();
  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    const source = mongoose.connection.db;
    const cols = await listUserCollections(source);

    const totals = [];
    let docsTotal = 0;
    for (const c of cols) {
      const count = await source.collection(c.name).estimatedDocumentCount();
      totals.push({ name: c.name, count });
      docsTotal += count;
    }
    job.progress = {
      phase: dropTarget ? 'replacing' : 'copying',
      collection: null,
      docsDone: 0,
      docsTotal,
      collectionsDone: 0,
      collectionsTotal: totals.length,
    };

    await client.connect();
    const target = client.db(dbName);

    const results = [];
    let docsDone = 0;
    for (const { name, count } of totals) {
      job.progress.collection = name;
      const srcCol = source.collection(name);
      const dstCol = target.collection(name);
      if (dropTarget) {
        await dstCol.drop().catch(() => {});
        await copyIndexes(srcCol, dstCol);
      }
      const written = await streamCopy(srcCol, dstCol, dropTarget, (n) => {
        job.progress.docsDone = docsDone + n;
      });
      docsDone += count;
      job.progress.docsDone = docsDone;
      const targetCount = await dstCol.estimatedDocumentCount().catch(() => -1);
      results.push({ name, source: count, written, targetCount });
      job.progress.collectionsDone = results.length;
    }

    jobDone(job, {
      target: { database: dbName, uri: maskUri(uri) },
      dropTarget,
      collections: results,
      totalDocuments: docsTotal,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    jobFail(job, err);
  } finally {
    if (client) await client.close().catch(() => {});
  }
};

export const startBackupToUri = async (req, res) => {
  const uri = String(req.body?.uri || '').trim();
  const extraDb = String(req.body?.dbName || '').trim();
  const dropTarget = Boolean(req.body?.dropTarget);

  if (!/^mongodb(\+srv)?:\/\//i.test(uri)) {
    return res.status(400).json({ success: false, message: 'Enter a valid MongoDB URI (mongodb:// or mongodb+srv://).' });
  }

  const target = uriInfo(uri);
  if (!target) {
    return res.status(400).json({ success: false, message: 'Could not parse that MongoDB URI.' });
  }
  const dbName = target.db || extraDb;
  if (!dbName) {
    return res.status(400).json({ success: false, message: 'The URI has no database name — enter a target database name below.' });
  }

  // Never let the "backup" overwrite the live database itself.
  const live = uriInfo(process.env.MONGODB_URI || '');
  if (live && live.host === target.host && live.db === dbName) {
    return res.status(400).json({ success: false, message: 'That URI points at the live database. Pick a different database or host.' });
  }

  const { job, error } = createJob('to-uri');
  if (error) return res.status(409).json({ success: false, message: error });

  runCopyJob(job, uri, dbName, dropTarget);
  res.json({ success: true, data: { jobId: job.id, target: { database: dbName, uri: maskUri(uri) } } });
};

// ── GET /export — stream a gzipped EJSON download of the whole DB ───────────
export const exportBackup = async (req, res) => {
  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  let aborted = false;
  req.on('close', () => { aborted = true; });

  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  res.status(200);
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', `attachment; filename="invertisprep-${dbName}-${stamp}.json.gz"`);

  const gzip = zlib.createGzip({ level: 6 });
  gzip.pipe(res);
  const write = (chunk) =>
    new Promise((resolve, reject) => {
      if (aborted) return resolve();
      gzip.write(chunk, (err) => (err ? reject(err) : resolve()));
    });

  try {
    const cols = await listUserCollections(db);

    const counts = {};
    let totalDocuments = 0;
    for (const c of cols) {
      counts[c.name] = await db.collection(c.name).estimatedDocumentCount();
      totalDocuments += counts[c.name];
    }

    await write('{');
    await write(
      JSON.stringify({
        format: EXPORT_FORMAT,
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        database: dbName,
      }).slice(1, -1)
    );
    await write(`,"totalDocuments":${totalDocuments},"collections":{`);

    for (let i = 0; i < cols.length; i++) {
      if (aborted) break;
      const name = cols[i].name;
      let indexes = [];
      try {
        indexes = await db.collection(name).listIndexes().toArray();
      } catch { /* namespace gone or has no indexes */ }
      if (i > 0) await write(',');
      await write(
        `${JSON.stringify(name)}:{"count":${counts[name]},"indexes":${EJSON.stringify(indexes, { relaxed: false })},"documents":[`
      );

      let first = true;
      const cursor = db.collection(name).find({}, { batchSize: COPY_BATCH });
      try {
        for await (const doc of cursor) {
          if (aborted) break;
          await write(first ? '' : ',');
          await write(EJSON.stringify(doc, { relaxed: false }));
          first = false;
        }
      } finally {
        await cursor.close().catch(() => {});
      }
      await write(']}');
    }

    if (aborted) {
      res.destroy();
      return;
    }
    await write('}}');
    await new Promise((resolve) => gzip.end(resolve));
  } catch (err) {
    console.error('[Backup] export failed:', err);
    res.destroy();
  }
};

// ── POST /import/chunk — append one chunk of the backup file ────────────────
// The client slices the file into small chunks (hosting proxies like Vercel
// cap request bodies at ~4.5 MB) and uploads them sequentially.
export const importChunk = async (req, res) => {
  const uploadId = sanitizeUploadId(req.body?.uploadId);
  const index = Number(req.body?.index);
  if (!uploadId || !Number.isInteger(index) || index < 0) {
    return res.status(400).json({ success: false, message: 'Invalid upload id or chunk index.' });
  }
  if (!req.file?.buffer?.length) {
    return res.status(400).json({ success: false, message: 'No chunk data received.' });
  }
  ensureBackupDir();
  try {
    await fs.promises.appendFile(path.join(BACKUP_DIR, `${uploadId}.part`), req.file.buffer);
    res.json({ success: true, data: { index, received: req.file.buffer.length } });
  } catch (err) {
    console.error('[Backup] chunk append failed:', err);
    res.status(500).json({ success: false, message: 'Failed to write uploaded chunk.' });
  }
};

// ── POST /import/parse — validate the assembled file, return a summary ──────
export const importParse = async (req, res) => {
  const uploadId = sanitizeUploadId(req.body?.uploadId);
  if (!uploadId) {
    return res.status(400).json({ success: false, message: 'Invalid upload id.' });
  }
  const partPath = path.join(BACKUP_DIR, `${uploadId}.part`);
  if (!fs.existsSync(partPath)) {
    return res.status(404).json({ success: false, message: 'Uploaded file not found — upload it again.' });
  }

  // Clean up parts abandoned more than a day ago.
  try {
    ensureBackupDir();
    const now = Date.now();
    for (const f of fs.readdirSync(BACKUP_DIR)) {
      if (!f.endsWith('.part')) continue;
      const p = path.join(BACKUP_DIR, f);
      if (now - fs.statSync(p).mtimeMs > CHUNK_MAX_AGE_MS) fs.promises.unlink(p).catch(() => {});
    }
  } catch { /* cleanup is best-effort */ }

  try {
    const text = await readFileMaybeGzip(partPath);
    const parsed = EJSON.parse(text, { relaxed: false });
    const validationError = validateExport(parsed);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const collections = Object.entries(parsed.collections).map(([name, c]) => ({
      name,
      count: Array.isArray(c?.documents) ? c.documents.length : 0,
    }));
    const totalDocuments = collections.reduce((sum, c) => sum + c.count, 0);

    res.json({
      success: true,
      data: {
        uploadId,
        summary: {
          exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null,
          database: typeof parsed.database === 'string' ? parsed.database : null,
          totalDocuments,
          collections,
        },
      },
    });
  } catch (err) {
    console.error('[Backup] import parse failed:', err);
    res.status(400).json({ success: false, message: `Could not read that backup file: ${err?.message || 'unknown error'}` });
  }
};

// ── POST /import/confirm — restore the backup into the live DB (async job) ──
const runImportJob = async (job, uploadId, mode) => {
  const started = Date.now();
  const partPath = path.join(BACKUP_DIR, `${uploadId}.part`);
  try {
    job.progress = { phase: 'reading', collection: null, docsDone: 0, docsTotal: 0, collectionsDone: 0, collectionsTotal: 0 };

    const text = await readFileMaybeGzip(partPath);
    const parsed = EJSON.parse(text, { relaxed: false });
    const validationError = validateExport(parsed);
    if (validationError) throw new Error(validationError);

    const entries = Object.entries(parsed.collections);
    const docsTotal = entries.reduce((sum, [, c]) => sum + (Array.isArray(c?.documents) ? c.documents.length : 0), 0);
    job.progress = {
      phase: mode === 'replace' ? 'replacing' : 'merging',
      collection: null,
      docsDone: 0,
      docsTotal,
      collectionsDone: 0,
      collectionsTotal: entries.length,
    };

    const db = mongoose.connection.db;
    const results = [];
    let docsDone = 0;
    for (const [name, colData] of entries) {
      const docs = Array.isArray(colData?.documents) ? colData.documents : [];
      job.progress.collection = name;
      const dst = db.collection(name);
      if (mode === 'replace') {
        await dst.drop().catch(() => {});
      }
      const written = await insertDocs(dst, docs, {
        skipExisting: mode === 'merge',
        onBatch: (n) => { job.progress.docsDone = docsDone + n; },
      });
      if (mode === 'replace') {
        await restoreIndexes(dst, colData?.indexes);
      }
      docsDone += docs.length;
      job.progress.docsDone = docsDone;
      const targetCount = await dst.estimatedDocumentCount().catch(() => -1);
      results.push({ name, source: docs.length, written, targetCount });
      job.progress.collectionsDone = results.length;
      // Yield between collections so status polls aren't starved.
      await new Promise((r) => setImmediate(r));
    }

    // Only remove the uploaded part once the restore fully succeeded, so a
    // failed run can be retried from the same file.
    fs.promises.unlink(partPath).catch(() => {});

    jobDone(job, {
      mode,
      database: db.databaseName,
      collections: results,
      totalDocuments: docsTotal,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    jobFail(job, err);
  }
};

export const importConfirm = async (req, res) => {
  const uploadId = sanitizeUploadId(req.body?.uploadId);
  const mode = req.body?.mode === 'merge' ? 'merge' : 'replace';
  if (!uploadId) {
    return res.status(400).json({ success: false, message: 'Invalid upload id.' });
  }
  const partPath = path.join(BACKUP_DIR, `${uploadId}.part`);
  if (!fs.existsSync(partPath)) {
    return res.status(404).json({ success: false, message: 'Uploaded file not found — upload it again.' });
  }

  const { job, error } = createJob('import');
  if (error) return res.status(409).json({ success: false, message: error });

  runImportJob(job, uploadId, mode);
  res.json({ success: true, data: { jobId: job.id, mode } });
};

// ── GET /jobs/:id — poll a running operation ────────────────────────────────
export const getJobStatus = async (req, res) => {
  const job = jobs.get(String(req.params.id || ''));
  if (!job) {
    return res.status(404).json({ success: false, message: 'Unknown job — the server may have restarted. Start the operation again.' });
  }
  if (job.status === 'running' && Date.now() - Date.parse(job.startedAt) > JOB_STALE_MS) {
    jobFail(job, new Error('Operation timed out.'));
  }
  res.json({ success: true, data: job });
};
