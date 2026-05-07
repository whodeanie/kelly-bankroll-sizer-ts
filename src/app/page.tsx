"use client";

import { useMemo, useState } from "react";
import { SimChart } from "@/components/SimChart";
import {
  americanToDecimal,
  computeKelly,
  decimalToAmerican,
  simulateGrowth,
} from "@/lib/kelly";

export default function HomePage() {
  const [bankroll, setBankroll] = useState(10_000);
  const [edgePct, setEdgePct] = useState(3);
  const [american, setAmerican] = useState(-110);
  const [fraction, setFraction] = useState(0.25);
  const [bets, setBets] = useState(1000);
  const [paths, setPaths] = useState(200);

  const decimalOdds = useMemo(() => americanToDecimal(american), [american]);

  const kelly = useMemo(
    () => computeKelly({ bankroll, edgePct, decimalOdds, fraction }),
    [bankroll, edgePct, decimalOdds, fraction],
  );

  const sim = useMemo(
    () =>
      simulateGrowth({
        bankroll,
        appliedFraction: kelly.appliedFraction,
        decimalOdds,
        edgePct,
        bets,
        paths,
      }),
    [bankroll, kelly.appliedFraction, decimalOdds, edgePct, bets, paths],
  );

  const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

  return (
    <main>
      <h1>Kelly bankroll sizer</h1>
      <p className="muted">
        Fractional Kelly stake recommendation plus a {paths} path Monte Carlo growth simulation
        over {bets} bets. All math runs locally in your browser. Nothing leaves the page.
      </p>

      <div className="card">
        <div className="row">
          <div className="field">
            <label htmlFor="bankroll">Bankroll</label>
            <input
              id="bankroll"
              type="number"
              min={1}
              value={bankroll}
              onChange={(e) => setBankroll(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="edge">Edge percent</label>
            <input
              id="edge"
              type="number"
              step="0.1"
              value={edgePct}
              onChange={(e) => setEdgePct(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="odds">American odds</label>
            <input
              id="odds"
              type="number"
              value={american}
              onChange={(e) => setAmerican(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="frac">Kelly fraction</label>
            <select
              id="frac"
              value={fraction}
              onChange={(e) => setFraction(Number(e.target.value))}
            >
              <option value={1}>Full Kelly</option>
              <option value={0.5}>Half Kelly</option>
              <option value={0.25}>Quarter Kelly</option>
              <option value={0.1}>Tenth Kelly</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="bets">Bets in simulation</label>
            <input
              id="bets"
              type="number"
              min={50}
              max={10000}
              value={bets}
              onChange={(e) => setBets(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="paths">Paths</label>
            <input
              id="paths"
              type="number"
              min={20}
              max={2000}
              value={paths}
              onChange={(e) => setPaths(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Decimal odds</label>
            <input value={decimalOdds.toFixed(3)} disabled />
          </div>
          <div className="field">
            <label>Implied prob (no edge)</label>
            <input value={pct(1 / decimalOdds)} disabled />
          </div>
        </div>
      </div>

      <div className="card kpi">
        <div className="item">
          <div className="label">Full Kelly</div>
          <div className="value">{pct(Math.max(0, kelly.fullKellyFraction))}</div>
        </div>
        <div className="item">
          <div className="label">Applied fraction</div>
          <div className="value">{pct(kelly.appliedFraction)}</div>
        </div>
        <div className="item">
          <div className="label">Recommended stake</div>
          <div className="value">{fmt(kelly.recommendedStake)}</div>
        </div>
        <div className="item">
          <div className="label">EV per bet</div>
          <div className="value">{fmt(kelly.expectedValuePerBet)}</div>
        </div>
        <div className="item">
          <div className="label">Median final bankroll</div>
          <div className="value">{fmt(sim.median[sim.median.length - 1] ?? 0)}</div>
        </div>
        <div className="item">
          <div className="label">P10 final</div>
          <div className="value">{fmt(sim.p10[sim.p10.length - 1] ?? 0)}</div>
        </div>
        <div className="item">
          <div className="label">P90 final</div>
          <div className="value">{fmt(sim.p90[sim.p90.length - 1] ?? 0)}</div>
        </div>
        <div className="item">
          <div className="label">Bust probability</div>
          <div className="value">{pct(sim.bustProbability)}</div>
        </div>
      </div>

      <div className="card">
        <h2>Bankroll growth, P10 to P90 band, median trace, dashed line is starting bankroll</h2>
        <SimChart median={sim.median} p10={sim.p10} p90={sim.p90} bankroll={bankroll} />
      </div>

      <div className="card">
        <h2>How this works</h2>
        <p className="muted">
          Kelly fraction f equals (b times p minus q) divided by b, where b equals decimalOdds
          minus 1, p is win probability, q is 1 minus p. Edge percent is converted to p via p
          equals (1 plus edgePct over 100) divided by decimalOdds. The simulator stakes a constant
          fraction of the running bankroll on every bet. Each bet wins with probability p and pays
          out b times the stake; otherwise the stake is lost. American odds of {american} convert
          to decimal odds {decimalOdds.toFixed(3)} which round trip back to{" "}
          {decimalToAmerican(decimalOdds)}.
        </p>
      </div>

      <div className="disclaimer">
        Educational analytics only. The Kelly criterion assumes you actually have the edge you
        type into the form. In practice bettors over estimate edge, fail to account for line
        movement, and pay vig on losses. Use a small fractional Kelly. This repo is not investment
        or wagering advice.
      </div>
    </main>
  );
}
