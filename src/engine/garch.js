/**
 * GJR-GARCH(1,1) — PUBLIC SAFE VERSION.
 *
 * Model structure:
 *   h_t = ω + α·ε²_{t-1} + γ·ε²_{t-1}·I_{t-1}^- + β·h_{t-1}
 *
 * This public release includes the GARCH term structure (closed-form,
 * published by Engle & Bollerslev 1986) and Monte Carlo simulation,
 * but the MLE fitting procedure (Adam optimizer with analytical score
 * functions) is replaced with a stub that returns reasonable defaults.
 *
 * The term structure and MC modules are standard academic implementations
 * and are not proprietary.
 */

import { mean, variance, clamp } from './math.js';

// ─────────────────────────────────────────────────────────────────────────────
// fitGJRGARCH — REDACTED (MLE estimation removed)
//
// Returns well-known equity default parameters instead of fitted values.
// The private implementation uses Adam MLE with analytical score functions.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number[]} returns - Log returns.
 * @param {object} opts
 * @returns {object} GARCH parameters (defaults, not fitted).
 */
export function fitGJRGARCH(returns, opts = {}) {
  const uv = Math.max(variance(returns.length ? returns : [0]), 1e-6);

  // Standard equity GARCH defaults (not fitted — proprietary MLE excluded)
  const omega = uv * 0.05;
  const alpha = 0.06;
  const gamma = 0.08;
  const beta  = 0.88;
  const persistence = alpha + beta + gamma / 2;
  const longRunVar = omega / (1 - persistence);

  // Compute conditional variances with default params
  const condVar = [uv];
  for (let t = 1; t < returns.length; t++) {
    const eps2 = returns[t - 1] ** 2;
    const indNeg = returns[t - 1] < 0 ? 1 : 0;
    condVar.push(Math.max(
      omega + alpha * eps2 + gamma * eps2 * indNeg + beta * condVar[t - 1],
      1e-10
    ));
  }

  return {
    omega, alpha, gamma, beta,
    condVar,
    longRunVar: Math.max(longRunVar, 1e-8),
    persistence,
    leverageRatio: gamma / alpha,
    logLikelihood: -Infinity, // Not computed in public version
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GARCH Term Structure — STANDARD ACADEMIC (not proprietary)
//
// Engle & Bollerslev (1986):
//   E[h_{t+k}] = σ²_LR + φ^k·(h_t − σ²_LR)
//   Var[r_{t,t+H}] = H·σ²_LR + (h_t − σ²_LR)·φ·(1−φ^H)/(1−φ)
// ─────────────────────────────────────────────────────────────────────────────

export function garchTermStructure(garch, horizonDays, tradingDaysPerYear = 252) {
  const { condVar, longRunVar, persistence: phi } = garch;
  const h0 = Math.max(condVar[condVar.length - 1], 1e-10);

  const stepForecasts = [];
  for (let k = 1; k <= horizonDays; k++) {
    stepForecasts.push(Math.max(longRunVar + phi ** k * (h0 - longRunVar), 1e-10));
  }

  let cumulativeVar;
  if (Math.abs(phi - 1) < 1e-6) {
    cumulativeVar = horizonDays * h0;
  } else {
    cumulativeVar = horizonDays * longRunVar
      + (h0 - longRunVar) * phi * (1 - phi ** horizonDays) / (1 - phi);
  }
  cumulativeVar = Math.max(cumulativeVar, 1e-10);

  const horizonVol = Math.sqrt(cumulativeVar);
  const annualizedVol = Math.sqrt(cumulativeVar * (tradingDaysPerYear / horizonDays));

  return { stepForecasts, cumulativeVar, horizonVol, annualizedVol };
}

// ─────────────────────────────────────────────────────────────────────────────
// Monte Carlo — STANDARD ACADEMIC
// ─────────────────────────────────────────────────────────────────────────────

export function gjrGarchMC(S0, drift, garch, horizon = 22, nPaths = 500) {
  const { omega, alpha, gamma, beta, condVar } = garch;
  const h0 = Math.max(condVar[condVar.length - 1], 1e-10);

  return Array.from({ length: nPaths }, () => {
    const path = [S0];
    let ht = h0;
    let prevEps = Math.sqrt(h0) * (Math.random() < 0.5 ? 1 : -1);

    for (let t = 1; t <= horizon; t++) {
      const indNeg = prevEps < 0 ? 1 : 0;
      ht = Math.max(omega + alpha * prevEps ** 2 + gamma * prevEps ** 2 * indNeg + beta * ht, 1e-10);
      const eps = Math.sqrt(ht) * Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
      prevEps = eps;
      path.push(Math.max(path[path.length - 1] * Math.exp(drift - 0.5 * ht + eps), 0.001));
    }
    return path;
  });
}
