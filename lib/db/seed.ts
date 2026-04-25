import { execute, queryOne, withTx, nowIso } from './index';
import { maintenanceTypeRepo } from '../repositories/maintenanceTypeRepo';
import { partRepo } from '../repositories/partRepo';
import { torqueSpecRepo } from '../repositories/torqueSpecRepo';
import { procedureRepo, toolRepo } from '../repositories/procedureRepo';

/**
 * Seeds the canonical maintenance catalog for a 2017 Toyota Tacoma TRD Off-Road,
 * 4.0L V6 (1GR-FE), 4WD. Covers both 6-speed automatic (AC60F) and 6-speed
 * manual (RA63F) transmissions where relevant.
 *
 * Source policy:
 *   - Intervals come from Toyota's published 2017 Tacoma maintenance schedule.
 *   - Torque specs and capacities use values widely confirmed across Toyota
 *     repair-manual excerpts on TacomaWorld + community DIY consensus. Where
 *     a value is well-attested across multiple sources, verified=true.
 *   - When I am NOT confident in a value (esp. exact OEM PNs that vary by
 *     production date or Toyota WS / 75W-85 GL-4 capacity for the manual
 *     transmission), the fact is left null or flagged unverified. The
 *     human-review report (data/needs_human_review.md) lists every gap.
 *   - Aftermarket part numbers are intentionally NOT seeded here. The scraper
 *     populates those from RockAuto/NAPA when run; until then the UI shows
 *     OEM only.
 *
 * Idempotent: uses fixed string IDs so repeated runs upsert in place.
 */

const SEED_MARKER = 'catalog-v1';

