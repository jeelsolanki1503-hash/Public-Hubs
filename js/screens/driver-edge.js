// Driver · 3 Edge cases & failure states.
// E0 is a browsable index. Most other E screens reuse the T* and O* flows
// but with a specific state (pre-filled wrong code, offline banner, etc.).

import {
  h, ic, screen, pageHead, topBar, button, textLink, iconButton, iconTile,
  listRow, radioGroup, docRow, meter, infoCard, banner, stateIcon,
  directionBar, mapScene, timerRing, swipeConfirm, codeBoxes, keypad,
  fareHero, tripBrief, bagsRow,
} from '../components.js';
import { toast, sheet, dialog } from '../overlays.js';
import { go, back } from '../router.js';
import { store } from '../store.js';
import { t } from '../i18n.js';
import { countdown, after, timerBag } from '../clock.js';
import { mmss } from '../format.js';
import { TRIPS, DOCUMENTS, QUEUE, SUPPORT_PHONE, DRIVER } from '../data.js';
import { openSOS, openBadBags } from './driver-trip.js';

const D = (code) => `/driver/${code}`;
const driver = () => store.driver();
const work = () => store.work();
const reads = (...keys) => () => keys.map((k) => (typeof k === 'function' ? k() : t(k))).join('. ');

function setWork(patch) { store.set('work', patch); }
function docName(doc) {
  const cab = doc.cabNameKey && driver().vehicleType === 'cab';
  return t(cab ? doc.cabNameKey : doc.nameKey);
}

// ---------------------------------------------------------------- E0 index

const CASES = [
  { code: 'E1',  icon: 'clock',   titleKey: 'e0.e1.title',  subKey: 'e0.e1.sub' },
  { code: 'E2',  icon: 'x',       titleKey: 'e0.e2.title',  subKey: 'e0.e2.sub' },
  { code: 'E3',  icon: 'ret',     titleKey: 'e0.e3.title',  subKey: 'e0.e3.sub' },
  { code: 'E4',  icon: 'user',    titleKey: 'e0.e4.title',  subKey: 'e0.e4.sub' },
  { code: 'E5',  icon: 'clock',   titleKey: 'e0.e5.title',  subKey: 'e0.e5.sub' },
  { code: 'E7',  icon: 'bag',     titleKey: 'e0.e7.title',  subKey: 'e0.e7.sub' },
  { code: 'E8',  icon: 'alert',   titleKey: 'e0.e8.title',  subKey: 'e0.e8.sub' },
  { code: 'E9',  icon: 'sos',     titleKey: 'e0.e9.title',  subKey: 'e0.e9.sub' },
  { code: 'E10', icon: 'wifioff', titleKey: 'e0.e10.title', subKey: 'e0.e10.sub' },
  { code: 'E11', icon: 'bag',     titleKey: 'e0.e11.title', subKey: 'e0.e11.sub' },
  { code: 'E12', icon: 'help',    titleKey: 'e0.e12.title', subKey: 'e0.e12.sub' },
  { code: 'E13', icon: 'pin',     titleKey: 'e0.e13.title', subKey: 'e0.e13.sub' },
  { code: 'E14', icon: 'doc',     titleKey: 'e0.e14.title', subKey: 'e0.e14.sub' },
  { code: 'E15', icon: 'msg',     titleKey: 'e0.e15.title', subKey: 'e0.e15.sub' },
];

export function E0() {
  const rows = CASES.map((c) =>
    listRow({
      iconName: c.icon,
      iconTone: 'neutral',
      title: t(c.titleKey),
      sub: t(c.subKey),
      onClick: () => openCase(c.code),
    }),
  );
  const { el } = screen({
    code: 'E0',
    label: t('e0.title'),
    topbar: topBar({
      left: h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('e0.title')),
      listen: reads('e0.title', 'e0.sub'),
    }),
    body: [
      h('p', { class: 't-callout t-mute e0-sub' }, t('e0.sub')),
      h('ul', { class: 'edge-list' }, rows),
    ],
    className: 'e0',
  });
  return { el };
}

/**
 * E0 opens each case the way it would appear in a live app: an overlay fires
 * on top of a sensible host screen; full-screen cases just navigate.
 */
