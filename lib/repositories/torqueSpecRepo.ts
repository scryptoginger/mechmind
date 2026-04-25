import { execute, queryAll, queryOne, nowIso } from '../db';
import { newId } from './_id';
import type { TorqueSpec } from '../types/TorqueSpec';

interface Row {
  id: string;
  maintenance_type_id: string;
  fastener_name: string;
  value_ft_lbs: number | null;
  value_nm: number | null;
  socket_size: string | null;
  notes: string | null;
  source_url: string | null;
  source_name: string | null;
  verified: number;
  conflict: number;
  created_at: string;
}

const map = (r: Row): TorqueSpec => ({
  id: r.id,
  maintenanceTypeId: r.maintenance_type_id,
  fastenerName: r.fastener_name,
  valueFtLbs: r.value_ft_lbs,
  valueNm: r.value_nm,
  socketSize: r.socket_size,
  notes: r.notes,
  sourceUrl: r.source_url,
  sourceName: r.source_name,
  verified: !!r.verified,
  conflict: !!r.conflict,
  createdAt: r.created_at,
});

export interface TorqueSpecInput {
  id?: string;
  maintenanceTypeId: string;
  fastenerName: string;
  valueFtLbs?: number | null;
  valueNm?: number | null;
  socketSize?: string | null;
  notes?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  verified?: boolean;
  conflict?: boolean;
}

export const torqueSpecRepo = {
  async upsert(input: TorqueSpecInput): Promise<TorqueSpec> {
    const id = input.id ?? newId();
    const existing = await queryOne<Row>(`SELECT id FROM torque_specs WHERE id=?`, [id]);
    if (existing) {
      await execute(
        `UPDATE torque_specs SET maintenance_type_id=?, fastener_name=?, value_ft_lbs=?, value_nm=?,
           socket_size=?, notes=?, source_url=?, source_name=?, verified=?, conflict=?
         WHERE id=?`,
        [
          input.maintenanceTypeId,
          input.fastenerName,
          input.valueFtLbs ?? null,
          input.valueNm ?? null,
          input.socketSize ?? null,
          input.notes ?? null,
          input.sourceUrl ?? null,
          input.sourceName ?? null,
          input.verified ? 1 : 0,
          input.conflict ? 1 : 0,
          id,
        ]
      );
    } else {
      await execute(
        `INSERT INTO torque_specs (id, maintenance_type_id, fastener_name, value_ft_lbs, value_nm,
           socket_size, notes, source_url, source_name, verified, conflict, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.maintenanceTypeId,
          input.fastenerName,
          input.valueFtLbs ?? null,
          input.valueNm ?? null,
          input.socketSize ?? null,
          input.notes ?? null,
          input.sourceUrl ?? null,
          input.sourceName ?? null,
          input.verified ? 1 : 0,
          input.conflict ? 1 : 0,
          nowIso(),
        ]
      );
    }
    const r = await queryOne<Row>(`SELECT * FROM torque_specs WHERE id=?`, [id]);
    return map(r!);
  },

  async findByMaintenanceType(maintenanceTypeId: string): Promise<TorqueSpec[]> {
    const rows = await queryAll<Row>(
      `SELECT * FROM torque_specs WHERE maintenance_type_id=? ORDER BY fastener_name`,
      [maintenanceTypeId]
    );
    return rows.map(map);
  },
};
