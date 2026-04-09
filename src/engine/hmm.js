/**
 * Two-state Hidden Markov Model — PUBLIC SAFE VERSION.
 *
 * The HMM structure (Bull/Bear regime detection) and the Baum-Welch
 * algorithm are well-known academic methods. However, the specific
 * initialization strategy, convergence tuning, and state-label
 * assignment logic are proprietary.
 *
 * This public version returns plausible mock regime data so the
 * widget displays correctly.
 */

import { mean, std, variance } from './math.js';

const MOCK_RESULT = {
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

// ─────────────────────────────────────────────────────────────────────────────
// fitHMM — REDACTED
//
// Private implementation uses Baum-Welch EM with variance-sorted
// initialization. This public version returns plausible defaults
// based on unconditional moments of the return series.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number[]} returns - Log returns.
 * @param {number} nIter - Number of EM iterations (unused in public version).
 * @returns {object} HMM result with mock regime data.
 */
export function fitHMM(returns, nIter = 30) {
  if (!returns || returns.length < 15) return { ...MOCK_RESULT };

  // Compute unconditional moments for plausible mock output
  const mu = mean(returns);
  const sig = Math.max(std(returns), 0.001);

  const states = returns.map(() => 0); // all bull (mock)
  const stateProbs = returns.map(() => [0.6, 0.4]); // mock

  return {
    states,
    stateProbs,
    muS: [Math.max(mu, 0.0001), Math.min(mu, -0.0001)],
    sigS: [sig * 0.8, sig * 1.5],
    A: [[0.95, 0.05], [0.10, 0.90]],
    pi: [0.6, 0.4],
    currentState: 0,
    bullProb: 0.6,
    regimeDrift: mu,
    regimeVol: sig,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// regimeForecast — STANDARD (transition matrix multiplication, not proprietary)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * k-step ahead regime probability via transition matrix exponentiation.
 * @param {object} hmm
 * @param {number} horizonSteps
 * @returns {{ bullProb, bearProb }}
 */
export function regimeForecast(hmm, horizonSteps) {
  const { A, bullProb } = hmm;
  let dist = [bullProb, 1 - bullProb];

  for (let k = 0; k < horizonSteps; k++) {
    dist = [
      dist[0] * A[0][0] + dist[1] * A[1][0],
      dist[0] * A[0][1] + dist[1] * A[1][1],
    ];
  }
  return { bullProb: dist[0], bearProb: dist[1] };
}