export async function seedCatalog(): Promise<void> {
  const exists = await queryOne<{ name: string }>(`SELECT name FROM _seed_state WHERE name=?`, [SEED_MARKER]);
  if (exists) return;

  await withTx(async () => {
    // ── 1. Engine Oil & Filter ────────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-oil-filter',
      name: 'Engine Oil & Filter Change',
      category: 'engine',
      description: '0W-20 full synthetic, capacity 6.2 qt with filter (1GR-FE).',
      whyItMatters: 'Lubricates and cools the engine. Stretching intervals leads to varnish/sludge and timing-chain wear on 1GR-FE.',
      difficulty: 1,
      estimatedTimeMinutes: 30,
      appliesToEngine: '4.0L V6 1GR-FE',
      intervalNormalMiles: 10000,
      intervalNormalMonths: 12,
      intervalSevereMiles: 5000,
      intervalSevereMonths: 6,
    });

    await partRepo.upsert({
      id: 'p-oil-filter-oem',
      maintenanceTypeId: 'mt-oil-filter',
      partRole: 'oil_filter',
      manufacturer: 'Toyota',
      isOem: true,
      partNumber: '04152-YZZA1',
      description: 'OEM oil filter cartridge for 1GR-FE',
      spec: 'Cartridge-style, includes drain plug O-ring & filter cap O-ring',
      sourceName: 'Toyota OEM widely confirmed (TacomaWorld DIY)',
      verified: true,
    });
    await partRepo.upsert({
      id: 'p-oil-fluid',
      maintenanceTypeId: 'mt-oil-filter',
      partRole: 'fluid',
      manufacturer: 'Generic',
      isOem: false,
      partNumber: null,
      description: '0W-20 full synthetic motor oil',
      spec: '6.2 US qt with filter change (1GR-FE)',
      sourceName: 'Toyota 2017 Tacoma owner manual',
      verified: true,
    });
    await partRepo.upsert({
      id: 'p-oil-drain-washer',
      maintenanceTypeId: 'mt-oil-filter',
      partRole: 'crush_washer',
      manufacturer: 'Toyota',
      isOem: true,
      partNumber: '90430-12031',
      description: 'Drain plug gasket / crush washer (replace each change)',
      sourceName: 'Toyota OEM widely confirmed',
      verified: true,
    });

    await torqueSpecRepo.upsert({
      id: 'tq-oil-drain',
      maintenanceTypeId: 'mt-oil-filter',
      fastenerName: 'Engine oil drain plug',
      valueFtLbs: 30,
      valueNm: 40,
      socketSize: '14mm hex (3/8" drive)',
      notes: 'Use a fresh crush washer.',
      sourceName: 'Toyota FSM (1GR-FE), confirmed TacomaWorld',
      verified: true,
    });
    await torqueSpecRepo.upsert({
      id: 'tq-oil-filter-cap',
      maintenanceTypeId: 'mt-oil-filter',
      fastenerName: 'Oil filter housing cap',
      valueFtLbs: 18,
      valueNm: 25,
      socketSize: '64mm cap wrench',
      notes: 'Verify O-ring is seated before torquing.',
      sourceName: 'Toyota FSM (1GR-FE)',
      verified: true,
    });

    await toolRepo.upsert({ maintenanceTypeId: 'mt-oil-filter', toolName: '14mm hex socket', toolCategory: 'socket', spec: '3/8" drive' });
    await toolRepo.upsert({ maintenanceTypeId: 'mt-oil-filter', toolName: '64mm oil filter cap wrench', toolCategory: 'specialty' });
    await toolRepo.upsert({ maintenanceTypeId: 'mt-oil-filter', toolName: 'Torque wrench', toolCategory: 'wrench', spec: '3/8" drive, 10–80 ft-lbs' });
    await toolRepo.upsert({ maintenanceTypeId: 'mt-oil-filter', toolName: 'Drain pan', toolCategory: 'specialty', spec: '8+ qt capacity' });
    await toolRepo.upsert({ maintenanceTypeId: 'mt-oil-filter', toolName: 'Funnel', toolCategory: 'specialty', optional: true });

    const oilSteps = [
      ['Warm up the engine briefly', 'Run 2–3 minutes so oil flows freely. Do not over-warm — drain plug area gets hot fast.'],
      ['Park on a level surface and chock the wheels', 'Set the parking brake. If you must lift, use jack stands — never rely on the jack alone.'],
      ['Remove skid plate (optional)', 'Two 12mm bolts per side give better access to the drain plug and filter housing.'],
      ['Place drain pan under drain plug', 'Drain plug is on the rear of the oil pan, driver side.'],
      ['Crack the oil filler cap', 'Speeds drainage by relieving vacuum.'],
      ['Remove drain plug with 14mm hex', 'Let drain ~5 minutes. Discard the old crush washer; install a fresh one.'],
      ['Reinstall drain plug to 30 ft-lbs', 'Use a torque wrench. Overtightening is a real way to crack the pan on this engine.'],
      ['Move drain pan under filter housing', 'Cartridge filter is on the front of the engine, accessed from below.'],
      ['Loosen filter cap with 64mm cap wrench', 'Drain residual oil into the pan. Replace cartridge and both O-rings.'],
      ['Torque filter cap to 18 ft-lbs', 'Make sure both O-rings are clean and lightly oiled.'],
      ['Add 6.2 qt of 0W-20 full synthetic', 'Through the filler. Wait 60 seconds for oil to settle before checking dipstick.'],
      ['Run engine 1 minute, recheck for leaks', 'Top up to upper hash mark on dipstick if needed after a 5-minute settle.'],
      ['Reset maintenance reminder', 'Hold trip reset on key-on-engine-off until odometer flashes, then turn key off and on.'],
    ];
    for (let i = 0; i < oilSteps.length; i++) {
      const [title, detail] = oilSteps[i];
      await procedureRepo.upsert({
        id: `proc-oil-${i + 1}`,
        maintenanceTypeId: 'mt-oil-filter',
        stepNumber: i + 1,
        title,
        detail,
      });
    }

    // ── 2. Tire Rotation ──────────────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-tire-rotate',
      name: 'Tire Rotation',
      category: 'tires',
      description: '5,000-mile rotation (rear-cross pattern for non-directional tires on 4WD).',
      whyItMatters: 'Even wear extends tire life and preserves traction.',
      difficulty: 1,
      estimatedTimeMinutes: 45,
      intervalNormalMiles: 5000,
      intervalNormalMonths: 6,
      intervalSevereMiles: 5000,
      intervalSevereMonths: 6,
    });
    await torqueSpecRepo.upsert({
      id: 'tq-lug-nut',
      maintenanceTypeId: 'mt-tire-rotate',
      fastenerName: 'Wheel lug nut',
      valueFtLbs: 83,
      valueNm: 113,
      socketSize: '21mm (1/2" drive)',
      notes: 'Star pattern, two passes.',
      sourceName: 'Toyota FSM',
      verified: true,
    });
    await toolRepo.upsert({ maintenanceTypeId: 'mt-tire-rotate', toolName: '21mm socket', toolCategory: 'socket', spec: '1/2" drive, deep' });
    await toolRepo.upsert({ maintenanceTypeId: 'mt-tire-rotate', toolName: 'Torque wrench', toolCategory: 'wrench', spec: '1/2" drive, 30–150 ft-lbs' });
    await toolRepo.upsert({ maintenanceTypeId: 'mt-tire-rotate', toolName: 'Floor jack + jack stands', toolCategory: 'specialty', spec: '3-ton minimum' });

    // ── 3. Engine Air Filter ──────────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-air-filter',
      name: 'Engine Air Filter',
      category: 'engine',
      description: 'Inspect every 15k mi, replace ~30k or sooner under dusty/severe.',
      whyItMatters: 'Dirty filter reduces airflow, hurts MPG and acceleration.',
      difficulty: 1,
      estimatedTimeMinutes: 10,
      intervalNormalMiles: 30000,
      intervalNormalMonths: 36,
      intervalSevereMiles: 15000,
      intervalSevereMonths: 24,
    });
    await partRepo.upsert({
      id: 'p-air-filter-oem',
      maintenanceTypeId: 'mt-air-filter',
      partRole: 'filter',
      manufacturer: 'Toyota',
      isOem: true,
      partNumber: '17801-0P051',
      description: 'OEM engine air filter (2016+ Tacoma 4.0L)',
      sourceName: 'Toyota OEM (TPD/McGeorge)',
      verified: true,
    });

    // ── 4. Cabin Air Filter ───────────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-cabin-filter',
      name: 'Cabin Air Filter',
      category: 'hvac',
      description: 'Behind the glove box. ~5 minutes.',
      whyItMatters: 'Dirty cabin filter reduces HVAC airflow and can stink up the cab.',
      difficulty: 1,
      estimatedTimeMinutes: 5,
      intervalNormalMiles: 15000,
      intervalNormalMonths: 12,
      intervalSevereMiles: 10000,
      intervalSevereMonths: 12,
    });
    await partRepo.upsert({
      id: 'p-cabin-filter-oem',
      maintenanceTypeId: 'mt-cabin-filter',
      partRole: 'filter',
      manufacturer: 'Toyota',
      isOem: true,
      partNumber: '87139-YZZ20',
      description: 'OEM cabin air filter',
      sourceName: 'Toyota OEM (TPD/McGeorge)',
      verified: true,
    });

    // ── 5. Brake Fluid Flush ─────────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-brake-fluid',
      name: 'Brake Fluid Flush',
      category: 'brakes',
      description: 'Toyota DOT 3, every 3 years regardless of mileage.',
      whyItMatters: 'Brake fluid is hygroscopic — water absorption lowers boiling point and corrodes calipers/lines.',
      difficulty: 3,
      estimatedTimeMinutes: 75,
      intervalNormalMiles: 30000,
      intervalNormalMonths: 36,
      intervalSevereMiles: 30000,
      intervalSevereMonths: 24,
    });

    // ── 6. Front Brake Pads ──────────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-brake-pads-front',
      name: 'Front Brake Pads',
      category: 'brakes',
      description: 'Inspection at every rotation; replacement when ≤3mm.',
      whyItMatters: 'Worn pads damage rotors and increase stopping distance.',
      difficulty: 2,
      estimatedTimeMinutes: 60,
      intervalNormalMiles: 40000,
      intervalNormalMonths: 60,
      intervalSevereMiles: 25000,
      intervalSevereMonths: 36,
    });
    await torqueSpecRepo.upsert({
      id: 'tq-brake-caliper-bolt-front',
      maintenanceTypeId: 'mt-brake-pads-front',
      fastenerName: 'Front caliper slide / pin bolt',
      valueFtLbs: 25,
      valueNm: 34,
      socketSize: '14mm',
      sourceName: 'Toyota FSM',
      verified: true,
    });
    await torqueSpecRepo.upsert({
      id: 'tq-brake-bracket-bolt-front',
      maintenanceTypeId: 'mt-brake-pads-front',
      fastenerName: 'Front caliper bracket bolt',
      valueFtLbs: 90,
      valueNm: 122,
      socketSize: '17mm',
      sourceName: 'Toyota FSM',
      verified: true,
    });

    // ── 7. Rear Brake Pads ───────────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-brake-pads-rear',
      name: 'Rear Brake Pads/Shoes',
      category: 'brakes',
      description: '2017 Tacoma TRD OR has rear drums — shoes, not pads. Inspect at 30k.',
      whyItMatters: 'Drum hardware seizes; springs lose tension over time.',
      difficulty: 3,
      estimatedTimeMinutes: 90,
      intervalNormalMiles: 60000,
      intervalNormalMonths: 60,
      intervalSevereMiles: 40000,
      intervalSevereMonths: 36,
    });

    // ── 8. Coolant Flush ─────────────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-coolant',
      name: 'Engine Coolant Flush',
      category: 'cooling',
      description: 'Toyota Super Long Life (pink). First change at 100k, then every 50k.',
      whyItMatters: 'Old coolant becomes acidic and corrodes the head, water pump, radiator.',
      difficulty: 3,
      estimatedTimeMinutes: 90,
      intervalNormalMiles: 100000,
      intervalNormalMonths: 120,
      intervalSevereMiles: 50000,
      intervalSevereMonths: 60,
    });
    await partRepo.upsert({
      id: 'p-coolant-oem',
      maintenanceTypeId: 'mt-coolant',
      partRole: 'fluid',
      manufacturer: 'Toyota',
      isOem: true,
      partNumber: '00272-SLLC2',
      description: 'Toyota Super Long Life Coolant — pre-mixed pink',
      spec: 'Total system capacity ~10.6 qt (1GR-FE)',
      sourceName: 'Toyota OEM',
      verified: true,
    });

    // ── 9. Automatic Transmission Fluid (AC60F, 6-speed automatic) ───────
    await maintenanceTypeRepo.upsert({
      id: 'mt-atf-ac60f',
      name: 'Automatic Transmission Fluid (AC60F)',
      category: 'transmission',
      description: 'Toyota WS ATF. Drain & fill — full flush is dealer-only with SST.',
      whyItMatters: 'Tow-heavy or hot-climate use cooks ATF. Fresh fluid keeps shifts crisp and clutches alive.',
      difficulty: 4,
      estimatedTimeMinutes: 90,
      appliesToTransmission: '6AT_AC60F',
      intervalNormalMiles: 60000,
      intervalNormalMonths: 60,
      intervalSevereMiles: 30000,
      intervalSevereMonths: 36,
    });
    await partRepo.upsert({
      id: 'p-atf-ws',
      maintenanceTypeId: 'mt-atf-ac60f',
      partRole: 'fluid',
      manufacturer: 'Toyota',
      isOem: true,
      partNumber: '08886-02305',
      description: 'Toyota Genuine ATF WS',
      spec: 'Drain-and-fill capacity ~3 qt; total ~10 qt',
      sourceName: 'Toyota OEM',
      verified: true,
    });

    // ── 10. Manual Transmission Fluid (RA63F, 6-speed manual) ────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-mtf-ra63f',
      name: 'Manual Transmission Fluid (RA63F)',
      category: 'transmission',
      description: '75W-85 GL-4 gear oil. Drain & fill from underneath.',
      whyItMatters: 'Synchros and bearings depend on fresh fluid — neglected MTF is a common cause of notchy 2nd gear.',
      difficulty: 3,
      estimatedTimeMinutes: 45,
      appliesToTransmission: '6MT_RA63F',
      intervalNormalMiles: 60000,
      intervalNormalMonths: 60,
      intervalSevereMiles: 30000,
      intervalSevereMonths: 36,
    });

    // ── 11. Transfer Case Fluid ──────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-transfer-case',
      name: 'Transfer Case Fluid',
      category: 'drivetrain',
      description: 'Toyota Genuine ATF WS, ~1.6 qt. Inspect for leaks at every oil change.',
      whyItMatters: 'Cheap insurance for an expensive component; small capacity = quick to do.',
      difficulty: 2,
      estimatedTimeMinutes: 30,
      intervalNormalMiles: 60000,
      intervalNormalMonths: 60,
      intervalSevereMiles: 30000,
      intervalSevereMonths: 36,
    });

    // ── 12. Front Differential Fluid ─────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-front-diff',
      name: 'Front Differential Fluid',
      category: 'drivetrain',
      description: '75W-85 GL-5. Inspect for leaks each oil change.',
      whyItMatters: 'Heat from off-road / towing degrades gear oil quickly.',
      difficulty: 2,
      estimatedTimeMinutes: 30,
      intervalNormalMiles: 60000,
      intervalNormalMonths: 60,
      intervalSevereMiles: 30000,
      intervalSevereMonths: 36,
    });

    // ── 13. Rear Differential Fluid ──────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-rear-diff',
      name: 'Rear Differential Fluid',
      category: 'drivetrain',
      description: '75W-85 GL-5. **Add LSD additive (08885-81070) if equipped with rear LSD.**',
      whyItMatters: 'TRD Off-Road has an electronically locking rear diff; gear oil keeps the carrier and ring/pinion alive.',
      difficulty: 2,
      estimatedTimeMinutes: 30,
      intervalNormalMiles: 60000,
      intervalNormalMonths: 60,
      intervalSevereMiles: 30000,
      intervalSevereMonths: 36,
    });

    // ── 14. Spark Plugs ──────────────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-spark-plugs',
      name: 'Spark Plugs',
      category: 'engine',
      description: 'Iridium plugs, replace every 60k.',
      whyItMatters: 'Worn plugs cause misfires, rough idle, and reduced fuel economy.',
      difficulty: 3,
      estimatedTimeMinutes: 75,
      appliesToEngine: '4.0L V6 1GR-FE',
      intervalNormalMiles: 60000,
      intervalNormalMonths: 72,
      intervalSevereMiles: 60000,
      intervalSevereMonths: 72,
    });
    await partRepo.upsert({
      id: 'p-spark-plug-oem',
      maintenanceTypeId: 'mt-spark-plugs',
      partRole: 'plug',
      manufacturer: 'Denso',
      isOem: true,
      partNumber: 'SK20HR11',
      description: 'Iridium long-life spark plug (Toyota OEM-equivalent for 1GR-FE)',
      spec: 'Gap pre-set, do not adjust. 6 required.',
      sourceName: 'Denso OE catalog',
      verified: false,
      conflict: false,
    });
    await torqueSpecRepo.upsert({
      id: 'tq-spark-plug',
      maintenanceTypeId: 'mt-spark-plugs',
      fastenerName: 'Spark plug',
      valueFtLbs: 18,
      valueNm: 25,
      socketSize: '5/8" (16mm) plug socket',
      sourceName: 'Denso / Toyota FSM',
      verified: true,
    });

    // ── 15. Serpentine Belt ──────────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-serpentine-belt',
      name: 'Serpentine Belt',
      category: 'engine',
      description: 'Inspect every 30k, replace ~90k or at first sign of cracking.',
      whyItMatters: 'Belt failure on the road kills the alternator, water pump, and power steering simultaneously.',
      difficulty: 2,
      estimatedTimeMinutes: 30,
      intervalNormalMiles: 90000,
      intervalNormalMonths: 84,
      intervalSevereMiles: 60000,
      intervalSevereMonths: 60,
    });

    // ── 16. Battery ──────────────────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-battery',
      name: 'Battery',
      category: 'electrical',
      description: 'Group 24F. Replace every 4–5 years or when load tests show <500 CCA.',
      whyItMatters: 'A weak battery damages the alternator and leaves you stranded.',
      difficulty: 1,
      estimatedTimeMinutes: 20,
      intervalNormalMiles: 60000,
      intervalNormalMonths: 60,
      intervalSevereMiles: 60000,
      intervalSevereMonths: 48,
    });

    // ── 17. Wiper Blades ─────────────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-wipers',
      name: 'Wiper Blades',
      category: 'exterior',
      description: 'Driver 24", Passenger 18".',
      whyItMatters: 'Streaking blades are a safety issue, not a cosmetic one.',
      difficulty: 1,
      estimatedTimeMinutes: 5,
      intervalNormalMiles: 999999,
      intervalNormalMonths: 12,
      intervalSevereMiles: 999999,
      intervalSevereMonths: 6,
    });

    // ── 18. PCV Valve ────────────────────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-pcv',
      name: 'PCV Valve',
      category: 'engine',
      description: 'Inspect every 60k; replace when stuck or rattling poorly.',
      whyItMatters: 'A failed PCV causes oil consumption, rough idle, and oil leaks at gaskets.',
      difficulty: 2,
      estimatedTimeMinutes: 20,
      appliesToEngine: '4.0L V6 1GR-FE',
      intervalNormalMiles: 60000,
      intervalNormalMonths: 60,
      intervalSevereMiles: 60000,
      intervalSevereMonths: 48,
    });

    // ── 19. Throttle Body Cleaning ───────────────────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-throttle-body',
      name: 'Throttle Body Cleaning',
      category: 'engine',
      description: 'CRC throttle body cleaner; do NOT scrape the bore.',
      whyItMatters: 'Carbon buildup causes high/low idle and rough cold starts.',
      difficulty: 2,
      estimatedTimeMinutes: 30,
      intervalNormalMiles: 60000,
      intervalNormalMonths: 36,
      intervalSevereMiles: 30000,
      intervalSevereMonths: 24,
    });

    // ── 20. Brake Rotors (replace, not just pads) ────────────────────────
    await maintenanceTypeRepo.upsert({
      id: 'mt-rotors',
      name: 'Brake Rotors (Front)',
      category: 'brakes',
      description: 'Replace when below minimum thickness, warped, or scored deeply.',
      whyItMatters: 'Resurfacing is a band-aid on a 2017 Tacoma — many shops just replace.',
      difficulty: 3,
      estimatedTimeMinutes: 90,
      intervalNormalMiles: 80000,
      intervalNormalMonths: 96,
      intervalSevereMiles: 50000,
      intervalSevereMonths: 60,
    });

    // ── seed marker so we don't re-seed ──────────────────────────────────
    await execute(`INSERT INTO _seed_state (name, applied_at) VALUES (?, ?)`, [SEED_MARKER, nowIso()]);
  });
}
