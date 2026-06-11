/**
 * Multi-timeframe forecasting engine — PUBLIC SAFE VERSION.
 *
 * The forecast structure (timeframes, output format, CI construction)
 * is included for reference. The proprietary components — signal
 * calibration, confidence mapping, IC-drift blending, and the specific
 * multi-timeframe combination logic — are replaced with mock output.
 *
 * The widget will display plausible-looking but non-predictive forecasts.
 */

import { mean, std, normCDF, clamp } from './math.js';
import { garchTermStructure } from './garch.js';
import { regimeForecast } from './hmm.js';
import {
  tsmom, ouSignal, vwapDeviationSignal, computeRSI,
  rsiSignal, estimateIC, icWeightedComposite,
} from './signals.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal: mock forecast builder
// ─────────────────────────────────────────────────────────────────────────────

function buildMockForecast(label, horizonDays, garch, hmm) {
  const ts = garchTermStructure(garch, horizonDays);
  const { bullProb } = regimeForecast(hmm, horizonDays);

  // Mock signal: slight bullish bias from regime probability
  const mockSignal = clamp((bullProb - 0.5) * 2, -1, 1);
  const direction = mockSignal > 0.1 ? 'BUY' : mockSignal < -0.1 ? 'SELL' : 'HOLD';

  // Use GARCH vol for CI construction (this part is standard, not proprietary)
  const sigma = ts.horizonVol;
  const mockDrift = hmm.regimeDrift * horizonDays;
  const predictedPct = (Math.exp(mockDrift) - 1) * 100;

  return {
    timeframe:    label,
    direction,
    predictedPct: +predictedPct.toFixed(3),
    ci68:         [+((Math.exp(mockDrift - sigma) - 1) * 100).toFixed(3),
                   +((Math.exp(mockDrift + sigma) - 1) * 100).toFixed(3)],
    ci95:         [+((Math.exp(mockDrift - 1.96 * sigma) - 1) * 100).toFixed(3),
                   +((Math.exp(mockDrift + 1.96 * sigma) - 1) * 100).toFixed(3)],
    confidence:   +(0.50 + Math.abs(mockSignal) * 0.15).toFixed(3), // mock: 50-65%
    signal:       +mockSignal.toFixed(4),
    horizonDays,
    horizonVol:   +(ts.horizonVol * 100).toFixed(3),
    annualizedVol:+(ts.annualizedVol * 100).toFixed(2),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// multiTimeframeForecast — PUBLIC ENTRY POINT
//
// Proprietary signal combination, IC-calibration, and confidence mapping
// are excluded. This version produces structurally valid but non-predictive
// mock forecasts using regime probability and GARCH vol.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} dailyData   - { prices, returns, highs, lows, closes, volumes }
 * @param {object} intradayData - optional { hourly, minute }
 * @param {object} garch       - fitted GARCH result
 * @param {object} hmm         - fitted HMM result
 * @returns {object[]}
 */
export function multiTimeframeForecast(dailyData, intradayData = {}, garch, hmm) {
  const results = [];

  // Intraday forecasts — mock if data available
  if (intradayData.minute?.prices?.length >= 30) {
    results.push(buildMockForecast('1 MIN', 5, garch, hmm));
  }
  if (intradayData.hourly?.prices?.length >= 20) {
    results.push(buildMockForecast('1 HOUR', 4, garch, hmm));
  }

  // Core forecasts
  results.push(buildMockForecast('1 DAY',   1,  garch, hmm));
  results.push(buildMockForecast('1 WEEK',  5,  garch, hmm));
  results.push(buildMockForecast('1 MONTH', 22, garch, hmm));

  return results;
}
