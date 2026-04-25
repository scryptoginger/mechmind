import * as SQLite from 'expo-sqlite';

const DB_NAME = 'mechmind.db';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (_db) return _db;
  _db = SQLite.openDatabaseSync(DB_NAME);
  _db.execSync('PRAGMA journal_mode = WAL');
  _db.execSync('PRAGMA foreign_keys = ON');
  return _db;
}

export async function execute(sql: string, params: ReadonlyArray<SQLite.SQLiteBindValue> = []): Promise<void> {
  const db = getDb();
  await db.runAsync(sql, params as SQLite.SQLiteBindValue[]);
}

export async function queryAll<T = Record<string, unknown>>(
  sql: string,
  params: ReadonlyArray<SQLite.SQLiteBindValue> = []
): Promise<T[]> {
  const db = getDb();
  const rows = await db.getAllAsync<T>(sql, params as SQLite.SQLiteBindValue[]);
  return rows;
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: ReadonlyArray<SQLite.SQLiteBindValue> = []
): Promise<T | null> {
  const db = getDb();
  const row = await db.getFirstAsync<T>(sql, params as SQLite.SQLiteBindValue[]);
  return row ?? null;
}

export async function withTx<T>(fn: () => Promise<T>): Promise<T> {
  const db = getDb();
  await db.execAsync('BEGIN');
  try {
    const result = await fn();
    await db.execAsync('COMMIT');
    return result;
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}
