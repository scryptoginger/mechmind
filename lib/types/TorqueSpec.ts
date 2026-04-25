export interface TorqueSpec {
  id: string;
  maintenanceTypeId: string;
  fastenerName: string;
  valueFtLbs: number | null;
  valueNm: number | null;
  socketSize: string | null;
  notes: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  verified: boolean;
  conflict: boolean;
  createdAt: string;
}
