/**
 * Tests for src/data/fetcher.js — pure URL detection + mocked fetch layer.
 *
 * Functions tested
 * ----------------
 * detectTickerFromURL (5) — Yahoo Finance, MarketWatch, Google Finance, null, dashed ticker
 * fetchAllTimeframes  (9) — ticker field, prices length, currentPrice, returns length,
 *                           timestamps in ms, HTTP error, insufficient data,
 *                           null intraday, result fields shape
 *
 * Total: 14 tests, 2 describe blocks.
 */

import { fetchAllTimeframes, detectTickerFromURL } from '../../src/data/fetcher.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makePrices(n, start = 100) {
  return Array.from({ length: n }, (_, i) => +(start + i * 0.5).toFixed(4));
}

function yahooPayload(prices) {
  const timestamps = Array.from(
    { length: prices.length },
    (_, i) => 1_700_000_000 + i * 3_600,
  );
  return {
    chart: {
      result: [{
        timestamp: timestamps,
        indicators: {
          quote: [{
            open:   prices.map(p => (p != null ? +(p * 0.999).toFixed(4) : null)),
            high:   prices.map(p => (p != null ? +(p * 1.001).toFixed(4) : null)),
            low:    prices.map(p => (p != null ? +(p * 0.998).toFixed(4) : null)),
            close:  prices,
            volume: prices.map(() => 1_000_000),
          }],
        },
      }],
    },
  };
}

function mockFetchOk(prices) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(yahooPayload(prices)),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// detectTickerFromURL — pure regex function, no network
// ─────────────────────────────────────────────────────────────────────────────

describe('detectTickerFromURL', () => {
  it('Yahoo Finance quote URL → uppercased ticker', () =>
    expect(detectTickerFromURL('https://finance.yahoo.com/quote/AAPL/')).toBe('AAPL'));

  it('MarketWatch stock URL → uppercased ticker', () =>
    expect(detectTickerFromURL('https://www.marketwatch.com/investing/stock/msft')).toBe('MSFT'));

  it('Google Finance URL with exchange suffix → ticker only', () =>
    expect(detectTickerFromURL('https://www.google.com/finance/quote/TSLA:NASDAQ')).toBe('TSLA'));

  it('unrecognised URL → null', () =>
    expect(detectTickerFromURL('https://example.com/foobar')).toBeNull());

  it('Yahoo Finance with dashed ticker (BRK-B)', () =>
    expect(detectTickerFromURL('https://finance.yahoo.com/quote/BRK-B/')).toBe('BRK-B'));
});

// ─────────────────────────────────────────────────────────────────────────────
// fetchAllTimeframes — async; global fetch mocked per-test
// ─────────────────────────────────────────────────────────────────────────────

describe('fetchAllTimeframes', () => {
  afterEach(() => jest.resetAllMocks());

  it('result.ticker equals the input ticker string', async () => {
    mockFetchOk(makePrices(20));
    const r = await fetchAllTimeframes('AAPL');
    expect(r.ticker).toBe('AAPL');
  });

  it('daily.prices length matches bar count', async () => {
    const prices = makePrices(20);
    mockFetchOk(prices);
    const r = await fetchAllTimeframes('AAPL');
    expect(r.daily.prices.length).toBe(20);
  });

  it('currentPrice equals last daily close', async () => {
    const prices = makePrices(20);
    mockFetchOk(prices);
    const r = await fetchAllTimeframes('AAPL');
    expect(r.currentPrice).toBeCloseTo(prices[prices.length - 1], 6);
  });

  it('daily.returns length = prices.length − 1', async () => {
    mockFetchOk(makePrices(20));
    const r = await fetchAllTimeframes('AAPL');
    expect(r.daily.returns.length).toBe(19);
  });

  it('daily.timestamps are in milliseconds (> 1e12)', async () => {
    mockFetchOk(makePrices(15));
    const r = await fetchAllTimeframes('AAPL');
    expect(r.daily.timestamps[0]).toBeGreaterThan(1e12);
  });

  it('throws when fetch returns non-OK status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    await expect(fetchAllTimeframes('INVALID')).rejects.toThrow('404');
  });

  it('throws when daily bar count < 10 (insufficient data)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(yahooPayload(makePrices(5))),
    });
    await expect(fetchAllTimeframes('SPARSE')).rejects.toThrow('Insufficient daily data');
  });

  it('hourly is null when intraday fetch returns HTTP error', async () => {
    let callCount = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++;
      // calls: daily(1) + weekly(2) + monthly(3) via Promise.all, then hourly(4) via allSettled
      if (callCount === 4) return Promise.resolve({ ok: false, status: 429 });
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(yahooPayload(makePrices(20))),
      });
    });
    const r = await fetchAllTimeframes('AAPL');
    expect(r.hourly).toBeNull();
    expect(r.daily).not.toBeNull();
  });

  it('result has all expected top-level and daily sub-fields', async () => {
    mockFetchOk(makePrices(20));
    const r = await fetchAllTimeframes('AAPL');
    ['ticker', 'daily', 'weekly', 'monthly', 'currentPrice'].forEach(k =>
      expect(r).toHaveProperty(k),
    );
    ['prices', 'returns', 'timestamps', 'opens', 'highs', 'lows', 'volumes'].forEach(k =>
      expect(r.daily).toHaveProperty(k),
    );
  });
});
