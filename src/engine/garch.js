/**
 * GJR-GARCH(1,1) — Glosten, Jagannathan & Runkle (1993).
 *
 * Model:
 *   h_t = ω + α·ε²_{t-1} + γ·ε²_{t-1}·I_{t-1}^- + β·h_{t-1}
 *
 * where I_{t-1}^- = 1 if ε_{t-1} < 0 (leverage / asymmetry term).
 *
 * Reduces to standard GARCH(1,1) when γ = 0.
 * Stationarity condition: α + β + γ/2 < 1.
 *
 * Estimation via exact Gaussian log-likelihood:
 *   L(θ) = −½ Σ_t [log(h_t) + ε²_t / h_t]
 *
 * Optimised with Adam using analytical score functions (gradient of L wrt θ).
 * This replaces the broken coordinate-search in the original code.
 *
 * GARCH Term Structure (Engle & Bollerslev, 1986):
 *   φ = α + β + γ/2                     (effective persistence)
 *   σ²_LR = ω / (1 − φ)                 (long-run variance)
 *   E[h_{t+k}|F_t] = σ²_LR + φ^k · (h_t − σ²_LR)
 *   Var[r_{t,t+H}|F_t] = Σ_{k=1}^H E[h_{t+k}|F_t]   (closed form below)
 */

