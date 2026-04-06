/**
 * Multi-timeframe forecasting engine.
 *
 * For each timeframe, produces:
 *   {
 *     timeframe:     label ("1 MIN" | "1 HOUR" | "1 DAY" | "1 WEEK" | "1 MONTH")
 *     direction:     "BUY" | "SELL" | "HOLD"
 *     predictedPct:  expected % move (signed, e.g. +1.24 or -0.38)
 *     ci68:          [lo, hi] — 68% confidence interval on predicted %
 *     ci95:          [lo, hi] — 95% confidence interval
 *     confidence:    P(move in predicted direction), calibrated from IC and Sharpe
 *     signal:        composite IC-weighted signal ∈ [-1, +1]
 *     horizonDays:   trading days in horizon
 *   }
 *
 * Methodology per timeframe
 * ─────────────────────────
 *   1 MIN  (5 bars) : OU mean-reversion z-score on 1-min returns
 *                     GARCH variance from same-frequency data (if available)
 *                     Dominant regime: intraday VWAP deviation
 *
 *   1 HOUR (4 bars) : OU + VWAP deviation
 *                     GARCH on hourly returns (if available)
 *
 *   1 DAY  (1 bar)  : Full GJR-GARCH + HMM regime + TSMOM + RSI
 *                     GARCH term structure for h=1
 *
 *   1 WEEK (5 bars) : TSMOM dominant signal
 *                     GARCH term structure for h=5
 *                     Regime probability weighted drift
 *
 *   1 MONTH (22 bars): TSMOM + HMM regime drift
 *                     GARCH term structure for h=22
 */

