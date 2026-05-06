import { createNeonAuth } from '@neondatabase/auth/next/server';

const normalizeAuthBaseUrl = (rawUrl: string | undefined) => {
  if (!rawUrl || rawUrl.trim() === '') {
    throw new Error('Missing NEON_AUTH_BASE_URL environment variable.');
  }

  const cleaned = rawUrl.trim().replace(/\/+$|\s+$/g, '');
  let authUrl: URL;

  try {
    authUrl = new URL(cleaned);
  } catch {
    try {
      authUrl = new URL(`https://${cleaned}`);
    } catch {
      throw new Error(
        `Invalid NEON_AUTH_BASE_URL value. Expected a valid URL, got ${JSON.stringify(rawUrl)}.`,
      );
    }
  }

  if (process.env.DATABASE_URL) {
    try {
      const dbUrl = new URL(process.env.DATABASE_URL.replace(/^postgresql:/, 'http:'));
      if (dbUrl.host === authUrl.host) {
        throw new Error(
          'NEON_AUTH_BASE_URL appears to point to your database host. Set NEON_AUTH_BASE_URL to your Neon Auth service URL, not the Postgres host from DATABASE_URL.',
        );
      }
    } catch {
      // ignore parse errors for DATABASE_URL; the auth URL itself is still validated above
    }
  }

  return authUrl.toString().replace(/\/+$/g, '');
};

export const auth = createNeonAuth({
  baseUrl: normalizeAuthBaseUrl(process.env.NEON_AUTH_BASE_URL || process.env.BETTER_AUTH_BASE_URL),
  cookies: {
    secret:
      process.env.NEON_AUTH_COOKIE_SECRET ||
      process.env.AUTH_SECRET ||
      process.env.BETTER_AUTH_SECRET ||
      (() => {
        throw new Error('Missing NEON_AUTH_COOKIE_SECRET / AUTH_SECRET / BETTER_AUTH_SECRET environment variable.');
      })(),
  },
});
