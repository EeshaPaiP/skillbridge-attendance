import { neon, neonConfig } from '@neondatabase/serverless';

// This allows the driver to use port 443 (which we just confirmed works!)
neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

export const sql = neon(process.env.DATABASE_URL);