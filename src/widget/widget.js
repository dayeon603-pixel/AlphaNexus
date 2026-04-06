/**
 * AlphaNexus overlay widget — renders into an injected DOM node.
 *
 * Layout:
 *   ┌─────────────────────────────────────────┐
 *   │ ◈ ALPHA NEXUS          [↺] [−] [×]     │  ← header
 *   │ AAPL · $213.24                          │
 *   ├─────────────────────────────────────────┤
 *   │ TIMEFRAME  DIR    MOVE     CI68   CONF  │  ← forecast table
 *   │ 1 MIN      ↑ BUY  +0.08%  ±0.3%   65%  │
 *   │ 1 HOUR     ↑ BUY  +0.31%  ±1.1%   68%  │
 *   │ 1 DAY      ↑ BUY  +0.52%  ±2.4%   61%  │
 *   │ 1 WEEK     → HOLD +0.84%  ±5.2%   54%  │
 *   │ 1 MONTH    ↑ BUY  +3.10%  ±11%    60%  │
 *   ├─────────────────────────────────────────┤
 *   │ REGIME: BULL 74%  │ RSI: 58  │ ATR: 1.2%│  ← regime bar
 *   │ GJR-GARCH vol: 21.4% (persist. 0.97)   │
 *   │ Sharpe: 1.24  │ MaxDD: −18.2%           │
 *   └─────────────────────────────────────────┘
 *
 * No React dependency — pure DOM manipulation for minimal bundle size.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Colour helpers
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = {
  bg:         '#04090f',
  bgPanel:    '#060e1a',
  bgRow:      '#070d17',
  border:     '#0c1824',
  text:       '#c8d8e8',
  textDim:    '#2a4560',
  textMid:    '#4a7090',
  buy:        '#00e8a2',
  sell:       '#ff4060',
  hold:       '#f0c040',
  blue:       '#4a9aff',
  accent:     '#0a6aff',
  bull:       '#00e8a2',
  bear:       '#ff4060',
};

const dirColor  = (d) => d === 'BUY' ? COLORS.buy : d === 'SELL' ? COLORS.sell : COLORS.hold;
const dirArrow  = (d) => d === 'BUY' ? '↑' : d === 'SELL' ? '↓' : '→';
const pctColor  = (v) => v > 0 ? COLORS.buy : v < 0 ? COLORS.sell : COLORS.textMid;
const fmtPct    = (v) => (v > 0 ? '+' : '') + v.toFixed(2) + '%';
const fmtConf   = (v) => Math.round(v * 100) + '%';

// ─────────────────────────────────────────────────────────────────────────────
// State manager — avoid full re-render on every update
// ─────────────────────────────────────────────────────────────────────────────
let _minimised = false;
let _onRefresh = null;

// ─────────────────────────────────────────────────────────────────────────────
// Build widget HTML (called once; updates patch in-place)
// ─────────────────────────────────────────────────────────────────────────────
function buildShell(root) {
  root.innerHTML = `
    <div class="an-widget" id="an-widget">
      <div class="an-header">
        <span class="an-logo">◈ ALPHA NEXUS</span>
        <div class="an-header-controls">
          <button class="an-btn" id="an-refresh" title="Refresh">↺</button>
          <button class="an-btn" id="an-toggle"  title="Minimise">−</button>
          <button class="an-btn" id="an-close"   title="Close">×</button>
        </div>
      </div>
      <div id="an-body" class="an-body">
        <div class="an-ticker-row" id="an-ticker-row"></div>
        <div id="an-content"></div>
      </div>
    </div>`;

  // Drag to reposition
  makeDraggable(root.querySelector('.an-widget'));

  // Controls
  root.querySelector('#an-toggle').addEventListener('click', () => {
    _minimised = !_minimised;
    root.querySelector('#an-body').style.display = _minimised ? 'none' : '';
    root.querySelector('#an-toggle').textContent = _minimised ? '+' : '−';
  });
  root.querySelector('#an-close').addEventListener('click', () => {
    root.style.display = 'none';
  });
  root.querySelector('#an-refresh').addEventListener('click', () => {
    if (_onRefresh) _onRefresh();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Render states
// ─────────────────────────────────────────────────────────────────────────────
function renderLoading(root, ticker) {
  const tr = root.querySelector('#an-ticker-row');
  if (tr) tr.innerHTML = `<span class="an-ticker">${ticker}</span>`;
  const c = root.querySelector('#an-content');
  if (c) c.innerHTML = `<div class="an-loading">
    <span class="an-pulse">Fetching live data · Running GJR-GARCH · HMM · TSMOM…</span>
  </div>`;
}

function renderError(root, ticker, error) {
  const tr = root.querySelector('#an-ticker-row');
  if (tr) tr.innerHTML = `<span class="an-ticker">${ticker}</span>`;
  const c = root.querySelector('#an-content');
  if (c) c.innerHTML = `<div class="an-error">✕ ${error}</div>`;
}

function renderReady(root, ticker, data) {
  const { currentPrice, forecasts, garch, hmm, risk, indicators } = data;

  // Ticker row
  const tr = root.querySelector('#an-ticker-row');
  if (tr) {
    tr.innerHTML = `
      <span class="an-ticker">${ticker}</span>
      <span class="an-price">$${currentPrice.toFixed(2)}</span>`;
  }

  // Forecast table
  const rows = forecasts.map((f) => {
    const dc = dirColor(f.direction);
    const ci = f.ci68 ? `±${Math.abs(f.ci68[1] - f.predictedPct).toFixed(1)}%` : '—';
    const bar = confidenceBar(f.confidence);
    return `
      <tr class="an-row">
        <td class="an-tf">${f.timeframe}</td>
        <td style="color:${dc};font-weight:700">${dirArrow(f.direction)} ${f.direction}</td>
        <td style="color:${pctColor(f.predictedPct)}">${fmtPct(f.predictedPct)}</td>
        <td class="an-ci">${ci}</td>
        <td>${bar}<span class="an-conf">${fmtConf(f.confidence)}</span></td>
      </tr>`;
  }).join('');

  // Regime indicator
  const regColor = hmm.regime === 'BULL' ? COLORS.bull : COLORS.bear;
  const sharpeColor = risk.sharpe > 1 ? COLORS.buy : risk.sharpe > 0 ? COLORS.hold : COLORS.sell;

  const c = root.querySelector('#an-content');
  if (!c) return;
  c.innerHTML = `
    <table class="an-table">
      <thead>
        <tr class="an-thead">
          <th>TIMEFRAME</th><th>SIGNAL</th><th>MOVE</th><th>CI 68%</th><th>CONF</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="an-metrics-row">
      <div class="an-chip">
        <div class="an-chip-label">REGIME</div>
        <div class="an-chip-val" style="color:${regColor}">${hmm.regime} ${Math.round(hmm.bullProb * 100)}%</div>
      </div>
      <div class="an-chip">
        <div class="an-chip-label">RSI</div>
        <div class="an-chip-val" style="color:${rsiColor(indicators.rsi)}">${indicators.rsi}</div>
      </div>
      <div class="an-chip">
        <div class="an-chip-label">ATR %</div>
        <div class="an-chip-val" style="color:${COLORS.blue}">${indicators.atrPct}%</div>
      </div>
    </div>

    <div class="an-metrics-row">
      <div class="an-chip">
        <div class="an-chip-label">GARCH VOL</div>
        <div class="an-chip-val" style="color:${COLORS.blue}">${garch.garchVolPct}%</div>
        <div class="an-chip-sub">persist ${garch.persistence}</div>
      </div>
      <div class="an-chip">
        <div class="an-chip-label">LEVERAGE γ/α</div>
        <div class="an-chip-val" style="color:${garch.leverageRatio > 1.2 ? COLORS.sell : COLORS.textMid}">${garch.leverageRatio.toFixed(2)}×</div>
        <div class="an-chip-sub">GJR asymmetry</div>
      </div>
      <div class="an-chip">
        <div class="an-chip-label">SHARPE</div>
        <div class="an-chip-val" style="color:${sharpeColor}">${risk.sharpe.toFixed(2)}</div>
        <div class="an-chip-sub">annualised</div>
      </div>
      <div class="an-chip">
        <div class="an-chip-label">MAX DD</div>
        <div class="an-chip-val" style="color:${COLORS.sell}">−${risk.mddPct.toFixed(1)}%</div>
      </div>
    </div>

    <div class="an-footer">
      GJR-GARCH + HMM + TSMOM + IC-Weighted Ensemble · ${data.dataQuality.dailyBars} daily bars
      ${data.cached ? ' · cached' : ''}
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
export function renderWidget(root, { state, ticker, data, error, onRefresh }) {
  if (onRefresh) _onRefresh = onRefresh;

  // Build shell on first render
  if (!root.querySelector('.an-widget')) {
    buildShell(root);
  }

  switch (state) {
    case 'loading': renderLoading(root, ticker); break;
    case 'error':   renderError(root, ticker, error); break;
    case 'ready':   renderReady(root, ticker, data); break;
  }
}

export function destroyWidget(root) {
  root.innerHTML = '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function rsiColor(v) {
  if (v <= 30) return COLORS.buy;
  if (v >= 70) return COLORS.sell;
  return COLORS.textMid;
}

function confidenceBar(conf) {
  const filled = Math.round(conf * 10); // out of 10 blocks
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  const c = conf > 0.66 ? COLORS.buy : conf > 0.55 ? COLORS.hold : COLORS.textDim;
  return `<span style="color:${c};font-size:8px;letter-spacing:1px;font-family:monospace">${bar}</span> `;
}

function makeDraggable(el) {
  let ox = 0, oy = 0, mx = 0, my = 0;
  const header = el.querySelector('.an-header');
  if (!header) return;

  header.style.cursor = 'grab';
  header.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('an-btn')) return;
    mx = e.clientX; my = e.clientY;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  function onMove(e) {
    ox = mx - e.clientX; oy = my - e.clientY;
    mx = e.clientX; my = e.clientY;
    el.style.top  = (el.offsetTop  - oy) + 'px';
    el.style.left = (el.offsetLeft - ox) + 'px';
    el.style.right = 'auto'; el.style.bottom = 'auto';
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
}
