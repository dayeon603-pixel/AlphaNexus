/**
 * Content script — injected into Yahoo Finance, MarketWatch, Google Finance.
 *
 * Responsibilities:
 *   1. Detect ticker from URL.
 *   2. Request analysis from background service worker.
 *   3. Inject and manage the AlphaNexus overlay widget.
 *   4. Re-run on SPA navigation (Yahoo Finance uses React router).
 */

import './widget.css';
import { renderWidget, destroyWidget } from './widget.js';
import { detectTickerFromURL } from '../data/fetcher.js';

let currentTicker = null;
let widgetRoot = null;

// ─────────────────────────────────────────────────────────────────────────────
// Request analysis from background service worker
// ─────────────────────────────────────────────────────────────────────────────
function requestAnalysis(ticker, forceRefresh = false) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'ANALYZE_TICKER', ticker, forceRefresh },
      (resp) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (!resp) return reject(new Error('No response from background'));
        if (!resp.ok) return reject(new Error(resp.error || 'Analysis failed'));
        resolve(resp.data);
      }
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main: detect ticker and run
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const ticker = detectTickerFromURL(window.location.href);
  if (!ticker) return;
  if (ticker === currentTicker && widgetRoot) return; // already rendered

  currentTicker = ticker;

  // Mount widget in loading state
  if (!widgetRoot) {
    widgetRoot = document.createElement('div');
    widgetRoot.id = 'alpha-nexus-root';
    document.body.appendChild(widgetRoot);
  }

  renderWidget(widgetRoot, { state: 'loading', ticker });

  try {
    const data = await requestAnalysis(ticker);
    renderWidget(widgetRoot, { state: 'ready', ticker, data });
  } catch (err) {
    renderWidget(widgetRoot, { state: 'error', ticker, error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SPA navigation detection (Yahoo Finance is a React SPA)
// ─────────────────────────────────────────────────────────────────────────────
let lastURL = window.location.href;

const observer = new MutationObserver(() => {
  if (window.location.href !== lastURL) {
    lastURL = window.location.href;
    currentTicker = null; // force re-render on ticker change
    main();
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// Initial run
main();

// ─────────────────────────────────────────────────────────────────────────────
// Messages from popup
// ─────────────────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'SHOW_WIDGET' && widgetRoot) {
    widgetRoot.style.display = '';
  }
  if (msg.action === 'RENDER_FRESH' && msg.ticker && msg.data) {
    if (widgetRoot) {
      renderWidget(widgetRoot, { state: 'ready', ticker: msg.ticker, data: msg.data });
    }
  }
});
