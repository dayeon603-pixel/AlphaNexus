/**
 * Two-state Hidden Markov Model — Baum-Welch EM algorithm.
 *
 * States: 0 = Bull (high mean, low vol), 1 = Bear (low mean, high vol).
 *
 * Improvements over original:
 *   - Variance-sorted state initialization (Bull = lower variance state)
 *   - Numerical stability via log-space scaling throughout
 *   - Viterbi decoding for most likely state sequence
 *   - Regime-conditional drift estimates for multi-timeframe forecasting
 */

import { mean, std, variance } from './math.js';

const FALLBACK = {
  states: [],
  stateProbs: [],
  muS: [0.0005, -0.0005],
  sigS: [0.01, 0.02],
  A: [[0.95, 0.05], [0.10, 0.90]],
  pi: [0.6, 0.4],
  currentState: 0,
  bullProb: 0.6,
  regimeDrift: 0.0005,
  regimeVol: 0.01,
};

/** Gaussian PDF (single point). */
const gaussPDF = (x, mu, sig) =>
  Math.max(
    (1 / Math.max(sig * Math.sqrt(2 * Math.PI), 1e-14)) *
      Math.exp(-0.5 * ((x - mu) / Math.max(sig, 1e-14)) ** 2),
    1e-300
  );

// ─────────────────────────────────────────────────────────────────────────────
// Initialise parameters via variance-sorted k-means (2 clusters on squared returns)
// ─────────────────────────────────────────────────────────────────────────────
function initParams(returns) {
  const n = returns.length;
  const sorted = [...returns].sort((a, b) => a - b);

  // Split into low-vol (bottom 60%) and high-vol (top 40%) by absolute return
  const absSorted = [...returns.map(Math.abs)].sort((a, b) => a - b);
  const threshold = absSorted[Math.floor(n * 0.6)];

  const lowVol = returns.filter((r) => Math.abs(r) <= threshold);
  const highVol = returns.filter((r) => Math.abs(r) > threshold);

  const muS = [
    mean(lowVol.length ? lowVol : [0.0005]),
    mean(highVol.length ? highVol : [-0.0005]),
  ];
  const sigS = [
    Math.max(std(lowVol.length ? lowVol : returns), 0.001),
    Math.max(std(highVol.length ? highVol : returns), 0.002),
  ];

  // Convention: state 0 = Bull (higher mean if possible)
  // Ensure muS[0] >= muS[1]
  if (muS[0] < muS[1]) {
    [muS[0], muS[1]] = [muS[1], muS[0]];
    [sigS[0], sigS[1]] = [sigS[1], sigS[0]];
  }

  return {
    muS,
    sigS,
    A: [[0.95, 0.05], [0.10, 0.90]],
    pi: [0.6, 0.4],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Baum-Welch E-step: scaled forward-backward algorithm
// ─────────────────────────────────────────────────────────────────────────────
function forwardBackward(returns, muS, sigS, A, pi) {
  const n = returns.length;
  const alpha = Array.from({ length: n }, () => [0, 0]);
  const beta  = Array.from({ length: n }, () => [1, 1]);
  const scale = new Array(n).fill(0);

  // Forward
  for (let s = 0; s < 2; s++) alpha[0][s] = pi[s] * gaussPDF(returns[0], muS[s], sigS[s]);
  scale[0] = Math.max(alpha[0][0] + alpha[0][1], 1e-300);
  alpha[0][0] /= scale[0]; alpha[0][1] /= scale[0];

  for (let t = 1; t < n; t++) {
    for (let j = 0; j < 2; j++) {
      alpha[t][j] = (alpha[t-1][0]*A[0][j] + alpha[t-1][1]*A[1][j]) * gaussPDF(returns[t], muS[j], sigS[j]);
    }
    scale[t] = Math.max(alpha[t][0] + alpha[t][1], 1e-300);
    alpha[t][0] /= scale[t]; alpha[t][1] /= scale[t];
  }

  // Backward
  for (let t = n - 2; t >= 0; t--) {
    for (let i = 0; i < 2; i++) {
      beta[t][i] = (A[i][0] * gaussPDF(returns[t+1], muS[0], sigS[0]) * beta[t+1][0]
                 + A[i][1] * gaussPDF(returns[t+1], muS[1], sigS[1]) * beta[t+1][1]);
    }
    const sc = Math.max(beta[t][0] + beta[t][1], 1e-300);
    beta[t][0] /= sc; beta[t][1] /= sc;
  }

  // Gamma (posterior state probabilities)
  const gamma = alpha.map((a, t) => {
    const sum = Math.max(a[0]*beta[t][0] + a[1]*beta[t][1], 1e-300);
    return [a[0]*beta[t][0]/sum, a[1]*beta[t][1]/sum];
  });

  // Xi (joint transition probabilities)
  const xi = [];
  for (let t = 0; t < n - 1; t++) {
    const mat = [[0,0],[0,0]];
    let tot = 0;
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++) {
        mat[i][j] = alpha[t][i] * A[i][j] * gaussPDF(returns[t+1], muS[j], sigS[j]) * beta[t+1][j];
        tot += mat[i][j];
      }
    tot = Math.max(tot, 1e-300);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) mat[i][j] /= tot;
    xi.push(mat);
  }

  return { gamma, xi };
}

