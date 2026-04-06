/**
 * AlphaNexus popup — communicates with the active tab's content script
 * and the background service worker.
 *
 * Actions:
 *   - Detect current ticker from the active tab URL.
 *   - Show widget status (active / loading / error / not a stock page).
 *   - Trigger a force-refresh analysis.
 *   - Show the widget if it was hidden.
 *   - Persist "auto-analyse" preference via chrome.storage.local.
 */

// ─────────────────────────────────────────────────────────────────────────────
// DOM refs
// ─────────────────────────────────────────────────────────────────────────────
const tickerSection = document.getElementById('ticker-section');
const cacheInfo     = document.getElementById('cache-info');
const statusDot     = document.getElementById('status-dot');
const statusText    = document.getElementById('status-text');
const btnRefresh    = document.getElementById('btn-refresh');
const btnShow       = document.getElementById('btn-show');
const toggleAuto    = document.getElementById('toggle-auto');
const extVersion    = document.getElementById('ext-version');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function detectTickerFromURL(url) {
  let m = url.match(/finance\.yahoo\.com\/quote\/([A-Z0-9.^-]+)/i);
  if (m) return m[1].toUpperCase();

  m = url.match(/marketwatch\.com\/investing\/(?:stock|fund|etf)\/([a-z0-9.-]+)/i);
  if (m) return m[1].toUpperCase();

  m = url.match(/google\.com\/finance\/quote\/([A-Z0-9.^-]+)(?::|\/|$)/i);
  if (m) return m[1].toUpperCase();

  return null;
}

function setStatus(state, text) {
  statusDot.className = 'status-dot ' + (state || '');
  statusText.textContent = text;
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialise popup
// ─────────────────────────────────────────────────────────────────────────────
async function init() {
  // Extension version
  const manifest = chrome.runtime.getManifest();
  extVersion.textContent = `v${manifest.version}`;

  // Load auto-analyse preference
  const prefs = await chrome.storage.local.get('autoAnalyse');
  toggleAuto.checked = prefs.autoAnalyse !== false; // default true

  // Query active tab
  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch {
    setStatus('error', 'Cannot access active tab');
    return;
  }

  const ticker = tab?.url ? detectTickerFromURL(tab.url) : null;

  if (!ticker) {
    setStatus('', 'Not a stock page');
    tickerSection.innerHTML = `<div class="ticker-none">Navigate to a supported stock page</div>`;
    return;
  }

  // Show ticker
  tickerSection.innerHTML = `
    <div class="ticker-display">
      <span class="ticker-sym">${ticker}</span>
    </div>`;
  btnRefresh.disabled = false;

  // Check cache for this ticker
  try {
    const key = `alphaNexus_${ticker}`;
    const stored = await chrome.storage.session.get(key);
    const entry = stored[key];
    if (entry?.result) {
      const result = entry.result;
      const price  = result.currentPrice;
      if (price) {
        tickerSection.innerHTML = `
          <div class="ticker-display">
            <span class="ticker-sym">${ticker}</span>
            <span class="ticker-price">$${price.toFixed(2)}</span>
          </div>`;
      }
      const age = timeAgo(entry.timestamp);
      cacheInfo.innerHTML = `Cached · <span>${age}</span> · ${result.dataQuality?.dailyBars ?? '?'} daily bars`;
      setStatus('active', 'Analysis ready');
    } else {
      setStatus('', 'No cached data — click Refresh');
    }
  } catch {
    setStatus('', 'Status unknown');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Force-refresh
// ─────────────────────────────────────────────────────────────────────────────
btnRefresh.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const ticker = tab?.url ? detectTickerFromURL(tab.url) : null;
  if (!ticker) return;

  btnRefresh.disabled = true;
  setStatus('loading', `Fetching ${ticker}…`);
  cacheInfo.textContent = '';

  try {
    const resp = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'ANALYZE_TICKER', ticker, forceRefresh: true },
        (r) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          resolve(r);
        }
      );
    });

    if (!resp?.ok) throw new Error(resp?.error || 'Analysis failed');

    const price = resp.data?.currentPrice;
    tickerSection.innerHTML = `
      <div class="ticker-display">
        <span class="ticker-sym">${ticker}</span>
        ${price ? `<span class="ticker-price">$${price.toFixed(2)}</span>` : ''}
      </div>`;
    cacheInfo.innerHTML = `Fresh · <span>just now</span> · ${resp.data?.dataQuality?.dailyBars ?? '?'} daily bars`;
    setStatus('active', 'Analysis ready');

    // Ask content script to re-render with fresh data
    chrome.tabs.sendMessage(tab.id, { action: 'RENDER_FRESH', ticker, data: resp.data });
  } catch (err) {
    setStatus('error', err.message);
  } finally {
    btnRefresh.disabled = false;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Show widget (in case user closed it)
// ─────────────────────────────────────────────────────────────────────────────
btnShow.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { action: 'SHOW_WIDGET' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Auto-analyse toggle
// ─────────────────────────────────────────────────────────────────────────────
toggleAuto.addEventListener('change', () => {
  chrome.storage.local.set({ autoAnalyse: toggleAuto.checked });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
init();
