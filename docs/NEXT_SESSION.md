# Next Session — what's deferred

This is the punch list for the follow-up build session. Nothing here is
load-bearing for daily use today — the app works as-is.

## Data quality (highest value)

- **Procedures for the remaining 19 jobs.** Only Engine Oil & Filter has
  the full step-by-step seeded. The dashboard, parts list, torque table,
  and media links work for every job — but the procedure section reads
  "No procedure steps seeded yet" for everything else. Filling these in
  is the single biggest UX improvement.
- **Resolve `data/needs_human_review.md`.** Spark plug PN, MTF capacity,
  rear diff capacity + LSD additive PN, brake pad set PN — these are
  small but real gaps that should land before the first major service.
- **Aftermarket parts cross-references.** RockAuto + NAPA scrapers are
  scaffolded but no-op. Either implement them with Playwright or just
  paste a few cross-references into seed.ts manually for the parts
  Keith actually buys.

## Features deferred

- **Photo attachments** on maintenance logs (receipts, before/after,
  the bolt you couldn't identify). Schema does not yet have a `photos`
  column on `maintenance_logs` — needs a new migration.
- **"Ask MechMind" chat** scoped to the vehicle's data via Gemini or
  Claude. Stretch goal — would need an API key and rate-limit thinking.
- **Maintenance cost analytics** (cost per mile, cost per category over
  time) — easy follow-up since `maintenance_logs.parts_used` already
  has cost.
- **iCal export** for due-soon jobs — useful if Keith wants Google
  Calendar reminders alongside Discord pings.
- **Backup/restore** for the SQLite DB — manual export to JSON, import
  from JSON. Trivial but needs a UI.
- **Optional Supabase sync layer** if Keith decides to use this on
  multiple devices. Until then the local-first design stays.
- **Service worker** so the PWA loads fully offline. Currently relies
  on browser cache after first load.
- **Re-scrape automation** — monthly cron in GitHub Actions to refresh
  the data catalog without manual intervention.

## Engineering

- **Tests for `CadenceLearnerService`.** Spec called for unit tests
  (empty history → defaults, single reading → defaults, 3 → calculated,
  10+ → window). Logic is in place but the test file was deferred to
  this list.
- **`react-native-worklets` install only worked with `--legacy-peer-deps`.**
  Worth investigating once nativewind v4 stabilizes its peer ranges.
- **Native iOS/Android builds.** Currently web-only; the Expo config
  has bundle identifiers set up so `eas build` should work once Keith
  wants to ship a native app.
- **Service-profile per-job override.** The catalog supports it
  conceptually (mixed profile picks per-job), but the UI to flip an
  individual job from severe→normal is not built — it just defaults
  to severe under mixed.

## Productization (NOT to implement)

Keith was clear this is personal-use. Out of scope:
- User accounts, payments, multi-tenancy, ad/affiliate revenue.
- Mobile-app-store deliverables.
- Mechanic-shop or fleet features.