import { mean, variance, clamp } from './math.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal: compute conditional variances h_t given parameters
// ─────────────────────────────────────────────────────────────────────────────
function computeCondVar(returns, omega, alpha, gamma, beta) {
  const n = returns.length;
  const eps2 = returns.map((r) => r * r);
  const indNeg = returns.map((r) => (r < 0 ? 1 : 0)); // I_{t}^-
  const h = new Array(n);
  const uv = Math.max(variance(returns), 1e-8); // unconditional variance init
  h[0] = uv;
  for (let t = 1; t < n; t++) {
    h[t] = Math.max(
      omega + alpha * eps2[t - 1] + gamma * eps2[t - 1] * indNeg[t - 1] + beta * h[t - 1],
      1e-10
    );
  }
  return h;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: Gaussian log-likelihood
// ─────────────────────────────────────────────────────────────────────────────
function logLikelihood(returns, h) {
  let ll = 0;
  for (let t = 0; t < returns.length; t++) {
    ll -= 0.5 * (Math.log(h[t]) + returns[t] ** 2 / h[t]);
  }
  return ll;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: analytical score (gradient of log-likelihood wrt [ω, α, γ, β])
//
// ∂L/∂θ_k = ½ Σ_t [(ε²_t − h_t) / h_t²] · ∂h_t/∂θ_k
//
// Recursive derivatives:
//   d_ω[t] = 1          + β·d_ω[t-1]
//   d_α[t] = ε²_{t-1}   + β·d_α[t-1]
//   d_γ[t] = ε²_{t-1}·I_{t-1}^- + β·d_γ[t-1]
//   d_β[t] = h_{t-1}    + β·d_β[t-1]
// ─────────────────────────────────────────────────────────────────────────────
function score(returns, omega, alpha, gamma, beta) {
  const n = returns.length;
  const eps2 = returns.map((r) => r * r);
  const indNeg = returns.map((r) => (r < 0 ? 1 : 0));
  const uv = Math.max(variance(returns), 1e-8);

  // Forward pass: h_t and partial derivatives
  const h = new Array(n).fill(0);
  const dO = new Array(n).fill(0); // ∂h/∂ω
  const dA = new Array(n).fill(0); // ∂h/∂α
  const dG = new Array(n).fill(0); // ∂h/∂γ
  const dB = new Array(n).fill(0); // ∂h/∂β

  h[0] = uv;
  // d[0] = 0 (initial condition for derivatives)

  for (let t = 1; t < n; t++) {
    h[t] = Math.max(
      omega + alpha * eps2[t - 1] + gamma * eps2[t - 1] * indNeg[t - 1] + beta * h[t - 1],
      1e-10
    );
    dO[t] = 1 + beta * dO[t - 1];
    dA[t] = eps2[t - 1] + beta * dA[t - 1];
    dG[t] = eps2[t - 1] * indNeg[t - 1] + beta * dG[t - 1];
    dB[t] = h[t - 1] + beta * dB[t - 1];
  }

  // Accumulate score
  let gO = 0, gA = 0, gG = 0, gB = 0;
  for (let t = 0; t < n; t++) {
    const coeff = 0.5 * (eps2[t] - h[t]) / (h[t] * h[t]);
    gO += coeff * dO[t];
    gA += coeff * dA[t];
    gG += coeff * dG[t];
    gB += coeff * dB[t];
  }

  return { gO, gA, gG, gB, h, ll: logLikelihood(returns, h) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Project parameters onto stationarity constraint set
// ─────────────────────────────────────────────────────────────────────────────
function project(omega, alpha, gamma, beta) {
  const o = Math.max(omega, 1e-7);
  const a = Math.max(alpha, 0);
  const g = Math.max(gamma, 0);
  const b = Math.max(beta, 0);
  const persist = a + b + g / 2;
  if (persist >= 0.9999) {
    const scale = 0.9998 / persist;
    return { omega: o, alpha: a * scale, gamma: g * scale, beta: b * scale };
  }
  return { omega: o, alpha: a, gamma: g, beta: b };
}

// ─────────────────────────────────────────────────────────────────────────────
// fitGJRGARCH — maximum likelihood estimation via Adam optimiser
//
// Returns:
//   { omega, alpha, gamma, beta,  // fitted parameters
//     condVar,                    // conditional variances h_1,...,h_T
//     longRunVar,                 // σ²_LR = ω/(1−φ)
//     persistence,                // φ = α + β + γ/2
//     leverageRatio,              // γ/α — asymmetry ratio (> 1 = leverage present)
//     logLikelihood }
// ─────────────────────────────────────────────────────────────────────────────
export function fitGJRGARCH(returns, { maxIter = 400, lr = 5e-4, tol = 1e-7 } = {}) {
  if (returns.length < 10) {
    // Fallback: well-known equity defaults
    const uv = Math.max(variance(returns.length ? returns : [0]), 1e-6);
    return {
      omega: uv * 0.05, alpha: 0.06, gamma: 0.08, beta: 0.88,
      condVar: [uv], longRunVar: uv, persistence: 0.97,
      leverageRatio: 1.33, logLikelihood: -Infinity,
    };
  }

  const uv = Math.max(variance(returns), 1e-8);

  // Initialise near typical equity GARCH values
  let { omega, alpha, gamma, beta } = project(uv * 0.05, 0.06, 0.08, 0.88);

  // Adam state
  const adam = { mO: 0, mA: 0, mG: 0, mB: 0, vO: 0, vA: 0, vG: 0, vB: 0 };
  const b1 = 0.9, b2 = 0.999, eps = 1e-8;
  let prevLL = -Infinity;

  for (let iter = 1; iter <= maxIter; iter++) {
    const { gO, gA, gG, gB, ll } = score(returns, omega, alpha, gamma, beta);

    // Adam update (ascent — add gradient)
    adam.mO = b1 * adam.mO + (1 - b1) * gO;
    adam.mA = b1 * adam.mA + (1 - b1) * gA;
    adam.mG = b1 * adam.mG + (1 - b1) * gG;
    adam.mB = b1 * adam.mB + (1 - b1) * gB;
    adam.vO = b2 * adam.vO + (1 - b2) * gO ** 2;
    adam.vA = b2 * adam.vA + (1 - b2) * gA ** 2;
    adam.vG = b2 * adam.vG + (1 - b2) * gG ** 2;
    adam.vB = b2 * adam.vB + (1 - b2) * gB ** 2;
    const bc1 = 1 - b1 ** iter, bc2 = 1 - b2 ** iter;
    omega += lr * (adam.mO / bc1) / (Math.sqrt(adam.vO / bc2) + eps);
    alpha += lr * (adam.mA / bc1) / (Math.sqrt(adam.vA / bc2) + eps);
    gamma += lr * (adam.mG / bc1) / (Math.sqrt(adam.vG / bc2) + eps);
    beta  += lr * (adam.mB / bc1) / (Math.sqrt(adam.vB / bc2) + eps);

    // Project onto feasible set after each step
    ({ omega, alpha, gamma, beta } = project(omega, alpha, gamma, beta));

    if (Math.abs(ll - prevLL) < tol && iter > 50) break;
    prevLL = ll;
  }

  const condVar = computeCondVar(returns, omega, alpha, gamma, beta);
  const persistence = alpha + beta + gamma / 2;
  const longRunVar = persistence < 0.9999
    ? Math.max(omega / (1 - persistence), 1e-8)
    : Math.max(variance(returns), 1e-8);
  const { ll } = score(returns, omega, alpha, gamma, beta);

  return {
    omega, alpha, gamma, beta,
    condVar,
    longRunVar,
    persistence,
    leverageRatio: alpha > 1e-10 ? gamma / alpha : 0,
    logLikelihood: ll,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GARCH Term Structure — multi-horizon variance forecasts
//
// Closed-form cumulative variance for horizon H (Engle & Bollerslev, 1986):
//
//   φ = α + β + γ/2
//   E[h_{t+k}] = σ²_LR + φ^k·(h_t − σ²_LR)
//
//   If φ ≠ 1:
//     Var[r_{t,t+H}] = H·σ²_LR + (h_t − σ²_LR)·φ·(1 − φ^H)/(1 − φ)
//   If φ = 1 (IGARCH):
//     Var[r_{t,t+H}] = H·h_t
//
// Returns:
//   {
//     stepForecasts:   h_{t+1}, ..., h_{t+H}   (per-step variance)
//     cumulativeVar:   Var[r_{t,t+H}]           (total variance over horizon)
//     annualizedVol:   annualised σ for horizon H (assuming T=252 trading days/year)
//   }
// ─────────────────────────────────────────────────────────────────────────────
export function garchTermStructure(garch, horizonDays, tradingDaysPerYear = 252) {
  const { condVar, longRunVar, persistence: phi, omega } = garch;
  const h0 = Math.max(condVar[condVar.length - 1], 1e-10);

  const stepForecasts = [];
  for (let k = 1; k <= horizonDays; k++) {
    const hk = longRunVar + phi ** k * (h0 - longRunVar);
    stepForecasts.push(Math.max(hk, 1e-10));
  }

  let cumulativeVar;
  if (Math.abs(phi - 1) < 1e-6) {
    // IGARCH: linear scaling
    cumulativeVar = horizonDays * h0;
  } else {
    cumulativeVar = horizonDays * longRunVar
      + (h0 - longRunVar) * phi * (1 - phi ** horizonDays) / (1 - phi);
  }
  cumulativeVar = Math.max(cumulativeVar, 1e-10);

  // Annualise: σ_annual = σ_daily × √(252)
  // Horizon vol: σ_H = √(cumulativeVar) [already in daily² units]
  // Annualised equivalent: √(cumulativeVar × (252/H)) — for comparison only
  const horizonVol = Math.sqrt(cumulativeVar);
  const annualizedVol = Math.sqrt(cumulativeVar * (tradingDaysPerYear / horizonDays));

  return { stepForecasts, cumulativeVar, horizonVol, annualizedVol };
}

// ─────────────────────────────────────────────────────────────────────────────
// Monte Carlo simulation with GJR-GARCH variance paths
// (Used for VaR/ES estimation, not for point prediction)
// ─────────────────────────────────────────────────────────────────────────────
export function gjrGarchMC(S0, drift, garch, horizon = 22, nPaths = 500) {
  const { omega, alpha, gamma, beta, condVar } = garch;
  const h0 = Math.max(condVar[condVar.length - 1], 1e-10);

  return Array.from({ length: nPaths }, () => {
    const path = [S0];
    let ht = h0;
    let prevEps = Math.sqrt(h0) * (Math.random() < 0.5 ? 1 : -1); // init eps

    for (let t = 1; t <= horizon; t++) {
      const indNeg = prevEps < 0 ? 1 : 0;
      ht = Math.max(omega + alpha * prevEps ** 2 + gamma * prevEps ** 2 * indNeg + beta * ht, 1e-10);
      const eps = Math.sqrt(ht) * (Math.random() < 0.5
        ? Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())
        : Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random()));
      prevEps = eps;
      path.push(Math.max(path[path.length - 1] * Math.exp(drift - 0.5 * ht + eps), 0.001));
    }
    return path;
  });
}
