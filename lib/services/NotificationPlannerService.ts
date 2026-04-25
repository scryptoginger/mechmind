import { computeDueStatuses } from './MaintenanceDueService';
import { cadenceRepo, odometerRepo, notificationRepo } from '../repositories/odometerRepo';
import { vehicleRepo } from '../repositories/vehicleRepo';
import { notifyDiscord } from './DiscordNotifier';

const DEDUPE_HOURS = 24;
const FILLUP_OVERDUE_FACTOR = 1.5;

function hoursSinceIso(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export interface PlannedNotification {
  type: 'maintenance_due' | 'fill_up_prompt';
  message: string;
  relatedMaintenanceTypeId: string | null;
}

export async function planNotifications(vehicleId: string): Promise<PlannedNotification[]> {
  const v = await vehicleRepo.findById(vehicleId);
  if (!v) return [];

  const planned: PlannedNotification[] = [];

  // Overdue jobs
  const due = await computeDueStatuses(vehicleId);
  for (const d of due.filter((x) => x.status === 'overdue')) {
    const last = await notificationRepo.lastForKey(vehicleId, 'maintenance_due', d.maintenanceType.id);
    if (last && hoursSinceIso(last.sentAt) < DEDUPE_HOURS) continue;
    const milesPart =
      d.milesUntilDue != null ? ` (${Math.abs(Math.round(d.milesUntilDue))} mi past due)` : '';
    planned.push({
      type: 'maintenance_due',
      message: `🔧 ${v.year} ${v.model}: **${d.maintenanceType.name}** is overdue${milesPart}.`,
      relatedMaintenanceTypeId: d.maintenanceType.id,
    });
  }

  // Fill-up reminder if overdue vs cadence
  const cadence = await cadenceRepo.findByVehicle(vehicleId);
  const last = await odometerRepo.latest(vehicleId);
  if (cadence?.avgDaysBetween && last) {
    const hoursSince = hoursSinceIso(last.recordedAt);
    const expectedHours = cadence.avgDaysBetween * 24 * FILLUP_OVERDUE_FACTOR;
    if (hoursSince > expectedHours) {
      const lastNotif = await notificationRepo.lastForKey(vehicleId, 'fill_up_prompt', null);
      if (!lastNotif || hoursSinceIso(lastNotif.sentAt) >= DEDUPE_HOURS) {
        planned.push({
          type: 'fill_up_prompt',
          message: `⛽ ${v.year} ${v.model}: log an odometer reading to keep tracking accurate.`,
          relatedMaintenanceTypeId: null,
        });
      }
    }
  }

  return planned;
}

export async function dispatchNotifications(vehicleId: string): Promise<PlannedNotification[]> {
  const planned = await planNotifications(vehicleId);
  for (const p of planned) {
    const ok = await notifyDiscord(p.message);
    await notificationRepo.log(vehicleId, p.type, ok ? 'discord' : 'in_app', p.relatedMaintenanceTypeId);
  }
  return planned;
}