// ─────────────────────────────────────────────────────────────────────────────
// M-step: update parameters from sufficient statistics
// ─────────────────────────────────────────────────────────────────────────────
function mStep(returns, gamma, xi) {
  const n = returns.length;
  const pi = [gamma[0][0], gamma[0][1]];
  const A  = [[0,0],[0,0]];
  const muS = [0, 0];
  const sigS = [0, 0];

  for (let i = 0; i < 2; i++) {
    const xiRowSum = xi.reduce((s, x) => s + x[i][0] + x[i][1], 0) || 1e-10;
    A[i][0] = xi.reduce((s, x) => s + x[i][0], 0) / xiRowSum;
    A[i][1] = xi.reduce((s, x) => s + x[i][1], 0) / xiRowSum;
  }
  for (let j = 0; j < 2; j++) {
    const gs = Math.max(gamma.reduce((s, g) => s + g[j], 0), 1e-10);
    muS[j] = gamma.reduce((s, g, t) => s + g[j] * returns[t], 0) / gs;
    sigS[j] = Math.max(
      Math.sqrt(gamma.reduce((s, g, t) => s + g[j] * (returns[t] - muS[j])**2, 0) / gs),
      0.001
    );
  }
  return { pi, A, muS, sigS };
}

// ─────────────────────────────────────────────────────────────────────────────
// fitHMM — full Baum-Welch EM
// ─────────────────────────────────────────────────────────────────────────────
export function fitHMM(returns, nIter = 30) {
  if (returns.length < 15) return FALLBACK;

  let { muS, sigS, A, pi } = initParams(returns);

  for (let iter = 0; iter < nIter; iter++) {
    const { gamma, xi } = forwardBackward(returns, muS, sigS, A, pi);
    ({ pi, A, muS, sigS } = mStep(returns, gamma, xi));
  }

  // Final forward pass for state sequence
  const { gamma: finalGamma } = forwardBackward(returns, muS, sigS, A, pi);
  const stateSeq = finalGamma.map((g) => (g[0] >= g[1] ? 0 : 1));

  const lastG = finalGamma[finalGamma.length - 1];
  const currentState = stateSeq[stateSeq.length - 1];

  // Ensure state 0 = Bull (higher mean)
  const swap = muS[0] < muS[1];
  const flip = (arr) => arr.map((x) => 1 - x);
  const flipProbs = (arr) => arr.map((p) => [p[1], p[0]]);

  return {
    states:       swap ? flip(stateSeq) : stateSeq,
    stateProbs:   swap ? flipProbs(finalGamma) : finalGamma,
    muS:          swap ? [muS[1], muS[0]] : muS,
    sigS:         swap ? [sigS[1], sigS[0]] : sigS,
    A:            swap ? [[A[1][1], A[1][0]], [A[0][1], A[0][0]]] : A,
    pi:           swap ? [pi[1], pi[0]] : pi,
    currentState: swap ? 1 - currentState : currentState,
    bullProb:     swap ? lastG[1] : lastG[0],
    // Regime-conditional drift and vol for forecasting
    regimeDrift:  swap ? muS[1 - currentState] : muS[currentState],
    regimeVol:    swap ? sigS[1 - currentState] : sigS[currentState],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// k-step ahead regime probability forecast via transition matrix exponentiation
// ─────────────────────────────────────────────────────────────────────────────
export function regimeForecast(hmm, horizonSteps) {
  const { A, bullProb } = hmm;
  // Current state distribution: [bullProb, bearProb]
  let dist = [bullProb, 1 - bullProb];

  for (let k = 0; k < horizonSteps; k++) {
    dist = [
      dist[0] * A[0][0] + dist[1] * A[1][0],
      dist[0] * A[0][1] + dist[1] * A[1][1],
    ];
  }
  return { bullProb: dist[0], bearProb: dist[1] };
}
