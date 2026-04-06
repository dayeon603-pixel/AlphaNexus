# AlphaNexus — Quant Signal Overlay

> A Chrome browser extension that injects a floating quantitative analysis overlay into Yahoo Finance, MarketWatch, and Google Finance. Shows multi-timeframe directional predictions, confidence intervals, regime state, and risk metrics — computed from real market data using professional-grade quant models.

---

## What It Does

AlphaNexus detects the ticker on the current page and runs a full quant pipeline in the background. Results appear as a draggable overlay widget:

```
┌─────────────────────────────────────────┐
│ ◈ ALPHA NEXUS              [↺] [−] [×] │
│ AAPL · $213.24                          │
├─────────────────────────────────────────┤
│ TIMEFRAME  SIGNAL   MOVE    CI 68%  CONF│
│ 1 MIN      ↑ BUY   +0.08%  ±0.3%   65%│
│ 1 HOUR     ↑ BUY   +0.31%  ±1.1%   68%│
│ 1 DAY      ↑ BUY   +0.52%  ±2.4%   61%│
│ 1 WEEK     → HOLD  +0.84%  ±5.2%   54%│
│ 1 MONTH    ↑ BUY   +3.10%  ±11%    60%│
├─────────────────────────────────────────┤
│ REGIME: BULL 74%  │ RSI: 58  │ ATR: 1.2%│
│ GARCH VOL: 21.4%  │ Leverage: 1.31×     │
│ Sharpe: 1.24      │ Max DD: −18.2%      │
└─────────────────────────────────────────┘
```

All data is fetched from the Yahoo Finance v8 Chart API. All computation runs in the extension's background service worker — no external servers, no data collection.

---

## Quant Models

### GJR-GARCH(1,1) — Volatility

Captures asymmetric volatility (leverage effect): negative shocks increase volatility more than positive shocks of equal magnitude.

$$h_t = \omega + \alpha \varepsilon_{t-1}^2 + \gamma \varepsilon_{t-1}^2 \mathbf{1}[\varepsilon_{t-1} < 0] + \beta h_{t-1}$$

Fitted via MLE using the Adam optimiser with analytical score functions (gradient of Gaussian log-likelihood via recursive derivative equations). No coordinate search heuristics.

**Term structure** for multi-horizon variance (Engle & Bollerslev 1986):

$$\mathbb{E}[h_{t+k}] = \sigma^2_{LR} + \varphi^k (h_t - \sigma^2_{LR}), \quad \varphi = \alpha + \beta + \gamma/2$$

Cumulative variance for horizon $H$ is computed in closed form — no simulation required.

### HMM — Regime Detection

Two-state Hidden Markov Model (Bull / Bear) fitted via Baum-Welch EM on daily log returns.

Initialisation uses variance-sorting: the bottom 60% of observations by absolute return are assigned to the Bull state (low-volatility regime). This is economically justified — bull markets exhibit lower volatility than bear markets — and produces more stable EM convergence than arbitrary index splitting.

Regime probability is propagated forward using the transition matrix to give regime forecasts at each horizon.

### Signals — TSMOM, OU, VWAP

Three orthogonal signal sources combined via IC-weighting:

**Time-Series Momentum (TSMOM)** — Moskowitz, Ooi & Pedersen (2012):

$$s_t = \text{sign}(r_{t-12m,\,t-1m}) \times \frac{\sigma_{\text{target}}}{\hat{\sigma}_t}$$

Volatility-scaled to target annualised vol of 40%.

**Ornstein-Uhlenbeck Mean Reversion:**

$$\Delta X_t = a + b X_{t-1} + \varepsilon_t$$

Fitted via OLS. Half-life $= \ln(2)/\kappa$ where $\kappa = -\ln(1 + b)$. Positions expressed as a z-score of the deviation from the OU equilibrium.

**VWAP Deviation** (intraday, when minute data available): z-score of close relative to rolling VWAP, using volume-weighted average price.

### IC-Weighted Ensemble

Signals are combined proportionally to their rolling information coefficients (rank correlation with subsequent returns):

$$w_k = \frac{|IC_k|}{\sum_j |IC_j|}$$

