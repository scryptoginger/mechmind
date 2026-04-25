/**
 * Optional one-shot seed script for Keith's 2017 Tacoma. The app will run
 * this when the user taps "Use defaults" on the Add Vehicle screen, OR a
 * developer can wire it into a debug button.
 *
 * Idempotent: only inserts the vehicle if no vehicles exist.
 */
import { vehicleRepo } from '../lib/repositories/vehicleRepo';

export async function seedKeithTacoma(opts: {
  currentOdometer?: number;
  transmission?: '6AT_AC60F' | '6MT_RA63F';
  serviceProfile?: 'normal' | 'severe' | 'mixed';
} = {}) {
  const existing = await vehicleRepo.findAll();
  if (existing.length > 0) return existing[0];

  return vehicleRepo.create({
    year: 2017,
    make: 'Toyota',
    model: 'Tacoma',
    trim: 'TRD Off-Road',
    cab: 'double_cab',
    bed: 'long',
    engine: '4.0L V6 1GR-FE',
    transmission: opts.transmission ?? '6AT_AC60F',
    drivetrain: '4WD',
    currentOdometer: opts.currentOdometer ?? null,
    serviceProfile: opts.serviceProfile ?? 'mixed',
    notes: 'Personal DIY tracking — single owner.',
  });
}
