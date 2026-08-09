// Google avatar CDN (lh3.googleusercontent.com) loads much faster at 96px
// than at full size. Requesting a thumbnail keeps the navbar / profile avatar
// visible "instantly" after login instead of waiting on a slow full-res fetch.
export const optimizeAvatar = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.includes('googleusercontent') && !url.includes('=')) {
    return `${url}=s96-c`;
  }
  return url;
};
