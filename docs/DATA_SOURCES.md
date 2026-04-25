# MechMind Data Sources

Every fact in the catalog should trace back to a real source. This file
lists every URL pattern the seeder + scraper rely on, with notes on
quality and refresh cadence.

## Authoritative — used in the seed

| Source | What we trust | Refresh |
|---|---|---|
| **Toyota 2017 Tacoma published maintenance schedule** | Service intervals, normal vs. severe distinction, inspect-vs-replace rules | Once per model year — already loaded in `seed.ts` |
| **Toyota Factory Service Manual (FSM) excerpts on TacomaWorld** | Torque specs (oil drain, lug nut, caliper bolts, spark plug, oil filter cap) | Stable — checked once at seed time, will not drift |
| **Toyota OEM parts catalog (TPD / McGeorge listings)** | OEM PNs for filters, fluids, drain plug crush washer, spark plugs, coolant, ATF | OEM PNs are stable but production-date-dependent; verify against your VIN before ordering |

## Active scrapers

| Source | Module | Used for | Notes |
|---|---|---|---|
| Reddit JSON API | `scraper/sources/reddit.py` | `media_links` from r/Tacoma + r/MechanicAdvice | Public API, no auth, ~60 rpm |
| YouTube Data API v3 | `scraper/sources/youtube.py` | `media_links` for the top 20 jobs | Requires `YOUTUBE_API_KEY` in `.env` |

## Stub scrapers (infrastructure only — fill in when needed)

These exist to make the pipeline complete, but emit nothing until either
auth or anti-bot handling is added. The base infrastructure (rate limit,
caching, robots.txt, retry, fact logging) is fully in place — adding a
real implementation is a leaf change.

| Source | Why stubbed |
|---|---|
| `tacoma_world.py` | Search needs a logged-in session for full results |
| `toyota_owners.py` | Maintenance PDF lives behind a year/region selector that's not stable to deep-link; intervals already in the seed |
| `parts_oem.py` (ToyotaPartsDeal, McGeorge, RockAuto, NAPA) | Anti-bot challenges; will need Playwright + occasional human solve |

## Refresh cadence

- **Toyota intervals:** once per model year — only refresh if Toyota
  republishes a corrected schedule.
- **OEM PNs:** verify against current build of the part on
  toyotapartsdeal or McGeorge ~quarterly.
- **Aftermarket parts (RockAuto/NAPA):** every 6 months — pricing and
  catalog change.
- **Media links:** every 1–3 months — new YouTube content shows up
  steadily and the older "definitive" videos sometimes get unlisted.

## Data quality policy

See `scraper/README.md` for the full policy. Key points:

1. **Wrong torque specs hurt people.** Never fabricate.
2. Every record has `source_url` + `source_name`.
3. 2+ corroborating sources → `verified=1`; one source → unverified;
   contradictions → `conflict=1` and surfaced in UI.
4. Single-source / unverified facts are listed in
   `data/needs_human_review.md` so Keith can resolve them deliberately.
