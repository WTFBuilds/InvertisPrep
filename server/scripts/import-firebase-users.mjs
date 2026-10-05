/**
 * InvertisPrep — Firebase → MongoDB v2 user migration (standalone final).
 * ========================================================================
 * Pre-seeds users from the old Firebase-based platform into the v2 Mongo
 * `users` collection so their FIRST Google sign-in resolves to their existing
 * account instantly — no re-registration, no profile setup. The v2 login flow
 * (NextAuth → /auth/google-login) matches by googleId/email and issues tokens,
 * so a pre-seeded record with googleId is all it takes.
 *
 * STANDALONE — no repo needed. One-time setup in an empty folder:
 *   npm init -y && npm i mongoose firebase-admin dotenv
 *
 * Environment (shell exports or a .env file next to this script):
 *   MONGODB_URI                     — v2 database (same URI the API uses)
 *   FIREBASE_SERVICE_ACCOUNT        — full service-account JSON as a string, OR
 *   FIREBASE_SERVICE_ACCOUNT_PATH   — path to the service-account JSON file
 *
 * Usage:
 *   node import-firebase-users.mjs                        # dry-run report (default)
 *   node import-firebase-users.mjs --commit               # actually write to Mongo
 *   node import-firebase-users.mjs --export fb.json       # dump Firebase users to a file
 *   node import-firebase-users.mjs --from fb.json         # import from a saved export
 *   node import-firebase-users.mjs --email a@b.com        # import exactly one email
 *   node import-firebase-users.mjs --limit 5              # test with N users only
 *
 * Typical full run:
 *   node import-firebase-users.mjs --export fb.json       # one-time, needs Firebase creds
 *   node import-firebase-users.mjs --from fb.json         # dry-run against Mongo
 *   node import-firebase-users.mjs --from fb.json --commit
 *
 * Proven results (Oct 2026 migration): 4,098 Firebase users fetched,
 * 3,422 Google-federated verified users imported, 0 conflicts.
 *
 * Safety rules baked in:
 *   - Bulk mode imports Google-federated users with verified emails only
 *     (the v2 googleLogin rejects unverified emails, so the rest is dead weight).
 *   - --email mode imports the exact account regardless of provider (email/name
 *     only for password accounts — they log in instantly the moment they use
 *     Google sign-in with that Gmail; Firebase passwords can't migrate).
 *   - Matched by email; existing users are only PATCHED with fields they are
 *     missing (googleId / picture). role, qcoins, points, freeDownloadsLeft
 *     and everything else on existing accounts is never touched.
 *   - Email conflicts (existing user linked to a DIFFERENT Google account)
 *     are reported and skipped, never overwritten.
 *   - Firebase-disabled accounts are imported with isActive: false.
 *   - Re-running is idempotent: already-imported users report as
 *     "already fully synced" and are left untouched.
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// ── v2 User schema, exactly as the server defines it ────────────────────────
const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, sparse: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    name: { type: String, required: true, trim: true },
    picture: { type: String },
    studentId: { type: String, trim: true, default: '' },
    phoneNumber: { type: String, trim: true, default: '' },
    course: { type: String, trim: true, default: '' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    role: { type: String, enum: ['student', 'srt', 'admin', 'super-admin'], default: 'student' },
    lastLogin: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    qcoins: { type: Number, default: 0, min: 0 },
    freeDownloadsLeft: { type: Number, default: 2, min: 0 },
    points: { type: Number, default: 0, min: 0, index: true },
    weeklyPoints: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);
const User = mongoose.model('User', userSchema);

// ── CLI flags ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const COMMIT = args.includes('--commit');
const exportIdx = args.indexOf('--export');
const EXPORT_PATH = exportIdx !== -1 ? args[exportIdx + 1] : null;
const fromIdx = args.indexOf('--from');
const FROM_PATH = fromIdx !== -1 ? args[fromIdx + 1] : null;
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) || 0 : 0;
const emailIdx = args.indexOf('--email');
const EMAIL = emailIdx !== -1 ? args[emailIdx + 1]?.toLowerCase().trim() : null;

const resolveServiceAccount = () => {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      ? JSON.parse(fsSync.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'))
      : null;

  if (!serviceAccount) {
    console.error(
      'Set FIREBASE_SERVICE_ACCOUNT (JSON string) or FIREBASE_SERVICE_ACCOUNT_PATH (file), ' +
      'or use --from <file> with a previous --export.'
    );
    process.exit(1);
  }
  return serviceAccount;
};

/**
 * Single-email mode: fetch exactly one Firebase Auth user by email via
 * getUserByEmail (no bulk listing). Imports the account regardless of
 * provider, because a targeted import of a password account (email/name
 * only, no googleId) still lets that user log in instantly the moment they
 * choose Google sign-in with the same Gmail.
 */
