export interface Part {
  id: string;
  maintenanceTypeId: string;
  partRole: string;
  manufacturer: string | null;
  isOem: boolean;
  partNumber: string | null;
  description: string | null;
  spec: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  verified: boolean;
  conflict: boolean;
  createdAt: string;
}
