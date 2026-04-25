import { execute, queryAll, queryOne, nowIso } from '../db';
import { newId } from './_id';
import type { MaintenanceType } from '../types/MaintenanceType';

interface Row {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  why_it_matters: string | null;
  difficulty: number | null;
  estimated_time_minutes: number | null;
  vehicle_id: string | null;
  applies_to_engine: string | null;
  applies_to_transmission: string | null;
  interval_normal_miles: number | null;
  interval_normal_months: number | null;
  interval_severe_miles: number | null;
  interval_severe_months: number | null;
  created_at: string;
}

const map = (r: Row): MaintenanceType => ({
  id: r.id,
  name: r.name,
  category: r.category,
  description: r.description,
  whyItMatters: r.why_it_matters,
  difficulty: r.difficulty,
  estimatedTimeMinutes: r.estimated_time_minutes,
  vehicleId: r.vehicle_id,
  appliesToEngine: r.applies_to_engine,
  appliesToTransmission: r.applies_to_transmission,
  intervalNormalMiles: r.interval_normal_miles,
  intervalNormalMonths: r.interval_normal_months,
  intervalSevereMiles: r.interval_severe_miles,
  intervalSevereMonths: r.interval_severe_months,
  createdAt: r.created_at,
});

export interface MaintenanceTypeInput {
  id?: string;
  name: string;
  category?: string | null;
  description?: string | null;
  whyItMatters?: string | null;
  difficulty?: number | null;
  estimatedTimeMinutes?: number | null;
  vehicleId?: string | null;
  appliesToEngine?: string | null;
  appliesToTransmission?: string | null;
  intervalNormalMiles?: number | null;
  intervalNormalMonths?: number | null;
  intervalSevereMiles?: number | null;
  intervalSevereMonths?: number | null;
}

export const maintenanceTypeRepo = {
  async upsert(input: MaintenanceTypeInput): Promise<MaintenanceType> {
    const id = input.id ?? newId();
    const existing = await this.findById(id);
    if (existing) {
      await execute(
        `UPDATE maintenance_types SET name=?, category=?, description=?, why_it_matters=?,
           difficulty=?, estimated_time_minutes=?, vehicle_id=?, applies_to_engine=?, applies_to_transmission=?,
           interval_normal_miles=?, interval_normal_months=?, interval_severe_miles=?, interval_severe_months=?
         WHERE id=?`,
        [
          input.name,
          input.category ?? null,
          input.description ?? null,
          input.whyItMatters ?? null,
          input.difficulty ?? null,
          input.estimatedTimeMinutes ?? null,
          input.vehicleId ?? null,
          input.appliesToEngine ?? null,
          input.appliesToTransmission ?? null,
          input.intervalNormalMiles ?? null,
          input.intervalNormalMonths ?? null,
          input.intervalSevereMiles ?? null,
          input.intervalSevereMonths ?? null,
          id,
        ]
      );
    } else {
      await execute(
        `INSERT INTO maintenance_types (id, name, category, description, why_it_matters, difficulty,
           estimated_time_minutes, vehicle_id, applies_to_engine, applies_to_transmission,
           interval_normal_miles, interval_normal_months, interval_severe_miles, interval_severe_months,
           created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.name,
          input.category ?? null,
          input.description ?? null,
          input.whyItMatters ?? null,
          input.difficulty ?? null,
          input.estimatedTimeMinutes ?? null,
          input.vehicleId ?? null,
          input.appliesToEngine ?? null,
          input.appliesToTransmission ?? null,
          input.intervalNormalMiles ?? null,
          input.intervalNormalMonths ?? null,
          input.intervalSevereMiles ?? null,
          input.intervalSevereMonths ?? null,
          nowIso(),
        ]
      );
    }
    return (await this.findById(id))!;
  },

  async findById(id: string): Promise<MaintenanceType | null> {
    const r = await queryOne<Row>(`SELECT * FROM maintenance_types WHERE id=?`, [id]);
    return r ? map(r) : null;
  },

  async findAll(): Promise<MaintenanceType[]> {
    const rows = await queryAll<Row>(
      `SELECT * FROM maintenance_types WHERE category IS NULL OR category != '__internal' ORDER BY category, name`
    );
    return rows.map(map);
  },

  /**
   * Returns all maintenance types whose vehicle_id is null (generic) OR matches
   * the given vehicle's profile. Filters by engine + transmission when those
   * fields on the maintenance type are non-null (match), otherwise included.
   */
  async findApplicableTo(vehicleId: string, engine: string | null, transmission: string | null): Promise<MaintenanceType[]> {
    const all = await this.findAll();
    return all.filter((mt) => {
      if (mt.vehicleId && mt.vehicleId !== vehicleId) return false;
      if (mt.appliesToEngine && engine && mt.appliesToEngine !== engine) return false;
      if (mt.appliesToTransmission && transmission && mt.appliesToTransmission !== transmission) return false;
      return true;
    });
  },
};
