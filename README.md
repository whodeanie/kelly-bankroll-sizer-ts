# kelly-bankroll-sizer-ts

Polished Next.js + TypeScript reimplementation of the [kelly-criterion-bankroll-sizer](https://github.com/whodeanie/kelly-criterion-bankroll-sizer) static prototype. Pure client side. Deployable to Vercel free tier as a single static page.

> Educational analytics. Not investment or wagering advice.

## What it does

You enter a bankroll, an estimated edge percent, current American odds, and a Kelly fraction. The app shows the recommended stake and runs a deterministic Monte Carlo simulation of two hundred paths over one thousand bets, rendering the median bankroll trajectory and the P10 to P90 fan band live in a Recharts canvas. Every change to an input rebuilds the simulation in milliseconds.

## The technically interesting bits

1. **Kelly with edge expressed as percent.** Most users think in edge percent, not raw probability. The math is `f = (b * p - q) / b`, but `p` is derived from edge: `p = (1 + edgePct/100) / decimalOdds`. The Kelly module is pure functions, no DOM, no React. Every formula is unit tested.
2. **Deterministic Monte Carlo via Mulberry32.** Same inputs produce the exact same chart on every page load and across machines. Useful when you want to share a screenshot with a friend who is going to plug the same numbers in.
3. **Strict TypeScript end to end.** `noUncheckedIndexedAccess`, no `any`, types for every simulation field. The chart props are typed so a refactor in the math module will surface as a compile error in the chart.
4. **Recharts area band plus line.** The P10 to P90 fan is a Recharts `<Area>` with a tuple `[low, high]` data key. The median is a `<Line>` on the same `<ComposedChart>`. The starting bankroll is a dashed reference line.

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000
```

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## Deploy

Vercel free tier. Click new project, point at this repo, accept defaults. Or:

```bash
npm install -g vercel
vercel --prod
```

No environment variables, no backend, no API keys. Pure client side React.

## Project layout

```
src/
  app/
    layout.tsx
    page.tsx          form, KPIs, chart, disclaimer
    globals.css
  components/
    SimChart.tsx      Recharts ComposedChart (Area band plus median Line)
  lib/
    kelly.ts          pure Kelly math plus Monte Carlo simulator (Mulberry32)
tests/
  kelly.test.ts       Vitest suite
```

## License

MIT.
