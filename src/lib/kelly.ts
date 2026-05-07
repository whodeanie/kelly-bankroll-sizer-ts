/**
 * Pure functions for Kelly criterion sizing and Monte Carlo growth simulation.
 * No DOM, no React, no fetch. Fully unit testable.
 */

export interface KellyInputs {
  bankroll: number;
  edgePct: number;
  decimalOdds: number;
  fraction: number;
}

export interface KellyResult {
  fullKellyFraction: number;
  appliedFraction: number;
  recommendedStake: number;
  expectedValuePerBet: number;
  edgePct: number;
}

/**
 * Kelly fraction f = (b * p - q) / b, where:
 *   b = decimalOdds - 1 (net payout per unit staked on a win)
 *   p = win probability
 *   q = 1 - p (loss probability)
 *
 * The user supplies edge as a percentage. We back out p from b and edge so the
 * UI stays familiar (most users think in edge percent, not raw probability).
 *
 * edge% = (decimalOdds * p) - 1, so p = (1 + edge%) / decimalOdds.
 */
export function computeKelly(inputs: KellyInputs): KellyResult {
  const { bankroll, edgePct, decimalOdds, fraction } = inputs;
  const b = decimalOdds - 1;
  const p = (1 + edgePct / 100) / decimalOdds;
  const q = 1 - p;
  const fullKelly = b > 0 ? (b * p - q) / b : 0;
  const applied = Math.max(0, fullKelly) * fraction;
  return {
    fullKellyFraction: fullKelly,
    appliedFraction: applied,
    recommendedStake: Math.max(0, bankroll * applied),
    expectedValuePerBet: bankroll * applied * (decimalOdds * p - 1),
    edgePct,
  };
}

export interface SimInputs {
  bankroll: number;
  appliedFraction: number;
  decimalOdds: number;
  edgePct: number;
  bets: number;
  paths: number;
  seed?: number;
}

export interface SimResult {
  paths: number[][];
  median: number[];
  p10: number[];
  p90: number[];
  bustProbability: number;
  expectedFinalBankroll: number;
}

/**
 * Mulberry32 deterministic PRNG. Cheap, decent statistics, fully reproducible.
 */
function mulberry32(a: number): () => number {
  let s = a >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Monte Carlo growth simulation. Each bet independently wins with probability
 * p (derived from edge and odds). On a win the bankroll grows by stake*(b);
 * on a loss it shrinks by stake. Stake is `appliedFraction * bankroll` at each
 * step (proportional sizing, the textbook Kelly behavior).
 */
export function simulateGrowth(inputs: SimInputs): SimResult {
  const { bankroll, appliedFraction, decimalOdds, edgePct, bets, paths } = inputs;
  const seed = inputs.seed ?? 42;
  const rand = mulberry32(seed);

  const b = decimalOdds - 1;
  const p = (1 + edgePct / 100) / decimalOdds;

  const allPaths: number[][] = [];
  let busts = 0;

  for (let path = 0; path < paths; path++) {
    let br = bankroll;
    const trail: number[] = [br];
    for (let i = 0; i < bets; i++) {
      const stake = br * appliedFraction;
      if (rand() < p) br += stake * b;
      else br -= stake;
      if (br <= 0.01) {
        br = 0;
        trail.push(0);
        for (let j = i + 1; j < bets; j++) trail.push(0);
        break;
      }
      trail.push(br);
    }
    if (br <= 0.01) busts++;
    allPaths.push(trail);
  }

  const median = quantileBetweenPaths(allPaths, 0.5);
  const p10 = quantileBetweenPaths(allPaths, 0.1);
  const p90 = quantileBetweenPaths(allPaths, 0.9);
  const finals = allPaths.map((p) => p[p.length - 1] ?? 0);
  const expectedFinalBankroll = finals.reduce((a, c) => a + c, 0) / Math.max(1, finals.length);

  return {
    paths: allPaths,
    median,
    p10,
    p90,
    bustProbability: paths > 0 ? busts / paths : 0,
    expectedFinalBankroll,
  };
}

function quantileBetweenPaths(paths: number[][], q: number): number[] {
  const T = paths[0]?.length ?? 0;
  const out: number[] = [];
  for (let t = 0; t < T; t++) {
    const slice = paths.map((p) => p[t] ?? 0).sort((a, b) => a - b);
    const idx = Math.min(slice.length - 1, Math.max(0, Math.floor(q * (slice.length - 1))));
    out.push(slice[idx] ?? 0);
  }
  return out;
}

export function americanToDecimal(american: number): number {
  if (american > 0) return 1 + american / 100;
  return 1 + 100 / Math.abs(american);
}

export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}
