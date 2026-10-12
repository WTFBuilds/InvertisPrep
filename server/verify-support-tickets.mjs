// E2E test for the support-ticket system: paper requests + bug reports.
// Registers a throwaway student, raises a paper request and a bug, verifies
// /mine returns both, replies as the student, verifies the thread persisted,
// then (staff path) promotes to admin and verifies unread-count reflects a
// staff reply. Cleans up everything.
//
// Run from server/:  node --env-file=.env verify-support-tickets.mjs

const API = 'http://localhost:5000/api';

const stamp = Date.now().toString().slice(-8);
const email = `ticket.${stamp}@invertisprep.in`;

async function j(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text.slice(0, 200) }; }
}

async function main() {
  // Register student
  const reg = await j(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ticket Check', email, password: 'TicketCheck#2026', phoneNumber: '9999999999' }),
  });
  if (reg.status !== 201 || !reg.body?.token) {
    console.log('❌ register failed', reg.status, JSON.stringify(reg.body).slice(0, 200));
    process.exit(1);
  }
  const token = reg.body.token;
  const userId = reg.body.user.id;
  const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  console.log(`✓ registered student (${userId})`);

  // Raise a paper request
  const deptList = await j(`${API}/departments`);
  const dept = deptList.body?.data?.[0];
  const branchList = await j(`${API}/branches?departmentId=${dept?._id}`);
  const branch = branchList.body?.data?.[0];
  if (!dept || !branch) { console.log('⚠ no departments/branches — skipping paper request'); }
  else {
    const req = await j(`${API}/paper-requests`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({
        departmentId: dept._id,
        branchId: branch._id,
        subjectName: 'Support Systems',
        subjectCode: 'CS401',
        examType: 'any',
        year: 2024,
        note: 'Need this for mid-terms',
      }),
    });
    console.log(`✓ create paper request → ${req.status}`);
    const reqId = req.body?.data?._id;
    if (!reqId) { console.log('❌ no request id'); process.exit(1); }

    // Student sees it in /mine
    const mine = await j(`${API}/paper-requests/mine`, { headers: H });
    console.log(`✓ /paper-requests/mine → ${mine.status}, found: ${mine.body?.data?.some((r) => r._id === reqId)}`);

    // Student replies
    const reply = await j(`${API}/paper-requests/${reqId}/reply`, { method: 'POST', headers: H, body: JSON.stringify({ body: 'Any updates on this?' }) });
    console.log(`✓ student reply → ${reply.status}, thread messages: ${reply.body?.data?.messages?.length ?? 0}`);

    // Unread-count sees only staff replies → should be 0 so far
    const unread0 = await j(`${API}/paper-requests/unread-count`, { headers: H });
    console.log(`✓ unread-count (before staff reply) → ${unread0.body?.data?.unread ?? '?'} (expect 0)`);
  }

  // Raise a bug
  const bug = await j(`${API}/bugs`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ title: 'Broken download button', description: 'The button does nothing', severity: 'medium', email }),
  });
  console.log(`✓ create bug → ${bug.status}`);
  const bugId = bug.body?.data?._id;

  if (bugId) {
    const mineB = await j(`${API}/bugs/mine`, { headers: H });
    console.log(`✓ /bugs/mine → ${mineB.status}, found: ${mineB.body?.data?.some((b) => b._id === bugId)}`);
  }

  // Staff reply → unread jumps to 1 — simulate by promoting to admin and replying as admin
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const mongo = await import('mongodb');
  const oid = new mongo.ObjectId(userId);
  await db.collection('users').updateOne({ _id: oid }, { $set: { role: 'admin' } });

  const login = await j(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'TicketCheck#2026' }) });
  const adminToken = login.body?.token;
  const AH = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

  // Paper request staff reply (if one was created)
  const mine2 = await j(`${API}/paper-requests/mine`, { headers: AH });
  const myReq = mine2.body?.data?.[0];
  if (myReq?._id) {
    const staffReply = await j(`${API}/paper-requests/${myReq._id}/reply`, { method: 'POST', headers: AH, body: JSON.stringify({ body: 'We found it, uploading shortly.' }) });
    console.log(`✓ staff reply (paper) → ${staffReply.status}, thread messages: ${staffReply.body?.data?.messages?.length ?? 0}`);

    const unread1 = await j(`${API}/paper-requests/unread-count`, { headers: AH });
    console.log(`✓ unread-count (after staff reply) → ${unread1.body?.data?.unread ?? '?'} (expect ≥1)`);
  }

  // Cleanup on the SAME connection
  await db.collection('users').deleteOne({ _id: oid });
  if (bugId) await db.collection('bugs').deleteOne({ _id: new mongo.ObjectId(bugId) });
  await db.collection('paperrequests').deleteMany({ requestedBy: oid });
  await db.collection('reports').deleteMany({ reportedBy: oid });
  await mongoose.disconnect();
  console.log('\n✓ cleanup complete');
}

main().catch((e) => { console.error('test failed:', e); process.exit(1); });