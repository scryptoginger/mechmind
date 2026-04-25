// Lightweight assertion tests for CadenceLearnerService.computeCadenceFromReadings.
// Run with: `node lib/services/__tests__/CadenceLearnerService.test.mjs`
//
// Imports the source via TypeScript-stripping at runtime is overkill, so this
// file mirrors the function under test in pure JS. When the source changes,
// re-mirror the algorithm here. Cheap insurance against weighted-window
// regressions; no Jest / Vitest dependency.

import assert from 'node:assert/strict';

// ── Mirror of computeCadenceFromReadings + weightedAvg ────────────────────
const DEFAULT_DAYS = 7;
const DEFAULT_MILES = 300;
const WINDOW = 10;

function weightedAvg(values) {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  const denom = values.length - 1;
  let total = 0;
  let weightSum = 0;
  values.forEach((v, i) => {
    const w = 1 + i / denom;
    total += v * w;
    weightSum += w;
  });
  return total / weightSum;
}

function computeCadenceFromReadings(readingsDescending) {
  if (readingsDescending.length < 2) {
    return {
      avgDays: DEFAULT_DAYS,
      avgMiles: DEFAULT_MILES,
      sampleCount: readingsDescending.length,
      isLearning: true,
    };
  }
  const ascending = [...readingsDescending].reverse();
  const pairs = [];
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

// ── Helpers ───────────────────────────────────────────────────────────────
function reading(daysAgo, miles) {
  const recordedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return { id: 'r' + daysAgo, vehicleId: 'v', reading: miles, recordedAt, source: 'fill_up', notes: null };
}

// readingsDescending = newest first
function descBy(daysAgoList, milesList) {
  return daysAgoList.map((d, i) => reading(d, milesList[i]));
}

// ── Tests ─────────────────────────────────────────────────────────────────
function test(name, fn) {
  try {
    fn();
    console.log('ok  ' + name);
  } catch (e) {
    console.error('FAIL ' + name);
    console.error(e);
    process.exitCode = 1;
  }
}

test('empty history → defaults + learning', () => {
  const c = computeCadenceFromReadings([]);
  assert.equal(c.avgDays, DEFAULT_DAYS);
  assert.equal(c.avgMiles, DEFAULT_MILES);
  assert.equal(c.sampleCount, 0);
  assert.equal(c.isLearning, true);
});

test('single reading → still defaults', () => {
  const c = computeCadenceFromReadings([reading(0, 50000)]);
  assert.equal(c.avgDays, DEFAULT_DAYS);
  assert.equal(c.avgMiles, DEFAULT_MILES);
  assert.equal(c.sampleCount, 1);
  assert.equal(c.isLearning, true);
});

test('three readings 7d/300mi apart → ~7d/~300mi', () => {
  const c = computeCadenceFromReadings(descBy([0, 7, 14], [50600, 50300, 50000]));
  assert.ok(Math.abs(c.avgDays - 7) < 0.01, 'days ' + c.avgDays);
  assert.ok(Math.abs(c.avgMiles - 300) < 0.01, 'miles ' + c.avgMiles);
  assert.equal(c.sampleCount, 2);
  assert.equal(c.isLearning, true);
});

test('10+ readings → not learning, weighted toward recent', () => {
  // 11 readings: oldest gap was 1000 miles (boring),
  //              recent gaps are all 200 miles. Weighted should pull toward 200.
  const days = [110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
  const miles = [49000, 49200, 49400, 49600, 49800, 50000, 50200, 50400, 50600, 50800, 51000];
  // newest first:
  const desc = days.map((d, i) => reading(d, miles[i])).reverse();
  const c = computeCadenceFromReadings(desc);
  assert.equal(c.isLearning, false);
  assert.equal(c.sampleCount, 10);
  assert.ok(Math.abs(c.avgMiles - 200) < 1, 'miles ' + c.avgMiles);
  assert.ok(Math.abs(c.avgDays - 10) < 0.5, 'days ' + c.avgDays);
});

test('recent change in routine: weighted avg leans toward newest', () => {
  // 5 pairs at 14 days, then 5 pairs at 5 days. Newest 5 should pull avg below
  // the simple mean of (14+5)/2 = 9.5.
  const days = [];
  let cum = 0;
  for (let i = 0; i < 5; i++) {
    cum += 14;
    days.push(cum);
  }
  for (let i = 0; i < 5; i++) {
    cum += 5;
    days.push(cum);
  }
  const milesArr = days.map((_, i) => 50000 + (i + 1) * 250);
  const desc = days.map((d, i) => reading(d, milesArr[i])).reverse();
  const c = computeCadenceFromReadings(desc);
  // We're ascending in time so the last 5 pairs (most recent in time) are the
  // 5-day gaps. With weight 2x on newest, avg should be < 9.5.
  assert.ok(c.avgDays < 9.5, 'expected newer-leaning avg, got ' + c.avgDays);
  assert.ok(c.avgDays > 5, 'should still feel the older 14-day pairs, got ' + c.avgDays);
});

test('non-monotonic odometer is dropped, not crashed', () => {
  // Middle reading is BEFORE prior in odo (data entry typo) — gets filtered.
  const desc = [
    reading(0, 51000),
    reading(7, 49000), // typo
    reading(14, 50700),
    reading(21, 50400),
    reading(28, 50100),
  ];
  const c = computeCadenceFromReadings(desc);
  // We get 2 valid pairs out of 4, plus one valid jump from typo→51000
  // (51000-49000 = 2000mi over 7d). Still valid number, not NaN.
  assert.ok(Number.isFinite(c.avgDays));
  assert.ok(Number.isFinite(c.avgMiles));
  assert.ok(c.avgMiles > 0);
});