function openCase(code) {
  if (code === 'E1') { // Trip offer ran out — needs T4 behind the dialog
    setWork({ status: 'inQueue', tripKind: 'airport', queuePlace: 7 });
    go(D('T4'));
    setTimeout(() => E1(), 450);
  } else if (code === 'E2') {
    setWork({ status: 'offer', tripKind: 'airport' });
    go(D('T5'));
    setTimeout(() => E2Sheet(), 450);
  } else if (code === 'E3') {
    setWork({ status: 'waiting', tripKind: 'airport' });
    go(D('T6'));
    setTimeout(() => E3Sheet(), 450);
  } else if (code === 'E4') {
    setWork({ status: 'waiting', tripKind: 'airport' });
    go(D('T7'));
    setTimeout(() => E4(), 450);
  } else if (code === 'E5') {
    setWork({ status: 'waiting', tripKind: 'airport' });
    go(D('E5'));
  } else if (code === 'E7') {
    setWork({ status: 'waiting', tripKind: 'airport' });
    go(D('T8'));
    setTimeout(() => openBadBags(), 450);
  } else if (code === 'E8') {
    setWork({ status: 'waiting', tripKind: 'airport' });
    go(D('E8'));
  } else if (code === 'E9') {
    setWork({ status: 'onTrip', tripKind: 'airport' });
    go(D('T9'));
    setTimeout(() => openSOS(), 450);
  } else if (code === 'E10') {
    setWork({ status: 'onTrip', tripKind: 'airport' });
    store.set('settings', { simulateOffline: true });
    go(D('T9'));
  } else if (code === 'E11') {
    setWork({ status: 'done', tripKind: 'airport' });
    go(D('T13'));
    setTimeout(() => E11(), 450);
  } else if (code === 'E12') {
    go(D('E12'));
  } else if (code === 'E13') {
    setWork({ status: 'inQueue', queuePlace: 7 });
    go(D('T3'));
    setTimeout(() => E13(), 450);
  } else if (code === 'E14') {
    go(D('E14'));
  } else if (code === 'E15') {
    go(D('E15'));
  }
}

// ---------------------------------------------------------------- E1 (dialog)

export function E1() {
  dialog({
    title: t('offer.expiredTitle'),
    iconName: 'clock',
    body: t('offer.expiredBody'),
    actions: [{ label: t('offer.expiredOk'), variant: 'primary', onClick: () => {
      setWork({ status: 'inQueue', queuePlace: 7 });
      go(D('T4'), { replace: true });
    } }],
  });
}

// ---------------------------------------------------------------- E2 / E3 (shortcuts)
// The sheets live in driver-trip.js; from E0 we open the host screen first.
function E2Sheet() {
  // Re-use the one in the offer flow by firing the Say no action
  const btn = document.querySelector('.screen:last-child .screen__footer .btn--text');
  if (btn) btn.click();
}
function E3Sheet() {
  const btn = document.querySelector('.screen:last-child .screen__footer .btn--text');
  if (btn) btn.click();
}

// ---------------------------------------------------------------- E4 (rider cancels dialog)

export function E4() {
  const trip = TRIPS[work().tripKind || 'airport'];
  const amount = Math.round(trip.fare * 0.1);
  dialog({
    title: t('e4.title', { name: trip.rider }),
    iconName: 'user',
    body: t('e4.body', { name: trip.rider, amount }),
    actions: [{ label: t('e4.cta'), variant: 'primary', onClick: () => {
      store.set('work', { record: [{ type: 'riderCancel', date: '18 Oct', amount }, ...work().record] });
      setWork({ status: 'inQueue', queuePlace: 7 });
      go(D('T4'), { replace: true });
    } }],
  });
}

// ---------------------------------------------------------------- E5 (paid-waiting screen)

