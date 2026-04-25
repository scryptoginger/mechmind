export interface MaintenanceType {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  whyItMatters: string | null;
  difficulty: number | null;
  estimatedTimeMinutes: number | null;
  vehicleId: string | null;
  appliesToEngine: string | null;
  appliesToTransmission: string | null;
  intervalNormalMiles: number | null;
  intervalNormalMonths: number | null;
  intervalSevereMiles: number | null;
  intervalSevereMonths: number | null;
  createdAt: string;
}
