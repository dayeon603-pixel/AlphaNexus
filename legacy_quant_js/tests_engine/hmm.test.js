import { regimeForecast } from '../../src/engine/hmm.js';

const hmm = {
  A: [[0.95, 0.05], [0.10, 0.90]],
  bullProb: 0.7,
};

describe('regimeForecast', () => {
  it('bullProb + bearProb = 1', () => {
    const { bullProb, bearProb } = regimeForecast(hmm, 1);
    expect(bullProb + bearProb).toBeCloseTo(1, 10);
  });
  it('horizonSteps=0 → initial distribution', () => {
    expect(regimeForecast(hmm, 0).bullProb).toBeCloseTo(0.7, 10);
  });
  it('1-step hand calculation: [0.7,0.3]×A = [0.695,0.305]', () => {
    expect(regimeForecast(hmm, 1).bullProb).toBeCloseTo(0.695, 8);
  });
  it('long horizon → stationary π_B = 2/3', () => {
    // π_B×0.05 = π_S×0.10 → π_B/π_S = 2 → π_B = 2/3
    expect(regimeForecast(hmm, 500).bullProb).toBeCloseTo(2 / 3, 3);
  });
  it('bullProb in [0, 1]', () => {
    const { bullProb } = regimeForecast(hmm, 10);
    expect(bullProb).toBeGreaterThanOrEqual(0);
    expect(bullProb).toBeLessThanOrEqual(1);
  });
  it('deterministic: same inputs → same output', () => {
    expect(regimeForecast(hmm, 5).bullProb).toBe(regimeForecast(hmm, 5).bullProb);
  });
});