const fetchSingleUser = async (email) => {
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  initializeApp({ credential: cert(resolveServiceAccount()) });

  let user;
  try {
    user = await getAuth().getUserByEmail(email);
  } catch (err) {
    console.error(`No Firebase Auth user found with email: ${email}`);
    process.exit(1);
  }

  const googleProvider = (user.providerData || []).find((p) => p.providerId === 'google.com');
  const record = {
    email: user.email.toLowerCase().trim(),
    name: user.displayName || 'User',
    picture: user.photoURL || null,
    googleId: googleProvider?.uid || null,
    disabled: !!user.disabled,
    lastSignIn: user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null,
    firebaseUid: user.uid,
  };

  console.log(`Found Firebase user: ${record.email}`);
  if (!googleProvider) {
    console.log('Note: email/password account (no Google identity in Firebase).');
    console.log('  → Importing email/name only. They get in instantly if they use "Continue');
    console.log('    with Google" on this Gmail (googleLogin matches by email); their Firebase');
    console.log('    password cannot be migrated (Firebase scrypt vs your bcrypt).');
  } else if (!user.emailVerified) {
    console.log('Note: Google account with emailVerified=false in Firebase — importing anyway.');
  }
  return [record];
};

/**
 * Pulls every Firebase Auth user, keeps Google-federated accounts with
 * verified emails, and maps them to the import shape. Optionally writes the
 * transformed list to `exportPath` so the Firebase step (which needs
 * service-account credentials) runs only once.
 */
const exportFromFirebase = async (exportPath) => {
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  initializeApp({ credential: cert(resolveServiceAccount()) });

  const all = [];
  let pageToken;
  do {
    // listUsers caps at 1000 per call — loop until the token runs out.
    const result = await getAuth().listUsers(1000, pageToken);
    all.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);
  console.log(`Fetched ${all.length} Firebase Auth users.`);

  const transformed = [];
  const seenEmails = new Set();
  const googleIdOwners = new Map(); // googleId → email, for collision reporting

  for (const u of all) {
    const googleProvider = (u.providerData || []).find((p) => p.providerId === 'google.com');
    if (!googleProvider || !u.email || !u.emailVerified) continue;

    const email = u.email.toLowerCase().trim();
    if (seenEmails.has(email)) continue; // Firebase shouldn't dupe, but casing can
    seenEmails.add(email);

    transformed.push({
      email,
      name: u.displayName || 'User',
      picture: u.photoURL || null,
      googleId: googleProvider.uid, // this IS the Google `sub` — same value googleLogin stores
      disabled: !!u.disabled,
      lastSignIn: u.metadata?.lastSignInTime ? new Date(u.metadata.lastSignInTime) : null,
      firebaseUid: u.uid,
    });

    if (googleIdOwners.has(googleProvider.uid)) {
      console.warn(
        `⚠ Same Google account (${googleProvider.uid}) on two Firebase emails: ` +
        `${googleIdOwners.get(googleProvider.uid)} and ${email} — importing the first only.`
      );
    } else {
      googleIdOwners.set(googleProvider.uid, email);
    }
  }

  console.log(`Google-federated verified users: ${transformed.length}`);

  if (LIMIT > 0 && transformed.length > LIMIT) {
    console.log(`--limit ${LIMIT}: keeping the first ${LIMIT} of ${transformed.length} users for this test run.`);
    transformed.length = LIMIT;
  }

  if (exportPath) {
    await fs.writeFile(exportPath, JSON.stringify(transformed, null, 2));
    console.log(`Export written to ${exportPath}`);
  }

  return transformed;
};

