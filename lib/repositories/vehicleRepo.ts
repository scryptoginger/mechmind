import { execute, queryAll, queryOne, nowIso } from '../db';
import { newId } from './_id';
import type { Vehicle, VehicleInput } from '../types/Vehicle';

interface Row {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  cab: string | null;
  bed: string | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  current_odometer: number | null;
  service_profile: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const map = (r: Row): Vehicle => ({
  id: r.id,
  year: r.year,
  make: r.make,
  model: r.model,
  trim: r.trim,
  cab: r.cab,
  bed: r.bed,
  engine: r.engine,
  transmission: r.transmission,
  drivetrain: r.drivetrain,
  currentOdometer: r.current_odometer,
  serviceProfile: r.service_profile as Vehicle['serviceProfile'],
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const vehicleRepo = {
  async create(input: VehicleInput): Promise<Vehicle> {
    const id = newId();
    const now = nowIso();
    await execute(
      `INSERT INTO vehicles (id, year, make, model, trim, cab, bed, engine, transmission, drivetrain,
                             current_odometer, service_profile, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.year,
        input.make,
        input.model,
        input.trim ?? null,
        input.cab ?? null,
        input.bed ?? null,
        input.engine ?? null,
        input.transmission ?? null,
        input.drivetrain ?? null,
        input.currentOdometer ?? null,
        input.serviceProfile ?? null,
        input.notes ?? null,
        now,
        now,
      ]
    );
    const v = await this.findById(id);
    if (!v) throw new Error('vehicle insert failed');
    return v;
  },

  async findAll(): Promise<Vehicle[]> {
    const rows = await queryAll<Row>(`SELECT * FROM vehicles ORDER BY created_at ASC`);
    return rows.map(map);
  },

  async findById(id: string): Promise<Vehicle | null> {
    const r = await queryOne<Row>(`SELECT * FROM vehicles WHERE id = ?`, [id]);
    return r ? map(r) : null;
  },

  async update(id: string, patch: Partial<VehicleInput>): Promise<Vehicle> {
    const cur = await this.findById(id);
    if (!cur) throw new Error(`vehicle ${id} not found`);
    const merged = { ...cur, ...patch } as Vehicle & VehicleInput;
    const now = nowIso();
    await execute(
      `UPDATE vehicles SET year=?, make=?, model=?, trim=?, cab=?, bed=?, engine=?, transmission=?,
                            drivetrain=?, current_odometer=?, service_profile=?, notes=?, updated_at=?
       WHERE id=?`,
      [
        merged.year,
        merged.make,
        merged.model,
        merged.trim ?? null,
        merged.cab ?? null,
        merged.bed ?? null,
        merged.engine ?? null,
        merged.transmission ?? null,
        merged.drivetrain ?? null,
        merged.currentOdometer ?? null,
        merged.serviceProfile ?? null,
        merged.notes ?? null,
        now,
        id,
      ]
    );
    return (await this.findById(id))!;
  },

  async setOdometer(id: string, odometer: number): Promise<void> {
    await execute(`UPDATE vehicles SET current_odometer=?, updated_at=? WHERE id=?`, [odometer, nowIso(), id]);
  },

  async delete(id: string): Promise<void> {
    await execute(`DELETE FROM vehicles WHERE id=?`, [id]);
  },
};
