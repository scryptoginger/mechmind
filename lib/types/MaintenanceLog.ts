export interface PartUsedRef {
  partId: string;
  qty: number;
  cost: number;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  maintenanceTypeId: string;
  completedAt: string;
  odometerAtCompletion: number;
  notes: string | null;
  /** stored as JSON in SQLite */
  partsUsed: PartUsedRef[] | null;
  totalCost: number | null;
  timeSpentMinutes: number | null;
  difficultyActual: number | null;
  createdAt: string;
}

export interface MaintenanceLogInput {
  vehicleId: string;
  maintenanceTypeId: string;
  completedAt?: string;
  odometerAtCompletion: number;
  notes?: string | null;
  partsUsed?: PartUsedRef[] | null;
  totalCost?: number | null;
  timeSpentMinutes?: number | null;
  difficultyActual?: number | null;
}
