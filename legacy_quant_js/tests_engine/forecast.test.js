import { multiTimeframeForecast } from '../../src/engine/forecast.js';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const mockGarch = {
  condVar: [0.0001],
  longRunVar: 0.0002,
  persistence: 0.95,
  omega: 0.0000015,
  alpha: 0.06,
  gamma: 0.08,
  beta: 0.88,
};

const mockHmmBull = {
  currentState: 0,
  bullProb: 0.75,           // strong bull regime
  regimeDrift: 0.0004,      // +ve drift
  regimeVol: 0.01,
  A: [[0.9, 0.1], [0.2, 0.8]],
};

const mockHmmBear = {
  currentState: 1,
  bullProb: 0.25,           // strong bear regime
  regimeDrift: -0.0004,     // -ve drift
  regimeVol: 0.015,
  A: [[0.9, 0.1], [0.2, 0.8]],
};

// Minimal daily data (only needed for structural tests; signals not used here)
const dailyData = {
  prices:  Array.from({ length: 60 }, (_, i) => 100 + i * 0.5),
  returns: Array.from({ length: 59 }, () => 0.001),
  highs:   Array.from({ length: 60 }, (_, i) => 101 + i * 0.5),
  lows:    Array.from({ length: 60 }, (_, i) =>  99 + i * 0.5),
  closes:  Array.from({ length: 60 }, (_, i) => 100 + i * 0.5),
  volumes: Array.from({ length: 60 }, () => 1e6),
};

// ─────────────────────────────────────────────────────────────────────────────
// multiTimeframeForecast — output structure
// ─────────────────────────────────────────────────────────────────────────────

