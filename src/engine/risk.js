/**
 * Risk metrics module.
 *
 * Implements:
 *   - Sharpe ratio (annualised, excess return over risk-free rate)
 *   - Sortino ratio (downside deviation only)
 *   - Calmar ratio (annualised return / max drawdown)
 *   - Maximum drawdown (and drawdown series)
 *   - Historical VaR (Value at Risk) at 95% and 99%
 *   - CVaR / Expected Shortfall at 95% and 99%
 *   - Skewness and excess kurtosis (tail risk indicators)
 *   - Omega ratio (probability-weighted gain/loss ratio)
 *   - Annualised return and volatility
 *
 * Risk-free rate defaults to 5.25% annualised (approx Fed Funds as of 2025).
 */

import { mean, std, variance, percentile } from './math.js';

const DEFAULT_RF_ANNUAL = 0.0525;

/**
 * Compute all risk metrics from a log-return series and price series.
 *
 * @param {number[]} returns      - Log returns, length T.
 * @param {number[]} prices       - Price levels, length T+1.
 * @param {number}   [rf]         - Annualised risk-free rate.
 * @param {number}   [tradingDays] - Trading days per year (default 252).
 * @returns {RiskMetrics}
 */
export function computeRiskMetrics(returns, prices, rf = DEFAULT_RF_ANNUAL, tradingDays = 252) {
  if (!returns || returns.length < 2) return nullMetrics();

  const rfDaily = rf / tradingDays;
  const excess  = returns.map((r) => r - rfDaily);
  const sv      = Math.max(std(returns), 1e-12);

  // ── Sharpe ────────────────────────────────────────────────────────────────
  const sharpe = (mean(excess) / sv) * Math.sqrt(tradingDays);

  // ── Sortino ──────────────────────────────────────────────────────────────
  const downside = returns.filter((r) => r < rfDaily);
  const dv = downside.length > 1 ? Math.max(std(downside), 1e-12) : sv;
  const sortino = (mean(excess) / dv) * Math.sqrt(tradingDays);

  // ── Max Drawdown ──────────────────────────────────────────────────────────
  let peak = prices[0], mdd = 0;
  const drawdownSeries = [];
  for (const p of prices) {
    if (p > peak) peak = p;
    const dd = (peak - p) / Math.max(peak, 1e-10);
    mdd = Math.max(mdd, dd);
    drawdownSeries.push(-dd * 100); // negative % for display
  }

  // ── Annualised Return & Vol ───────────────────────────────────────────────
  const annRet = mean(returns) * tradingDays;
  const annVol = sv * Math.sqrt(tradingDays);

  // ── Calmar ────────────────────────────────────────────────────────────────
  const calmar = mdd > 0.001 ? annRet / mdd : 0;

  // ── Skewness & Excess Kurtosis ────────────────────────────────────────────
  const m = mean(returns);
  const skew = mean(returns.map((r) => ((r - m) / sv) ** 3));
  const kurt = mean(returns.map((r) => ((r - m) / sv) ** 4)) - 3;

  // ── VaR & CVaR (Historical Simulation) ───────────────────────────────────
  const sorted = [...returns].sort((a, b) => a - b);
  const var95 = percentile(sorted, 5);   // 5th percentile (losses are negative)
  const var99 = percentile(sorted, 1);
  const n95   = Math.max(1, Math.floor(returns.length * 0.05));
  const n99   = Math.max(1, Math.floor(returns.length * 0.01));
  const cvar95 = mean(sorted.slice(0, n95));
  const cvar99 = mean(sorted.slice(0, n99));

  // ── Omega Ratio (threshold = 0) ───────────────────────────────────────────
  const gains  = returns.filter((r) => r > 0).reduce((s, r) => s + r, 0);
  const losses = returns.filter((r) => r < 0).reduce((s, r) => s + Math.abs(r), 0);
  const omega  = losses > 1e-12 ? gains / losses : gains > 0 ? Infinity : 1;

  // ── Win Rate ──────────────────────────────────────────────────────────────
  const winRate = returns.filter((r) => r > 0).length / returns.length;

  return {
    sharpe:    +sharpe.toFixed(4),
    sortino:   +sortino.toFixed(4),
    calmar:    +calmar.toFixed(4),
    mdd:       +mdd.toFixed(6),
    mddPct:    +(mdd * 100).toFixed(2),
    annRet:    +annRet.toFixed(6),
    annRetPct: +(annRet * 100).toFixed(2),
    annVol:    +annVol.toFixed(6),
    annVolPct: +(annVol * 100).toFixed(2),
    skew:      +skew.toFixed(4),
    kurt:      +kurt.toFixed(4),
    var95:     +var95.toFixed(6),
    var99:     +var99.toFixed(6),
    cvar95:    +cvar95.toFixed(6),
    cvar99:    +cvar99.toFixed(6),
    var95Pct:  +(var95 * 100).toFixed(3),
    cvar95Pct: +(cvar95 * 100).toFixed(3),
    omega:     isFinite(omega) ? +omega.toFixed(4) : 999,
    winRate:   +winRate.toFixed(4),
    drawdownSeries,
    nObs:      returns.length,
  };
}

function nullMetrics() {
  return {
    sharpe: 0, sortino: 0, calmar: 0, mdd: 0, mddPct: 0,
    annRet: 0, annRetPct: 0, annVol: 0, annVolPct: 0,
    skew: 0, kurt: 0, var95: 0, var99: 0, cvar95: 0, cvar99: 0,
    var95Pct: 0, cvar95Pct: 0, omega: 1, winRate: 0.5, drawdownSeries: [], nObs: 0,
  };
}

/**
 * Compute rolling Sharpe ratio (useful for regime analysis).
 * @param {number[]} returns
 * @param {number}   window   - Rolling window in days.
 * @param {number}   [rf]     - Annualised risk-free rate.
 * @returns {number[]}
 */
export function rollingSharpe(returns, window = 60, rf = DEFAULT_RF_ANNUAL) {
  const rfD = rf / 252;
  const n = returns.length;
  const out = new Array(n).fill(NaN);
  for (let t = window; t <= n; t++) {
    const w = returns.slice(t - window, t);
    const m = mean(w) - rfD;
    const s = Math.max(std(w), 1e-12);
    out[t - 1] = (m / s) * Math.sqrt(252);
  }
  return out;
}
