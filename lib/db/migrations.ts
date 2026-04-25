import { getDb, execute, queryAll, nowIso } from './index';
import { ALL_MIGRATIONS } from './schema';
import { seedCatalog } from './seed';

let _ran = false;

export async function runMigrations(): Promise<void> {
  if (_ran) return;
  const db = getDb();

  // Bootstrap _migrations table outside the loop in case it doesn't exist yet.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = await queryAll<{ name: string }>(`SELECT name FROM _migrations`);
  const appliedNames = new Set(applied.map((r) => r.name));

  for (const migration of ALL_MIGRATIONS) {
    if (appliedNames.has(migration.name)) continue;
    for (const stmt of migration.statements) {
      await db.execAsync(stmt);
    }
    await execute(`INSERT INTO _migrations (name, applied_at) VALUES (?, ?)`, [migration.name, nowIso()]);
  }

  // Idempotent catalog seed — populates the canonical 2017 Tacoma maintenance
  // types + parts/torque/procedures the first time we run.
  await seedCatalog();

  _ran = true;
}
