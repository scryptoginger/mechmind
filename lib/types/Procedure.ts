export interface Procedure {
  id: string;
  maintenanceTypeId: string;
  stepNumber: number;
  title: string;
  detail: string;
  warning: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
}

export interface ToolRequired {
  id: string;
  maintenanceTypeId: string;
  toolName: string;
  toolCategory: string | null;
  spec: string | null;
  optional: boolean;
  notes: string | null;
}

export interface MediaLink {
  id: string;
  maintenanceTypeId: string;
  mediaType: 'youtube' | 'forum_thread' | 'article' | string;
  title: string;
  url: string;
  sourceName: string | null;
  notes: string | null;
  qualityScore: number | null;
}
