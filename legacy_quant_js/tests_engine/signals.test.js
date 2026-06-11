import { computeRSI, trueATR } from '../../src/engine/signals.js';

describe('computeRSI', () => {
  it('output length = input length', () => {
    const prices = Array.from({ length: 20 }, (_, i) => 100 + i);
    expect(computeRSI(prices, 14).length).toBe(20);
  });
  it('all values in [0, 100]', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 10);
    computeRSI(prices, 14).forEach(v => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });
  it('all-up series → RSI ≈ 100', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
    const rsi = computeRSI(prices, 14);
    expect(rsi[rsi.length - 1]).toBeCloseTo(100, 1);
  });
  it('all-down series → RSI ≈ 0', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 200 - i);
    const rsi = computeRSI(prices, 14);
    expect(rsi[rsi.length - 1]).toBeCloseTo(0, 1);
  });
  it('short series (< period + 1) → all 50s', () => {
    computeRSI([100, 101], 14).forEach(v => expect(v).toBe(50));
  });
});

describe('trueATR', () => {
  const n = 20, period = 14;

  it('output length = n − period + 1', () => {
    const h = Array.from({ length: n }, () => 105);
    const l = Array.from({ length: n }, () => 95);
    const c = Array.from({ length: n }, () => 100);
    expect(trueATR(h, l, c, period).length).toBe(n - period + 1);
  });
  it('all non-negative', () => {
    const h = Array.from({ length: n }, () => 105);
    const l = Array.from({ length: n }, () => 95);
    const c = Array.from({ length: n }, () => 100);
    trueATR(h, l, c, period).forEach(v => expect(v).toBeGreaterThanOrEqual(0));
  });
  it('zero range → ATR = 0', () => {
    const p = Array.from({ length: n }, () => 100);
    trueATR(p, p, p, period).forEach(v => expect(v).toBeCloseTo(0, 8));
  });
  it('constant range 10 → ATR ≈ 10', () => {
    const h = Array.from({ length: n }, () => 110);
    const l = Array.from({ length: n }, () => 100);
    const c = Array.from({ length: n }, () => 105);
    const atr = trueATR(h, l, c, period);
    expect(atr[atr.length - 1]).toBeCloseTo(10, 5);
  });
});
