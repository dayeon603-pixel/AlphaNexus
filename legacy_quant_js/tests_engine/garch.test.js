import { garchTermStructure, gjrGarchMC } from '../../src/engine/garch.js';

const mockGarch = {
  condVar: [0.0001],
  longRunVar: 0.0002,
  persistence: 0.95,
  omega: 0.0000015,
  alpha: 0.06,
  gamma: 0.08,
  beta: 0.88,
};

describe('garchTermStructure', () => {
  it('stepForecasts.length = horizonDays', () => {
    expect(garchTermStructure(mockGarch, 22).stepForecasts.length).toBe(22);
  });
  it('all step forecasts positive', () => {
    garchTermStructure(mockGarch, 22).stepForecasts
      .forEach(v => expect(v).toBeGreaterThan(0));
  });
  it('horizonVol > 0', () => {
    expect(garchTermStructure(mockGarch, 5).horizonVol).toBeGreaterThan(0);
  });
  it('annualizedVol > 0', () => {
    expect(garchTermStructure(mockGarch, 22).annualizedVol).toBeGreaterThan(0);
  });
  it('phi=0 → all forecasts = longRunVar', () => {
    const g = { ...mockGarch, persistence: 0 };
    garchTermStructure(g, 10).stepForecasts
      .forEach(v => expect(v).toBeCloseTo(g.longRunVar, 8));
  });
  it('phi=1 → cumulativeVar = horizonDays × h0', () => {
    const g = { ...mockGarch, persistence: 1 };
    const ts = garchTermStructure(g, 5);
    expect(ts.cumulativeVar).toBeCloseTo(5 * g.condVar[0], 8);
  });
});

describe('gjrGarchMC', () => {
  it('returns nPaths paths', () => {
    expect(gjrGarchMC(100, 0.0005, mockGarch, 5, 10).length).toBe(10);
  });
  it('each path has horizonDays + 1 elements', () => {
    gjrGarchMC(100, 0.0005, mockGarch, 5, 10)
      .forEach(p => expect(p.length).toBe(6));
  });
  it('each path starts at S0', () => {
    gjrGarchMC(100, 0.0005, mockGarch, 5, 10)
      .forEach(p => expect(p[0]).toBe(100));
  });
  it('all prices positive', () => {
    gjrGarchMC(100, 0.0005, mockGarch, 10, 50)
      .forEach(p => p.forEach(v => expect(v).toBeGreaterThan(0)));
  });
});
