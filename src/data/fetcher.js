/**
 * Yahoo Finance v8 Chart API — data fetcher.
 *
 * Uses the same public endpoints as yfinance (Python), accessible from
 * browser extensions with host_permissions for query1.finance.yahoo.com.
 *
 * API shape:
 *   GET https://query1.finance.yahoo.com/v8/finance/chart/{ticker}
 *       ?interval={interval}&range={range}
 *
 * Response: chart.result[0].indicators.quote[0].{open, high, low, close, volume}
 *           chart.result[0].timestamp  (Unix seconds)
 *
 * Timeframe configs:
 *   minute  → interval=1m,  range=5d     (~1950 bars, 5 trading days)
 *   hourly  → interval=1h,  range=60d    (~480 bars,  60 trading days)
 *   daily   → interval=1d,  range=2y     (~504 bars)
 *   weekly  → interval=1wk, range=5y     (~260 bars)
 *   monthly → interval=1mo, range=10y    (~120 bars)
 *
 * NOTE: This module runs in the background service worker, not the content script.
 * All fetches are proxied through the background to avoid CORS issues on the page.
 */

import { logReturns } from '../engine/math.js';

const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

const TIMEFRAME_CONFIGS = {
  minute:  { interval: '1m',  range: '5d'  },
  hourly:  { interval: '1h',  range: '60d' },
  daily:   { interval: '1d',  range: '2y'  },
  weekly:  { interval: '1wk', range: '5y'  },
  monthly: { interval: '1mo', range: '10y' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Fetch a single timeframe from Yahoo Finance v8 chart API
// ─────────────────────────────────────────────────────────────────────────────
async function fetchYahooChart(ticker, interval, range) {
  const url = `${BASE_URL}/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}&includePrePost=false&events=div%2Csplit`;
  const resp = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      // Yahoo Finance v8 does not require authentication for public tickers
    },
  });

  if (!resp.ok) throw new Error(`Yahoo Finance API ${resp.status} for ${ticker}`);
  const json = await resp.json();

  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No chart data returned for ${ticker}`);

  const timestamps = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0] ?? {};
  const { open = [], high = [], low = [], close = [], volume = [] } = quote;

  // Filter out null bars (Yahoo sometimes returns null for illiquid periods)
  const bars = timestamps.map((ts, i) => ({
    ts,
    open:   open[i],
    high:   high[i],
    low:    low[i],
    close:  close[i],
    volume: volume[i] ?? 0,
  })).filter((b) => b.close != null && b.close > 0);

  return bars;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse raw bars into engine-ready arrays
// ─────────────────────────────────────────────────────────────────────────────
function parseBars(bars) {
  const prices  = bars.map((b) => b.close);
  const opens   = bars.map((b) => b.open  ?? b.close);
  const highs   = bars.map((b) => b.high  ?? b.close);
  const lows    = bars.map((b) => b.low   ?? b.close);
  const closes  = prices;
  const volumes = bars.map((b) => b.volume);
  const timestamps = bars.map((b) => b.ts * 1000); // ms

  const returns = logReturns(prices);

  return { prices, opens, highs, lows, closes, volumes, returns, timestamps };
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchAllTimeframes — main entry point
//
// Returns:
//   {
//     ticker,
//     daily:   { prices, returns, highs, lows, closes, volumes, timestamps },
//     weekly:  { ... },
//     monthly: { ... },
//     hourly:  { ... } | null,   // null if fetch fails
//     minute:  { ... } | null,   // null if fetch fails
//     currentPrice: number,
//     meta: { longName, regularMarketPrice, ... }
//   }
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAllTimeframes(ticker) {
  // Fetch daily first — required for core models
  const [dailyBars, weeklyBars, monthlyBars] = await Promise.all([
    fetchYahooChart(ticker, TIMEFRAME_CONFIGS.daily.interval,   TIMEFRAME_CONFIGS.daily.range),
    fetchYahooChart(ticker, TIMEFRAME_CONFIGS.weekly.interval,  TIMEFRAME_CONFIGS.weekly.range),
    fetchYahooChart(ticker, TIMEFRAME_CONFIGS.monthly.interval, TIMEFRAME_CONFIGS.monthly.range),
  ]);

  if (dailyBars.length < 10) throw new Error(`Insufficient daily data for ${ticker} (${dailyBars.length} bars)`);

  // Intraday data — best-effort; failure is non-fatal
  const [hourlyBars, minuteBars] = await Promise.allSettled([
    fetchYahooChart(ticker, TIMEFRAME_CONFIGS.hourly.interval, TIMEFRAME_CONFIGS.hourly.range),
    fetchYahooChart(ticker, TIMEFRAME_CONFIGS.minute.interval, TIMEFRAME_CONFIGS.minute.range),
  ]).then((results) => results.map((r) => (r.status === 'fulfilled' ? r.value : null)));

  const daily   = parseBars(dailyBars);
  const weekly  = parseBars(weeklyBars);
  const monthly = parseBars(monthlyBars);
  const hourly  = hourlyBars  ? parseBars(hourlyBars)  : null;
  const minute  = minuteBars  ? parseBars(minuteBars)  : null;

  const currentPrice = daily.prices[daily.prices.length - 1];

  return { ticker, daily, weekly, monthly, hourly, minute, currentPrice };
}

// ─────────────────────────────────────────────────────────────────────────────
// Detect ticker from the current page URL (called in content script)
// ─────────────────────────────────────────────────────────────────────────────
export function detectTickerFromURL(url) {
  // Yahoo Finance: https://finance.yahoo.com/quote/AAPL/
  let m = url.match(/finance\.yahoo\.com\/quote\/([A-Z0-9.^-]+)/i);
  if (m) return m[1].toUpperCase();

  // MarketWatch: https://www.marketwatch.com/investing/stock/aapl
  m = url.match(/marketwatch\.com\/investing\/(?:stock|fund|etf)\/([a-z0-9.-]+)/i);
  if (m) return m[1].toUpperCase();

  // Google Finance: https://www.google.com/finance/quote/AAPL:NASDAQ
  m = url.match(/google\.com\/finance\/quote\/([A-Z0-9.^-]+)(?::|\/|$)/i);
  if (m) return m[1].toUpperCase();

  return null;
}
