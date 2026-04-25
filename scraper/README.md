# MechMind Scraper

Python scraper that populates the MechMind SQLite catalog with maintenance
data — OEM part numbers, torque specs, fluid capacities, procedures, and
links to vetted YouTube + forum content.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

## Run

```bash
# Inside the venv:
python -m scraper.cli scrape-all
python -m scraper.cli verify-cache
python -m scraper.cli summary
```

## Sources

| Source | Module | Status | Notes |
|---|---|---|---|
| Toyota Owners (PDF) | `sources/toyota_owners.py` | stub | Intervals seeded directly in `lib/db/seed.ts` from the official 2017 schedule |
| TacomaWorld | `sources/tacoma_world.py` | stub | Search needs auth; conservative no-op until cookies wired |
| Reddit (r/Tacoma, r/MechanicAdvice) | `sources/reddit.py` | active | Public JSON API, no auth |
| YouTube | `sources/youtube.py` | conditional | Uses Data API if `YOUTUBE_API_KEY` set, else no-op |
| ToyotaPartsDeal | `sources/parts_oem.py` | stub | Anti-bot challenges need Playwright + occasional human solve |
| McGeorge Toyota | `sources/parts_oem.py` | stub | Same |
| RockAuto | `sources/parts_oem.py` | stub | Same |
| NAPA Online | `sources/parts_oem.py` | stub | Same |

## Data quality policy

- Every fact stored must include `source_url` and `source_name`.
- A fact corroborated by 2+ independent sources is stored with `verified=True`.
- A fact contradicted across sources is stored with `conflict=True, verified=False`
  — the UI surfaces both variants and links sources for the human to resolve.
- A single-source fact starts as `verified=False, conflict=False` and is
  flagged in `data/needs_human_review.md`.
- Torque specs and fluid capacities are NEVER fabricated. If the scraper
  cannot find a value, the field is left null and the gap is reported.

## Why so many stubs?

The base infrastructure (rate limiting, caching, robots.txt, JSONL fact
logging, conflict detection) is the load-bearing piece. Adding a new
concrete source is a small leaf change once the pipeline is in place.
The seed in `lib/db/seed.ts` already provides high-confidence canonical
data for the top 20 jobs, so the app is useful from first launch — the
scraper enriches it over time.