export function E5() {
  const timers = timerBag();
  const trip = TRIPS[work().tripKind || 'airport'];
  const name = trip.rider || 'the rider';
  let paid = 0;
  const ring = h('div', { class: 'ring ring--big ring--brand' },
    h('span', { class: 'ring__svg-wrap', html: `<svg viewBox="0 0 180 180" class="ring__svg"><circle class="ring__track" cx="90" cy="90" r="80" stroke-width="10" fill="none"/><circle class="ring__arc" cx="90" cy="90" r="80" stroke-width="10" fill="none" stroke-dasharray="502 502" stroke-linecap="round" transform="rotate(-90 90 90)"/></svg>` }),
    h('span', { class: 'ring__label' }, '3:20', h('span', { class: 'ring__label-sub' }, t('e5.paidWait'))),
  );
  const payCard = h('div', { class: 'card card--row card--brand' },
    iconTile('wallet', { round: true, tone: 'brand', size: 20 }),
    h('div', {}, h('p', { class: 't-headline' }, t('e5.pay', { n: 3 })), h('p', { class: 't-subhead t-mute' }, t('e5.paySub'))),
  );

  const { el } = screen({
    code: 'E5',
    label: t('e5.title', { bay: QUEUE.bay }),
    topbar: topBar({
      left: h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('e5.title', { bay: QUEUE.bay })),
      listen: reads('e5.title', 'e5.notYet'),
    }),
    body: [
      h('div', { class: 't7-ring' }, ring),
      payCard,
      h('div', { class: 'card card--outline' },
        iconTile('user', { round: true, tone: 'neutral', size: 18 }),
        h('div', {}, h('p', { class: 't-headline' }, t('e5.notYet', { name })), h('p', { class: 't-subhead t-mute' }, t('e5.callMsg'))),
      ),
      h('div', { class: 't7-actions' },
        button({ label: t('e5.message'), icon: 'msg', variant: 'secondary', onClick: () => toast('Message sent to ' + name) }),
        button({ label: t('e5.call'), icon: 'phone', variant: 'secondary', onClick: () => (window.location.href = `tel:${trip.riderPhone || SUPPORT_PHONE}`) }),
      ),
    ],
    footer: [
      button({ label: t('e5.here'), icon: 'user', onClick: () => { setWork({ status: 'waiting' }); go(D('T8')); } }),
      button({ label: t('e5.notHere'), variant: 'text', onClick: () => E6() }),
    ],
    className: 'e5',
  });

  return {
    el,
    onMount() {
      // Keep the paid-waiting ring counting the pay up (just a feel; stops at 5 min)
      const start = Date.now();
      const id = setInterval(() => {
        const dt = Math.min(300, Math.floor((Date.now() - start) / 1000) + 200);
        paid = Math.ceil(dt / 60) - 2;
        ring.querySelector('.ring__label').firstChild.textContent = mmss(600 - dt);
        payCard.querySelector('.t-headline').textContent = t('e5.pay', { n: paid });
      }, 1000);
      timers.add(() => clearInterval(id));
    },
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- E6 (sheet) + E6b (screen)

export function E6() {
  sheet({
    title: t('e6.title'),
    content: [h('p', { class: 't-callout t-mute' }, t('e6.body'))],
    actions: [
      { label: t('e6.yes'), icon: 'check', variant: 'primary', onClick: () => go(D('E6b')) },
      { label: t('e6.wait'), variant: 'secondary' },
    ],
  });
}

export function E6b() {
  const trip = TRIPS[work().tripKind || 'airport'];
  const amount = Math.round(trip.fare * 0.1);
  const { el } = screen({
    code: 'E6b',
    label: t('e6b.title'),
    topbar: topBar({
      left: h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('e6b.title')),
      listen: reads('e6b.heading', 'e6b.body'),
    }),
    body: [
      h('div', { class: 'e6b-hero' },
        stateIcon({ iconName: 'check', tone: 'hero' }),
        h('h1', { class: 't-large t-center' }, t('e6b.heading')),
        h('p', { class: 't-callout t-mute t-center' }, t('e6b.body')),
      ),
      h('div', { class: 'e6b-amount' },
        h('span', { class: 't-callout t-mute' }, t('e6b.get')),
        h('span', { class: 't-hero' }, t('e6b.amount', { amount })),
        h('span', { class: 't-subhead t-mute' }, t('e6b.amountSub')),
      ),
      h('div', { class: 'card card--brand card--row' },
        iconTile('shield', { round: true, tone: 'brand', size: 18 }),
        h('div', {}, h('p', { class: 't-headline' }, t('e6b.safe')), h('p', { class: 't-subhead t-mute' }, t('e6b.safeSub'))),
      ),
      h('div', { class: 'card card--outline card--row' },
        iconTile('ret', { round: true, tone: 'neutral', size: 18 }),
        h('div', {}, h('p', { class: 't-headline' }, t('e6b.keep')), h('p', { class: 't-subhead t-mute' }, t('e6b.keepSub'))),
      ),
    ],
    footer: [button({
      label: t('e6b.cta'), icon: 'ret', onClick: () => {
        store.set('work', { record: [{ type: 'noShow', date: '18 Oct', amount }, ...work().record] });
        setWork({ status: 'inQueue', queuePlace: 7 });
        go(D('T4'), { replace: true });
      },
    })],
    className: 'e6b',
  });
  return { el };
}

