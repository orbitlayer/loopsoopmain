import "server-only";
import mysql from "mysql2/promise";

/*
 * MySQL connection pool (Hostinger). Reused across requests. Credentials come
 * from env vars only (DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME) — never code.
 */

// Cache the pool on the global object so hot-reload / serverless reuse doesn't
// open a new pool per invocation.
const g = globalThis as unknown as { _loopsoopPool?: mysql.Pool };

export function getPool(): mysql.Pool {
  if (!g._loopsoopPool) {
    g._loopsoopPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5, // conservative for shared hosting
      maxIdle: 5,
      idleTimeout: 60_000,
      enableKeepAlive: true,
      // Return DATETIME/DATE as strings (not JS Date objects) so they match our
      // `string` types and are safe to render directly. (mysql2 defaults to Date,
      // which caused React error #31 when a Date reached the render tree.)
      dateStrings: true,
    });
  }
  return g._loopsoopPool;
}

type SqlParam = string | number | boolean | null;

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = [],
): Promise<T[]> {
  // No database configured → run in the app's intended no-DB "demo" mode.
  // Return an empty result instead of opening a pool to a non-existent MySQL:
  // every fail-safe read then falls back to its built-in defaults, and we avoid
  // an async mysql2 keep-alive `uncaughtException` (ECONNREFUSED) crashing the
  // render. Set DB_HOST/DB_USER/DB_NAME to switch back to real queries.
  if (!hasDbEnv()) return [] as T[];
  const [rows] = await getPool().execute(sql, params);
  return rows as T[];
}

export const hasDbEnv = () =>
  Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
