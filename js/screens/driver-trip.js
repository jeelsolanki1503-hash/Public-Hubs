// Driver · 2 First trip (going online → first drop).
// Screens T1–T16 plus the overlays this flow owns (T2s, T11, T13, E1/E2/E3/E7/E9).

import {
  h, ic, screen, pageHead, topBar, button, textLink, iconButton, iconTile,
  tabBar, timerRing, swipeConfirm, mapScene, directionBar, statTile, flightsChart,
  fareHero, tripBrief, bagsRow, listRow, codeBoxes, keypad, segmented, infoCard,
  banner, badge, stateIcon, meter, numberPlate,
} from '../components.js';
import { toast, sheet, dialog } from '../overlays.js';
import { go, back } from '../router.js';
import { store, isOffline } from '../store.js';
import { t } from '../i18n.js';
import { countdown, after, timerBag } from '../clock.js';
import { rupees, mmss } from '../format.js';
import { TRIPS, FLIGHTS_BY_HOUR, AMENITIES, QUEUE, SUPPORT_PHONE, TIMING, DRIVER } from '../data.js';

const D = (code) => `/driver/${code}`;
const driver = () => store.driver();
const work = () => store.work();
const reads = (...keys) => () => keys.map((k) => (typeof k === 'function' ? k() : t(k))).join('. ');

function setWork(patch) {
  store.set('work', patch);
}

function switchTab(id) {
  if (id === 'home') go(D('T1'));
  else if (id === 'earnings') go(D('T14'));
  else if (id === 'account') go(D('T15'));
}

function vibrate(ms) {
  if (navigator.vibrate) try { navigator.vibrate(ms); } catch { /* no-op */ }
}

// ---------------------------------------------------------------- T1

export function T1() {
  const name = (driver().name || DRIVER.firstName).split(' ')[0];
  const w = work();
  const isOnline = w.status !== 'offline';
  const bellCoach = !w.coachSeen && !isOnline;

  const cta = button({
    label: isOnline ? t('t13.off') : t('t1.cta'),
    icon: isOnline ? 'out' : 'arrow',
    onClick: () => {
      if (isOnline) {
        setWork({ status: 'offline', onlineMs: w.onlineMs + Math.max(0, Date.now() - (w.onlineSince || Date.now())), onlineSince: 0 });
        go(D('T1'));
      } else {
        setWork({ coachSeen: true });
        openJoinSheet();
      }
    },
  });

  const { el } = screen({
    code: 'T1',
    label: t('tab.home'),
    topbar: topBar({
      left: h('span', { class: 't-title2' }, t('t1.hi', { name })),
      listen: reads('t1.hi', 't1.flights', () => `${t('t1.flightsCount', { n: 12 })} ${t('t1.flightsIn')}`),
    }),
    body: [
      h(
        'div',
        { class: 't1-status' },
        iconTile(isOnline ? 'auto' : 'wifioff', { tone: isOnline ? 'success' : 'neutral', round: true }),
        h('div', { class: 't1-status__text' },
          h('span', { class: 't-headline' }, isOnline ? t('t1.online') : t('t1.offline')),
          h('span', { class: 't-subhead t-mute' }, isOnline ? t('t1.onlineSub') : t('t1.offlineSub')),
        ),
        h('span', {
          class: `t1-switch${isOnline ? ' is-on' : ''}`,
          role: 'switch',
          'aria-checked': String(isOnline),
          tabindex: '0',
          onClick: () => cta.click(),
        }, h('span', { class: 't1-switch__knob' })),
      ),
      h(
        'section',
        { class: 'card t1-flights' },
        h('header', { class: 't1-flights__h' }, ic('plane', { size: 18 }), h('span', { class: 't-headline' }, t('t1.flights'))),
        h('p', { class: 't1-flights__big' },
          h('span', { class: 't-hero' }, '12'),
          h('span', { class: 't-callout t-mute' }, t('t1.flightsIn')),
        ),
        flightsChart(FLIGHTS_BY_HOUR),
        h('p', { class: 't-footnote t-mute' }, t('t1.flightsSource')),
      ),
    ],
    footer: [
      bellCoach ? h('span', { class: 'coach' }, ic('bell', { size: 16 }), h('span', {}, t('t1.coach'))) : null,
      cta,
    ],
    tabbar: tabBar('home', switchTab),
    className: 't1',
  });
  return { el };
}

function openJoinSheet() {
  sheet({
    title: t('t2s.title'),
    content: [
      h('div', { class: 'card card--brand' },
        iconTile('pin', { tone: 'brand', round: true, size: 20 }),
        h('div', {},
          h('p', { class: 't-headline' }, t('t2s.area', { area: QUEUE.area })),
          h('p', { class: 't-subhead t-mute' }, t('t2s.areaBy')),
        ),
      ),
      h('ul', { class: 'bullets' },
        h('li', {}, ic('auto', { size: 20 }), h('span', {}, t('t2s.join', { area: QUEUE.area }))),
        h('li', {}, ic('check', { size: 20 }), h('span', {}, t('t2s.first'))),
      ),
    ],
    actions: [
      { label: t('t2s.cta', { area: QUEUE.area }), variant: 'primary', onClick: () => {
          setWork({ status: 'toQueue', onlineSince: Date.now() });
          go(D('T3'));
        } },
      { label: t('t2s.cancel'), variant: 'text' },
    ],
  });
}

// ---------------------------------------------------------------- T3 ⏱T4

