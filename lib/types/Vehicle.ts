export type ServiceProfile = 'normal' | 'severe' | 'mixed';
export type Cab = 'double_cab' | 'access_cab' | 'regular_cab' | string;
export type Bed = 'long' | 'short' | string;
export type Drivetrain = '2WD' | '4WD' | 'AWD' | string;

export interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  cab: Cab | null;
  bed: Bed | null;
  engine: string | null;
  /** '6AT_AC60F' or '6MT_RA63F' for the 2017 Tacoma; free-form for others. */
  transmission: string | null;
  drivetrain: Drivetrain | null;
  currentOdometer: number | null;
  serviceProfile: ServiceProfile | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleInput {
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  cab?: Cab | null;
  bed?: Bed | null;
  engine?: string | null;
  transmission?: string | null;
  drivetrain?: Drivetrain | null;
  currentOdometer?: number | null;
  serviceProfile?: ServiceProfile | null;
  notes?: string | null;
}
