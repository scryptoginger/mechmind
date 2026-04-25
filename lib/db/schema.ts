/**
 * SQL DDL strings, applied by the migration runner. Column names are snake_case
 * in SQL; TS interfaces in lib/types/* mirror these tables in camelCase.
 *
 * Adding a column or table => append a new migration in lib/db/migrations.ts.
 * Never edit MIGRATION_001 once it has shipped.
 */

export const MIGRATION_001_INIT = [
  `CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    year INTEGER NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    trim TEXT,
    cab TEXT,
    bed TEXT,
    engine TEXT,
    transmission TEXT,
    drivetrain TEXT,
    current_odometer INTEGER,
    service_profile TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS maintenance_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    why_it_matters TEXT,
    difficulty INTEGER,
    estimated_time_minutes INTEGER,
    vehicle_id TEXT,
    applies_to_engine TEXT,
    applies_to_transmission TEXT,
    interval_normal_miles INTEGER,
    interval_normal_months INTEGER,
    interval_severe_miles INTEGER,
    interval_severe_months INTEGER,
    created_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_maintenance_types_vehicle ON maintenance_types(vehicle_id)`,
  `CREATE INDEX IF NOT EXISTS idx_maintenance_types_category ON maintenance_types(category)`,

  `CREATE TABLE IF NOT EXISTS parts (
    id TEXT PRIMARY KEY,
    maintenance_type_id TEXT NOT NULL,
    part_role TEXT NOT NULL,
    manufacturer TEXT,
    is_oem INTEGER NOT NULL,
    part_number TEXT,
    description TEXT,
    spec TEXT,
    source_url TEXT,
    source_name TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    conflict INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_parts_maintenance ON parts(maintenance_type_id)`,

  `CREATE TABLE IF NOT EXISTS torque_specs (
    id TEXT PRIMARY KEY,
    maintenance_type_id TEXT NOT NULL,
    fastener_name TEXT NOT NULL,
    value_ft_lbs REAL,
    value_nm REAL,
    socket_size TEXT,
    notes TEXT,
    source_url TEXT,
    source_name TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    conflict INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_torque_maintenance ON torque_specs(maintenance_type_id)`,

  `CREATE TABLE IF NOT EXISTS tools_required (
    id TEXT PRIMARY KEY,
    maintenance_type_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    tool_category TEXT,
    spec TEXT,
    optional INTEGER NOT NULL DEFAULT 0,
    notes TEXT
  )`,

  `CREATE INDEX IF NOT EXISTS idx_tools_maintenance ON tools_required(maintenance_type_id)`,

  `CREATE TABLE IF NOT EXISTS procedures (
    id TEXT PRIMARY KEY,
    maintenance_type_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    warning TEXT,
    source_url TEXT,
    source_name TEXT
  )`,

  `CREATE INDEX IF NOT EXISTS idx_procedures_maintenance ON procedures(maintenance_type_id, step_number)`,

  `CREATE TABLE IF NOT EXISTS media_links (
    id TEXT PRIMARY KEY,
    maintenance_type_id TEXT NOT NULL,
    media_type TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    source_name TEXT,
    notes TEXT,
    quality_score INTEGER
  )`,

  `CREATE INDEX IF NOT EXISTS idx_media_maintenance ON media_links(maintenance_type_id)`,

  `CREATE TABLE IF NOT EXISTS maintenance_logs (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    maintenance_type_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    odometer_at_completion INTEGER NOT NULL,
    notes TEXT,
    parts_used TEXT,
    total_cost REAL,
    time_spent_minutes INTEGER,
    difficulty_actual INTEGER,
    created_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_logs_vehicle ON maintenance_logs(vehicle_id, completed_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_logs_maintenance ON maintenance_logs(maintenance_type_id)`,

  `CREATE TABLE IF NOT EXISTS odometer_readings (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    reading INTEGER NOT NULL,
    recorded_at TEXT NOT NULL,
    source TEXT NOT NULL,
    notes TEXT
  )`,

  `CREATE INDEX IF NOT EXISTS idx_odo_vehicle ON odometer_readings(vehicle_id, recorded_at DESC)`,

  `CREATE TABLE IF NOT EXISTS fill_up_cadence (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL UNIQUE,
    avg_days_between REAL,
    avg_miles_between REAL,
    sample_count INTEGER,
    last_calculated_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS notification_log (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    related_maintenance_type_id TEXT,
    sent_at TEXT NOT NULL,
    channel TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_notif_dedupe ON notification_log(vehicle_id, notification_type, related_maintenance_type_id, sent_at DESC)`,

  `CREATE TABLE IF NOT EXISTS _seed_state (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`,
];

export const MIGRATION_002_CLEANUP_SEED_MARKER = [
  // Remove the legacy seed-marker maintenance_type row written by the
  // first version of seedCatalog. New code uses the _seed_state table.
  `DELETE FROM maintenance_types WHERE id='seed-marker-v1'`,
];

export const ALL_MIGRATIONS: { name: string; statements: string[] }[] = [
  { name: '001_init', statements: MIGRATION_001_INIT },
  { name: '002_cleanup_seed_marker', statements: MIGRATION_002_CLEANUP_SEED_MARKER },
];
