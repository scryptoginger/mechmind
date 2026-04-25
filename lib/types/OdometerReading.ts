export type OdometerSource = 'fill_up' | 'maintenance' | 'manual';

export interface OdometerReading {
  id: string;
  vehicleId: string;
  reading: number;
  recordedAt: string;
  source: OdometerSource;
  notes: string | null;
}

export interface FillUpCadence {
  id: string;
  vehicleId: string;
  avgDaysBetween: number | null;
  avgMilesBetween: number | null;
  sampleCount: number | null;
  lastCalculatedAt: string;
}

export interface NotificationLogEntry {
  id: string;
  vehicleId: string;
  notificationType: 'maintenance_due' | 'fill_up_prompt' | string;
  relatedMaintenanceTypeId: string | null;
  sentAt: string;
  channel: 'discord' | 'in_app' | string;
}
