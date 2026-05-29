/**
 * @jest-environment jsdom
 */
import { renderWidget, destroyWidget } from '../../src/widget/widget.js';

const mkRoot = () => document.createElement('div');
const MOCK_DATA = {
  currentPrice: 213.24,
  forecasts: [
    { timeframe: '1 DAY',   direction: 'BUY',  predictedPct: 0.52,  ci68: [0.22, 0.82],  confidence: 0.61 },
    { timeframe: '1 WEEK',  direction: 'SELL', predictedPct: -0.40, ci68: [-0.80, 0.00], confidence: 0.55 },
    { timeframe: '1 MONTH', direction: 'HOLD', predictedPct: 0.10,  ci68: [-0.90, 1.10], confidence: 0.52 },
  ],
  garch:       { garchVolPct: 21.4, persistence: 0.97, leverageRatio: 1.1 },
  hmm:         { regime: 'BULL', bullProb: 0.74 },
  risk:        { sharpe: 1.24, mddPct: 18.2 },
  indicators:  { rsi: 58, atrPct: 1.2 },
  dataQuality: { dailyBars: 252 },
  cached: false,
};

// ─── Shell creation (6) ───────────────────────────────────────────────────────
describe('shell creation', () => {
  test('creates .an-widget inside root', () => {
    const root = mkRoot();
    renderWidget(root, { state: 'loading', ticker: 'AAPL' });
    expect(root.querySelector('.an-widget')).not.toBeNull();
  });

  test('#an-close button exists', () => {
    const root = mkRoot();
    renderWidget(root, { state: 'loading', ticker: 'AAPL' });
    expect(root.querySelector('#an-close')).not.toBeNull();
  });

  test('#an-toggle button exists', () => {
    const root = mkRoot();
    renderWidget(root, { state: 'loading', ticker: 'AAPL' });
    expect(root.querySelector('#an-toggle')).not.toBeNull();
  });

  test('#an-refresh button exists', () => {
    const root = mkRoot();
    renderWidget(root, { state: 'loading', ticker: 'AAPL' });
    expect(root.querySelector('#an-refresh')).not.toBeNull();
  });

  test('calling renderWidget twice does not duplicate .an-widget', () => {
    const root = mkRoot();
    renderWidget(root, { state: 'loading', ticker: 'AAPL' });
    renderWidget(root, { state: 'loading', ticker: 'AAPL' });
    expect(root.querySelectorAll('.an-widget').length).toBe(1);
  });

  test('#an-body exists', () => {
    const root = mkRoot();
    renderWidget(root, { state: 'loading', ticker: 'AAPL' });
    expect(root.querySelector('#an-body')).not.toBeNull();
  });
});

// ─── Loading state (3) ───────────────────────────────────────────────────────
describe('loading state', () => {
  let root;
  beforeEach(() => {
    root = mkRoot();
    renderWidget(root, { state: 'loading', ticker: 'TSLA' });
  });

  test('ticker text appears in #an-ticker-row', () => {
    expect(root.querySelector('#an-ticker-row').textContent).toContain('TSLA');
  });

  test('.an-loading element exists', () => {
    expect(root.querySelector('.an-loading')).not.toBeNull();
  });

  test('.an-table is not present', () => {
    expect(root.querySelector('.an-table')).toBeNull();
  });
});

// ─── Error state (3) ─────────────────────────────────────────────────────────
describe('error state', () => {
  let root;
  beforeEach(() => {
    root = mkRoot();
    renderWidget(root, { state: 'error', ticker: 'GOOG', error: 'Rate limit exceeded' });
  });

  test('ticker text appears in #an-ticker-row', () => {
    expect(root.querySelector('#an-ticker-row').textContent).toContain('GOOG');
  });

  test('.an-error element contains error text', () => {
    const el = root.querySelector('.an-error');
    expect(el).not.toBeNull();
    expect(el.textContent).toContain('Rate limit exceeded');
  });

  test('.an-table is not present', () => {
    expect(root.querySelector('.an-table')).toBeNull();
  });
});

// ─── Ready state (9) ─────────────────────────────────────────────────────────
describe('ready state', () => {
  let root;
  beforeEach(() => {
    root = mkRoot();
    renderWidget(root, { state: 'ready', ticker: 'AAPL', data: MOCK_DATA });
  });

  test('.an-table exists', () => {
    expect(root.querySelector('.an-table')).not.toBeNull();
  });

  test('renders correct number of forecast rows', () => {
    expect(root.querySelectorAll('tr.an-row').length).toBe(3);
  });

  test('BUY direction shows ↑ arrow', () => {
    expect(root.querySelectorAll('tr.an-row')[0].textContent).toContain('↑');
  });

  test('SELL direction shows ↓ arrow', () => {
    expect(root.querySelectorAll('tr.an-row')[1].textContent).toContain('↓');
  });

  test('HOLD direction shows → arrow', () => {
    expect(root.querySelectorAll('tr.an-row')[2].textContent).toContain('→');
  });

  test('.an-metrics-row elements exist', () => {
    expect(root.querySelectorAll('.an-metrics-row').length).toBeGreaterThan(0);
  });

  test('.an-footer exists', () => {
    expect(root.querySelector('.an-footer')).not.toBeNull();
  });

  test('ticker text appears in #an-ticker-row', () => {
    expect(root.querySelector('#an-ticker-row').textContent).toContain('AAPL');
  });

  test('price formatted with $ in #an-ticker-row', () => {
    expect(root.querySelector('#an-ticker-row').textContent).toContain('$213.24');
  });
});

// ─── Controls (3) ────────────────────────────────────────────────────────────
describe('controls', () => {
  test('close button sets root.style.display to none', () => {
    const root = mkRoot();
    renderWidget(root, { state: 'loading', ticker: 'AAPL' });
    root.querySelector('#an-close').click();
    expect(root.style.display).toBe('none');
  });

  test('toggle button changes #an-body visibility and restores on second click', () => {
    const root = mkRoot();
    renderWidget(root, { state: 'loading', ticker: 'AAPL' });
    const body = root.querySelector('#an-body');
    const btn  = root.querySelector('#an-toggle');
    const before = body.style.display;
    btn.click();
    const after = body.style.display;
    expect(after).not.toBe(before);
    btn.click();
    expect(body.style.display).toBe(before);
  });

  test('refresh button calls onRefresh callback', () => {
    const root = mkRoot();
    const onRefresh = jest.fn();
    renderWidget(root, { state: 'loading', ticker: 'AAPL', onRefresh });
    root.querySelector('#an-refresh').click();
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

// ─── destroyWidget (2) ───────────────────────────────────────────────────────
describe('destroyWidget', () => {
  test('clears root innerHTML', () => {
    const root = mkRoot();
    renderWidget(root, { state: 'loading', ticker: 'AAPL' });
    destroyWidget(root);
    expect(root.innerHTML).toBe('');
  });

  test('.an-widget no longer present after destroyWidget', () => {
    const root = mkRoot();
    renderWidget(root, { state: 'loading', ticker: 'AAPL' });
    destroyWidget(root);
    expect(root.querySelector('.an-widget')).toBeNull();
  });
});
