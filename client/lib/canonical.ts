// Canonical product/auth domain architecture.
//
// InvertisPrep serves two public domains:
//   - https://invertisprep.vercel.app — SEO/discovery entry point (stays public)
//   - https://invertisprep.in         — canonical authenticated product domain
//
// NextAuth's Google flow is stateful: the state/PKCE cookies it sets are
// scoped to the host that starts the flow, while the OAuth redirect_uri is
// derived from the server's resolved origin. A flow started on .vercel.app
// therefore lands on .in without its state cookies and fails with
// `error=OAuthCallback`. Authentication must transition to the canonical
// domain BEFORE the OAuth round-trip begins. Public pages are never
// redirected, so the SEO entry point keeps working and no loop is possible
// (the canonical host is never in the transition set).

export const CANONICAL_AUTH_ORIGIN = 'https://invertisprep.in';

// Hosts allowed to serve the authenticated experience directly.
const CANONICAL_AUTH_HOSTS = new Set(['invertisprep.in']);

// Public/SEO hosts that must transition to the canonical domain for login.
// Vercel preview deployments are intentionally excluded so they keep working
// as isolated test environments.
const TRANSITION_AUTH_HOSTS = new Set([
  'invertisprep.vercel.app',
  'www.invertisprep.in',
]);

// Login-route query params carried across the domain transition. Anything
// else is dropped, so unknown params can't be injected into the login URL.
export const PRESERVED_LOGIN_PARAMS = [
  'returnUrl',
  'webview',
  'mobile',
  'role',
  'mode',
] as const;

export type PreservedLoginParam = (typeof PRESERVED_LOGIN_PARAMS)[number];

export type LoginTransitionParams = Partial<Record<PreservedLoginParam, string>>;

export type LoginHostHeaders = {
  'x-forwarded-host'?: string | null;
  host?: string | null;
};

// Resolves the serving host from proxy headers (x-forwarded-host can be a
// comma-separated list when proxies are chained, and may carry a port).
export function getLoginHost(headers: LoginHostHeaders): string {
  const raw = headers['x-forwarded-host'] ?? headers.host ?? '';
  return raw.split(',')[0].trim().toLowerCase().split(':')[0];
}

export function isCanonicalAuthHost(host: string): boolean {
  return CANONICAL_AUTH_HOSTS.has(host);
}

export function shouldTransitionAuthHost(host: string): boolean {
  return TRANSITION_AUTH_HOSTS.has(host);
}

// Only in-app relative destinations qualify as post-login redirects.
// Rejects absolute URLs and protocol-relative "//host" / "/\" variants so the
// returnUrl parameter can never become an open redirect.
export function isSafeReturnPath(path: string | null | undefined): path is string {
  return Boolean(
    path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')
  );
}

export function pickLoginParams(search: string): LoginTransitionParams {
  const params = new URLSearchParams(search);
  const picked: LoginTransitionParams = {};
  for (const key of PRESERVED_LOGIN_PARAMS) {
    const value = params.get(key);
    if (value) picked[key] = value;
  }
  return picked;
}

// Builds a login-route URL on the canonical domain, preserving only
// whitelisted params from the original request.
export function buildCanonicalLoginUrl(
  pathname: string,
  params: LoginTransitionParams = {},
  options?: { autoGoogle?: boolean }
): string {
  const url = new URL(pathname === '/auth/signin' ? pathname : '/login', CANONICAL_AUTH_ORIGIN);
  for (const key of PRESERVED_LOGIN_PARAMS) {
    const value = params[key];
    if (value) url.searchParams.set(key, value);
  }
  if (options?.autoGoogle) {
    url.searchParams.set('auto', 'google');
  }
  return url.toString();
}

// Builds a /login href that preserves the current location so sign-in can
// return the user there after authentication (client-side use only).
export function buildLoginHref(currentPath: string, currentSearch: string): string {
  const target = `${currentPath}${currentSearch}`;
  if (!isSafeReturnPath(target)) {
    return '/login';
  }
  if (currentPath.startsWith('/login') || currentPath.startsWith('/auth/signin')) {
    return '/login';
  }
  return `/login?returnUrl=${encodeURIComponent(target)}`;
}
