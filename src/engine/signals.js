/**
 * Quantitative signal construction.
 *
 * Signals implemented:
 *
 *   1. TSMOM — Time-Series Momentum (Moskowitz, Ooi & Pedersen, 2012)
 *      Signal = sign(r_{t-12m, t-1m}) × (target_vol / σ_t)
 *      Scaled to unit volatility contribution.
 *
 *   2. OU Mean Reversion — Ornstein-Uhlenbeck process (Avellaneda & Lee, 2010)
 *      Estimate reversion speed κ and equilibrium μ from:
 *        ΔX_t = a + b·X_{t-1} + ε_t  (OLS)
 *      Half-life = ln(2)/|b|
 *      Signal = −(X_t − μ) / σ_X  (z-score, sign-flipped for mean reversion)
 *
 *   3. Carry Proxy — short-term excess return over trailing realised vol
 *      (approximates implied-minus-realised vol carry for equities)
 *
 *   4. IC-Weighted Ensemble
 *      weight_k = IC_k / Σ_j |IC_j|
 *      composite = Σ_k weight_k × signal_k(t)
 *      IC_k = rolling correlation between signal_k and next-period return.
 *
 *   5. Volatility-Scaled Kelly Fraction
 *      f* = μ / σ² (full Kelly for log-normal)
 *      f_half = 0.5 × f* (half-Kelly — standard institutional cap)
 *
 * All signals are normalised to [−1, +1] before combination.
 */

import { mean, std, variance, correlation, rolling, clamp, ema } from './math.js';

// ─────────────────────────────────────────────────────────────────────────────
// 1. TSMOM — Time-Series Momentum
//    Reference: Moskowitz, Ooi, Pedersen (2012) "Time Series Momentum"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute TSMOM signal for each time step.
 *
 * @param {number[]} returns      - Daily log returns, length T.
 * @param {object}   opts
 * @param {number}   opts.lookback   - Momentum lookback window (days). Default 252.
 * @param {number}   opts.skip       - Skip last N days before lookback. Default 21.
 * @param {number}   opts.volWindow  - Realised vol window. Default 60.
 * @param {number}   opts.targetVol  - Annualised target vol. Default 0.40.
 * @returns {number[]} TSMOM signals in [-1, +1], aligned to returns.
 */