This downweights signals whose recent predictive power has degraded.

### Risk Metrics

Full risk profile computed from daily returns and price series:

| Metric | Formula |
|---|---|
| Sharpe | $(E[r] - r_f) / \sigma \cdot \sqrt{252}$ |
| Sortino | $(E[r] - r_f) / \sigma_{\text{downside}} \cdot \sqrt{252}$ |
| Calmar | Annualised return / Max drawdown |
| VaR 95% | 5th percentile of historical return distribution |
| CVaR 95% | Mean of returns below VaR 95% |
| Omega | $\sum r^+ / \sum |r^-|$ |

---

## Architecture

Chrome Extension Manifest v3. Three separate JS bundles, zero external dependencies at runtime.

```
src/
├── background.js          Service worker: pipeline runner, 5-min TTL cache
├── data/fetcher.js        Yahoo Finance v8 Chart API + URL ticker detection
├── engine/
│   ├── math.js            Numerical utilities (logReturns, percentile, etc.)
│   ├── garch.js           GJR-GARCH MLE + term structure
│   ├── hmm.js             Baum-Welch HMM + regime forecast
│   ├── signals.js         TSMOM, OU, VWAP, RSI, ATR, IC-ensemble, Kelly
│   ├── forecast.js        Multi-timeframe forecast engine
│   └── risk.js            Full risk metrics
└── widget/
    ├── index.js           Content script: inject, SPA nav detection
    ├── widget.js          Pure-DOM overlay renderer (no React)
    └── widget.css         Styles scoped under #alpha-nexus-root
public/
├── popup.html             Extension popup UI
└── popup.js              Status, force-refresh, auto-analyse toggle
```

**Why a service worker?** Yahoo Finance API calls require CORS-safe requests that content scripts cannot make directly. The service worker runs in the extension context and can fetch any permitted host. Results are cached in `chrome.storage.session` with a 5-minute TTL.

**Why pure DOM (no React)?** The content script is injected into third-party pages. Bundling React would increase the payload from ~15 kB to ~150 kB, and React's reconciliation overhead is unnecessary for a widget that updates at most once per page load.

**SPA navigation:** Yahoo Finance is a React SPA. URL changes do not trigger full page reloads. A `MutationObserver` on `document.body` detects URL changes and re-runs ticker detection and analysis automatically.

---

## Supported Sites

| Site | URL Pattern |
|---|---|
| Yahoo Finance | `finance.yahoo.com/quote/*` |
| MarketWatch | `marketwatch.com/investing/stock/*` |
| Google Finance | `google.com/finance/quote/*` |

---

## Installation

### From Source

```bash
git clone git@github.com:dayeon603-pixel/AlphaNexus.git
cd AlphaNexus
npm install
npm run build      # outputs to dist/
```

Load in Chrome: `chrome://extensions` → **Load unpacked** → select the `dist/` folder.

### Dependencies

```json
{
  "devDependencies": {
    "webpack": "5.x",
    "webpack-cli": "5.x",
    "babel-loader": "9.x",
    "@babel/preset-env": "7.x",
    "css-loader": "6.x",
    "mini-css-extract-plugin": "2.x",
    "copy-webpack-plugin": "11.x"
  }
}
```

No runtime dependencies — all quant models are implemented from scratch in vanilla JS.

---

## Data Source

Yahoo Finance v8 Chart API:

```
GET https://query1.finance.yahoo.com/v8/finance/chart/{ticker}
    ?interval={1m|1h|1d|1wk|1mo}&range={5d|60d|2y|5y|10y}
```

Five timeframes fetched per analysis:
- **Minute** (1m, 5d) — ~1950 bars, intraday signals
- **Hourly** (1h, 60d) — ~480 bars, short-term forecast
- **Daily** (1d, 2y) — ~504 bars, core model fitting
- **Weekly** (1wk, 5y) — ~260 bars, medium-term context
- **Monthly** (1mo, 10y) — ~120 bars, long-run vol baseline

Minute and hourly data are fetched best-effort; if unavailable (illiquid tickers, weekends), only daily/weekly/monthly forecasts are shown.

---

## Author

Dayeon Kang — quant researcher, developer