describe('multiTimeframeForecast — output structure', () => {
  let results;
  beforeAll(() => {
    results = multiTimeframeForecast(dailyData, {}, mockGarch, mockHmmBull);
  });

  it('returns an array', () => {
    expect(Array.isArray(results)).toBe(true);
  });

  it('contains exactly 3 core timeframes (no intraday)', () => {
    expect(results.length).toBe(3);
  });

  it('timeframe labels are 1 DAY / 1 WEEK / 1 MONTH', () => {
    const labels = results.map(r => r.timeframe);
    expect(labels).toEqual(['1 DAY', '1 WEEK', '1 MONTH']);
  });

  it('each result has required keys', () => {
    const required = [
      'timeframe', 'direction', 'predictedPct',
      'ci68', 'ci95', 'confidence', 'signal',
      'horizonDays', 'horizonVol', 'annualizedVol',
    ];
    results.forEach(r => {
      required.forEach(key => expect(r).toHaveProperty(key));
    });
  });

  it('horizonDays is numeric and correct', () => {
    const expected = [1, 5, 22];
    results.forEach((r, i) => {
      expect(typeof r.horizonDays).toBe('number');
      expect(r.horizonDays).toBe(expected[i]);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// multiTimeframeForecast — intraday inclusion
// ─────────────────────────────────────────────────────────────────────────────

describe('multiTimeframeForecast — intraday inclusion', () => {
  const minuteData = {
    prices: Array.from({ length: 30 }, (_, i) => 100 + i * 0.01),
  };
  const hourlyData = {
    prices: Array.from({ length: 20 }, (_, i) => 100 + i * 0.1),
  };

  it('adds 1 MIN timeframe when >= 30 minute prices', () => {
    const res = multiTimeframeForecast(
      dailyData,
      { minute: minuteData },
      mockGarch,
      mockHmmBull,
    );
    expect(res.length).toBe(4);
    expect(res[0].timeframe).toBe('1 MIN');
  });

  it('adds 1 HOUR timeframe when >= 20 hourly prices', () => {
    const res = multiTimeframeForecast(
      dailyData,
      { hourly: hourlyData },
      mockGarch,
      mockHmmBull,
    );
    expect(res.length).toBe(4);
    expect(res[0].timeframe).toBe('1 HOUR');
  });

  it('adds both intraday timeframes when both data available', () => {
    const res = multiTimeframeForecast(
      dailyData,
      { minute: minuteData, hourly: hourlyData },
      mockGarch,
      mockHmmBull,
    );
    expect(res.length).toBe(5);
    expect(res[0].timeframe).toBe('1 MIN');
    expect(res[1].timeframe).toBe('1 HOUR');
  });

  it('skips 1 MIN when < 30 minute prices', () => {
    const shortMinute = { prices: Array(29).fill(100) };
    const res = multiTimeframeForecast(
      dailyData,
      { minute: shortMinute },
      mockGarch,
      mockHmmBull,
    );
    expect(res.every(r => r.timeframe !== '1 MIN')).toBe(true);
  });

  it('skips 1 HOUR when < 20 hourly prices', () => {
    const shortHourly = { prices: Array(19).fill(100) };
    const res = multiTimeframeForecast(
      dailyData,
      { hourly: shortHourly },
      mockGarch,
      mockHmmBull,
    );
    expect(res.every(r => r.timeframe !== '1 HOUR')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// multiTimeframeForecast — value ranges and invariants
// ─────────────────────────────────────────────────────────────────────────────

describe('multiTimeframeForecast — value ranges', () => {
  let results;
  beforeAll(() => {
    results = multiTimeframeForecast(dailyData, {}, mockGarch, mockHmmBull);
  });

  it('confidence in [0.50, 0.65] for mock signal', () => {
    results.forEach(r => {
      expect(r.confidence).toBeGreaterThanOrEqual(0.50);
      expect(r.confidence).toBeLessThanOrEqual(0.65);
    });
  });

  it('signal in [-1, 1]', () => {
    results.forEach(r => {
      expect(r.signal).toBeGreaterThanOrEqual(-1);
      expect(r.signal).toBeLessThanOrEqual(1);
    });
  });

  it('ci68 lo <= predictedPct <= ci68 hi', () => {
    results.forEach(r => {
      expect(r.ci68[0]).toBeLessThanOrEqual(r.predictedPct);
      expect(r.ci68[1]).toBeGreaterThanOrEqual(r.predictedPct);
    });
  });

  it('ci95 lo <= ci68 lo and ci68 hi <= ci95 hi', () => {
    results.forEach(r => {
      expect(r.ci95[0]).toBeLessThanOrEqual(r.ci68[0]);
      expect(r.ci68[1]).toBeLessThanOrEqual(r.ci95[1]);
    });
  });

  it('horizonVol and annualizedVol are positive', () => {
    results.forEach(r => {
      expect(r.horizonVol).toBeGreaterThan(0);
      expect(r.annualizedVol).toBeGreaterThan(0);
    });
  });

  it('direction is BUY / SELL / HOLD', () => {
    results.forEach(r => {
      expect(['BUY', 'SELL', 'HOLD']).toContain(r.direction);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// multiTimeframeForecast — bull vs bear regime comparison
// ─────────────────────────────────────────────────────────────────────────────

describe('multiTimeframeForecast — bull vs bear regime', () => {
  let bullResults, bearResults;
  beforeAll(() => {
    bullResults = multiTimeframeForecast(dailyData, {}, mockGarch, mockHmmBull);
    bearResults = multiTimeframeForecast(dailyData, {}, mockGarch, mockHmmBear);
  });

  it('bull regime gives higher predictedPct than bear on 1 DAY', () => {
    const bullDay = bullResults.find(r => r.timeframe === '1 DAY');
    const bearDay = bearResults.find(r => r.timeframe === '1 DAY');
    expect(bullDay.predictedPct).toBeGreaterThan(bearDay.predictedPct);
  });

  it('bull regime direction is BUY for positive drift', () => {
    const dayForecast = bullResults.find(r => r.timeframe === '1 DAY');
    expect(dayForecast.direction).toBe('BUY');
  });

  it('bear regime direction is SELL for negative drift', () => {
    const dayForecast = bearResults.find(r => r.timeframe === '1 DAY');
    expect(dayForecast.direction).toBe('SELL');
  });

  it('longer horizons have larger CI widths than shorter ones (same regime)', () => {
    const day   = bullResults.find(r => r.timeframe === '1 DAY');
    const month = bullResults.find(r => r.timeframe === '1 MONTH');
    const dayWidth   = day.ci95[1]   - day.ci95[0];
    const monthWidth = month.ci95[1] - month.ci95[0];
    expect(monthWidth).toBeGreaterThan(dayWidth);
  });
});
