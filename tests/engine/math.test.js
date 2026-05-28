import {
  mean, variance, std, logReturns, simpleReturns, ema,
  normCDF, normPDF, clamp, correlation, percentile, rolling,
  realizedVariance, softplus, sigmoid, seededRNG,
} from '../../src/engine/math.js';

describe('mean', () => {
  it('[1..5] → 3', () => expect(mean([1, 2, 3, 4, 5])).toBeCloseTo(3, 10));
  it('single element → itself', () => expect(mean([7])).toBe(7));
  it('[-1,0,1] → 0', () => expect(mean([-1, 0, 1])).toBeCloseTo(0, 10));
  it('[2,8] → 5', () => expect(mean([2, 8])).toBeCloseTo(5, 10));
});

describe('variance', () => {
  it('constant → 0', () => expect(variance([5, 5, 5])).toBeCloseTo(0, 10));
  it('[0,1,2,3,4] → 2', () => expect(variance([0, 1, 2, 3, 4])).toBeCloseTo(2, 10));
  it('single element → 0', () => expect(variance([3])).toBe(0));
});

describe('std', () => {
  it('[0,2,4] → sqrt(8/3)', () => expect(std([0, 2, 4])).toBeCloseTo(Math.sqrt(8 / 3), 8));
  it('constant → 0', () => expect(std([1, 1, 1])).toBeCloseTo(0, 10));
  it('non-negative', () => expect(std([1, 2, 3, 4])).toBeGreaterThanOrEqual(0));
});

describe('logReturns', () => {
  it('length = prices.length − 1', () => expect(logReturns([1, 2, 3]).length).toBe(2));
  it('[100,110] → ln(1.1)', () => expect(logReturns([100, 110])[0]).toBeCloseTo(Math.log(1.1), 8));
  it('[1,1] → 0', () => expect(logReturns([1, 1])[0]).toBeCloseTo(0, 10));
  it('negative for price drop', () => expect(logReturns([110, 100])[0]).toBeLessThan(0));
});

describe('simpleReturns', () => {
  it('length = prices.length − 1', () => expect(simpleReturns([1, 2, 3]).length).toBe(2));
  it('[100,110] → 0.1', () => expect(simpleReturns([100, 110])[0]).toBeCloseTo(0.1, 8));
  it('[50,50] → 0', () => expect(simpleReturns([50, 50])[0]).toBeCloseTo(0, 10));
  it('negative for drop', () => expect(simpleReturns([100, 90])[0]).toBeCloseTo(-0.1, 8));
});

describe('ema', () => {
  it('first element unchanged', () => expect(ema([1, 2, 3], 3)[0]).toBe(1));
  it('same-length output', () => expect(ema([1, 2, 3, 4, 5], 3).length).toBe(5));
  it('constant series → constant', () => {
    ema([5, 5, 5, 5], 2).forEach(v => expect(v).toBeCloseTo(5, 10));
  });
  it('k=2/(n+1) weighting: ema([1,3],2)[1] = 7/3', () => {
    // k=2/3: ema[1] = 3*(2/3) + 1*(1/3) = 2 + 1/3 = 7/3
    expect(ema([1, 3], 2)[1]).toBeCloseTo(7 / 3, 8);
  });
});

describe('normCDF', () => {
  it('normCDF(0) = 0.5', () => expect(normCDF(0)).toBeCloseTo(0.5, 5));
  it('normCDF(1.96) ≈ 0.975', () => expect(normCDF(1.96)).toBeCloseTo(0.975, 2));
  it('symmetry: normCDF(−x) = 1 − normCDF(x)', () =>
    expect(normCDF(-1.5)).toBeCloseTo(1 - normCDF(1.5), 8));
  it('normCDF(10) ≈ 1', () => expect(normCDF(10)).toBeCloseTo(1, 5));
  it('normCDF(−10) ≈ 0', () => expect(normCDF(-10)).toBeCloseTo(0, 5));
  it('monotone: normCDF(1) > normCDF(0)', () => expect(normCDF(1)).toBeGreaterThan(normCDF(0)));
});

describe('normPDF', () => {
  it('normPDF(0) = 1/sqrt(2π)', () =>
    expect(normPDF(0)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 8));
  it('symmetry: normPDF(−x) = normPDF(x)', () =>
    expect(normPDF(-2)).toBeCloseTo(normPDF(2), 10));
  it('positive everywhere', () => expect(normPDF(5)).toBeGreaterThan(0));
});

describe('clamp', () => {
  it('below lo → lo', () => expect(clamp(-1, 0, 1)).toBe(0));
  it('above hi → hi', () => expect(clamp(5, 0, 1)).toBe(1));
  it('in range unchanged', () => expect(clamp(0.5, 0, 1)).toBe(0.5));
  it('at lo boundary', () => expect(clamp(0, 0, 1)).toBe(0));
  it('at hi boundary', () => expect(clamp(1, 0, 1)).toBe(1));
});

describe('correlation', () => {
  it('identical arrays → 1', () =>
    expect(correlation([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 8));
  it('reversed arrays → −1', () =>
    expect(correlation([1, 2, 3], [3, 2, 1])).toBeCloseTo(-1, 8));
  it('different lengths → NaN', () =>
    expect(correlation([1, 2], [1, 2, 3])).toBeNaN());
  it('constant array → NaN', () =>
    expect(correlation([1, 1, 1], [1, 2, 3])).toBeNaN());
  it('length 1 → NaN', () => expect(correlation([1], [1])).toBeNaN());
});

describe('percentile', () => {
  it('50th of [1..5] → 3', () => expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3));
  it('0th → minimum', () => expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1));
  it('100th → maximum', () => expect(percentile([1, 2, 3, 4, 5], 100)).toBe(5));
  it('empty → NaN', () => expect(percentile([], 50)).toBeNaN());
  it('25th of [1..5]: idx=1.0 → 2', () => expect(percentile([1, 2, 3, 4, 5], 25)).toBe(2));
});

describe('rolling', () => {
  it('length = arr.length − n + 1', () =>
    expect(rolling([1, 2, 3, 4, 5], 3, mean).length).toBe(3));
  it('rolling mean w=3: [2,3,4]', () => {
    const r = rolling([1, 2, 3, 4, 5], 3, mean);
    expect(r[0]).toBeCloseTo(2, 8);
    expect(r[1]).toBeCloseTo(3, 8);
    expect(r[2]).toBeCloseTo(4, 8);
  });
});

describe('realizedVariance', () => {
  it('all zeros → 0', () => expect(realizedVariance([0, 0, 0])).toBe(0));
  it('[1,2,3] → 14', () => expect(realizedVariance([1, 2, 3])).toBe(14));
  it('[5] → 25', () => expect(realizedVariance([5])).toBe(25));
});

describe('softplus', () => {
  it('large x → x', () => expect(softplus(100)).toBeCloseTo(100, 5));
  it('softplus(0) = ln(2)', () => expect(softplus(0)).toBeCloseTo(Math.LN2, 8));
  it('always positive', () => expect(softplus(-1000)).toBeGreaterThan(0));
});

describe('sigmoid', () => {
  it('sigmoid(0) = 0.5', () => expect(sigmoid(0)).toBeCloseTo(0.5, 10));
  it('large x → 1', () => expect(sigmoid(1000)).toBeCloseTo(1, 5));
  it('small x → 0', () => expect(sigmoid(-1000)).toBeCloseTo(0, 5));
  it('monotone', () => expect(sigmoid(1)).toBeGreaterThan(sigmoid(0)));
});

describe('seededRNG', () => {
  it('reproducible from same seed', () => {
    const r1 = seededRNG(42), r2 = seededRNG(42);
    expect(r1()).toBe(r2());
    expect(r1()).toBe(r2());
  });
  it('values in [0, 1)', () => {
    const rng = seededRNG(123);
    for (let i = 0; i < 10; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('different seeds → different first value', () =>
    expect(seededRNG(1)()).not.toBe(seededRNG(2)()));
});
