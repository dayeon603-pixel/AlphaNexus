import { computeRiskMetrics, rollingSharpe } from '../../src/engine/risk.js';
import { logReturns } from '../../src/engine/math.js';

describe('computeRiskMetrics — null cases', () => {
  it('empty returns → nObs=0, sharpe=0', () => {
    const m = computeRiskMetrics([], []);
    expect(m.nObs).toBe(0);
    expect(m.sharpe).toBe(0);
  });
  it('single-element returns → nullMetrics', () => {
    const m = computeRiskMetrics([0.01], [100, 101]);
    expect(m.nObs).toBe(0);
  });
});

describe('computeRiskMetrics — uptrend', () => {
  // Alternating log-returns (0.0003, 0.0008): strictly increasing so mdd=0,
  // all returns positive so winRate=1, and non-constant so annVol > 0.
  const prices = Array.from({ length: 101 }, (_, i) =>
    100 * Math.exp(Math.floor(i / 2) * 0.0011 + (i % 2 === 0 ? 0 : 0.0003)));
  const returns = logReturns(prices);
  const m = computeRiskMetrics(returns, prices);

  it('annRet > 0', () => expect(m.annRet).toBeGreaterThan(0));
  it('annVol > 0', () => expect(m.annVol).toBeGreaterThan(0));
  it('sharpe > 0', () => expect(m.sharpe).toBeGreaterThan(0));
  it('mdd = 0 for strictly increasing prices', () => expect(m.mdd).toBeCloseTo(0, 4));
  it('var99 <= var95', () => expect(m.var99).toBeLessThanOrEqual(m.var95 + 1e-9));
  it('cvar95 <= var95', () => expect(m.cvar95).toBeLessThanOrEqual(m.var95 + 1e-9));
  it('omega = 999 (no losing trades → Infinity → capped)', () => expect(m.omega).toBe(999));
  it('winRate = 1 (all positive returns)', () => expect(m.winRate).toBeCloseTo(1, 4));
  it('nObs = returns.length', () => expect(m.nObs).toBe(returns.length));
  it('drawdownSeries.length = prices.length', () =>
    expect(m.drawdownSeries.length).toBe(prices.length));
  it('annVolPct = annVol * 100 (rounded)', () =>
    expect(m.annVolPct).toBeCloseTo(m.annVol * 100, 2));
  it('mddPct = mdd * 100 (rounded)', () => expect(m.mddPct).toBeCloseTo(m.mdd * 100, 2));
});

describe('rollingSharpe', () => {
  it('output length = input length', () =>
    expect(rollingSharpe(new Array(50).fill(0.001), 10).length).toBe(50));
  it('first window − 1 elements are NaN', () => {
    const rs = rollingSharpe(new Array(50).fill(0.001), 10);
    for (let i = 0; i < 9; i++) expect(isNaN(rs[i])).toBe(true);
  });
  it('positive for sustained positive returns', () => {
    const rs = rollingSharpe(new Array(50).fill(0.005), 10);
    expect(rs[rs.length - 1]).toBeGreaterThan(0);
  });
  it('negative for sustained negative returns', () => {
    const rs = rollingSharpe(new Array(50).fill(-0.005), 10);
    expect(rs[rs.length - 1]).toBeLessThan(0);
  });
});
