import fs from 'node:fs';

const clientPath = 'client/lib/clubs.ts';
const src = fs.readFileSync(clientPath, 'utf8');

const start = src.indexOf('export const CLUBS: Record<string, Club> = {');
const objStart = src.indexOf('{', start);
const objEnd = src.indexOf('\n};', objStart);
let body = src.slice(objStart + 1, objEnd);

// Icons become plain string keys.
const iconMap = {
  Paintbrush: 'Paintbrush', Heart: 'Heart', Music: 'Music',
  BookOpen: 'BookOpen', Cpu: 'Cpu', Trophy: 'Trophy', Briefcase: 'Briefcase',
};
body = body.replace(/icon:\s*(\w+),/g, (m, name) => `icon: '${iconMap[name] || 'Users'}',`);

// Strip TS-only syntax.
body = body.replace(/\s+as const/g, '');

const out = `/**
 * Seed data for the clubs collection.
 *
 * This mirrors client/lib/clubs.ts — the canonical, human-authored copy of
 * the club content. It is inserted into Mongo the first time the clubs
 * collection is read, so a fresh deployment starts with the full club
 * pages already populated. Once the collection has documents, admins
 * own the content and this seed is never re-applied.
 *
 * Generated from client/lib/clubs.ts by scripts/generate-club-seed.mjs.
 */

const SEED_CLUB_MAP = {${body}
};

/** The seed clubs as an array, ready for insertMany(). */
export const SEED_CLUBS = Object.values(SEED_CLUB_MAP);
`;

fs.writeFileSync('server/src/shared/clubSeed.js', out);
console.log('Wrote server/src/shared/clubSeed.js');
