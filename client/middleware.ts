import { NextResponse, type NextRequest } from 'next/server';
import {
  buildCanonicalLoginUrl,
  getLoginHost,
  pickLoginParams,
  shouldTransitionAuthHost,
} from '@/lib/canonical';

// The real client IP as seen at the edge. Vercel overwrites x-forwarded-for at
// the edge, so its leftmost entry is the visitor — not something a browser can
// spoof by sending the header itself.
function edgeClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (first) return first.slice(0, 64);
  }
  return (request.headers.get('x-real-ip') || '').slice(0, 64);
}

// Auth domain boundary.
//
// The SEO/discovery domains stay fully browsable — only the stateful login
// routes are transitioned to the canonical product domain before OAuth starts
// (NextAuth's state/PKCE cookies are host-scoped, so the OAuth round-trip must
// begin and end on the same host). Public pages such as /pyq, /notes and
// /syllabus are untouched: there is no global redirect and no loop, because
// the canonical host is never in the transition set.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API proxy paths (/backend/* → main server, /pdfapi/* → pdf service).
  // These are proxied SERVER-SIDE, so the backend would otherwise only ever
  // see Vercel's egress IP for every student. Stamp the true client IP into
  // x-client-ip here, where it is reliable; the backends read it first.
  if (pathname.startsWith('/backend/') || pathname.startsWith('/pdfapi/')) {
    const headers = new Headers(request.headers);
    const ip = edgeClientIp(request);
    if (ip) headers.set('x-client-ip', ip);
    return NextResponse.next({ request: { headers } });
  }

  const host = getLoginHost({
    'x-forwarded-host': request.headers.get('x-forwarded-host'),
    host: request.headers.get('host'),
  });

  if (!shouldTransitionAuthHost(host)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(
    buildCanonicalLoginUrl(request.nextUrl.pathname, pickLoginParams(request.nextUrl.search))
  );
}

export const config = {
  matcher: ['/login', '/auth/signin', '/backend/:path*', '/pdfapi/:path*'],
};
