/**
 * Signal construction module — PUBLIC SAFE VERSION.
 *
 * This file contains the interface definitions and mock implementations
 * for AlphaNexus signal generation. Proprietary signal logic, including
 * IC-weighting, calibration parameters, and ensemble construction, is
 * excluded from this public repository.
 *
 * All exported functions maintain the same signatures as the private
 * implementation so that the widget and UI remain functional with
 * demonstration data.
 */

import { mean, std, clamp, ema } from './math.js';

// ─────────────────────────────────────────────────────────────────────────────
// 1. TSMOM — Time-Series Momentum
//    Reference: Moskowitz, Ooi, Pedersen (2012)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number[]} returns - Daily log returns.
 * @param {object} opts
 * @returns {number[]} Signals in [-1, +1].
 */
export function tsmom(returns, opts = {}) {
  // Proprietary signal logic not included in public release.
  return new Array(returns.length).fill(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. OU Mean Reversion
//    Reference: Avellaneda & Lee (2010)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number[]} prices
 * @returns {{ kappa, mu, sigma, halfLife, mse }}
 */
export function fitOU(prices) {
  return { kappa: 0, mu: mean(prices), sigma: std(prices), halfLife: Infinity, mse: Infinity };
}

/**
 * @param {number[]} prices
 * @param {number} zWindow
 * @returns {{ signals, ouParams }}
 */
export function ouSignal(prices, zWindow = 60) {
  return {
    signals: new Array(prices.length).fill(0),
    ouParams: { mu: mean(prices), sigma: std(prices), halfLife: Infinity },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. VWAP Deviation Signal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number[]} closes
 * @param {number[]} highs
 * @param {number[]} lows
 * @param {number[]} volumes
 * @returns {number[]}
 */
export function vwapDeviationSignal(closes, highs, lows, volumes) {
  return new Array(closes.length).fill(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. RSI — standard Wilder RSI (public, well-known algorithm)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wilder RSI — this is a standard public algorithm, not proprietary.
 * @param {number[]} prices
 * @param {number} period
 * @returns {number[]}
 */
export function computeRSI(prices, period = 14) {
  const n = prices.length;
  if (n < period + 1) return new Array(n).fill(50);

  const gains = [], losses = [];
  for (let i = 1; i < n; i++) {
    const d = prices[i] - prices[i - 1];
    gains.push(Math.max(d, 0));
    losses.push(Math.max(-d, 0));
  }

  const rsi = new Array(n).fill(50);
  let avgGain = mean(gains.slice(0, period));
  let avgLoss = mean(losses.slice(0, period));
  rsi[period] = avgLoss < 1e-10 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  const k = 1 / period;
  for (let i = period; i < gains.length; i++) {
    avgGain = gains[i] * k + avgGain * (1 - k);
    avgLoss = losses[i] * k + avgLoss * (1 - k);
    rsi[i + 1] = avgLoss < 1e-10 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

/** Convert RSI to [-1, +1] signal. */
export function rsiSignal(rsiValues) {
  return rsiValues.map(() => 0); // Proprietary mapping excluded
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. IC-Weighted Ensemble — REDACTED
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number[]} signals
 * @param {number[]} returns
 * @param {number} window
 * @returns {{ ic, icir }}
 */
export function estimateIC(signals, returns, window = 60) {
  return { ic: 0, icir: 0, rollingIC: [] };
}

/**
 * @param {{ signal: number, ic: number }[]} signalICs
 * @returns {number}
 */
export function icWeightedComposite(signalICs) {
  // Proprietary ensemble logic not included.
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Kelly Fraction — REDACTED
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number[]} returns
 * @returns {{ fullKelly, halfKelly, annMu, annSigma2 }}
 */
export function kellyFraction(returns) {
  return { fullKelly: 0, halfKelly: 0, annMu: 0, annSigma2: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ATR — standard algorithm (public)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wilder ATR — standard public algorithm.
 * @param {number[]} highs
 * @param {number[]} lows
 * @param {number[]} closes
 * @param {number} period
 * @returns {number[]}
 */
export function trueATR(highs, lows, closes, period = 14) {
  const n = highs.length;
  const tr = highs.map((h, i) => {
    if (i === 0) return h - lows[i];
    return Math.max(h - lows[i], Math.abs(h - closes[i-1]), Math.abs(lows[i] - closes[i-1]));
  });
  const atr = [mean(tr.slice(0, period))];
  const k = 1 / period;
  for (let i = period; i < n; i++) {
    atr.push(tr[i] * k + atr[atr.length - 1] * (1 - k));
  }
  return atr;
}
