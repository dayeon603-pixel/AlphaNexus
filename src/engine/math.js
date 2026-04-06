/**
 * Core mathematical utilities for quantitative finance.
 *
 * All functions operate on plain Float64Array or Array<number> for performance.
 * No external dependencies.
 */

/** Arithmetic mean. */
export const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

/** Population variance. */
export const variance = (a) => {
  const m = mean(a);
  return a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length;
};

/** Population standard deviation. */
export const std = (a) => Math.sqrt(Math.max(variance(a), 0));

/**
 * Log returns: r_t = ln(P_t / P_{t-1}).
 * Preferred for multi-period compounding and normality assumptions.
 */
export const logReturns = (prices) =>
  prices.slice(1).map((p, i) => Math.log(p / Math.max(prices[i], 1e-10)));

/**
 * Simple returns: r_t = (P_t - P_{t-1}) / P_{t-1}.
 * Used for single-period P&L attribution.
 */
export const simpleReturns = (prices) =>
  prices.slice(1).map((p, i) => (p - prices[i]) / Math.max(prices[i], 1e-10));

/**
 * Exponential moving average (EMA) with smoothing factor k = 2/(n+1).
 * Returns array same length as input.
 */
export const ema = (arr, n) => {
  const k = 2 / (n + 1);
  return arr.reduce((acc, v, i) => {
    acc.push(i === 0 ? v : v * k + acc[i - 1] * (1 - k));
    return acc;
  }, []);
};

/**
 * Standard normal CDF via Horner's method (Abramowitz & Stegun 26.2.17).
 * Max error < 7.5e-8.
 */
export const normCDF = (x) => {
  const a = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const xAbs = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * xAbs);
  const y = 1 - ((((a[4] * t + a[3]) * t + a[2]) * t + a[1]) * t + a[0]) * t * Math.exp(-xAbs * xAbs);
  return 0.5 * (1 + sign * y);
};

/** Standard normal PDF. */
export const normPDF = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

/** Clamp value to [lo, hi]. */
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Pearson correlation coefficient between two equal-length arrays.
 * Returns NaN if either has zero variance.
 */
export const correlation = (a, b) => {
  if (a.length !== b.length || a.length < 2) return NaN;
  const ma = mean(a), mb = mean(b);
  let num = 0, da2 = 0, db2 = 0;
  for (let i = 0; i < a.length; i++) {
    const da = a[i] - ma, db = b[i] - mb;
    num += da * db;
    da2 += da * da;
    db2 += db * db;
  }
  const denom = Math.sqrt(da2 * db2);
  return denom < 1e-14 ? NaN : num / denom;
};

/**
 * Percentile via linear interpolation (equivalent to numpy percentile).
 * @param {number[]} sorted - Pre-sorted ascending array.
 * @param {number} p - Percentile in [0, 100].
 */
export const percentile = (sorted, p) => {
  if (!sorted.length) return NaN;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
};

/**
 * Rolling window operation — applies fn to each window of size n.
 * Returns array of length (arr.length - n + 1).
 */
export const rolling = (arr, n, fn) =>
  arr.slice(n - 1).map((_, i) => fn(arr.slice(i, i + n)));

/**
 * Box-Muller transform — generates standard normal sample.
 * NOT suitable for seeded/reproducible use; use seededNormal for that.
 */
export const boxMuller = () => {
  let u, v;
  do { u = Math.random(); } while (u === 0);
  do { v = Math.random(); } while (v === 0);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/**
 * Seeded LCG pseudo-random number generator.
 * Returns a closure that yields uniform [0,1) on each call.
 */
export const seededRNG = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
};

/** Seeded Box-Muller normal from a seededRNG closure. */
export const seededNormal = (rng) => {
  let u, v;
  do { u = rng(); } while (u === 0);
  do { v = rng(); } while (v === 0);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/**
 * Compute realized variance from intraday returns (RV estimator).
 * RV_t = Σ_j r_{t,j}^2
 * Note: biased but consistent estimator; use for HAR-RV model.
 */
export const realizedVariance = (intradayReturns) =>
  intradayReturns.reduce((s, r) => s + r * r, 0);

/**
 * Soft-plus activation: log(1 + exp(x)).
 * Numerically stable for large |x|.
 */
export const softplus = (x) => x > 20 ? x : Math.log(1 + Math.exp(x));

/** Sigmoid: 1 / (1 + exp(-x)). */
export const sigmoid = (x) => 1 / (1 + Math.exp(-x));
