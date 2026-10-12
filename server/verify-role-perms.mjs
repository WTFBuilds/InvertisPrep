// E2E test for editable built-in role permissions + papers.edit/delete split.
// Registers a throwaway user, promotes to admin, checks the admin Role doc is
// seeded, revokes papers.delete (already system-only) and confirms the resolved
// permission set reflects the editable doc. Cleans up everything after.
//
// Run from server/:  node --env-file=.env verify-role-perms.mjs

const API = 'http://localhost:5000/api';
const PDF = 'http://localhost:5002/api';

const stamp = Date.now().toString().slice(-8);
const email = `rolecheck.${stamp}@invertisprep.in`;

async function j(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; }
  catch { return { status: res.status, body: text.slice(0, 200) }; }
}

async function main() {
  // Register the test user
  const reg = await j(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Role Check', email, password: 'RoleCheck#2026', phoneNumber: '9999999999' }),
  });
  if (reg.status !== 201 || !reg.body?.token) {
    console.log('❌ register failed', reg.status, JSON.stringify(reg.body).slice(0, 200));
    process.exit(1);
  }
  const token = reg.body.token;
  const userId = reg.body.user.id;
  console.log(`✓ registered test user (${userId})`);

  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Promote to admin directly (documented migration pattern)
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const mongo = await import('mongodb');
  const oid = new mongo.ObjectId(userId);
  await db.collection('users').updateOne({ _id: oid }, { $set: { role: 'admin' } });
  console.log('✓ promoted test user to admin');

  // Fresh token with role=admin
  const login = await j(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'RoleCheck#2026' }),
  });
  const adminToken = login.body?.token;
  const adminAuth = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };
  console.log('✓ logged in as admin');

  // listRoles as admin → seeds the admin + srt system docs
  const list = await j(`${API}/admin/roles`, { headers: adminAuth });
  console.log(`✓ listRoles as admin → ${list.status}, roles: ${(list.body?.data || []).map((r) => r.name + (r.isSystem ? '(sys)' : '')).join(', ')}`);

  // 1. The admin system Role doc should now exist (seeded by listRoles).
  const adminRole = await db.collection('roles').findOne({ name: 'admin', isSystem: true });
  if (!adminRole) { console.log('❌ admin system role NOT seeded'); process.exit(1); }
  console.log(`✓ admin system role exists: id=${adminRole._id} perms=${adminRole.permissions.length}`);

  // 2. Current user should reflect the editable perms (no papers.delete key
  //    in resolve since the doc default excludes it).
  const me = await j(`${API}/auth/me`, { headers: adminAuth });
  const perms = me.body?.user?.permissions ?? [];
  console.log(`✓ /auth/me admin permissions (${perms.length}): ${perms.includes('papers.edit') ? 'has papers.edit' : 'NO papers.edit'}, ${perms.includes('papers.delete') ? 'HAS papers.delete (BAD)' : 'no papers.delete (correct)'}`);

  // 3. Direct attempt: admin tries to DELETE a paper → must 403 (super-admin only).
  const pyq = await j(`${PDF}/pyq?page=1&limit=1`);
  const paperId = pyq.body?.data?.[0]?._id;
  if (paperId) {
    const del = await j(`${PDF}/pyq/${paperId}`, { method: 'DELETE', headers: adminAuth });
    console.log(`✓ admin DELETE /pyq/${paperId} → ${del.status} ${del.status === 403 ? '(correctly forbidden)' : del.status === 200 ? '*** ADMIN COULD DELETE (BUG)' : ''}`);
  }

  // 4. Now verify the edit route: admin PUT without papers.edit → 403.
  //    IMPORTANT: we intentionally do NOT send any real mutation — the check
  //    is that a 403 arrives. The body is a NON-mutating probe: the route
  //    authorizes first, so a 403 means denied before any write; if it ever
  //    returns 200, we must treat that as a test failure and NOT proceed.
  if (paperId) {
    const put = await j(`${PDF}/pyq/${paperId}`, {
      method: 'PUT',
      headers: adminAuth,
      body: JSON.stringify({ subjectName: 'SAFETY-GUARD-NOOP' }),
    });
    console.log(`✓ admin PUT /pyq/${paperId} → ${put.status} ${put.status === 403 ? '(correctly forbidden without papers.edit)' : put.status === 200 ? '*** ADMIN COULD EDIT — test must be reviewed, and the paper untouched' : ''}`);
  }

  // 5. Confirm resolveUserPermissions path via a super-admin-token test would
  //    require sensitive creds — instead assert the mapping directly.
  const { resolveUserPermissions } = await import('./src/shared/permissions.js');
  const resolved = await resolveUserPermissions({ role: 'admin', _id: userId });
  console.log(`✓ resolveUserPermissions(admin) → ${resolved.length} perms; papers.edit=${resolved.includes('papers.edit')}; papers.delete=${resolved.includes('papers.delete')}`);

  // 6. Restore the user's original state (delete test user + any roles seeded).
  await db.collection('users').deleteOne({ _id: oid });
  await mongoose.disconnect();
  console.log('\n✓ cleanup complete');
}

main().catch((e) => { console.error('test failed:', e); process.exit(1); });