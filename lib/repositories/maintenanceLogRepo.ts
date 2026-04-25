import { execute, queryAll, queryOne, nowIso } from '../db';
import { newId } from './_id';
import type { MaintenanceLog, MaintenanceLogInput, PartUsedRef } from '../types/MaintenanceLog';

interface Row {
  id: string;
  vehicle_id: string;
  maintenance_type_id: string;
  completed_at: string;
  odometer_at_completion: number;
  notes: string | null;
  parts_used: string | null;
  total_cost: number | null;
  time_spent_minutes: number | null;
  difficulty_actual: number | null;
  created_at: string;
}

const map = (r: Row): MaintenanceLog => {
  let partsUsed: PartUsedRef[] | null = null;
  if (r.parts_used) {
    try {
      partsUsed = JSON.parse(r.parts_used);
    } catch {
      partsUsed = null;
    }
  }
  return {
    id: r.id,
    vehicleId: r.vehicle_id,
    maintenanceTypeId: r.maintenance_type_id,
    completedAt: r.completed_at,
    odometerAtCompletion: r.odometer_at_completion,
    notes: r.notes,
    partsUsed,
    totalCost: r.total_cost,
    timeSpentMinutes: r.time_spent_minutes,
    difficultyActual: r.difficulty_actual,
    createdAt: r.created_at,
  };
};

export const maintenanceLogRepo = {
  async create(input: MaintenanceLogInput): Promise<MaintenanceLog> {
    const id = newId();
    const now = nowIso();
    await execute(
      `INSERT INTO maintenance_logs (id, vehicle_id, maintenance_type_id, completed_at,
         odometer_at_completion, notes, parts_used, total_cost, time_spent_minutes,
         difficulty_actual, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.vehicleId,
        input.maintenanceTypeId,
        input.completedAt ?? now,
        input.odometerAtCompletion,
        input.notes ?? null,
        input.partsUsed ? JSON.stringify(input.partsUsed) : null,
        input.totalCost ?? null,
        input.timeSpentMinutes ?? null,
        input.difficultyActual ?? null,
        now,
      ]
    );
    const r = await queryOne<Row>(`SELECT * FROM maintenance_logs WHERE id=?`, [id]);
    return map(r!);
  },

  async findById(id: string): Promise<MaintenanceLog | null> {
    const r = await queryOne<Row>(`SELECT * FROM maintenance_logs WHERE id=?`, [id]);
    return r ? map(r) : null;
  },

  async findByVehicle(vehicleId: string): Promise<MaintenanceLog[]> {
    const rows = await queryAll<Row>(
      `SELECT * FROM maintenance_logs WHERE vehicle_id=? ORDER BY completed_at DESC`,
      [vehicleId]
    );
    return rows.map(map);
  },

  async findLatestForJob(vehicleId: string, maintenanceTypeId: string): Promise<MaintenanceLog | null> {
    const r = await queryOne<Row>(
      `SELECT * FROM maintenance_logs WHERE vehicle_id=? AND maintenance_type_id=?
       ORDER BY completed_at DESC LIMIT 1`,
      [vehicleId, maintenanceTypeId]
    );
    return r ? map(r) : null;
  },

  async update(id: string, patch: Partial<MaintenanceLogInput>): Promise<MaintenanceLog> {
    const cur = await this.findById(id);
    if (!cur) throw new Error(`log ${id} not found`);
    const merged = { ...cur, ...patch };
    await execute(
      `UPDATE maintenance_logs SET completed_at=?, odometer_at_completion=?, notes=?, parts_used=?,
         total_cost=?, time_spent_minutes=?, difficulty_actual=? WHERE id=?`,
      [
        merged.completedAt,
        merged.odometerAtCompletion,
        merged.notes ?? null,
        merged.partsUsed ? JSON.stringify(merged.partsUsed) : null,
        merged.totalCost ?? null,
        merged.timeSpentMinutes ?? null,
        merged.difficultyActual ?? null,
        id,
      ]
    );
    return (await this.findById(id))!;
  },

  async delete(id: string): Promise<void> {
    await execute(`DELETE FROM maintenance_logs WHERE id=?`, [id]);
  },
};