// ---------------------------------------------------------------- E8 (wrong start code)

export function E8() {
  const trip = TRIPS[work().tripKind || 'airport'];
  let tries = 2;

  const boxes = codeBoxes({ length: 4, label: 'Code', onComplete: (val) => {
    if (val === trip.code) {
      boxes.setState('success');
      setTimeout(() => { setWork({ status: 'onTrip' }); go(D('T9'), { replace: true }); }, 400);
    } else {
      boxes.setState('error');
      tries = Math.max(0, tries - 1);
      hint.textContent = t('e8.error', { name: trip.rider, n: tries });
      hint.hidden = false;
    }
  } });
  // Pre-fill with the Figma "4 7 2 9" so it starts in error state
  boxes.fill('4729');
  boxes.setState('error');

  const hint = h('p', { class: 't-footnote hint-error', 'aria-live': 'polite', hidden: false }, t('e8.error', { name: trip.rider, n: tries }));

  const pad = keypad({ onDigit: (d) => boxes.type(d), onDelete: () => boxes.backspace() });

  const bagsBig = h('button', { type: 'button', class: 'bag-check', 'aria-checked': 'true', role: 'checkbox' },
    h('span', { class: 'bag-check__box' }, ic('check', { size: 14, stroke: 3 })),
    ic('bag', { size: 18 }), h('span', {}, `${trip.bags.big} big`));
  const bagsSmall = trip.bags.small ? h('button', { type: 'button', class: 'bag-check', 'aria-checked': 'true', role: 'checkbox' },
    h('span', { class: 'bag-check__box' }, ic('check', { size: 14, stroke: 3 })),
    ic('bag', { size: 16 }), h('span', {}, `${trip.bags.small} small`)) : null;

  const { el } = screen({
    code: 'E8',
    label: t('e8.title'),
    topbar: topBar({ onBack: () => back(D('T7')), listen: reads('e8.title', 'e8.error') }),
    body: [
      h('h1', { class: 't-large screen__heading', tabindex: '-1' }, t('e8.title')),
      h('p', { class: 't-label t-mute' }, '1 · LOAD THE BAGS'),
      h('div', { class: 'bag-row' }, bagsBig, bagsSmall),
      textLink({ label: 'Bags don’t match the booking?', onClick: openBadBags }),
      h('p', { class: 't-label t-mute' }, `2 · ASK ${trip.rider.toUpperCase()} FOR HER 4-DIGIT CODE`),
      boxes.el,
      hint,
    ],
    footer: [button({ label: 'Start trip', icon: 'arrow', disabled: true })],
    keypad: pad,
    className: 't8',
  });
  return { el, onMount: () => boxes.focus() };
}

// ---------------------------------------------------------------- E10 (no internet on trip)

export function E10() {
  store.set('settings', { simulateOffline: true });
  // Just route to T9; the app's offline banner handles the look
  go(D('T9'), { replace: true });
}

// ---------------------------------------------------------------- E11 (rider left a bag — dialog)

export function E11() {
  const trip = TRIPS[work().tripKind || 'airport'];
  dialog({
    title: t('e11.title', { name: trip.rider }),
    iconName: 'bag',
    body: t('e11.body'),
    actions: [
      { label: t('e11.call', { name: trip.rider }), icon: 'phone', variant: 'primary', onClick: () => (window.location.href = `tel:${trip.riderPhone || SUPPORT_PHONE}`) },
      { label: t('e11.not'), variant: 'secondary' },
    ],
  });
}

// ---------------------------------------------------------------- E12 (report problem) + E12b

const REPORT_OPTIONS = [
  { id: 'r1', key: 'e12.r1' },
  { id: 'r2', key: 'e12.r2' },
  { id: 'r3', key: 'e12.r3' },
  { id: 'r4', key: 'e12.r4' },
  { id: 'r5', key: 'e12.r5' },
];

