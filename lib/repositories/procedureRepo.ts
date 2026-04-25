import { execute, queryAll, queryOne } from '../db';
import { newId } from './_id';
import type { Procedure, ToolRequired, MediaLink } from '../types/Procedure';

interface ProcRow {
  id: string;
  maintenance_type_id: string;
  step_number: number;
  title: string;
  detail: string;
  warning: string | null;
  source_url: string | null;
  source_name: string | null;
}

const mapProc = (r: ProcRow): Procedure => ({
  id: r.id,
  maintenanceTypeId: r.maintenance_type_id,
  stepNumber: r.step_number,
  title: r.title,
  detail: r.detail,
  warning: r.warning,
  sourceUrl: r.source_url,
  sourceName: r.source_name,
});

export interface ProcedureInput {
  id?: string;
  maintenanceTypeId: string;
  stepNumber: number;
  title: string;
  detail: string;
  warning?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
}

export const procedureRepo = {
  async upsert(input: ProcedureInput): Promise<Procedure> {
    const id = input.id ?? newId();
    const existing = await queryOne<{ id: string }>(`SELECT id FROM procedures WHERE id=?`, [id]);
    if (existing) {
      await execute(
        `UPDATE procedures SET maintenance_type_id=?, step_number=?, title=?, detail=?, warning=?,
           source_url=?, source_name=? WHERE id=?`,
        [
          input.maintenanceTypeId,
          input.stepNumber,
          input.title,
          input.detail,
          input.warning ?? null,
          input.sourceUrl ?? null,
          input.sourceName ?? null,
          id,
        ]
      );
    } else {
      await execute(
        `INSERT INTO procedures (id, maintenance_type_id, step_number, title, detail, warning, source_url, source_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.maintenanceTypeId,
          input.stepNumber,
          input.title,
          input.detail,
          input.warning ?? null,
          input.sourceUrl ?? null,
          input.sourceName ?? null,
        ]
      );
    }
    const r = await queryOne<ProcRow>(`SELECT * FROM procedures WHERE id=?`, [id]);
    return mapProc(r!);
  },

  async findByMaintenanceType(maintenanceTypeId: string): Promise<Procedure[]> {
    const rows = await queryAll<ProcRow>(
      `SELECT * FROM procedures WHERE maintenance_type_id=? ORDER BY step_number ASC`,
      [maintenanceTypeId]
    );
    return rows.map(mapProc);
  },
};

interface ToolRow {
  id: string;
  maintenance_type_id: string;
  tool_name: string;
  tool_category: string | null;
  spec: string | null;
  optional: number;
  notes: string | null;
}

const mapTool = (r: ToolRow): ToolRequired => ({
  id: r.id,
  maintenanceTypeId: r.maintenance_type_id,
  toolName: r.tool_name,
  toolCategory: r.tool_category,
  spec: r.spec,
  optional: !!r.optional,
  notes: r.notes,
});

export interface ToolRequiredInput {
  id?: string;
  maintenanceTypeId: string;
  toolName: string;
  toolCategory?: string | null;
  spec?: string | null;
  optional?: boolean;
  notes?: string | null;
}

export const toolRepo = {
  async upsert(input: ToolRequiredInput): Promise<ToolRequired> {
    const id = input.id ?? newId();
    const existing = await queryOne<{ id: string }>(`SELECT id FROM tools_required WHERE id=?`, [id]);
    if (existing) {
      await execute(
        `UPDATE tools_required SET maintenance_type_id=?, tool_name=?, tool_category=?, spec=?,
           optional=?, notes=? WHERE id=?`,
        [
          input.maintenanceTypeId,
          input.toolName,
          input.toolCategory ?? null,
          input.spec ?? null,
          input.optional ? 1 : 0,
          input.notes ?? null,
          id,
        ]
      );
    } else {
      await execute(
        `INSERT INTO tools_required (id, maintenance_type_id, tool_name, tool_category, spec, optional, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.maintenanceTypeId,
          input.toolName,
          input.toolCategory ?? null,
          input.spec ?? null,
          input.optional ? 1 : 0,
          input.notes ?? null,
        ]
      );
    }
    const r = await queryOne<ToolRow>(`SELECT * FROM tools_required WHERE id=?`, [id]);
    return mapTool(r!);
  },

  async findByMaintenanceType(maintenanceTypeId: string): Promise<ToolRequired[]> {
    const rows = await queryAll<ToolRow>(
      `SELECT * FROM tools_required WHERE maintenance_type_id=? ORDER BY optional ASC, tool_name ASC`,
      [maintenanceTypeId]
    );
    return rows.map(mapTool);
  },
};

interface MediaRow {
  id: string;
  maintenance_type_id: string;
  media_type: string;
  title: string;
  url: string;
  source_name: string | null;
  notes: string | null;
  quality_score: number | null;
}

const mapMedia = (r: MediaRow): MediaLink => ({
  id: r.id,
  maintenanceTypeId: r.maintenance_type_id,
  mediaType: r.media_type,
  title: r.title,
  url: r.url,
  sourceName: r.source_name,
  notes: r.notes,
  qualityScore: r.quality_score,
});

export interface MediaLinkInput {
  id?: string;
  maintenanceTypeId: string;
  mediaType: 'youtube' | 'forum_thread' | 'article' | string;
  title: string;
  url: string;
  sourceName?: string | null;
  notes?: string | null;
  qualityScore?: number | null;
}

export const mediaLinkRepo = {
  async upsert(input: MediaLinkInput): Promise<MediaLink> {
    const id = input.id ?? newId();
    const existing = await queryOne<{ id: string }>(`SELECT id FROM media_links WHERE id=?`, [id]);
    if (existing) {
      await execute(
        `UPDATE media_links SET maintenance_type_id=?, media_type=?, title=?, url=?, source_name=?,
           notes=?, quality_score=? WHERE id=?`,
        [
          input.maintenanceTypeId,
          input.mediaType,
          input.title,
          input.url,
          input.sourceName ?? null,
          input.notes ?? null,
          input.qualityScore ?? null,
          id,
        ]
      );
    } else {
      await execute(
        `INSERT INTO media_links (id, maintenance_type_id, media_type, title, url, source_name, notes, quality_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.maintenanceTypeId,
          input.mediaType,
          input.title,
          input.url,
          input.sourceName ?? null,
          input.notes ?? null,
          input.qualityScore ?? null,
        ]
      );
    }
    const r = await queryOne<MediaRow>(`SELECT * FROM media_links WHERE id=?`, [id]);
    return mapMedia(r!);
  },

  async findByMaintenanceType(maintenanceTypeId: string): Promise<MediaLink[]> {
    const rows = await queryAll<MediaRow>(
      `SELECT * FROM media_links WHERE maintenance_type_id=?
       ORDER BY COALESCE(quality_score, -1) DESC, title ASC`,
      [maintenanceTypeId]
    );
    return rows.map(mapMedia);
  },
};
