import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';
import { env } from '../config/env.js';

// env module validates TURSO_DATABASE_URL and TURSO_AUTH_TOKEN at startup.
const client = createClient({
  url:       env.TURSO_DATABASE_URL.replace('libsql://', 'https://'),
  authToken: env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });