import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CLIENT_URL
);

export const verifyGoogleToken = async (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid token payload');
  }

  if (!payload.email) {
    throw new Error('Token does not contain email');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || '',
    picture: payload.picture || null,
    email_verified: payload.email_verified || false,
  };
};
