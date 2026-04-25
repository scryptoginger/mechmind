import { maintenanceTypeRepo } from '../repositories/maintenanceTypeRepo';
import { maintenanceLogRepo } from '../repositories/maintenanceLogRepo';
import { vehicleRepo } from '../repositories/vehicleRepo';
import type { MaintenanceType } from '../types/MaintenanceType';
import type { ServiceProfile } from '../types/Vehicle';

export interface DueStatus {
  maintenanceType: MaintenanceType;
  /** which interval set is in use, after applying overrides */
  effectiveProfile: 'normal' | 'severe';
  intervalMiles: number | null;
  intervalMonths: number | null;
  lastDoneAtMiles: number | null;
  lastDoneAtIso: string | null;
  /** miles since last completion, or absolute when never done */
  milesSinceLast: number | null;
  monthsSinceLast: number | null;
  /** miles until next due, negative if overdue. null if no interval */
  milesUntilDue: number | null;
  monthsUntilDue: number | null;
  /** unified bucket for UI grouping */
  status: 'overdue' | 'due_soon' | 'up_to_date' | 'unknown';
}

const SOON_THRESHOLD_FRAC = 0.1; // within 10% of interval triggers due_soon
const SOON_DAYS = 30;

function monthsBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso);
  const b = new Date(bIso);
  const ms = b.getTime() - a.getTime();
  return ms / (1000 * 60 * 60 * 24 * 30.4375);
}

export async function computeDueStatuses(
  vehicleId: string,
  options: {
    profileOverride?: ServiceProfile;
    perJobProfile?: Record<string, 'normal' | 'severe'>;
  } = {}
): Promise<DueStatus[]> {
  const vehicle = await vehicleRepo.findById(vehicleId);
  if (!vehicle) return [];
  const profile: ServiceProfile = options.profileOverride ?? vehicle.serviceProfile ?? 'normal';
  const types = await maintenanceTypeRepo.findApplicableTo(
    vehicleId,
    vehicle.engine,
    vehicle.transmission
  );

  const result: DueStatus[] = [];
  const now = new Date().toISOString();

  for (const mt of types) {
    let effective: 'normal' | 'severe';
    if (profile === 'severe') effective = 'severe';
    else if (profile === 'normal') effective = 'normal';
    else effective = options.perJobProfile?.[mt.id] ?? 'severe'; // mixed default = severe

    const intervalMiles = effective === 'severe' ? mt.intervalSevereMiles : mt.intervalNormalMiles;
    const intervalMonths = effective === 'severe' ? mt.intervalSevereMonths : mt.intervalNormalMonths;

    const last = await maintenanceLogRepo.findLatestForJob(vehicleId, mt.id);
    const lastMiles = last?.odometerAtCompletion ?? null;
    const lastIso = last?.completedAt ?? null;

    const curMiles = vehicle.currentOdometer;
    // milesSince is only well-defined when we have BOTH the current odo and a
    // previous log. Without a log we can't claim anything has elapsed — the
    // job may have been done by a previous owner. Treat as no signal.
    const milesSince =
      curMiles != null && lastMiles != null ? curMiles - lastMiles : null;
    const monthsSince = lastIso ? monthsBetween(lastIso, now) : null;

    const milesUntil = intervalMiles != null && milesSince != null ? intervalMiles - milesSince : null;
    const monthsUntil = intervalMonths != null && monthsSince != null ? intervalMonths - monthsSince : null;

    let status: DueStatus['status'] = 'unknown';
    const overdueByMiles = milesUntil != null && milesUntil < 0;
    const overdueByMonths = monthsUntil != null && monthsUntil < 0;
    const soonByMiles =
      milesUntil != null && intervalMiles != null && milesUntil <= intervalMiles * SOON_THRESHOLD_FRAC;
    const soonByMonths = monthsUntil != null && monthsUntil * 30 <= SOON_DAYS;

    if (intervalMiles == null && intervalMonths == null) {
      status = 'unknown';
    } else if (lastMiles == null && lastIso == null) {
      // No history — backfill required before we can judge.
      status = 'unknown';
    } else if (overdueByMiles || overdueByMonths) {
      status = 'overdue';
    } else if (soonByMiles || soonByMonths) {
      status = 'due_soon';
    } else {
      status = 'up_to_date';
    }

    result.push({
      maintenanceType: mt,
      effectiveProfile: effective,
      intervalMiles,
      intervalMonths,
      lastDoneAtMiles: lastMiles,
      lastDoneAtIso: lastIso,
      milesSinceLast: milesSince,
      monthsSinceLast: monthsSince,
      milesUntilDue: milesUntil,
      monthsUntilDue: monthsUntil,
      status,
    });
  }

  // Sort: overdue first, then due_soon, then unknown, then up_to_date.
  // Within each group, the most-due first (smallest milesUntilDue).
  const order: Record<DueStatus['status'], number> = {
    overdue: 0,
    due_soon: 1,
    unknown: 2,
    up_to_date: 3,
  };
  result.sort((a, b) => {
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    const am = a.milesUntilDue ?? Number.MAX_SAFE_INTEGER;
    const bm = b.milesUntilDue ?? Number.MAX_SAFE_INTEGER;
    return am - bm;
  });

  return result;
}
