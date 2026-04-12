import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('❌ CRITICAL: TURSO_DATABASE_URL is not defined in environment variables.');
}

const client = createClient({
  url: (url || '').replace('libsql://', 'https://'),
  authToken: authToken || '',
});

export const db = drizzle(client, { schema });