export function T3() {
  const timers = timerBag();
  const { el } = screen({
    code: 'T3',
    label: t('t3.turn'),
    hero: h('div', { class: 't3-hero' },
      directionBar({ iconName: 'arrow', title: t('t3.turn'), sub: t('t3.turnSub') }),
      mapScene({ kind: 'nav', pinLabel: QUEUE.area }),
    ),
    body: [
      h('span', { class: 'chip chip--dark t3-chip' }, ic('check', { size: 14, stroke: 3 }), 'Online'),
      h('p', { class: 't-label t-mute' }, t('t3.notYet')),
      h('h1', { class: 't-large screen__heading', tabindex: '-1' }, t('t3.area', { area: QUEUE.area, km: 1.2 })),
      h('p', { class: 't-callout t-mute' }, t('t3.areaSub', { area: QUEUE.area })),
    ],
    footer: [button({ label: t('t3.offline'), variant: 'text', onClick: () => {
      setWork({ status: 'offline' });
      go(D('T1'));
    } })],
    className: 't3',
  });
  return {
    el,
    onMount: () => timers.add(after(TIMING.toQueueMs, () => go(D('T4'), { replace: true }))),
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- T4 ⏱T4b

export function T4() {
  const timers = timerBag();
  setWork({ status: 'inQueue', queuePlace: QUEUE.startPlace });
  const place = h('span', { class: 'ring__label' }, String(QUEUE.startPlace), h('span', { class: 'ring__label-sub' }, t('t4.placeLabel')));
  const ring = h('div', { class: 'ring ring--big ring--brand' },
    h('span', { class: 'ring__svg-wrap', html: `<svg viewBox="0 0 180 180" class="ring__svg"><circle class="ring__track" cx="90" cy="90" r="80" stroke-width="8" fill="none"/><circle class="ring__arc" cx="90" cy="90" r="80" stroke-width="8" fill="none" stroke-dasharray="502 502" transform="rotate(-90 90 90)"/></svg>` }),
    place,
  );

  const { el } = screen({
    code: 'T4',
    label: t('t4.title'),
    topbar: topBar({ left: h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('t4.title')), listen: reads('t4.title', 't4.rules') }),
    body: [
      h('div', { class: 't4-ring' }, ring, h('p', { class: 't-subhead t-mute t-center' }, t('t4.among'))),
      listRow({
        iconName: 'doc', iconTone: 'brand', title: t('t4.register'),
        sub: t('t4.registerSub', { plate: driver().plate || DRIVER.vehicle.plate, name: (driver().name || DRIVER.firstName).split(' ')[0], time: QUEUE.registerTime }),
        right: ic('check', { size: 18 }),
      }),
      banner({ tone: 'neutral', iconName: 'x', text: t('t4.rules', { area: QUEUE.area }) }),
      h('h2', { class: 't-label t-mute' }, t('t4.near', { area: QUEUE.area }).toUpperCase()),
      h('div', { class: 'amenities' }, AMENITIES.map((a) => h('div', { class: 'amenity' }, iconTile(a.icon, { tone: 'neutral', round: true, size: 18 }), h('span', { class: 't-callout' }, a.label), h('span', { class: 't-footnote t-mute' }, a.where)))),
    ],
    footer: [button({
      label: t('t4.leave'),
      variant: 'secondary',
      onClick: () => dialog({
        title: t('t4.leaveConfirmTitle'),
        body: t('t4.leaveConfirmBody'),
        actions: [
          { label: t('t4.leaveNo'), variant: 'primary' },
          { label: t('t4.leaveYes'), variant: 'secondary', onClick: () => {
            setWork({ status: 'offline' });
            go(D('T1'));
          } },
        ],
      }),
    })],
    tabbar: tabBar('home', switchTab),
    className: 't4',
  });

  return {
    el,
    onMount() {
      // Counts the queue down 7 → 1 over queueMs (so the user sees the drop)
      const start = Date.now();
      const total = TIMING.queueMs;
      const id = setInterval(() => {
        const p = Math.min(1, (Date.now() - start) / total);
        const n = Math.max(1, Math.round(7 - 6 * p));
        place.firstChild.textContent = String(n);
      }, 350);
      timers.add(() => clearInterval(id));
      timers.add(after(total, () => {
        setWork({ status: 'nextAtBay', queuePlace: 1 });
        go(D('T4b'), { replace: true });
      }));
    },
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- T4b

export function T4b() {
  const { el } = screen({
    code: 'T4b',
    label: t('t4b.title'),
    topbar: topBar({ left: h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('t4b.title')), listen: reads('t4b.heading', 't4b.body') }),
    hero: mapScene({ kind: 'bay', pinLabel: QUEUE.bay }),
    body: [
      h('span', { class: 'chip chip--brand' }, t('t4b.first')),
      pageHead(t('t4b.heading', { bay: QUEUE.bay }), t('t4b.body')),
      listRow({
        iconName: 'pin', iconTone: 'brand',
        title: t('t4b.bay', { bay: QUEUE.bay, level: QUEUE.bayLevel }),
        sub: t('t4b.bayMeta'),
        right: '',
      }),
    ],
    footer: [
      button({ label: t('t4b.cta', { bay: QUEUE.bay }), icon: 'check', onClick: () => {
        setWork({ status: 'offer', tripKind: 'airport' });
        go(D('T5'));
      } }),
      button({ label: t('t4b.other'), variant: 'text', onClick: openOtherOffers }),
    ],
    className: 't4b',
  });
  return { el };
}

function openOtherOffers() {
  sheet({
    title: t('t4b.otherTitle'),
    content: [
      listRow({ iconName: 'rupee', iconTone: 'brand', title: t('t4b.otherShort'), sub: 'Sahar Village · 2 km · ₹60', onClick: () => { setWork({ status: 'offer', tripKind: 'short' }); go(D('T5b')); } }),
      listRow({ iconName: 'counter', iconTone: 'brand', title: t('t4b.otherCounter'), sub: 'Kurla West · 6 km · ₹260', onClick: () => { setWork({ status: 'offer', tripKind: 'counter' }); go(D('W1')); } }),
    ],
  });
}

// ---------------------------------------------------------------- T5 / T5b (offer)

export function T5() { return offerScreen('airport', 'T5'); }
export function T5b() { return offerScreen('short', 'T5b'); }

function offerScreen(kind, code) {
  const timers = timerBag();
  const trip = TRIPS[kind];
  const ring = timerRing({ size: 64, strokeWidth: 5, value: 1, label: '15', labelClass: 'ring__label', tone: 'ink' });
  ring.classList.add('ring--small-offer');
  const subLabel = h('span', { class: 'ring__label-sub' }, t('offer.sec'));
  ring.querySelector('.ring__label').append(subLabel);

  const nextDemo = kind === 'short'
    ? button({ label: t('t5b.nextDemo'), variant: 'text', onClick: () => { setWork({ status: 'offer', tripKind: 'counter' }); go(D('W1')); } })
    : null;

  const { el } = screen({
    code,
    label: t('offer.title'),
    topbar: topBar({
      left: h('div', {},
        h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('offer.title')),
        h('span', { class: 'chip chip--neutral' }, trip.tag),
      ),
      listen: reads('offer.title', () => `${trip.pickup}. ${trip.drop}. ${rupees(trip.fare)}`),
    }),
    body: [
      h('div', { class: 'offer-ring' }, ring),
      tripBrief(trip),
      fareHero({ amount: trip.fare, minimum: trip.minimum, note: trip.fareNote }),
      bagsRow({ big: trip.bags.big, small: trip.bags.small, people: trip.people }),
      trip.minimum ? banner({ tone: 'neutral', iconName: 'auto', text: 'The minimum amount will be tested with drivers and riders before launch.' }) : null,
    ],
    footer: [
      button({ label: t('offer.accept'), icon: 'check', onClick: () => {
        timers.clear();
        setWork({ status: 'accepted' });
        go(D('T7'));
      } }),
      button({ label: t('offer.sayNo'), variant: 'text', onClick: () => openSayNo(() => timers.clear()) }),
      nextDemo,
    ],
    className: 'offer',
  });

  return {
    el,
    onMount() {
      timers.add(countdown(TIMING.offerSec, (s) => {
        const v = s / TIMING.offerSec;
        ring.set(v, String(s), s <= 5 ? 'warning' : 'ink');
        ring.querySelector('.ring__label').append(subLabel);
        if (s === 5) vibrate(30);
      }, () => openOfferExpired()));
    },
    onUnmount: () => timers.clear(),
  };
}

export function openSayNo(onProceed, onTake) {
  sheet({
    title: t('e2.title'),
    content: [
      h('p', { class: 't-callout t-mute' }, t('e2.body')),
      metaRow('auto', t('e2.metaPlace'), t('e2.metaPlaceV')),
    ],
    actions: [
      { label: t('e2.take'), icon: 'check', variant: 'primary', onClick: () => onTake && onTake() },
      { label: t('e2.yes'), variant: 'secondary', onClick: () => {
        onProceed && onProceed();
        store.set('work', { record: [{ type: 'sayNo', date: '18 Oct' }, ...work().record] });
        setWork({ status: 'inQueue', queuePlace: 7 });
        go(D('T4'));
      } },
    ],
  });
}

function metaRow(iconName, label, value, tone) {
  return h(
    'div',
    { class: `meta-row${tone ? ' meta-row--' + tone : ''}` },
    iconTile(iconName, { round: true, tone: 'neutral', size: 18 }),
    h('span', { class: 'meta-row__label' }, label),
    h('span', { class: 'meta-row__value' }, value),
  );
}

export function openOfferExpired() {
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

// ---------------------------------------------------------------- W1 (counter rider)

export function W1() {
  setWork({ status: 'offer', tripKind: 'counter' });
  const trip = TRIPS.counter;
  const { el } = screen({
    code: 'W1',
    label: t('w1.title'),
    topbar: topBar({
      left: h('div', {},
        h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('w1.title')),
        h('span', { class: 'chip chip--neutral' }, t('w1.tag')),
      ),
      listen: reads('w1.title', () => `${trip.pickup}. ${trip.drop}. ${rupees(trip.fare)}`),
    }),
    body: [
      tripBrief({ ...trip, pickup: t('w1.pickup'), pickupNote: t('w1.pickupSub') }),
      fareHero({ amount: trip.fare, note: trip.fareNote }),
      bagsRow({ big: trip.bags.big, small: trip.bags.small, people: trip.people }),
      banner({ tone: 'neutral', iconName: 'lock', text: t('w1.counterNote') }),
    ],
    footer: [button({ label: t('w1.cta'), icon: 'user', onClick: () => { setWork({ status: 'waiting' }); go(D('T8')); } })],
    className: 'offer',
  });
  return { el };
}

// ---------------------------------------------------------------- T6 (fallback)

export function T6() {
  const trip = TRIPS[work().tripKind || 'airport'];
  const { el } = screen({
    code: 'T6',
    label: t('t6.turn'),
    hero: h('div', {},
      directionBar({ iconName: 'arrow', title: t('t6.turn'), sub: t('t6.turnSub', { bay: QUEUE.bay }) }),
      mapScene({ kind: 'bay', pinLabel: QUEUE.bay }),
    ),
    body: [
      h('span', { class: 't-label t-mute' }, t('t6.pickup')),
      h('h1', { class: 't-large screen__heading', tabindex: '-1' }, QUEUE.bay + ' · ' + QUEUE.bayLevel),
      h('div', { class: 'card' },
        h('p', { class: 't-subhead t-mute' }, t('t6.sign', { bay: QUEUE.bay })),
      ),
      h('div', { class: 'driver-card' },
        iconTile('user', { tone: 'neutral', round: true, size: 20 }),
        h('div', {}, h('span', { class: 't-headline' }, trip.rider), h('span', { class: 't-subhead t-mute' }, `${trip.bags.big} big + ${trip.bags.small} small bag · ${trip.people} person`)),
        iconButton({ icon: 'msg', label: 'Message rider' }),
        iconButton({ icon: 'phone', label: 'Call rider', onClick: () => (window.location.href = `tel:${trip.riderPhone || SUPPORT_PHONE}`) }),
      ),
    ],
    footer: [
      button({ label: t('t6.cta', { bay: QUEUE.bay }), icon: 'check', onClick: () => { setWork({ status: 'waiting' }); go(D('T7')); } }),
      button({ label: t('t6.cancel'), variant: 'text', onClick: () => openCancelAccepted() }),
    ],
    className: 't6',
  });
  return { el };
}

export function openCancelAccepted() {
  const trip = TRIPS[work().tripKind || 'airport'];
  sheet({
    title: t('e3.title'),
    content: [
      h('p', { class: 't-callout t-mute' }, t('e3.body', { name: trip.rider })),
      metaRow('wallet', t('e3.fee'), t('e3.feeV')),
      metaRow('auto', t('e2.metaPlace'), t('e3.placeV')),
      metaRow('shield', t('e3.record'), t('e3.recordV')),
      h('p', { class: 't-footnote t-mute' }, t('e3.rule')),
    ],
    actions: [
      { label: t('e3.keep'), icon: 'check', variant: 'primary' },
      { label: t('e3.yes'), variant: 'secondary', onClick: () => {
        store.set('work', { record: [{ type: 'driverCancel', date: '18 Oct', amount: 42 }, ...work().record] });
        setWork({ status: 'inQueue', queuePlace: 7 });
        go(D('T4'));
      } },
    ],
  });
}

// ---------------------------------------------------------------- T7 (waiting)

export function T7() {
  const timers = timerBag();
  const trip = TRIPS[work().tripKind || 'airport'];
  const name = trip.rider || 'the rider';
  let phase = 'free'; // free | paid | noShow
  let paidPay = 0;

  const ring = h('div', { class: 'ring ring--big' },
    h('span', { class: 'ring__svg-wrap', html: `<svg viewBox="0 0 180 180" class="ring__svg"><circle class="ring__track" cx="90" cy="90" r="80" stroke-width="10" fill="none"/><circle class="ring__arc" cx="90" cy="90" r="80" stroke-width="10" fill="none" stroke-dasharray="502 502" stroke-linecap="round" transform="rotate(-90 90 90)"/></svg>` }),
    h('span', { class: 'ring__label' }, '5:00', h('span', { class: 'ring__label-sub' }, t('t7.freeLeft'))),
  );
  const arc = ring.querySelector('.ring__arc');
  const label = ring.querySelector('.ring__label');
  const sub = ring.querySelector('.ring__label-sub');

  const banner = h('div', { class: 'wait-note', 'aria-live': 'polite' });

  function tickFree(secLeft) {
    const v = secLeft / TIMING.freeWaitSec;
    arc.setAttribute('stroke-dasharray', `${v * 502} 502`);
    label.firstChild.textContent = mmss(secLeft);
    if (secLeft <= 60) ring.classList.add('ring--warning');
    if (secLeft === 60) vibrate(30);
  }
  function startPaid() {
    phase = 'paid';
    ring.classList.remove('ring--warning');
    ring.classList.add('ring--brand');
    sub.textContent = t('t7.paidWait');
    label.firstChild.textContent = '₹0';
    banner.replaceChildren(h('p', { class: 't-subhead t-mute' }, t('t7.openPaidWait')));
    timers.add(countdown(TIMING.noShowSec, (s) => {
      paidPay = Math.ceil((TIMING.noShowSec - s) / 60);
      label.firstChild.textContent = `₹${paidPay}`;
    }, () => {
      phase = 'noShow';
      sheet({
        title: t('t7.noShowTitle'),
        content: [h('p', { class: 't-callout t-mute' }, t('t7.noShowBody', { amount: Math.round(trip.fare * 0.1) }))],
        actions: [{ label: t('t7.noShowCta'), onClick: () => {
          store.set('work', { record: [{ type: 'noShow', date: '18 Oct', amount: Math.round(trip.fare * 0.1) }, ...work().record] });
          setWork({ status: 'inQueue', queuePlace: 7 });
          go(D('T4'));
        } }],
      });
    }));
  }

  const { el } = screen({
    code: 'T7',
    label: t('t7.title', { bay: QUEUE.bay }),
    topbar: topBar({ left: h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('t7.title', { bay: QUEUE.bay })), listen: reads('t7.title', 't7.freeLeft') }),
    body: [
      h('div', { class: 't7-ring' }, ring),
      banner,
      trip.counter ? null : infoCard({ iconName: 'bag', title: t('t7.collected', { name }), text: t('t7.collectedSub', { bay: QUEUE.bay }), tone: 'success' }),
      trip.counter ? null : h('div', { class: 'card card--outline' },
        iconTile('photo', { tone: 'neutral', round: true, size: 18 }),
        h('div', {}, h('p', { class: 't-headline' }, t('t7.sentPhoto', { name })), h('p', { class: 't-subhead t-mute' }, t('t7.sentPhotoSub'))),
      ),
      h('div', { class: 't7-actions' },
        button({ label: t('t7.sendPhoto'), icon: 'camera', variant: 'secondary', onClick: () => toast(t('t7.photoSent', { name })) }),
        button({ label: t('t7.call'), icon: 'phone', variant: 'secondary', onClick: () => (window.location.href = `tel:${trip.riderPhone || SUPPORT_PHONE}`) }),
      ),
    ],
    footer: [
      button({ label: t('t7.cta'), icon: 'user', onClick: () => { setWork({ status: 'waiting' }); go(D('T8')); } }),
      h('p', { class: 't-footnote t-mute t-center' }, t('t7.foot')),
    ],
    className: 't7',
  });

  return {
    el,
    onMount: () => timers.add(countdown(TIMING.freeWaitSec, tickFree, startPaid)),
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- T8 (start trip)

export function T8() {
  const trip = TRIPS[work().tripKind || 'airport'];
  const bagsBig = trip.bags.big ? h('button', { type: 'button', class: 'bag-check', 'aria-checked': 'true', role: 'checkbox' },
    h('span', { class: 'bag-check__box' }, ic('check', { size: 14, stroke: 3 })),
    ic('bag', { size: 18 }), h('span', {}, `${trip.bags.big} big`)) : null;
  const bagsSmall = trip.bags.small ? h('button', { type: 'button', class: 'bag-check', 'aria-checked': 'true', role: 'checkbox' },
    h('span', { class: 'bag-check__box' }, ic('check', { size: 14, stroke: 3 })),
    ic('bag', { size: 16 }), h('span', {}, `${trip.bags.small} small`)) : null;

  [bagsBig, bagsSmall].filter(Boolean).forEach((btn) => btn.addEventListener('click', () => {
    btn.setAttribute('aria-checked', btn.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
    btn.classList.toggle('is-off', btn.getAttribute('aria-checked') === 'false');
  }));

  const boxes = codeBoxes({ length: 4, label: t('t8.codeStep', { name: trip.rider }), onComplete: (val) => {
    if (val === trip.code) {
      boxes.setState('success');
      vibrate(20);
      setTimeout(() => { setWork({ status: 'onTrip' }); go(D('T9'), { replace: true }); }, 400);
    } else {
      boxes.setState('error');
      toast(t('t8.wrong', { name: trip.rider }), { tone: 'error' });
    }
  } });

  // Hardware keyboard support
  const pad = keypad({ onDigit: (d) => boxes.type(d), onDelete: () => boxes.backspace() });

  const { el } = screen({
    code: 'T8',
    label: t('t8.title'),
    topbar: topBar({ onBack: () => back(D('T7')), listen: reads('t8.title', 't8.loadStep', 't8.codeStep') }),
    body: [
      h('h1', { class: 't-large screen__heading', tabindex: '-1' }, t('t8.title')),
      h('p', { class: 't-label t-mute' }, t('t8.loadStep').toUpperCase()),
      h('div', { class: 'bag-row' }, bagsBig, bagsSmall),
      textLink({ label: t('t8.badBags'), onClick: openBadBags }),
      h('p', { class: 't-label t-mute' }, t('t8.codeStep', { name: trip.rider }).toUpperCase()),
      boxes.el,
    ],
    footer: [button({ label: t('t8.cta'), icon: 'arrow', onClick: () => {
      const v = boxes.value();
      if (v.length !== 4) { toast('Enter the 4-digit code', { tone: 'error' }); boxes.focus(); return; }
      if (v !== trip.code) { boxes.setState('error'); toast(t('t8.wrong', { name: trip.rider }), { tone: 'error' }); return; }
      setWork({ status: 'onTrip' });
      go(D('T9'), { replace: true });
    } })],
    keypad: pad,
    className: 't8',
  });
  el.addEventListener('keydown', (e) => {
    if (!/^\d$/.test(e.key) && e.key !== 'Backspace') return;
    if (e.target.classList.contains('code-box')) return;
    if (e.key === 'Backspace') boxes.backspace(); else boxes.type(e.key);
  });
  return { el, onMount: () => boxes.focus() };
}

export function openBadBags() {
  const trip = TRIPS[work().tripKind || 'airport'];
  sheet({
    title: 'Bags don’t match the booking',
    content: [
      h('p', { class: 't-callout t-mute' }, t('e7.sub', { name: trip.rider })),
      choiceRow('check', t('e7.fit'), t('e7.fitSub', { name: trip.rider }), null),
      choiceRow('x', t('e7.dontFit'), t('e7.dontFitSub'), () => {
        store.set('work', { record: [{ type: 'badBags', date: '18 Oct' }, ...work().record] });
        setWork({ status: 'inQueue', queuePlace: 7 });
        go(D('T4'));
      }),
    ],
  });
}

function choiceRow(iconName, title, sub, onClick) {
  return h(
    'button',
    { type: 'button', class: 'choice-row', onClick: onClick || (() => {}) },
    ic(iconName, { size: 20 }),
    h('div', {}, h('span', { class: 't-headline' }, title), h('span', { class: 't-subhead t-mute' }, sub)),
    ic('chev', { size: 18 }),
  );
}

// ---------------------------------------------------------------- T9 ⏱T10

export function T9() {
  const timers = timerBag();
  const trip = TRIPS[work().tripKind || 'airport'];
  const { el } = screen({
    code: 'T9',
    label: t('t9.turn'),
    hero: h('div', {},
      directionBar({ iconName: 'arrow', title: t('t9.turn'), sub: t('t9.turnSub') }),
      mapScene({ kind: 'nav', pinLabel: t('t9.pin') }),
    ),
    body: [
      h('div', { class: 't9-row' },
        h('div', {},
          h('span', { class: 't-label t-mute' }, t('t9.drop')),
          h('span', { class: 't-large' }, trip.drop),
        ),
        h('span', { class: 'eta-badge' }, h('span', { class: 'eta-badge__v' }, String(trip.minutes || 28)), h('span', { class: 'eta-badge__u' }, t('t9.min'))),
      ),
      h('div', { class: 'card card--brand' },
        iconTile('lock', { tone: 'brand', round: true, size: 18 }),
        h('div', {},
          h('p', { class: 't-headline' }, trip.counter ? t('t9.counterPaid', { amount: trip.fare }) : t('t9.paid', { amount: trip.fare })),
          h('p', { class: 't-subhead t-mute' }, trip.counter ? t('t9.counterPaidSub') : t('t9.paidSub', { name: trip.rider })),
        ),
      ),
      h('div', { class: 't9-pills' },
        h('button', { type: 'button', class: 'pill pill--error', onClick: openSOS }, ic('sos', { size: 18 }), h('span', {}, t('t9.sos'))),
        h('button', { type: 'button', class: 'pill', onClick: () => go(D('T15')) }, ic('help', { size: 18 }), h('span', {}, t('t9.help'))),
      ),
    ],
    className: 't9',
  });
  return {
    el,
    onMount: () => timers.add(after(TIMING.onTripMs, () => { setWork({ status: 'arrived' }); go(D('T10'), { replace: true }); })),
    onUnmount: () => timers.clear(),
  };
}

export function openSOS() {
  sheet({
    title: t('e9.title'),
    content: [
      button({ label: t('e9.call'), icon: 'phone', variant: 'danger', onClick: () => (window.location.href = 'tel:112') }),
      choiceRow('pin', t('e9.shareTitle'), t('e9.shareSub'), () => toast('Sharing live location with support')),
      choiceRow('help', t('e9.supportTitle'), t('e9.supportSub'), () => (window.location.href = `tel:${SUPPORT_PHONE}`)),
    ],
    actions: [{ label: t('e9.ok'), variant: 'text' }],
  });
}

// ---------------------------------------------------------------- T10 → T11

export function T10() {
  const trip = TRIPS[work().tripKind || 'airport'];
  const { el } = screen({
    code: 'T10',
    label: t('t10.title'),
    hero: h('div', {},
      directionBar({ iconName: 'check', title: t('t10.title'), sub: trip.drop }),
      mapScene({ kind: 'drop', pinLabel: 'Drop' }),
    ),
    body: [
      h('span', { class: 't-label t-mute' }, t('t10.drop')),
      h('h1', { class: 't-large screen__heading', tabindex: '-1' }, trip.drop),
      h('p', { class: 't-callout t-mute' }, t('t10.body', { name: trip.rider })),
    ],
    footer: [swipeConfirm({ label: t('t10.swipe'), onConfirm: () => openAllBags() })],
    className: 't10',
  });
  return { el };
}

function openAllBags() {
  const trip = TRIPS[work().tripKind || 'airport'];
  const n = trip.bags.big + trip.bags.small;
  const bagIcons = h('div', { class: 'bag-icons' }, Array.from({ length: n }, () => ic('bag', { size: 32 })));
  sheet({
    title: t('t11.title'),
    scrimClose: false,
    content: [
      bagIcons,
      h('p', { class: 't-callout t-mute' }, t('t11.sub')),
      trip.counter ? null : infoCard({ iconName: 'user', title: t('t11.riderSays', { name: trip.rider, n }), text: t('t11.riderSaysSub'), tone: 'success' }),
    ],
    actions: [{ label: trip.counter ? t('t11.ctaCounter') : t('t11.cta', { n }), icon: 'check', onClick: () => {
      finishTrip(trip);
      go(D('T12'));
    } }],
  });
}

function finishTrip(trip) {
  const w = work();
  const waitPay = w.waitPay || 0;
  const total = trip.fare + waitPay;
  store.set('work', {
    status: 'done',
    waitPay: 0,
    trips: [{ kind: w.tripKind, drop: trip.drop, rider: trip.rider, time: '22:40', fare: total, waitPay }, ...w.trips],
  });
}

// ---------------------------------------------------------------- T12 (trip done)

export function T12() {
  const w = work();
  const last = w.trips[0];
  const trip = last ? TRIPS[last.kind] : TRIPS.airport;
  const isFirst = w.trips.length === 1;
  let rated = null;

  const good = h('button', { type: 'button', class: 'rate', 'aria-pressed': 'false' }, iconTile('good', { tone: 'success', round: true, size: 28 }), h('span', { class: 't-headline' }, t('t12.good')));
  const bad = h('button', { type: 'button', class: 'rate', 'aria-pressed': 'false' }, iconTile('bad', { tone: 'neutral', round: true, size: 28 }), h('span', { class: 't-headline' }, t('t12.bad')));
  const setRating = (v) => {
    rated = v;
    good.setAttribute('aria-pressed', String(v === 'good'));
    bad.setAttribute('aria-pressed', String(v === 'bad'));
    good.classList.toggle('rate--on', v === 'good');
    bad.classList.toggle('rate--on', v === 'bad');
  };
  good.addEventListener('click', () => setRating('good'));
  bad.addEventListener('click', () => setRating('bad'));

  const { el } = screen({
    code: 'T12',
    label: t('t12.title'),
    topbar: topBar({ left: h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('t12.title')), listen: reads('t12.title', () => `${t('t12.earned')} ${rupees(last ? last.fare : trip.fare)}`) }),
    body: [
      h('section', { class: 'earn-hero' },
        h('p', { class: 't-callout' }, t('t12.earned')),
        h('p', { class: 't-hero' }, '₹', String(last ? last.fare : trip.fare)),
        h('p', { class: 't-subhead' }, isFirst ? t('t12.firstTrip') : t('t12.anotherTrip', { drop: trip.drop })),
      ),
      h('div', { class: 'card break' },
        breakRow(t('t12.breakFare'), rupees(trip.fare)),
        breakRow(t('t12.breakWait'), rupees(last ? last.waitPay : 0)),
        trip.counter ? breakRow(t('t12.breakCounter'), 'Nothing to collect') : [
          breakRow(t('t12.breakToll'), t('t12.breakTollV')),
          breakRow(t('t12.breakFee'), t('t12.breakFeeV')),
        ],
      ),
      h('h2', { class: 't-headline' }, t('t12.rate', { name: trip.rider })),
      h('div', { class: 'rate-row' }, good, bad),
    ],
    footer: [button({ label: t('t12.done'), onClick: () => {
      if (rated) store.set('work', { record: [{ type: 'tripDone', date: '18 Oct', drop: trip.drop, rating: rated === 'good' ? 'Good' : 'Not good' }, ...work().record] });
      openWhatNext();
    } })],
    className: 't12',
  });
  return { el };
}

function breakRow(label, value) {
  return h('div', { class: 'break__row' }, h('span', { class: 't-callout t-mute' }, label), h('span', { class: 't-callout t-strong' }, value));
}

function openWhatNext() {
  sheet({
    title: t('t13.title'),
    content: [
      listRow({ iconName: 'ret', iconTone: 'brand', title: t('t13.again'), sub: t('t13.againSub', { area: QUEUE.area }), onClick: () => { setWork({ status: 'toQueue', onlineSince: Date.now() }); go(D('T3')); } }),
      listRow({ iconName: 'home', iconTone: 'neutral', title: t('t13.off'), sub: t('t13.offSub'), onClick: () => { setWork({ status: 'offline' }); go(D('T1')); } }),
    ],
  });
}

// ---------------------------------------------------------------- T14 (earnings)

export function T14() {
  const w = work();
  const total = w.trips.reduce((s, x) => s + x.fare, 0);
  const waitPay = w.trips.reduce((s, x) => s + (x.waitPay || 0), 0);
  const onlineMin = Math.floor((w.onlineMs + (w.onlineSince ? Date.now() - w.onlineSince : 0)) / 60000) || (w.trips.length ? 100 : 0);
  const hours = Math.floor(onlineMin / 60);
  const mins = onlineMin % 60;

  const { el } = screen({
    code: 'T14',
    label: t('t14.title'),
    topbar: topBar({ left: h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('t14.title')), listen: reads('t14.title', () => `${t('t14.today')} ${rupees(total)}`) }),
    body: [
      segmented({ label: t('t14.title'), value: 'today', options: [{ value: 'today', label: t('t14.today') }, { value: 'week', label: t('t14.week') }], onChange: () => toast('This week · not built yet', { tone: 'info' }) }),
      h('section', { class: 'earn-hero' },
        h('p', { class: 't-callout' }, t('t14.today')),
        h('p', { class: 't-hero' }, '₹', String(total)),
      ),
      h('div', { class: 'stat-row' },
        statTile({ value: String(w.trips.length), label: w.trips.length === 1 ? t('t14.trip') : t('t14.trips') }),
        statTile({ value: `₹${waitPay}`, label: t('t14.waitPay') }),
        statTile({ value: hours ? `${hours}h ${mins}m` : `${mins}m`, label: t('t14.online') }),
      ),
      w.trips.length === 0
        ? infoCard({ iconName: 'receipt', title: t('t14.empty'), text: t('t14.emptySub') })
        : h('div', {},
          h('h2', { class: 't-label t-mute' }, t('t14.tripsToday').toUpperCase()),
          h('ul', { class: 'trip-list' }, w.trips.map((trip) => listRow({
            iconName: 'auto', iconTone: 'neutral',
            title: t('t14.tripRow', { drop: trip.drop }),
            sub: t('t14.tripRowSub', { time: trip.time, name: trip.rider }),
            right: h('span', { class: 't-headline' }, rupees(trip.fare)),
          }))),
        ),
      listRow({
        iconName: 'bank', iconTone: 'brand',
        title: t('t14.payout', { where: driver().payout === 'bank' && driver().bank ? driver().bank.name : (driver().upi || DRIVER.upi) }),
        sub: t('t14.payoutChange'),
        onClick: () => go(D('T15')),
      }),
    ],
    tabbar: tabBar('earnings', switchTab),
    className: 't14',
  });
  return { el };
}

// ---------------------------------------------------------------- T15 (account)

export function T15() {
  const w = work();
  const d = driver();
  const name = d.name || `${DRIVER.firstName} ${DRIVER.lastName}`;
  const plate = d.plate || DRIVER.vehicle.plate;
  const taken = w.trips.length;
  const payout = d.payout === 'bank' && d.bank ? d.bank.name : (d.upi || DRIVER.upi);
  const lang = (store.settings().lang || 'en');
  const langDisplay = { en: 'English (English)', hi: 'हिंदी (Hindi)', mr: 'मराठी (Marathi)', gu: 'ગુજરાતી (Gujarati)' }[lang] || 'English';

  const { el } = screen({
    code: 'T15',
    label: t('t15.title'),
    topbar: topBar({ left: h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('t15.title')), listen: reads('t15.title', 't15.safeBody') }),
    body: [
      h('header', { class: 't15-head' },
        iconTile('user', { tone: 'neutral', round: true, size: 24 }),
        h('div', {},
          h('p', { class: 't-title2' }, name),
          h('p', { class: 't-subhead t-mute' }, `${d.vehicleType === 'cab' ? 'Cab' : 'Auto'} · ${plate}`),
        ),
      ),
      h('h2', { class: 't-label t-mute' }, t('t15.riders')),
      h('div', { class: 'stat-row' },
        statTile({ value: `${taken} of ${Math.max(taken, 1)}`, label: t('t15.taken') }),
        statTile({ value: '0', label: t('t15.cancelled') }),
        statTile({ value: taken ? '4.8' : t('t15.ratingNew'), label: t('t15.rating') }),
      ),
      h('div', { class: 'card card--brand card--row' },
        iconTile('shield', { tone: 'brand', round: true, size: 18 }),
        h('div', {}, h('p', { class: 't-headline' }, t('t15.safeTitle')), h('p', { class: 't-subhead t-mute' }, t('t15.safeBody'))),
      ),
      h('ul', { class: 'settings-list' },
        listRow({ iconName: 'shield', iconTone: 'neutral', title: t('t15.record'), sub: t('t15.recordSub'), onClick: () => go(D('T16')) }),
        listRow({ iconName: 'bank', iconTone: 'neutral', title: t('t15.payments'), sub: payout, onClick: () => go(D('O11')) }),
        listRow({ iconName: 'speaker', iconTone: 'neutral', title: t('t15.language'), sub: langDisplay, onClick: () => go(D('O2')) }),
        listRow({ iconName: 'help', iconTone: 'neutral', title: t('t15.help'), onClick: () => toast(t('e12.sent')) }),
        listRow({ iconName: 'out', iconTone: 'neutral', title: t('t15.logout'), onClick: () => dialog({
          title: t('t15.logoutTitle'),
          body: t('t15.logoutBody'),
          actions: [
            { label: 'Keep me signed in', variant: 'primary' },
            { label: t('t15.logoutYes'), variant: 'secondary', onClick: () => { store.reset(); go('/', { replace: true }); } },
          ],
        }) }),
      ),
    ],
    tabbar: tabBar('account', switchTab),
    className: 't15',
  });
  return { el };
}

