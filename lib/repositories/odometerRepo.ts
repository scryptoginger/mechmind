import { execute, queryAll, queryOne, nowIso } from '../db';
import { newId } from './_id';
import type { OdometerReading, OdometerSource, FillUpCadence, NotificationLogEntry } from '../types/OdometerReading';

interface Row {
  id: string;
  vehicle_id: string;
  reading: number;
  recorded_at: string;
  source: OdometerSource;
  notes: string | null;
}

const map = (r: Row): OdometerReading => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  reading: r.reading,
  recordedAt: r.recorded_at,
  source: r.source,
  notes: r.notes,
});

export const odometerRepo = {
  async create(vehicleId: string, reading: number, source: OdometerSource = 'fill_up', notes?: string | null): Promise<OdometerReading> {
    const id = newId();
    const now = nowIso();
    await execute(
      `INSERT INTO odometer_readings (id, vehicle_id, reading, recorded_at, source, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, vehicleId, reading, now, source, notes ?? null]
    );
    const r = await queryOne<Row>(`SELECT * FROM odometer_readings WHERE id=?`, [id]);
    return map(r!);
  },

  async findByVehicle(vehicleId: string, limit = 50): Promise<OdometerReading[]> {
    const rows = await queryAll<Row>(
      `SELECT * FROM odometer_readings WHERE vehicle_id=? ORDER BY recorded_at DESC LIMIT ?`,
      [vehicleId, limit]
    );
    return rows.map(map);
  },

  async fillUpsForVehicle(vehicleId: string, limit = 30): Promise<OdometerReading[]> {
    const rows = await queryAll<Row>(
      `SELECT * FROM odometer_readings WHERE vehicle_id=? AND source='fill_up'
       ORDER BY recorded_at DESC LIMIT ?`,
      [vehicleId, limit]
    );
    return rows.map(map);
  },

  async latest(vehicleId: string): Promise<OdometerReading | null> {
    const r = await queryOne<Row>(
      `SELECT * FROM odometer_readings WHERE vehicle_id=? ORDER BY recorded_at DESC LIMIT 1`,
      [vehicleId]
    );
    return r ? map(r) : null;
  },
};

interface CadenceRow {
  id: string;
  vehicle_id: string;
  avg_days_between: number | null;
  avg_miles_between: number | null;
  sample_count: number | null;
  last_calculated_at: string;
}

const mapCadence = (r: CadenceRow): FillUpCadence => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  avgDaysBetween: r.avg_days_between,
  avgMilesBetween: r.avg_miles_between,
  sampleCount: r.sample_count,
  lastCalculatedAt: r.last_calculated_at,
});

export const cadenceRepo = {
  async upsert(vehicleId: string, avgDays: number | null, avgMiles: number | null, sampleCount: number): Promise<FillUpCadence> {
    const existing = await queryOne<CadenceRow>(`SELECT * FROM fill_up_cadence WHERE vehicle_id=?`, [vehicleId]);
    const now = nowIso();
    if (existing) {
      await execute(
        `UPDATE fill_up_cadence SET avg_days_between=?, avg_miles_between=?, sample_count=?,
           last_calculated_at=? WHERE vehicle_id=?`,
        [avgDays, avgMiles, sampleCount, now, vehicleId]
      );
    } else {
      await execute(
        `INSERT INTO fill_up_cadence (id, vehicle_id, avg_days_between, avg_miles_between,
           sample_count, last_calculated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId(), vehicleId, avgDays, avgMiles, sampleCount, now]
      );
    }
    const r = await queryOne<CadenceRow>(`SELECT * FROM fill_up_cadence WHERE vehicle_id=?`, [vehicleId]);
    return mapCadence(r!);
  },

  async findByVehicle(vehicleId: string): Promise<FillUpCadence | null> {
    const r = await queryOne<CadenceRow>(`SELECT * FROM fill_up_cadence WHERE vehicle_id=?`, [vehicleId]);
    return r ? mapCadence(r) : null;
  },
};

interface NotifRow {
  id: string;
  vehicle_id: string;
  notification_type: string;
  related_maintenance_type_id: string | null;
  sent_at: string;
  channel: string;
}

const mapNotif = (r: NotifRow): NotificationLogEntry => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  notificationType: r.notification_type,
  relatedMaintenanceTypeId: r.related_maintenance_type_id,
  sentAt: r.sent_at,
  channel: r.channel,
});

export const notificationRepo = {
  async log(vehicleId: string, notificationType: string, channel: string, relatedMaintenanceTypeId: string | null = null): Promise<NotificationLogEntry> {
    const id = newId();
    const now = nowIso();
    await execute(
      `INSERT INTO notification_log (id, vehicle_id, notification_type, related_maintenance_type_id, sent_at, channel)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, vehicleId, notificationType, relatedMaintenanceTypeId, now, channel]
    );
    const r = await queryOne<NotifRow>(`SELECT * FROM notification_log WHERE id=?`, [id]);
    return mapNotif(r!);
  },

  async lastForKey(vehicleId: string, notificationType: string, relatedMaintenanceTypeId: string | null): Promise<NotificationLogEntry | null> {
    const r = await queryOne<NotifRow>(
      `SELECT * FROM notification_log
       WHERE vehicle_id=? AND notification_type=?
         AND COALESCE(related_maintenance_type_id, '') = COALESCE(?, '')
       ORDER BY sent_at DESC LIMIT 1`,
      [vehicleId, notificationType, relatedMaintenanceTypeId]
    );
    return r ? mapNotif(r) : null;
  },
};
