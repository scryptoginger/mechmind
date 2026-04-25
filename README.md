# MechMind

Personal DIY vehicle maintenance tracker for a 2017 Toyota Tacoma TRD Off-Road
(Double Cab, Long Bed, 4.0L V6, 4WD). Single-user, local-first. Not for
distribution.

## What it does

- Tracks maintenance jobs by miles AND time (whichever comes first).
- Switches between normal and severe service intervals per job.
- Adapts notification cadence to your gas-fill-up pattern.
- Surfaces OEM part numbers, aftermarket cross-references, torque specs,
  socket sizes, fluid capacities, and step-by-step procedures with vetted
  YouTube/forum links — per job, per vehicle.
- Optimized for one-handed odometer entry at the gas pump (PWA).

## Stack

- Expo SDK 55, React Native, TypeScript
- expo-router v3 (file-based routing)
- expo-sqlite (local persistence — no cloud sync)
- Zustand state, NativeWind / Tailwind v4 styling
- Discord webhook for alerts
- Python (Playwright + BeautifulSoup) scraper for the data catalog

## Run

```bash
npm install
npx expo start --web      # browse at http://localhost:8081
```

The first run applies migrations and creates `mechmind.db`.

## Re-run the scraper

```bash
cd scraper
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
python -m scraper.cli scrape-all
deactivate
```

Catalog summaries land in `data/db_summary.md` and review queue in
`data/needs_human_review.md`.

## Deploy as PWA

```bash
npx expo export --platform web
vercel --prod              # requires VERCEL_TOKEN in .env
```

## Where the data lives

Local SQLite on the device only. No accounts, no cloud, no sync, no telemetry.

## Repo layout

- `app/` — expo-router screens
- `components/` — reusable UI
- `lib/` — db, types, repositories, services, stores
- `scripts/` — seed + maintenance scripts
- `scraper/` — Python data acquisition pipeline
- `data/` — generated reports + canonical job lists
- `docs/` — schema, data sources, deploy notes, next-session preview
