# MechMind Database Schema

SQLite, single-file local DB (`mechmind.db`). All tables created by
`lib/db/schema.ts`, applied by the migration runner in
`lib/db/migrations.ts` on app boot. The seed runs once after migrations.

## ER overview (text)

```
vehicles ──< maintenance_logs >── maintenance_types ──< parts
                                                    ──< torque_specs
                                                    ──< tools_required
                                                    ──< procedures
                                                    ──< media_links
vehicles ──< odometer_readings
vehicles ── 1 ── fill_up_cadence
vehicles ──< notification_log
```

## Tables

### `vehicles`
One row per tracked vehicle. The MVP only ever has one, but the schema
is many-vehicle ready.

| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | UUID |
| year, make, model | required | `2017 Toyota Tacoma` |
| trim, cab, bed | nullable | `TRD Off-Road, double_cab, long` |
| engine, transmission, drivetrain | nullable | `4.0L V6 1GR-FE`, `6AT_AC60F` or `6MT_RA63F`, `4WD` |
| current_odometer | int | Latest known miles |
| service_profile | text | `normal` / `severe` / `mixed` |
| created_at, updated_at | iso strings | |

### `maintenance_types`
The catalog of jobs. Generic types have `vehicle_id=NULL`; vehicle-specific
overrides set `vehicle_id` to a specific vehicle. `applies_to_engine` /
`applies_to_transmission` filter applicability when populated.

### `parts`
OEM and aftermarket parts per maintenance type. `is_oem`, `verified`,
`conflict` are 0/1 booleans. `source_url` + `source_name` required by
data policy — see `data/needs_human_review.md`.

### `torque_specs`
Per-fastener torque values. Both `value_ft_lbs` and `value_nm` stored
when known. `socket_size` includes drive (e.g. `21mm (1/2" drive)`).
Same verification fields as `parts`.

### `tools_required`
List of tools needed; `optional` flag for nice-to-have items.

### `procedures`
Step-by-step instructions, ordered by `step_number`. `warning` highlighted
in UI when populated.

### `media_links`
YouTube + forum + article references. `quality_score` 1–5; UI sorts by
score descending.

### `maintenance_logs`
Completed work. `parts_used` is JSON of `[{partId, qty, cost}]`.

### `odometer_readings`
Every odometer entry with `source` ∈ `fill_up | maintenance | manual`.
Used by `CadenceLearnerService` to update `fill_up_cadence`.

### `fill_up_cadence`
One row per vehicle with rolling-window weighted averages.

### `notification_log`
Append-only log of every notification sent. Used to dedupe within 24h
in `NotificationPlannerService`.

## Migrations

`_migrations(name TEXT UNIQUE, applied_at TEXT)` records what's run.
First migration `001_init` creates everything above. Add subsequent
migrations to `ALL_MIGRATIONS` in `lib/db/schema.ts` — never edit a
shipped migration.

## Seed marker

`seed.ts` writes a sentinel maintenance type with `id='seed-marker-v1'`
and `category='__internal'` so re-runs are idempotent. The repo's
`findAll` filters out `category='__internal'` so it never appears in UI.
