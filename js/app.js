// Entry: route table, initial route, theme, language, offline banner.

import { route, startRouter, refresh, go } from './router.js';
import { mountOverlays } from './overlays.js';
import { mountDevPanel } from './devpanel.js';
import { store, isOffline } from './store.js';
import { contentLang } from './i18n.js';
import { t } from './i18n.js';
import { banner } from './components.js';
import { chrome } from './icons.js';
import { Launcher } from './screens/launcher.js';
import * as O from './screens/driver-onboarding.js';
import * as T from './screens/driver-trip.js';
import * as E from './screens/driver-edge.js';

const phone = document.querySelector('.phone');
const viewport = phone.querySelector('.viewport');

// Mock status bar glyphs
phone.querySelector('.statusbar__icons').innerHTML = chrome.signal + chrome.wifi + chrome.battery;

mountOverlays({
  phoneEl: phone,
  layerEl: phone.querySelector('.overlay-layer'),
  toastEl: phone.querySelector('.toast-region'),
  viewportEl: viewport,
});

// ---- Routes (frame code = route id) ----
route('/', Launcher);
route('/driver/', O.Splash);
route('/driver/splash', O.Splash);
route('/driver/O1', O.O1);
route('/driver/O2', O.O2);
route('/driver/O3', O.O3);
route('/driver/O4', O.O4);
route('/driver/O5', O.O5);
route('/driver/O5b', O.O5);
route('/driver/O6', O.O6);
route('/driver/O7', O.O7);
route('/driver/O7b', O.O8);
route('/driver/O8', O.O8);
route('/driver/O8c', O.O8);
route('/driver/O9', O.O9);
route('/driver/O10', O.O10);
route('/driver/O11', O.O11);
route('/driver/O12a', O.O12a);
route('/driver/O12b', O.O12b);
route('/driver/O12c', O.O12c);
route('/driver/O13', O.O13);
route('/driver/O14', O.O14);
route('/driver/T1', T.T1);
route('/driver/T2s', T.T1);
route('/driver/T3', T.T3);
route('/driver/T4', T.T4);
route('/driver/T4b', T.T4b);
route('/driver/T5', T.T5);
route('/driver/T5b', T.T5b);
route('/driver/W1', T.W1);
route('/driver/T6', T.T6);
route('/driver/T7', T.T7);
route('/driver/T8', T.T8);
route('/driver/T9', T.T9);
route('/driver/T10', T.T10);
route('/driver/T11', T.T10);
route('/driver/T12', T.T12);
route('/driver/T13', T.T12);
route('/driver/T14', T.T14);
route('/driver/T15', T.T15);
route('/driver/T16', T.T16);
route('/driver/E0', E.E0);
route('/driver/E5', E.E5);
route('/driver/E6b', E.E6b);
route('/driver/E8', E.E8);
route('/driver/E10', E.E10);
route('/driver/E12', E.E12);
route('/driver/E14', E.E14);
route('/driver/E15', E.E15);

// ---- Theme, language, offline ----
function applySettings() {
  const s = store.settings();
  phone.dataset.theme = s.theme;
  const lang = contentLang();
  phone.setAttribute('lang', lang);
  document.documentElement.setAttribute('lang', lang);
}

function renderOffline(scope = viewport) {
  const slot = scope.querySelector('.screen:last-child .offline-slot') || scope.querySelector('.offline-slot');
  if (!slot) return;
  slot.replaceChildren(...(isOffline() ? [banner({ tone: 'offline', iconName: 'wifioff', text: t('common.offline') })] : []));
}

let last = { ...store.settings() };
store.subscribe((state, branch) => {
  if (branch === 'reset') {
    applySettings();
    last = { ...state.settings };
    return;
  }
  if (branch !== 'settings') return;
  const s = state.settings;
  applySettings();
  if (s.lang !== last.lang) refresh();
  if (s.simulateOffline !== last.simulateOffline) renderOffline();
  last = { ...s };
});

window.addEventListener('online', () => renderOffline());
window.addEventListener('offline', () => renderOffline());

// ---- Device size: always 402 × 874 (iPhone 17 Pro); scale the whole frame to fit ----
const PHONE_W = 402;
const PHONE_H = 874;
function fitPhone() {
  if (window.innerWidth <= 520) {
    phone.style.zoom = '';
    phone.dataset.zoom = '1';
    return;
  }
  const panelBeside = window.innerWidth > 860;
  const availH = window.innerHeight - 48;
  const availW = window.innerWidth - 48 - (panelBeside ? 280 + 32 : 0);
  const s = Math.min(1, availH / (PHONE_H + 22), availW / (PHONE_W + 22));
  phone.style.zoom = s < 1 ? String(Math.round(s * 1000) / 1000) : '';
  phone.dataset.zoom = String(s < 1 ? s : 1);
}
window.addEventListener('resize', fitPhone);
fitPhone();

applySettings();
mountDevPanel(document.querySelector('.devpanel'), phone);

startRouter({
  viewportEl: viewport,
  onRender(view) {
    phone.dataset.chrome = view.chrome || '';
    const slot = view.el.querySelector('.offline-slot');
    if (slot && isOffline()) slot.append(banner({ tone: 'offline', iconName: 'wifioff', text: t('common.offline') }));
  },
});

// Keep an unknown deep link from showing a blank phone
if (!location.hash) go('/', { replace: true });
