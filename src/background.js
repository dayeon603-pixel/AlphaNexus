/**
 * Background service worker — Chrome Extension Manifest v3.
 *
 * Responsibilities:
 *   1. Receive ANALYZE_TICKER messages from content scripts.
 *   2. Fetch OHLCV data from Yahoo Finance API (CORS-safe from SW).
 *   3. Run the full quant pipeline (GJR-GARCH, HMM, signals, forecast, risk).
 *   4. Return structured results to content script.
 *   5. Cache results in chrome.storage.session (5-min TTL) to avoid redundant API calls.
 *
 * Pipeline:
 *   fetchAllTimeframes → fitGJRGARCH (daily) → fitHMM (daily)
 *   → multiTimeframeForecast → computeRiskMetrics → respond
 */

import { fetchAllTimeframes } from './data/fetcher.js';
import { fitGJRGARCH } from './engine/garch.js';
import { fitHMM } from './engine/hmm.js';
import { multiTimeframeForecast } from './engine/forecast.js';
import { computeRiskMetrics } from './engine/risk.js';
import { computeRSI, trueATR } from './engine/signals.js';
import { mean, std } from './engine/math.js';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─────────────────────────────────────────────────────────────────────────────
// Cache helpers (chrome.storage.session — cleared on browser close)
// ─────────────────────────────────────────────────────────────────────────────
async function getCached(ticker) {
  try {
    const key = `alphaNexus_${ticker}`;
    const data = await chrome.storage.session.get(key);
    const entry = data[key];
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) return entry.result;
  } catch { /* storage not available in all contexts */ }
  return null;
}

async function setCache(ticker, result) {
  try {
    const key = `alphaNexus_${ticker}`;
    await chrome.storage.session.set({ [key]: { result, timestamp: Date.now() } });
  } catch { /* non-fatal */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Full quant pipeline
// ─────────────────────────────────────────────────────────────────────────────
async function runPipeline(ticker) {
  // 1. Fetch real market data
  const data = await fetchAllTimeframes(ticker);
  const { daily, hourly, minute, currentPrice } = data;

  if (daily.returns.length < 20) {
    throw new Error(`Not enough daily data for ${ticker}`);
  }

  // 2. Fit GJR-GARCH on daily log returns
  const garch = fitGJRGARCH(daily.returns, { maxIter: 400, lr: 5e-4 });

  // 3. Fit HMM on daily log returns
  const hmm = fitHMM(daily.returns, 30);

  // 4. Multi-timeframe forecasts
  const forecasts = multiTimeframeForecast(
    daily,
    { hourly: hourly || undefined, minute: minute || undefined },
    garch,
    hmm
  );

  // 5. Risk metrics (daily)
  const risk = computeRiskMetrics(daily.returns, daily.prices);

  // 6. Technical indicators for display
  const rsi = computeRSI(daily.prices);
  const currentRSI = rsi[rsi.length - 1] ?? 50;

  const atr = trueATR(daily.highs, daily.lows, daily.closes);
  const currentATR = atr[atr.length - 1] ?? 0;
  const atrPct = currentPrice > 0 ? (currentATR / currentPrice) * 100 : 0;

  // 7. Summary stats
  const garchVol = Math.sqrt(garch.condVar[garch.condVar.length - 1]) * Math.sqrt(252) * 100;
  const longRunVol = Math.sqrt(garch.longRunVar) * Math.sqrt(252) * 100;
  const persistence = garch.persistence;
  const leverageRatio = garch.leverageRatio;

  return {
    ticker,
    currentPrice,
    garch: {
      persistence: +persistence.toFixed(4),
      garchVolPct:   +garchVol.toFixed(2),
      longRunVolPct: +longRunVol.toFixed(2),
      leverageRatio: +leverageRatio.toFixed(3),
      alpha: +garch.alpha.toFixed(4),
      gamma: +garch.gamma.toFixed(4),
      beta:  +garch.beta.toFixed(4),
    },
    hmm: {
      regime:      hmm.currentState === 0 ? 'BULL' : 'BEAR',
      bullProb:    +hmm.bullProb.toFixed(3),
      regimeDrift: +(hmm.regimeDrift * 252 * 100).toFixed(2), // annualised %
    },
    risk,
    forecasts,
    indicators: {
      rsi: +currentRSI.toFixed(1),
      atrPct: +atrPct.toFixed(2),
    },
    dataQuality: {
      dailyBars:  daily.prices.length,
      hasHourly:  !!hourly,
      hasMinute:  !!minute,
    },
    computedAt: Date.now(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Message handler
// ─────────────────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== 'ANALYZE_TICKER') return;

  const { ticker, forceRefresh = false } = msg;

  (async () => {
    try {
      if (!forceRefresh) {
        const cached = await getCached(ticker);
        if (cached) {
          sendResponse({ ok: true, data: cached, cached: true });
          return;
        }
      }

      const result = await runPipeline(ticker);
      await setCache(ticker, result);
      sendResponse({ ok: true, data: result, cached: false });
    } catch (err) {
      sendResponse({ ok: false, error: err.message });
    }
  })();

  return true; // keep channel open for async response
});

// Alarm for periodic cache invalidation (optional; service worker may be suspended)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'clearCache') chrome.storage.session.clear();
});
chrome.alarms.create('clearCache', { periodInMinutes: 15 });