export function E12() {
  let picked = 'r1';
  const trip = TRIPS[work().tripKind || 'airport'];
  const rows = REPORT_OPTIONS.map((o) => {
    const checked = o.id === picked;
    return h(
      'button',
      { type: 'button', class: 'report-opt', 'aria-checked': String(checked), dataset: { value: o.id } },
      h('span', { class: 'radio', 'aria-hidden': 'true' }),
      h('span', { class: 't-callout' }, t(o.key)),
    );
  });
  const group = h('div', { class: 'report-group', role: 'radiogroup', 'aria-label': t('e12.what') }, rows);
  radioGroup(group, rows, (v) => (picked = v));

  const { el } = screen({
    code: 'E12',
    label: t('e12.title'),
    topbar: topBar({ onBack: () => back(D('T15')), listen: reads('e12.title', 'e12.what') }),
    body: [
      h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, 'Report a problem'),
      h('p', { class: 't-subhead t-mute' }, t('e12.trip', { drop: trip.drop, time: '22:40' })),
      h('h2', { class: 't-headline e12-what' }, t('e12.what')),
      group,
      h('button', { type: 'button', class: 'note-add', onClick: () => toast(t('e12.addSoon'), { tone: 'info' }) },
        ic('msg', { size: 18 }), h('span', {}, t('e12.add')),
      ),
    ],
    footer: [button({ label: t('e12.send'), onClick: () => E12b() })],
    className: 'e12',
  });
  return { el };
}

export function E12b() {
  dialog({
    title: t('e12b.title'),
    iconName: 'shield',
    body: t('e12b.body'),
    actions: [{ label: t('e12b.ok'), variant: 'primary', onClick: () => go(D('T15'), { replace: true }) }],
  });
}

// ---------------------------------------------------------------- E13 (left the waiting area)

export function E13() {
  dialog({
    title: t('e13.title'),
    iconName: 'pin',
    body: t('e13.body'),
    actions: [
      { label: t('e13.back'), icon: 'nav', variant: 'primary', onClick: () => { setWork({ status: 'toQueue' }); go(D('T3'), { replace: true }); } },
      { label: t('e13.off'), variant: 'secondary', onClick: () => { setWork({ status: 'offline' }); go(D('T1'), { replace: true }); } },
    ],
  });
}

// ---------------------------------------------------------------- E14 (one doc rejected)

export function E14() {
  // Flip only one doc into "rejected" state so the list reads 5/6 added + 1 retake
  const docs = Object.fromEntries(DOCUMENTS.map((d) => [d.id, d.id === 'insurance' ? 'rejected' : 'uploaded']));
  store.set('driver', { docs });

  const rows = DOCUMENTS.map((d) => {
    const state = docs[d.id];
    if (state === 'rejected') {
      return h('li', {},
        h('button', { type: 'button', class: 'doc-row doc-row--needed', onClick: () => go(D(`O9/${d.id}`)) },
          h('span', { class: 'doc-row__icon', 'aria-hidden': 'true' }, ic(d.icon, { size: 20 })),
          h('span', { class: 'doc-row__body' }, h('span', { class: 'doc-row__name' }, docName(d)), h('span', { class: 'doc-row__meta' }, t('e14.reason'))),
          h('span', { class: 'doc-row__action retake-chip' }, t('e14.retake')),
        ),
      );
    }
    return docRow({ id: d.id, iconName: d.icon, name: docName(d), meta: t(d.metaKey), state: 'uploaded' });
  });

  const { el } = screen({
    code: 'E14',
    label: 'Add your documents',
    topbar: topBar({ onBack: () => back(D('O8c')), listen: reads('e14.count', 'e14.reason') }),
    body: [
      h('p', { class: 't-label t-mute' }, 'Step 3 of 3'),
      h('h1', { class: 't-large screen__heading', tabindex: '-1' }, 'Add your documents'),
      h('p', { class: 't-callout t-mute' }, 'Take a photo of each one. We check them before your first trip.'),
      h('p', { class: 'doc-count', 'aria-live': 'polite' }, t('e14.count')),
      meter(5, 6),
      h('ul', { class: 'doc-list' }, rows),
    ],
    footer: [button({ label: 'Next: how you get paid', disabled: true })],
    className: 'e14',
  });
  return { el };
}

// ---------------------------------------------------------------- E15 (wrong SMS code — pre-filled)

export function E15() {
  // Reuse the O4 code screen, but pre-fill a wrong code and mark it as 2 tries left.
  // The simplest live hi-fi: navigate to O4 and let the user see the inline error state.
  store.set('driver', { codeTries: 1 });
  go(D('O4'), { replace: true });
  // After O4 mounts, type a wrong number and submit it
  setTimeout(() => {
    const boxes = [...document.querySelectorAll('.screen:last-child .code-box')];
    if (boxes.length) {
      ['4', '7', '2', '1', '9', '0'].forEach((d, i) => (boxes[i].value = d));
      boxes.forEach((b) => b.classList.add('is-filled'));
      // Trigger the verify path
      const first = boxes[0];
      first.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, 400);
}
