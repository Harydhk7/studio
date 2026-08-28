import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const globalForPg = globalThis as typeof globalThis & {
  __sozolenPool?: pg.Pool;
};

const defaultMax = process.env.VERCEL ? 1 : 10;
const poolMax = Number(process.env.PGPOOL_MAX ?? defaultMax);

export const pool =
  globalForPg.__sozolenPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number.isFinite(poolMax) ? poolMax : defaultMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (!globalForPg.__sozolenPool) {
  globalForPg.__sozolenPool = pool;
}

export const db = drizzle(pool, { schema });
