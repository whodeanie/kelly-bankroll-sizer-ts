import { describe, expect, it } from "vitest";
import {
  americanToDecimal,
  computeKelly,
  decimalToAmerican,
  simulateGrowth,
} from "../src/lib/kelly";

describe("americanToDecimal", () => {
  it("plus money", () => {
    expect(americanToDecimal(150)).toBeCloseTo(2.5);
  });
  it("minus money", () => {
    expect(americanToDecimal(-110)).toBeCloseTo(1.9091, 3);
  });
  it("round trips through decimalToAmerican", () => {
    expect(decimalToAmerican(americanToDecimal(-110))).toBe(-110);
    expect(decimalToAmerican(americanToDecimal(200))).toBe(200);
  });
});

describe("computeKelly", () => {
  it("returns zero stake when edge is zero", () => {
    const k = computeKelly({ bankroll: 1000, edgePct: 0, decimalOdds: 1.9091, fraction: 1 });
    expect(k.fullKellyFraction).toBeLessThanOrEqual(1e-9);
    expect(k.recommendedStake).toBe(0);
  });

  it("scales by the user supplied fraction", () => {
    const full = computeKelly({ bankroll: 1000, edgePct: 4, decimalOdds: 1.9091, fraction: 1 });
    const half = computeKelly({ bankroll: 1000, edgePct: 4, decimalOdds: 1.9091, fraction: 0.5 });
    expect(half.appliedFraction).toBeCloseTo(full.appliedFraction / 2, 6);
    expect(half.recommendedStake).toBeCloseTo(full.recommendedStake / 2, 6);
  });

  it("EV per bet is positive when edge is positive", () => {
    const k = computeKelly({ bankroll: 1000, edgePct: 5, decimalOdds: 2, fraction: 0.25 });
    expect(k.expectedValuePerBet).toBeGreaterThan(0);
  });
});

describe("simulateGrowth", () => {
  it("is deterministic given a seed", () => {
    const args = {
      bankroll: 1000,
      appliedFraction: 0.02,
      decimalOdds: 1.9091,
      edgePct: 4,
      bets: 200,
      paths: 50,
      seed: 7,
    };
    const a = simulateGrowth(args);
    const b = simulateGrowth(args);
    expect(a.median).toEqual(b.median);
    expect(a.bustProbability).toBe(b.bustProbability);
  });

  it("paths length equals bets+1 (initial bankroll plus one per bet)", () => {
    const r = simulateGrowth({
      bankroll: 1000,
      appliedFraction: 0.02,
      decimalOdds: 1.9091,
      edgePct: 4,
      bets: 100,
      paths: 5,
    });
    expect(r.paths[0]?.length).toBe(101);
  });

  it("produces a positive expected final bankroll on a positive edge", () => {
    const r = simulateGrowth({
      bankroll: 1000,
      appliedFraction: 0.02,
      decimalOdds: 1.9091,
      edgePct: 4,
      bets: 1000,
      paths: 100,
    });
    expect(r.expectedFinalBankroll).toBeGreaterThan(1000);
  });
});
