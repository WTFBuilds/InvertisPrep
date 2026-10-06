import { NextResponse, type NextRequest } from 'next/server';
import {
  buildCanonicalLoginUrl,
  getLoginHost,
  pickLoginParams,
  shouldTransitionAuthHost,
} from '@/lib/canonical';

// Auth domain boundary.
//
// The SEO/discovery domains stay fully browsable — only the stateful login
// routes are transitioned to the canonical product domain before OAuth starts
// (NextAuth's state/PKCE cookies are host-scoped, so the OAuth round-trip must
// begin and end on the same host). Public pages such as /pyq, /notes and
// /syllabus are untouched: there is no global redirect and no loop, because
// the canonical host is never in the transition set.
export function middleware(request: NextRequest) {
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
  matcher: ['/login', '/auth/signin'],
};
