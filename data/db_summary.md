# MechMind Catalog Summary

This file is regenerated each time the app boots (via `seedCatalog`) and
each time the scraper runs (`python -m scraper.cli summary`). The version
checked into git reflects the post-seed state — the scraper enriches it
in place when run.

## Coverage (seeded baseline, before any scrape run)

| Table | Count | Notes |
|---|---|---|
| maintenance_types | 20 | Top 20 DIY jobs for 2017 Tacoma TRD OR (1GR-FE) |
| parts | ~6 | OEM only — oil filter, oil drain washer, air filter, cabin filter, coolant, ATF, spark plug |
| torque_specs | ~6 | Drain plug, oil filter cap, lug nut, front caliper bolts (slide + bracket), spark plug |
| tools_required | ~8 | Oil change tools fully populated; rest TBD |
| procedures | 13 | Engine oil & filter only — full step-by-step |
| media_links | 0 | Populated by scraper run |
| maintenance_logs | 0 | User-generated |
| odometer_readings | 0 | User-generated |

## Status by job

| Job | Intervals | Parts | Torque | Procedure |
|---|---|---|---|---|
| Engine Oil & Filter | ✅ | ✅ | ✅ | ✅ |
| Tire Rotation | ✅ | — | ✅ | — |
| Engine Air Filter | ✅ | ✅ | — | — |
| Cabin Air Filter | ✅ | ✅ | — | — |
| Brake Fluid Flush | ✅ | — | — | — |
| Front Brake Pads | ✅ | — | ✅ | — |
| Rear Brake Pads/Shoes | ✅ | — | — | — |
| Coolant Flush | ✅ | ✅ | — | — |
| ATF (AC60F) | ✅ | ✅ | — | — |
| MTF (RA63F) | ✅ | — | — | — |
| Transfer Case Fluid | ✅ | — | — | — |
| Front Diff Fluid | ✅ | — | — | — |
| Rear Diff Fluid | ✅ | — | — | — |
| Spark Plugs | ✅ | ⚠ unverified | ✅ | — |
| Serpentine Belt | ✅ | — | — | — |
| Battery | ✅ | — | — | — |
| Wiper Blades | ✅ | — | — | — |
| PCV Valve | ✅ | — | — | — |
| Throttle Body Cleaning | ✅ | — | — | — |
| Brake Rotors (Front) | ✅ | — | — | — |

✅ = present and verified, ⚠ = present but unverified, — = missing (pending scrape or manual entry)

## Verification policy reminder

- 2+ independent sources agree → `verified=1`
- Sources disagree → `verified=0, conflict=1` and surfaced in UI
- Single source → `verified=0, conflict=0`, listed in `needs_human_review.md`
- Wrong torque values cause real damage; this app never fabricates them.
