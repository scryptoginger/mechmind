# Human Review Queue

Facts the seeder or scraper flagged as low-confidence. Resolve by either:
- Confirming via a second authoritative source, then editing the row in
  `lib/db/seed.ts` and bumping `verified=1`, OR
- Replacing with a corrected value (and noting the source).

## Single-source / unverified parts

| Job | Field | Stored value | Source | Action |
|---|---|---|---|---|
| Spark Plugs | OEM PN | `Denso SK20HR11` | Denso OE catalog | ⚠ Some 2017 Tacomas shipped with `SK16R11` per build date. Cross-check against your VIN. |

## Missing OEM part numbers

For the following jobs, an OEM PN has NOT been seeded — the scraper or
manual entry needs to fill them:

- Tire Rotation — n/a (no consumable parts)
- Engine Air Filter (have)
- Cabin Air Filter (have)
- Brake Fluid Flush — DOT 3 PN
- Front Brake Pads — `04465-04090` likely but unverified for TRD OR
- Rear Brake Pads/Shoes — drum hardware kit PN
- Coolant Flush (have)
- ATF AC60F (have)
- **MTF RA63F — capacity AND PN both unverified**. Toyota lists 75W-85 GL-4
  for this transmission; capacity quoted as 2.2 qt by some sources, 1.9 by
  others. Resolve before doing this job.
- Transfer Case — Toyota WS ATF, capacity ~1.6 qt unverified
- Front Differential — capacity ~1.5 qt unverified
- Rear Differential — capacity ~3.7 qt unverified, LSD additive `08885-81070`
- Serpentine Belt — PN varies by build date
- Battery — group 24F, brand unspecified
- Wiper Blades — sizes only, no specific brand seeded
- PCV Valve — PN unverified
- Brake Rotors — front rotor PN unverified

## Missing torque specs

These have intervals + parts but no torque values seeded yet:

- Spark plugs (have, 18 ft-lbs)
- Caliper bracket bolts — rear (drum brakes — different fastener set)
- Transmission drain plugs (AT and MT both unverified)
- Differential drain/fill plugs (front + rear)
- Transfer case drain/fill plugs
- Wheel hub / spindle nut (if doing front rotor service)
- Valve cover (PCV access)
- Throttle body bolts

## Procedures pending

Step-by-step procedures are seeded ONLY for engine oil & filter. The
remaining 19 jobs need procedures populated — this is the highest-value
gap and should be the first follow-up.

## Media links pending

`media_links` is empty until the scraper is run. Run:

```bash
cd scraper && source venv/bin/activate
export YOUTUBE_API_KEY=...   # optional; without it, only Reddit results populate
python -m scraper.cli scrape-all
```
