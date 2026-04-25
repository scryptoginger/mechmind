import { odometerRepo, cadenceRepo } from '../repositories/odometerRepo';
import type { OdometerReading, FillUpCadence } from '../types/OdometerReading';

export const DEFAULT_DAYS = 7;
export const DEFAULT_MILES = 300;
export const WINDOW = 10;

interface Pair {
  prev: OdometerReading;
  curr: OdometerReading;
  days: number;
  miles: number;
}

/**
 * Recent-weighted average over up to WINDOW pairs of consecutive fill-ups.
 * Weight = 1 + (i / WINDOW) so most recent has roughly 2x weight of oldest.
 */
function weightedAvg(values: number[]): number {
  let total = 0;
  let weightSum = 0;
  values.forEach((v, i) => {
    const w = 1 + i / WINDOW;
    total += v * w;
    weightSum += w;
  });
  return total / weightSum;
}

export function computeCadenceFromReadings(readingsDescending: OdometerReading[]): {
  avgDays: number;
  avgMiles: number;
  sampleCount: number;
  isLearning: boolean;
} {
  if (readingsDescending.length < 2) {
    return {
      avgDays: DEFAULT_DAYS,
      avgMiles: DEFAULT_MILES,
      sampleCount: readingsDescending.length,
      isLearning: true,
    };
  }
  // pairs from oldest→newest so weighting can favor most recent
  const ascending = [...readingsDescending].reverse();
  const pairs: Pair[] = [];
  for (let i = 1; i < ascending.length; i++) {
    const prev = ascending[i - 1];
    const curr = ascending[i];
    const ms = new Date(curr.recordedAt).getTime() - new Date(prev.recordedAt).getTime();
    const days = ms / (1000 * 60 * 60 * 24);
    const miles = curr.reading - prev.reading;
    if (days > 0 && miles > 0) {
      pairs.push({ prev, curr, days, miles });
    }
  }
  const window = pairs.slice(-WINDOW);
  if (window.length === 0) {
    return { avgDays: DEFAULT_DAYS, avgMiles: DEFAULT_MILES, sampleCount: 0, isLearning: true };
  }
  return {
    avgDays: weightedAvg(window.map((p) => p.days)),
    avgMiles: weightedAvg(window.map((p) => p.miles)),
    sampleCount: pairs.length,
    isLearning: pairs.length < 5,
  };
}

export async function recomputeCadence(vehicleId: string): Promise<FillUpCadence> {
  const fills = await odometerRepo.fillUpsForVehicle(vehicleId, WINDOW + 5);
  const c = computeCadenceFromReadings(fills);
  return cadenceRepo.upsert(vehicleId, c.avgDays, c.avgMiles, c.sampleCount);
}
