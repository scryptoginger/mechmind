import { execute, queryAll, queryOne, nowIso } from '../db';
import { newId } from './_id';
import type { Part } from '../types/Part';

interface Row {
  id: string;
  maintenance_type_id: string;
  part_role: string;
  manufacturer: string | null;
  is_oem: number;
  part_number: string | null;
  description: string | null;
  spec: string | null;
  source_url: string | null;
  source_name: string | null;
  verified: number;
  conflict: number;
  created_at: string;
}

const map = (r: Row): Part => ({
  id: r.id,
  maintenanceTypeId: r.maintenance_type_id,
  partRole: r.part_role,
  manufacturer: r.manufacturer,
  isOem: !!r.is_oem,
  partNumber: r.part_number,
  description: r.description,
  spec: r.spec,
  sourceUrl: r.source_url,
  sourceName: r.source_name,
  verified: !!r.verified,
  conflict: !!r.conflict,
  createdAt: r.created_at,
});

export interface PartInput {
  id?: string;
  maintenanceTypeId: string;
  partRole: string;
  manufacturer?: string | null;
  isOem: boolean;
  partNumber?: string | null;
  description?: string | null;
  spec?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  verified?: boolean;
  conflict?: boolean;
}

export const partRepo = {
  async upsert(input: PartInput): Promise<Part> {
    const id = input.id ?? newId();
    const existing = await queryOne<Row>(`SELECT * FROM parts WHERE id=?`, [id]);
    if (existing) {
      await execute(
        `UPDATE parts SET maintenance_type_id=?, part_role=?, manufacturer=?, is_oem=?, part_number=?,
           description=?, spec=?, source_url=?, source_name=?, verified=?, conflict=?
         WHERE id=?`,
        [
          input.maintenanceTypeId,
          input.partRole,
          input.manufacturer ?? null,
          input.isOem ? 1 : 0,
          input.partNumber ?? null,
          input.description ?? null,
          input.spec ?? null,
          input.sourceUrl ?? null,
          input.sourceName ?? null,
          input.verified ? 1 : 0,
          input.conflict ? 1 : 0,
          id,
        ]
      );
    } else {
      await execute(
        `INSERT INTO parts (id, maintenance_type_id, part_role, manufacturer, is_oem, part_number,
           description, spec, source_url, source_name, verified, conflict, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.maintenanceTypeId,
          input.partRole,
          input.manufacturer ?? null,
          input.isOem ? 1 : 0,
          input.partNumber ?? null,
          input.description ?? null,
          input.spec ?? null,
          input.sourceUrl ?? null,
          input.sourceName ?? null,
          input.verified ? 1 : 0,
          input.conflict ? 1 : 0,
          nowIso(),
        ]
      );
    }
    const r = await queryOne<Row>(`SELECT * FROM parts WHERE id=?`, [id]);
    return map(r!);
  },

  async findByMaintenanceType(maintenanceTypeId: string): Promise<Part[]> {
    const rows = await queryAll<Row>(
      `SELECT * FROM parts WHERE maintenance_type_id=? ORDER BY is_oem DESC, manufacturer ASC`,
      [maintenanceTypeId]
    );
    return rows.map(map);
  },
};