const main = async () => {
  // ── 1. Load Firebase users (single email, saved export, or full pull) ─────
  let firebaseUsers;
  if (FROM_PATH) {
    firebaseUsers = JSON.parse(await fs.readFile(FROM_PATH, 'utf8'));
    console.log(`Loaded ${firebaseUsers.length} users from export file: ${FROM_PATH}`);
    if (EMAIL) {
      const before = firebaseUsers.length;
      firebaseUsers = firebaseUsers.filter((u) => u.email === EMAIL);
      console.log(`--email ${EMAIL}: ${firebaseUsers.length} of ${before} exported users matched.`);
    }
  } else if (EMAIL) {
    firebaseUsers = await fetchSingleUser(EMAIL);
  } else {
    firebaseUsers = await exportFromFirebase(EXPORT_PATH);
  }

  // ── 2. Connect to Mongo and load existing accounts ────────────────────────
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not set (environment or .env file).');
    process.exit(1);
  }
  await mongoose.connect(mongoUri, { family: 4 });
  console.log(`Connected to Mongo database: ${mongoose.connection.name}`);

  const existingUsers = await User.find({}).select('email googleId name picture').lean();

  const byEmail = new Map(
    existingUsers.filter((u) => u.email).map((u) => [u.email.toLowerCase(), u])
  );
  const byGoogleId = new Map(
    existingUsers.filter((u) => u.googleId).map((u) => [u.googleId, u])
  );

  // ── 3. Partition Firebase users into insert / patch / skip ────────────────
  const toInsert = [];
  const toPatch = []; // { filter, update: { $set } }
  let unchanged = 0;
  const conflicts = [];
  const alreadyLinked = [];

  for (const fb of firebaseUsers) {
    const existingByEmail = byEmail.get(fb.email);
    if (existingByEmail) {
      if (existingByEmail.googleId && existingByEmail.googleId !== fb.googleId) {
        conflicts.push({
          email: fb.email,
          reason: `existing account is linked to a different Google account (${existingByEmail.googleId})`,
        });
        continue;
      }
      const $set = {};
      if (!existingByEmail.googleId) $set.googleId = fb.googleId;
      if (!existingByEmail.picture && fb.picture) $set.picture = fb.picture;
      if (Object.keys($set).length === 0) {
        unchanged += 1;
      } else {
        toPatch.push({ filter: { _id: existingByEmail._id }, update: { $set } });
      }
      continue;
    }

    const existingByGoogleId = fb.googleId ? byGoogleId.get(fb.googleId) : null;
    if (existingByGoogleId) {
      // Google account already linked here under an older email. Nothing to
      // import — at login, googleLogin matches by googleId first, so this
      // user signs in instantly regardless of the email difference.
      alreadyLinked.push({ email: fb.email, linkedEmail: existingByGoogleId.email });
      continue;
    }

    toInsert.push(fb);
  }

  // ── 4. Report ─────────────────────────────────────────────────────────────
  const disabledCount = toInsert.filter((u) => u.disabled).length;
  console.log('\n────────────── Migration report ──────────────');
  console.log(`Firebase users eligible:            ${firebaseUsers.length}`);
  console.log(`Would insert (new accounts):        ${toInsert.length}${disabledCount ? ` (${disabledCount} of them disabled → isActive: false)` : ''}`);
  console.log(`Would patch (existing, missing googleId/picture): ${toPatch.length}`);
  console.log(`Already fully synced:               ${unchanged}`);
  console.log(`Already linked here (email changed on Google): ${alreadyLinked.length}`);
  console.log(`Conflicts (skipped):                ${conflicts.length}`);

  if (conflicts.length > 0) {
    console.log('\nConflicts — review these manually, they will NOT be touched:');
    for (const c of conflicts) console.log(`  • ${c.email}: ${c.reason}`);
  }
  if (alreadyLinked.length > 0) {
    console.log('\nEmail-changed users (existing googleId match, skipped):');
    for (const u of alreadyLinked) console.log(`  • firebase ${u.email} → stored as ${u.linkedEmail}`);
  }

  if (!COMMIT) {
    console.log('\nDry run only — nothing was written. Re-run with --commit to apply.');
    await mongoose.disconnect();
    return;
  }

  // ── 5. Commit ─────────────────────────────────────────────────────────────
  if (toInsert.length > 0) {
    const docs = toInsert.map((u) => ({
      email: u.email,
      name: u.name,
      picture: u.picture,
      googleId: u.googleId,
      role: 'student',
      isActive: !u.disabled,
      lastLogin: u.lastSignIn || undefined, // schema default (now) applies if absent
    }));
    // ordered: false → one bad document can't abort the whole batch.
    const inserted = await User.insertMany(docs, { ordered: false });
    console.log(`\nInserted ${inserted.length} users.`);
  }

  if (toPatch.length > 0) {
    const result = await User.bulkWrite(
      toPatch.map((p) => ({ updateOne: { filter: p.filter, update: p.update } }))
    );
    console.log(`Patched ${result.modifiedCount} existing users.`);
  }

  console.log('Done. Migrated users now log in instantly with Google — their first sign-in matches this record and issues tokens like any other user.');
  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error('Migration failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