export function tsmom(returns, {
  lookback = 252,
  skip = 21,
  volWindow = 60,
  targetVol = 0.40,
} = {}) {
  const T = returns.length;
  const signals = new Array(T).fill(NaN);

  for (let t = lookback; t < T; t++) {
    // Momentum return: r_{t-lookback, t-skip}
    const window = returns.slice(t - lookback, t - skip);
    if (window.length < 5) continue;
    const r_mom = window.reduce((s, v) => s + v, 0); // cumulative log return

    // Realised daily vol over volWindow
    const volWin = returns.slice(Math.max(0, t - volWindow), t);
    const dailyVol = Math.max(std(volWin), 1e-5);
    const annVol = dailyVol * Math.sqrt(252);

    // Vol-scaled signal: direction × (target / realised) capped at ±2
    const raw = Math.sign(r_mom) * Math.min(targetVol / annVol, 2);
    signals[t] = clamp(raw, -1, 1);
  }
  return signals;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. OU Mean Reversion (Ornstein-Uhlenbeck)
//    Reference: Avellaneda & Lee (2010) "Statistical arbitrage in the US equities market"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fit OU process parameters from a price series.
 * Solves: ΔX_t = a + b·X_{t-1} + ε_t  (OLS)
 *
 * @param {number[]} prices - Price series.
 * @returns {{ kappa, mu, sigma, halfLife, mse }}
 */
export function fitOU(prices) {
  if (prices.length < 10) return { kappa: 0, mu: mean(prices), sigma: std(prices), halfLife: Infinity, mse: Infinity };

  const n = prices.length;
  const X  = prices.slice(0, n - 1);   // X_{t-1}
  const dX = prices.slice(1).map((p, i) => p - X[i]); // ΔX_t

  // OLS: dX = a + b·X
  const mX  = mean(X), mdX = mean(dX);
  let sXX = 0, sXdX = 0;
  for (let i = 0; i < X.length; i++) {
    sXX  += (X[i] - mX) ** 2;
    sXdX += (X[i] - mX) * (dX[i] - mdX);
  }
  if (sXX < 1e-14) return { kappa: 0, mu: mX, sigma: std(prices), halfLife: Infinity, mse: Infinity };

  const b = sXdX / sXX;          // b = -κ·Δt  (Δt = 1 day)
  const a = mdX - b * mX;        // a = κ·μ·Δt
  const kappa  = Math.max(-b, 0); // reversion speed (per day)
  const mu     = kappa > 1e-8 ? a / kappa : mX;

  // Residual std
  const resid = dX.map((d, i) => d - a - b * X[i]);
  const sigma  = std(resid);      // daily noise
  const halfLife = kappa > 1e-8 ? Math.log(2) / kappa : Infinity;
  const mse    = mean(resid.map((r) => r ** 2));

  return { kappa, mu, sigma, halfLife, mse };
}

/**
 * OU mean-reversion z-score signal.
 * Positive when price is below equilibrium (expect reversion up).
 *
 * @param {number[]} prices
 * @param {number}   zWindow  - Rolling window for z-score normalisation.
 * @returns {{ signals, ouParams }}
 */
export function ouSignal(prices, zWindow = 60) {
  const { mu, sigma, halfLife } = fitOU(prices);
  const T = prices.length;

  const signals = new Array(T).fill(NaN);
  for (let t = zWindow; t < T; t++) {
    const win = prices.slice(t - zWindow, t);
    const m = mean(win), s = Math.max(std(win), 1e-8);
    const z = (prices[t] - m) / s;     // current z-score
    // Reversion signal: buy when price is low (z < 0), sell when high (z > 0)
    signals[t] = clamp(-z / 2, -1, 1); // divide by 2 to keep in [-1,1] for ±2σ
  }

  return { signals, ouParams: { mu, sigma, halfLife } };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Intraday VWAP Deviation Signal (for short timeframes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * VWAP-deviation signal: (price − VWAP) / ATR.
 * Negative when price is below VWAP (mean-reversion buy signal intraday).
 *
 * @param {number[]} closes   - Close prices for the session.
 * @param {number[]} highs    - High prices.
 * @param {number[]} lows     - Low prices.
 * @param {number[]} volumes  - Volume.
 * @returns {number[]} Normalised signals.
 */
export function vwapDeviationSignal(closes, highs, lows, volumes) {
  const T = closes.length;
  const typicalPrices = closes.map((c, i) => (c + highs[i] + lows[i]) / 3);
  const cumPV = typicalPrices.reduce((acc, tp, i) => {
    acc.push((acc[i - 1] || 0) + tp * (volumes[i] || 1));
    return acc;
  }, []);
  const cumV = volumes.reduce((acc, v, i) => {
    acc.push((acc[i - 1] || 0) + Math.max(v, 1));
    return acc;
  }, []);
  const vwap = cumPV.map((pv, i) => pv / cumV[i]);

  // True Range for ATR
  const tr = closes.map((c, i) => {
    if (i === 0) return highs[i] - lows[i];
    return Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1]));
  });
  const atrArr = ema(tr, 14);

  return closes.map((c, i) => {
    const atr = Math.max(atrArr[i], 1e-8);
    const dev = (c - vwap[i]) / (vwap[i] * Math.max(atr / c, 1e-6));
    return clamp(-dev, -1, 1); // mean-reversion: negative dev → buy
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. RSI Signal (classic Wilder RSI)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wilder RSI using exponential smoothing (not simple average).
 * @param {number[]} prices
 * @param {number}   period
 * @returns {number[]} RSI values [0, 100], same length as prices.
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
  // Initial SMA
  let avgGain = mean(gains.slice(0, period));
  let avgLoss = mean(losses.slice(0, period));
  rsi[period] = avgLoss < 1e-10 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  // Wilder smoothing
  const k = 1 / period;
  for (let i = period; i < gains.length; i++) {
    avgGain = gains[i] * k + avgGain * (1 - k);
    avgLoss = losses[i] * k + avgLoss * (1 - k);
    rsi[i + 1] = avgLoss < 1e-10 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

/** Convert RSI to a [-1, +1] signal. Buy oversold (< 30), sell overbought (> 70). */
export function rsiSignal(rsiValues) {
  return rsiValues.map((r) => {
    if (r <= 20) return 1.0;
    if (r <= 30) return 0.5 + (30 - r) / 20;
    if (r >= 80) return -1.0;
    if (r >= 70) return -0.5 - (r - 70) / 20;
    return (50 - r) / 50; // linear between 30 and 70
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. IC-Weighted Signal Ensemble
//    IC_k = rolling correlation(signal_k(t), return(t+1))
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estimate historical Information Coefficient for a single signal.
 *
 * @param {number[]} signals  - Signal time series (aligned with returns).
 * @param {number[]} returns  - Next-period returns.
 * @param {number}   window   - Rolling window for IC estimation.
 * @returns {{ ic, icir }}    - Mean IC and IC Information Ratio.
 */
export function estimateIC(signals, returns, window = 60) {
  const n = Math.min(signals.length, returns.length) - 1;
  const rollingIC = [];

  for (let t = window; t <= n; t++) {
    const s = signals.slice(t - window, t);
    const r = returns.slice(t - window + 1, t + 1); // next-period returns
    const validPairs = s
      .map((sv, i) => [sv, r[i]])
      .filter(([sv, rv]) => !isNaN(sv) && !isNaN(rv));
    if (validPairs.length < 5) continue;
    const ic = correlation(validPairs.map((p) => p[0]), validPairs.map((p) => p[1]));
    if (!isNaN(ic)) rollingIC.push(ic);
  }

  if (!rollingIC.length) return { ic: 0, icir: 0, rollingIC: [] };
  const icMean = mean(rollingIC);
  const icStd  = Math.max(std(rollingIC), 1e-8);
  return { ic: icMean, icir: icMean / icStd * Math.sqrt(rollingIC.length), rollingIC };
}

/**
 * Combine signals using IC-proportional weights.
 *
 * @param {{ signal: number, ic: number }[]} signalICs - Signal values + IC estimates.
 * @returns {number} Composite signal in [-1, +1].
 */
export function icWeightedComposite(signalICs) {
  const totalAbsIC = signalICs.reduce((s, { ic }) => s + Math.abs(ic), 0);
  if (totalAbsIC < 1e-8) {
    // Fallback: equal weights
    const avg = mean(signalICs.map(({ signal }) => signal).filter((v) => !isNaN(v)));
    return clamp(avg || 0, -1, 1);
  }
  const composite = signalICs.reduce((s, { signal, ic }) => {
    if (isNaN(signal)) return s;
    return s + (Math.abs(ic) / totalAbsIC) * signal * Math.sign(ic);
  }, 0);
  return clamp(composite, -1, 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Half-Kelly Position Sizing
//    f* = μ / σ² (log-normal full Kelly)
//    f_half = 0.5 × f*  (institutional standard — limits ruin probability)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number[]} returns  - Historical log returns.
 * @returns {{ fullKelly, halfKelly, annMu, annSigma2 }}
 */
export function kellyFraction(returns) {
  if (returns.length < 2) return { fullKelly: 0, halfKelly: 0, annMu: 0, annSigma2: 0 };
  const annMu     = mean(returns) * 252;
  const annSigma2 = Math.max(variance(returns) * 252, 1e-8);
  const fullKelly = annMu / annSigma2;
  return {
    fullKelly: clamp(fullKelly, -3, 3),
    halfKelly: clamp(fullKelly * 0.5, -1.5, 1.5),
    annMu,
    annSigma2,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. True ATR (OHLCV — not close-to-close)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wilder ATR using high/low/close. Requires aligned OHLCV arrays.
 * @param {number[]} highs
 * @param {number[]} lows
 * @param {number[]} closes
 * @param {number}   period
 * @returns {number[]} ATR values.
 */
export function trueATR(highs, lows, closes, period = 14) {
  const n = highs.length;
  const tr = highs.map((h, i) => {
    if (i === 0) return h - lows[i];
    return Math.max(h - lows[i], Math.abs(h - closes[i-1]), Math.abs(lows[i] - closes[i-1]));
  });
  // Wilder smoothing (same as RSI)
  const atr = [mean(tr.slice(0, period))];
  const k = 1 / period;
  for (let i = period; i < n; i++) {
    atr.push(tr[i] * k + atr[atr.length - 1] * (1 - k));
  }
  return atr;
}
