// Prototype panel: outside the phone on desktop; on mobile it opens with a
// long-press on the status bar / top edge. Not part of the app UI.

import { store } from './store.js';
import { go, currentPath, refresh } from './router.js';
import { LANGUAGES } from './data.js';

const SCREENS = ['splash', 'O1', 'O2', 'O3', 'O4', 'O5', 'O5b', 'O6', 'O7', 'O7b', 'O8', 'O9', 'O10', 'O8c', 'O11', 'O12a', 'O12b', 'O12c', 'O13', 'O14',
  'T1', 'T3', 'T4', 'T4b', 'T5', 'T5b', 'W1', 'T6', 'T7', 'T8', 'T9', 'T10', 'T12', 'T14', 'T15', 'T16',
  'E0', 'E5', 'E6b', 'E8', 'E10', 'E12', 'E14', 'E15'];

export function mountDevPanel(panel, phone) {
  panel.innerHTML = `
    <button type="button" class="devpanel__btn devpanel__close" data-act="close">Close</button>
    <h2>Prototype panel</h2>
    <p class="devpanel__hint">Fixride Driver · 1 Sign up &amp; onboarding. Not part of the app.</p>

    <div class="devpanel__group">
      <span class="devpanel__label">Flow starts</span>
      <div class="devpanel__row">
        <a class="devpanel__btn" href="#/">App picker</a>
        <a class="devpanel__btn" href="#/driver/splash">Driver sign up</a>
        <a class="devpanel__btn" href="#/driver/T1">First trip (T1)</a>
        <a class="devpanel__btn" href="#/driver/E0">Edge cases (E0)</a>
      </div>
    </div>

    <div class="devpanel__group">
      <span class="devpanel__label">Screens</span>
      <div class="devpanel__links">
        ${SCREENS.map((c) => `<a class="devpanel__btn" href="#/driver/${c}" data-code="${c}">${c}</a>`).join('')}
      </div>
    </div>

    <div class="devpanel__group">
      <label class="devpanel__label" for="dp-lang">Language</label>
      <select id="dp-lang">
        ${LANGUAGES.map((l) => `<option value="${l.id}">${l.en} · ${l.native}</option>`).join('')}
      </select>
    </div>

    <div class="devpanel__group">
      <span class="devpanel__label">Theme</span>
      <div class="devpanel__row">
        <button type="button" class="devpanel__btn" data-theme-set="light">Light</button>
        <button type="button" class="devpanel__btn" data-theme-set="dark">Dark</button>
      </div>
    </div>

    <div class="devpanel__group">
      <span class="devpanel__label">Demo speed (timers)</span>
      <div class="devpanel__row">
        <button type="button" class="devpanel__btn" data-speed="1">1×</button>
        <button type="button" class="devpanel__btn" data-speed="10">10×</button>
      </div>
    </div>

    <div class="devpanel__group">
      <span class="devpanel__label">Network</span>
      <button type="button" class="devpanel__btn devpanel__btn--wide" data-act="offline">Simulate offline</button>
    </div>

    <div class="devpanel__group">
      <button type="button" class="devpanel__btn devpanel__btn--wide" data-act="reset">Reset all data</button>
      <p class="devpanel__hint">Clears what was typed, documents and language, then goes to the app picker.</p>
    </div>
  `;

  const lang = panel.querySelector('#dp-lang');
  lang.addEventListener('change', () => store.set('settings', { lang: lang.value }));

  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button, a');
    if (!b) return;
    if (b.dataset.themeSet) store.set('settings', { theme: b.dataset.themeSet });
    if (b.dataset.speed) store.set('settings', { demoSpeed: Number(b.dataset.speed) });
    if (b.dataset.act === 'offline') store.set('settings', { simulateOffline: !store.settings().simulateOffline });
    if (b.dataset.act === 'reset') {
      store.reset();
      if (currentPath() === '/') refresh();
      else go('/', { replace: true });
    }
    if (b.dataset.act === 'close' || b.tagName === 'A') panel.classList.remove('is-open');
  });

  function sync() {
    const s = store.settings();
    lang.value = s.lang;
    panel.querySelectorAll('[data-theme-set]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeSet === s.theme)));
    panel.querySelectorAll('[data-speed]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === s.demoSpeed)));
    panel.querySelector('[data-act="offline"]').setAttribute('aria-pressed', String(s.simulateOffline));
    const path = currentPath();
    panel.querySelectorAll('[data-code]').forEach((a) => {
      const on = path === `/driver/${a.dataset.code}` || path.startsWith(`/driver/${a.dataset.code}/`);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  store.subscribe(sync);
  window.addEventListener('hashchange', sync);
  sync();

  // Mobile: long-press the top edge of the phone to open the panel
  let timer = null;
  const start = (e) => {
    if (!e.target.closest('.statusbar, .topbar')) return;
    if (e.target.closest('button, a, input')) return;
    timer = setTimeout(() => panel.classList.add('is-open'), 600);
  };
  const cancel = () => clearTimeout(timer);
  phone.addEventListener('pointerdown', start);
  phone.addEventListener('pointerup', cancel);
  phone.addEventListener('pointerleave', cancel);
  phone.addEventListener('pointercancel', cancel);
}