// ---------------------------------------------------------------- T16 (my record)

export function T16() {
  const w = work();
  // If the user hasn't done anything, show the DS sample so the screen reads as a hi-fi design
  const entries = w.record.length ? w.record : [
    { type: 'sayNo', date: '18 Oct' },
    { type: 'riderCancel', date: '18 Oct', amount: 42 },
    { type: 'police', date: '18 Oct' },
    { type: 'tripDone', date: '18 Oct', drop: 'Andheri East', rating: 'Good' },
  ];
  const taken = w.trips.length || 3;

  const row = (e) => {
    if (e.type === 'sayNo') return listRow({ iconName: 'x', iconTone: 'neutral', title: t('rec.sayNo'), sub: t('rec.sayNoSub', { date: e.date }), right: '' });
    if (e.type === 'riderCancel') return listRow({ iconName: 'user', iconTone: 'neutral', title: t('rec.riderCancel'), sub: t('rec.riderCancelSub', { date: e.date, amount: e.amount || 42 }), right: '' });
    if (e.type === 'police') return listRow({ iconName: 'help', iconTone: 'neutral', title: t('rec.police'), sub: t('rec.policeSub', { date: e.date }), right: '' });
    if (e.type === 'noShow') return listRow({ iconName: 'clock', iconTone: 'neutral', title: t('rec.noShow'), sub: t('rec.noShowSub', { date: e.date, amount: e.amount || 42 }), right: '' });
    if (e.type === 'tripDone') return listRow({ iconName: 'check', iconTone: 'success', title: t('rec.trip', { drop: e.drop }), sub: t('rec.tripSub', { date: e.date, rating: e.rating }), right: '' });
    if (e.type === 'badBags') return listRow({ iconName: 'bag', iconTone: 'neutral', title: 'Bags did not fit', sub: `${e.date} · not counted`, right: '' });
    if (e.type === 'driverCancel') return listRow({ iconName: 'x', iconTone: 'neutral', title: 'You cancelled a trip', sub: `${e.date} · counted · ₹${e.amount || 42} fee`, right: '' });
    return null;
  };

  const { el } = screen({
    code: 'T16',
    label: t('t16.title'),
    topbar: topBar({ onBack: () => back(D('T15')), listen: reads('t16.title', 't16.rule') }),
    body: [
      h('p', { class: 't-label t-mute' }, t('t16.sub')),
      h('div', { class: 'stat-row' },
        statTile({ value: `${taken} of ${taken + 1}`, label: t('t15.taken') }),
        statTile({ value: '0', label: t('t15.cancelled') }),
        statTile({ value: '4.8', label: t('t15.rating') }),
      ),
      h('h2', { class: 't-label t-mute' }, t('t16.history')),
      h('ul', { class: 'record-list' }, entries.map(row).filter(Boolean)),
      banner({ tone: 'neutral', iconName: 'shield', text: t('t16.rule') }),
    ],
    className: 't16',
  });
  return { el };
}