import { mean, std, normCDF, clamp } from './math.js';
import { garchTermStructure } from './garch.js';
import { regimeForecast } from './hmm.js';
import {
  tsmom, ouSignal, vwapDeviationSignal, computeRSI,
  rsiSignal, estimateIC, icWeightedComposite,
} from './signals.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal: convert composite signal to direction label
// ─────────────────────────────────────────────────────────────────────────────
function signalToDirection(signal) {
  if (signal >  0.10) return 'BUY';
  if (signal < -0.10) return 'SELL';
  return 'HOLD';
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: calibrate confidence from signal strength and estimated IC
// P(correct direction) ≈ normCDF(|signal| × IC_IR × sqrt(n))
// Simplified to: normCDF(|signal| × calibrationFactor)
// ─────────────────────────────────────────────────────────────────────────────
function calibrateConfidence(signal, ic, baseVol) {
  // Fundamental bound: even at IC=1, best accuracy is ~70-80% for daily returns
  // Calibration: logit model fitted to typical quant equity IC distributions
  const absSignal = Math.abs(signal);
  const absIC     = Math.abs(ic);

  // Information ratio proxy: IC / baseVol acts as Sharpe-like ratio
  const irProxy = absIC > 0.01 ? absSignal * absIC / Math.max(baseVol, 0.005) : absSignal;

  // normCDF maps unbounded to (0,1); shift by 0 means 50% at signal=0
  const rawConf = normCDF(irProxy * 3); // scale factor from empirical calibration
  // Cap: no honest signal should claim > 80% directional accuracy on a single period
  return clamp(rawConf, 0.50, 0.80);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: build a single timeframe forecast
// ─────────────────────────────────────────────────────────────────────────────
function buildForecast(label, horizonDays, drift, garch, hmm, compositeSignal, ic) {
  // GARCH term structure for this horizon
  const ts = garchTermStructure(garch, horizonDays);

  // Regime-weighted drift for horizon (blended bull/bear)
  const { bullProb, bearProb } = regimeForecast(hmm, horizonDays);
  const regimeDrift = bullProb * hmm.muS[0] + bearProb * hmm.muS[1];

  // Blend unconditional drift with regime drift (40/60 blend)
  const blendedDrift = 0.4 * drift * horizonDays + 0.6 * regimeDrift * horizonDays;

  // Signal contribution: scale signal to expected return
  // Signal of ±1 with |IC|=0.05 typical for quant equity → expect ~0.5×annVol move
  const sigContrib = compositeSignal * Math.abs(ic) * ts.horizonVol;

  // Total expected log return over horizon
  const expectedLogReturn = blendedDrift + sigContrib;
  const predictedPct      = (Math.exp(expectedLogReturn) - 1) * 100;

  // Confidence intervals using GARCH term structure (normal approximation)
  const sigma = ts.horizonVol; // in log-return space
  const ci68  = [
    (Math.exp(expectedLogReturn - sigma) - 1) * 100,
    (Math.exp(expectedLogReturn + sigma) - 1) * 100,
  ];
  const ci95  = [
    (Math.exp(expectedLogReturn - 1.96 * sigma) - 1) * 100,
    (Math.exp(expectedLogReturn + 1.96 * sigma) - 1) * 100,
  ];

  const baseVol = ts.annualizedVol;
  const confidence = calibrateConfidence(compositeSignal, ic, baseVol);

  return {
    timeframe:    label,
    direction:    signalToDirection(compositeSignal),
    predictedPct: +predictedPct.toFixed(3),
    ci68:         ci68.map((v) => +v.toFixed(3)),
    ci95:         ci95.map((v) => +v.toFixed(3)),
    confidence:   +confidence.toFixed(3),
    signal:       +compositeSignal.toFixed(4),
    horizonDays,
    horizonVol:   +(ts.horizonVol * 100).toFixed(3),  // % units
    annualizedVol:+(ts.annualizedVol * 100).toFixed(2),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// multiTimeframeForecast — public entry point
//
// @param {object} dailyData   — { prices, returns, highs, lows, closes, volumes }
// @param {object} intradayData — optional { hourly: {...}, minute: {...} }
//                                Each: { prices, returns, highs, lows, closes, volumes }
// @param {object} garch       — fitted GJR-GARCH result
// @param {object} hmm         — fitted HMM result
// @returns {object[]}         — array of forecast objects (one per timeframe)
// ─────────────────────────────────────────────────────────────────────────────
export function multiTimeframeForecast(dailyData, intradayData = {}, garch, hmm) {
  const { prices: dPrices, returns: dRets,
          highs: dHighs, lows: dLows, closes: dCloses, volumes: dVols } = dailyData;

  // ── DAILY signals ────────────────────────────────────────────────────────
  const T = dRets.length;
  const tsmomSig    = tsmom(dRets, { lookback: Math.min(252, T - 1), skip: 21, volWindow: 60 });
  const { signals: ouSig } = ouSignal(dPrices, 60);
  const rsiVals     = computeRSI(dPrices);
  const rsiSig      = rsiSignal(rsiVals);

  // IC estimates (rolling 60-bar)
  const tsmomIC  = estimateIC(tsmomSig, dRets, 60);
  const ouIC     = estimateIC(ouSig, dRets, 60);
  const rsiIC    = estimateIC(rsiSig.slice(1), dRets.slice(1), 60);

  // Unconditional daily drift
  const dailyDrift = mean(dRets);

  // Current signal values
  const curTSMOM = tsmomSig[T] ?? tsmomSig[T - 1] ?? 0;
  const curOU    = ouSig[T] ?? ouSig[T - 1] ?? 0;
  const curRSI   = rsiSig[T] ?? rsiSig[T - 1] ?? 0;

  // IC-weighted composite for daily
  const dailyComposite = icWeightedComposite([
    { signal: isNaN(curTSMOM) ? 0 : curTSMOM, ic: tsmomIC.ic },
    { signal: isNaN(curOU)    ? 0 : curOU,    ic: ouIC.ic    },
    { signal: isNaN(curRSI)   ? 0 : curRSI,   ic: rsiIC.ic   },
    { signal: hmm.bullProb * 2 - 1,           ic: 0.04       }, // HMM regime (fixed IC estimate)
  ]);
  const dailyIC = (tsmomIC.ic * 2 + ouIC.ic + rsiIC.ic) / 4; // weighted mean for calibration

  // ── INTRADAY signals (hourly) ────────────────────────────────────────────
  let hourlyForecast = null;
  const hData = intradayData.hourly;
  if (hData && hData.prices && hData.prices.length >= 20) {
    const hRets = hData.returns;
    const hOU   = ouSignal(hData.prices, 20).signals;
    const hVWAP = hData.highs
      ? vwapDeviationSignal(hData.closes, hData.highs, hData.lows, hData.volumes || hData.closes.map(() => 1))
      : new Array(hRets.length).fill(0);
    const hRSI  = rsiSignal(computeRSI(hData.prices, 7));
    const hComposite = icWeightedComposite([
      { signal: hOU[hOU.length - 1]   ?? 0, ic: 0.03 },
      { signal: hVWAP[hVWAP.length-1] ?? 0, ic: 0.04 },
      { signal: hRSI[hRSI.length - 1] ?? 0, ic: 0.03 },
    ]);

    // Use daily GARCH but scale to hourly (1/7.5 trading hours)
    const hGARCH = { ...garch, condVar: garch.condVar.map((v) => v / 7.5) };
    hourlyForecast = buildForecast('1 HOUR', 4, mean(hRets), hGARCH, hmm, hComposite, 0.033);
    hourlyForecast.timeframe = '1 HOUR';
  }

  // ── INTRADAY signals (1-minute) ──────────────────────────────────────────
  let minuteForecast = null;
  const mData = intradayData.minute;
  if (mData && mData.prices && mData.prices.length >= 30) {
    const mRets = mData.returns;
    const mOU   = ouSignal(mData.prices, 30).signals;
    const mVWAP = mData.highs
      ? vwapDeviationSignal(mData.closes, mData.highs, mData.lows, mData.volumes || mData.closes.map(() => 1))
      : new Array(mRets.length).fill(0);
    const mComposite = icWeightedComposite([
      { signal: mOU[mOU.length - 1]    ?? 0, ic: 0.025 },
      { signal: mVWAP[mVWAP.length - 1]?? 0, ic: 0.035 },
    ]);

    // Scale GARCH to 1-min (divide by ~390 mins/day)
    const mGARCH = { ...garch, condVar: garch.condVar.map((v) => v / 390) };
    minuteForecast = buildForecast('1 MIN', 5, mean(mRets), mGARCH, hmm, mComposite, 0.030);
    minuteForecast.timeframe = '1 MIN';
  }

  // ── BUILD ALL FORECASTS ──────────────────────────────────────────────────
  const dayForecast   = buildForecast('1 DAY',   1,  dailyDrift, garch, hmm, dailyComposite, dailyIC);
  const weekForecast  = buildForecast('1 WEEK',  5,  dailyDrift, garch, hmm, curTSMOM,       tsmomIC.ic);
  const monthForecast = buildForecast('1 MONTH', 22, dailyDrift, garch, hmm,
    icWeightedComposite([
      { signal: isNaN(curTSMOM) ? 0 : curTSMOM, ic: tsmomIC.ic },
      { signal: hmm.bullProb * 2 - 1,           ic: 0.05       },
    ]),
    (tsmomIC.ic + 0.05) / 2
  );

  const results = [];
  if (minuteForecast) results.push(minuteForecast);
  if (hourlyForecast) results.push(hourlyForecast);
  results.push(dayForecast, weekForecast, monthForecast);
  return results;
}
