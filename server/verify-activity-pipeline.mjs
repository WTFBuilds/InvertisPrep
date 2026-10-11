// End-to-end verification of the activity pipeline against the REAL database.
// Creates a clearly-labeled throwaway user, pushes one event through every
// tracking path exactly the way the app does, reads the docs back from Mongo,
// then deletes everything it created.
//
// Run from server/:  node --env-file=.env verify-activity-pipeline.mjs
// (dev servers must be running on :5000 and :5002)

const API = 'http://localhost:5000/api';
const PDF = 'http://localhost:5002/api';

const stamp = Date.now().toString().slice(-8);
const email = `pipeline.check.${stamp}@invertisprep.in`;
const sessionKey = 'verify-pipeline-script';

async function j(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 160);
  }
  return { status: res.status, body };
}

async function main() {
  // 1 — register (this also exercises the server-side signup event)
  const reg = await j(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Pipeline Check',
      email,
      password: 'PipelineCheck#2026',
      phoneNumber: '9999999999',
    }),
  });
  const token = reg.body?.token;
  const userId = reg.body?.user?.id ?? reg.body?.user?._id;
  if (!token || !userId) {
    console.log('❌ REGISTER FAILED', reg.status, JSON.stringify(reg.body).slice(0, 240));
    process.exit(1);
  }
  console.log(`✓ registered test user ${email} (${userId})`);

  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 2 — presence heartbeat (what makes "Online Now" work)
  const hb = await j(`${API}/activity/presence`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ path: '/pyq', title: 'PYQ papers', sessionKey, visible: true }),
  });
  console.log(`✓ presence heartbeat → ${hb.status}`);

  // 3 — page view (what the client tracker sends on every navigation)
  const pv = await j(`${API}/activity`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ type: 'page_view', path: '/pyq', title: 'PYQ papers', sessionKey, referrer: 'https://www.google.com/' }),
  });
  console.log(`✓ page_view → ${pv.status}`);

  // 4 — open a real PYQ paper (the exact call the student list makes on open)
  const pyq = await j(`${PDF}/pyq?page=1&limit=1`);
  const paperId = pyq.body?.data?.[0]?._id;
  if (!paperId) {
    console.log('⚠ no PYQ papers to test with — skipping paper events');
  } else {
    const tv = await j(`${PDF}/pyq/${paperId}/view`, { method: 'POST', headers: auth });
    console.log(`✓ paper_view (trackView ${paperId}) → ${tv.status}`);
    const td = await j(`${PDF}/pyq/${paperId}/download`, { method: 'POST', headers: auth });
    console.log(`✓ paper_download → ${td.status}`);
    const sr = await j(`${PDF}/pyq?search=mathematics&page=1&limit=1`, { headers: auth });
    console.log(`✓ search (browse with query) → ${sr.status}`);
  }

  // give the fire-and-forget writes a beat
  await new Promise((r) => setTimeout(r, 1200));

  // 5 — read it all back from MongoDB
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const uid = new (await import('mongodb')).ObjectId(userId);

  const logs = await db.collection('activitylogs').find({ user: uid }).sort({ createdAt: -1 }).limit(10).toArray();
  console.log(`\n── MongoDB: ${logs.length} activity events written for the test user:`);
  for (const d of logs) {
    const dev = d.device ? `${d.device.browser || '?'} on ${d.device.os || '?'} (${d.device.type || '?'})` : '—';
    console.log(`   • ${d.type.padEnd(15)} | ip: ${String(d.ip || '(empty)').padEnd(16)} | ${dev.padEnd(28)} | ${d.title || d.path || ''}`);
  }

  const presence = await db.collection('presences').findOne({ user: uid });
  if (presence) {
    console.log(`\n── MongoDB presence doc: path="${presence.currentPath}" title="${presence.currentTitle}" ip=${presence.ip} lastSeen=${presence.lastSeenAt?.toISOString()}`);
    console.log('   → this user now counts in "Online Now" and shows in Live Now for 90s after this beat');
  } else {
    console.log('\n❌ no presence doc found — heartbeat did not persist');
  }

  // 6 — clean up everything the test created
  await db.collection('activitylogs').deleteMany({ user: uid });
  await db.collection('presences').deleteOne({ user: uid });
  await db.collection('users').deleteOne({ _id: uid });
  console.log('\n✓ cleanup done — test user, its events and presence removed from the DB');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('verification run failed:', err?.message || err);
  process.exit(1);
});
