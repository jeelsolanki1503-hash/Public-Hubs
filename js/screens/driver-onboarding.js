// Driver · 1 Sign up & onboarding (first login): O1–O14, O5b, O8c.
// Each factory is named after its Figma frame code.

import {
  h, ic, screen, pageHead, topBar, button, textLink, textField, selectField, codeBoxes, keypad,
  radioGroup, langTile, choiceCard, segmented, stepProgress, pageDots, timeline, banner, spinner,
  badge, stateIcon, infoCard, docRow, checkList, iconButton,
  illustration, iconTile, numberPlate, meter, pageHeadIcon,
} from '../components.js';
import * as ill from '../illustrations.js';
import { BRAND, PIN_OUTER, PIN_KEY } from '../brand.js';
import { toast, osAlert } from '../overlays.js';
import { go, back, backTo, inTrail, relabel } from '../router.js';
import { store, isOffline } from '../store.js';
import { t } from '../i18n.js';
import { countdown, after, timerBag } from '../clock.js';
import * as fmt from '../format.js';
import { LANGUAGES, CITIES, VEHICLE_TYPES, DOCUMENTS, HOW_PAGES, SMS_CODE, SUPPORT_PHONE, TIMING, BANKS } from '../data.js';

const D = (code) => `/driver/${code}`;
const driver = () => store.driver();

/** Listen reads the screen title and its main instruction. */
const reads = (...keys) => () => keys.map((k) => (typeof k === 'function' ? k() : t(k))).join('. ');

function vibrate(ms) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* not allowed before a user gesture — ignore */
    }
  }
}

function needOnline() {
  if (!isOffline()) return true;
  toast(t('common.offlineAction'), { tone: 'error' });
  return false;
}

function docName(doc) {
  const cab = doc.cabNameKey && driver().vehicleType === 'cab';
  return t(cab ? doc.cabNameKey : doc.nameKey);
}

function docLower(doc) {
  const cab = doc.cabNameKey && driver().vehicleType === 'cab';
  return t(`doc.${doc.id}${cab ? 'Cab' : ''}Lower`);
}

// ---------------------------------------------------------------- Splash (2 s)

export function Splash() {
  const timers = timerBag();
  const pin = `<svg class="splash__pin" viewBox="0 0 100 130" aria-hidden="true" focusable="false">
    <path class="splash__pin-body" d="${PIN_OUTER}"/>
    <path class="splash__pin-key" d="${PIN_KEY}"/>
  </svg>`;
  const el = h(
    'main',
    { class: 'screen splash', 'aria-label': `${BRAND} Driver`, dataset: { code: 'splash' } },
    h(
      'div',
      { class: 'splash__stage', role: 'img', 'aria-label': BRAND },
      h('span', { class: 'splash__ripple', 'aria-hidden': 'true' }),
      h('span', { class: 'splash__ripple splash__ripple--2', 'aria-hidden': 'true' }),
      h('span', { class: 'splash__mark', html: pin }, h('span', { class: 'splash__shadow', 'aria-hidden': 'true' })),
      h('span', { class: 'splash__word', 'aria-hidden': 'true' }, h('span', {}, BRAND)),
    ),
    h('p', { class: 'splash__tag', 'aria-hidden': 'true' }, 'Driver'),
  );
  return {
    el,
    chrome: 'brand',
    // 2 s brand moment, then the welcome screen fades in (splash leaves history)
    onMount: () => timers.add(after(2000, () => go(D('O1'), { replace: true, fade: true }))),
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- O1

export function O1() {
  const { el } = screen({
    code: 'O1',
    label: t('o1.title'),
    topbar: topBar({ brandName: 'Driver', listen: reads('o1.title', 'o1.body') }),
    body: [
      illustration(ill.welcome(t('o1.illus')), { className: 'o1-hero' }),
      h('h1', { class: 't-large screen__heading o1-title', tabindex: '-1' }, t('o1.title')),
      h('p', { class: 't-callout t-mute o1-body' }, t('o1.body')),
    ],
    footer: [
      button({ label: t('o1.cta'), onClick: () => go(D('O2')) }),
      button({ label: t('o1.have'), variant: 'text', onClick: () => go(D('O3')) }),
    ],
  });
  return { el };
}

// ---------------------------------------------------------------- O2

let focusLangAfterRefresh = false;

export function O2() {
  const picked = store.settings().lang;
  const tiles = LANGUAGES.map((lang) => langTile({ lang, checked: lang.id === picked }));
  const grid = h('div', { class: 'lang-grid', 'aria-label': t('o2.title') }, tiles);
  radioGroup(grid, tiles, (id) => {
    if (id === store.settings().lang) return;
    focusLangAfterRefresh = true;
    store.set('settings', { lang: id }); // app.js re-renders every screen on language change
    if (id === 'gu') setTimeout(() => toast(t('common.langFallback'), { tone: 'info' }), 350);
  });

  const { el } = screen({
    code: 'O2',
    label: t('o2.title'),
    topbar: topBar({ onBack: () => back(D('O1')), listen: reads('o2.title', 'o2.sub') }),
    body: [
      pageHead(t('o2.title'), t('o2.sub')),
      grid,
      infoCard({ iconName: 'speaker', title: t('o2.hintTitle'), text: t('o2.hintBody'), tone: 'brand' }),
    ],
    footer: [button({ label: t('o2.cta'), onClick: () => go(D('O3')) })],
  });

  return {
    el,
    onMount() {
      if (focusLangAfterRefresh) {
        focusLangAfterRefresh = false;
        const on = tiles.find((x) => x.getAttribute('aria-checked') === 'true');
        if (on) on.focus({ preventScroll: true });
      }
    },
  };
}

// ---------------------------------------------------------------- O3

export function O3() {
  let digits = fmt.digitsOnly(driver().phone);

  const field = textField({
    label: t('o3.label'),
    value: fmt.phone(digits),
    prefix: '+91',
    type: 'tel',
    autocomplete: 'tel-national',
    readOnlyKeyboard: true, // the mock keypad below is the keyboard
    onInput: (e) => setDigits(fmt.digitsOnly(e.target.value)),
    onBlur: (_, f) => {
      // Check when they leave the field, not on every key press
      if (digits.length && digits.length < 10) f.setError(t('o3.errLen'));
    },
  });

  function setDigits(d) {
    digits = d.slice(0, 10);
    field.input.value = fmt.phone(digits);
    store.set('driver', { phone: digits });
  }

  const cta = button({ label: t('o3.cta'), onClick: submit });

  function submit() {
    if (digits.length < 10) return field.setError(t('o3.errLen'));
    if (!/^[6-9]/.test(digits)) return field.setError(t('o3.errStart'));
    if (!needOnline()) return;
    cta.setLoading(t('o3.sending'));
    after(600, () => {
      store.set('driver', { phone: digits, codeTries: 0 });
      go(D('O4'));
    });
  }

  const pad = keypad({
    onDigit: (d) => {
      if (field.el.classList.contains('field--error')) field.clear();
      setDigits(digits + d);
      field.input.focus({ preventScroll: true });
    },
    onDelete: () => {
      setDigits(digits.slice(0, -1));
      field.input.focus({ preventScroll: true });
    },
  });

  field.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });

  const typeAnywhere = (e) => {
    if (e.target === field.input || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      setDigits(digits + e.key);
      field.input.focus({ preventScroll: true });
    }
  };

  const { el } = screen({
    code: 'O3',
    label: t('o3.title'),
    topbar: topBar({ onBack: () => back(D('O2')), listen: reads('o3.title', 'o3.sub') }),
    body: [
      pageHeadIcon('phone', t('o3.title'), t('o3.sub')),
      field.el,
      h('p', { class: 't-footnote t-mute o3-terms' }, t('o3.terms')),
    ],
    footer: [cta],
    keypad: pad,
  });
  el.addEventListener('keydown', typeAnywhere);

  return {
    el,
    onMount: () => field.input.focus({ preventScroll: true }),
  };
}

// ---------------------------------------------------------------- O4

export function O4() {
  const timers = timerBag();
  const phoneShown = fmt.phoneWithCode(driver().phone || '9876543210');
  let autofilling = false;
  let userTyped = false;

  const status = h('p', { class: 'o4-line t-subhead t-mute', 'aria-live': 'polite' });
  const resendLine = h('p', { class: 'o4-resend' });

  const boxes = codeBoxes({
    length: 6,
    label: t('o4.codeLabel'),
    onComplete: verify,
  });

  // Typing yourself cancels the SMS auto-read
  boxes.el.addEventListener('keydown', () => {
    userTyped = true;
  });
  boxes.el.addEventListener('click', () => {
    // Figma wires a tap on the code boxes straight to O5: finish the auto-read now
    if (!userTyped && !autofilling && !boxes.value() && !isLocked()) startAutofill(0);
  });

  function setStatus(iconName, text, tone = '') {
    status.className = `o4-line t-subhead ${tone ? `o4-line--${tone}` : 't-mute'}`;
    status.replaceChildren(...(iconName ? [ic(iconName, { size: 18 })] : []), h('span', {}, text));
  }

  function isLocked() {
    return driver().codeLockedUntil > Date.now();
  }

  function startAutofill(delay = TIMING.smsAutofillMs) {
    if (isLocked()) return;
    setStatus('msg', t('o4.reading'));
    timers.add(
      after(delay, () => {
        if (userTyped || boxes.value()) return;
        autofilling = true;
        [...SMS_CODE].forEach((d, i) =>
          timers.add(
            after(i * 110, () => {
              if (!userTyped) boxes.type(d);
            }),
          ),
        );
      }),
    );
  }

  function verify(code) {
    autofilling = false;
    if (code === SMS_CODE) {
      boxes.setState('success');
      setStatus('check', t('o4.verified'), 'success');
      store.set('driver', { codeTries: 0 });
      vibrate(20);
      timers.add(after(650, () => go(D('O5'), { replace: true })));
      return;
    }
    const tries = driver().codeTries + 1;
    const left = 3 - tries;
    if (left <= 0) {
      store.set('driver', { codeTries: 0, codeLockedUntil: Date.now() + (TIMING.codeLockSec * 1000) / store.settings().demoSpeed });
      lock();
      return;
    }
    store.set('driver', { codeTries: tries });
    boxes.setState('error');
    setStatus('alert', left === 1 ? t('o4.wrong1') : t('o4.wrong', { n: left }), 'error');
    vibrate([30, 40, 30]);
    boxes.focus();
  }

  function lock() {
    boxes.setState('locked');
    const secs = (driver().codeLockedUntil - Date.now()) / 1000;
    timers.add(
      countdown(
        secs * store.settings().demoSpeed,
        (s) => setStatus('lock', t('o4.locked', { t: fmt.mmss(s) }), 'warning'),
        () => {
          boxes.setState(null);
          boxes.clear();
          setStatus(null, '');
          boxes.focus();
        },
      ),
    );
  }

  function startResend() {
    timers.add(
      countdown(
        TIMING.resendSec,
        (s) => {
          resendLine.className = 'o4-resend t-subhead t-strong t-faint';
          resendLine.textContent = t('o4.resendIn', { t: fmt.mmss(s) });
        },
        () => {
          resendLine.className = 'o4-resend t-subhead';
          resendLine.replaceChildren(textLink({ label: t('o4.resend'), onClick: resend }));
        },
      ),
    );
  }

  function resend() {
    if (isLocked() || !needOnline()) return;
    toast(t('o4.resent'));
    userTyped = false;
    boxes.setState(null);
    boxes.clear();
    startResend();
    startAutofill();
  }

  const pad = keypad({
    onDigit: (d) => {
      userTyped = true;
      boxes.type(d);
    },
    onDelete: () => {
      userTyped = true;
      boxes.backspace();
    },
  });

  const { el } = screen({
    code: 'O4',
    label: t('o4.title'),
    topbar: topBar({ onBack: () => back(D('O3')), listen: reads('o4.title', () => t('o4.sentTo', { phone: phoneShown })) }),
    body: [
      h(
        'header',
        { class: 'page-head page-head--icon' },
        iconTile('msg', { size: 24 }),
        h('h1', { class: 't-large screen__heading', tabindex: '-1' }, t('o4.title')),
        h('p', { class: 't-callout page-head__sub' }, t('o4.sentTo', { phone: phoneShown }), ' · ', textLink({ label: t('o4.change'), onClick: () => back(D('O3')) })),
      ),
      boxes.el,
      status,
      resendLine,
    ],
    keypad: pad,
  });

  // A hardware keyboard types into the boxes wherever focus is on the screen
  el.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('code-box') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^\d$/.test(e.key)) {
      userTyped = true;
      boxes.type(e.key);
    } else if (e.key === 'Backspace') {
      userTyped = true;
      boxes.backspace();
    }
  });

  return {
    el,
    onMount() {
      boxes.focus();
      if (isLocked()) lock();
      else startAutofill();
      startResend();
    },
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- O5 / O5b

function askLocation() {
  osAlert({
    title: t('os.locTitle'),
    message: t('os.locMsg'),
    buttons: [
      { label: t('os.whileUsing'), onClick: () => grant('while-using') },
      { label: t('os.once'), onClick: () => grant('once') },
      { label: t('os.deny'), onClick: () => store.set('driver', { permissions: { ...driver().permissions, location: 'denied' } }) },
    ],
  });
}

function grant(kind) {
  store.set('driver', { permissions: { location: kind, notifications: 'granted' } });
  go(D('O6'));
}

export function O5({ code } = {}) {
  const { el } = screen({
    code: 'O5',
    label: t('o5.title'),
    topbar: topBar({ onBack: () => back(D('O3')), listen: reads('o5.title', 'o5.sub', 'o5.locBody', 'o5.notifBody') }),
    body: [
      pageHead(t('o5.title'), t('o5.sub')),
      infoCard({ iconName: 'pin', title: t('o5.locTitle'), text: t('o5.locBody') }),
      infoCard({ iconName: 'bell', title: t('o5.notifTitle'), text: t('o5.notifBody') }),
    ],
    footer: [button({ label: t('o5.cta'), onClick: askLocation })],
  });
  return {
    el,
    onMount() {
      if (code === 'O5b') after(350, askLocation);
    },
  };
}

// ---------------------------------------------------------------- O6

export function O6() {
  const d = driver();

  const name = textField({
    label: t('o6.name'),
    value: d.name,
    placeholder: t('o6.namePh'),
    autocomplete: 'name',
    autocapitalize: 'words',
    onInput: (e) => store.set('driver', { name: e.target.value }),
    onBlur: (_, f) => d.name && checkName(f),
  });

  // Date of birth: masked text input + the native picker behind the trailing icon
  const native = h('input', { type: 'date', class: 'field__date-native', tabindex: '-1', 'aria-hidden': 'true', max: new Date().toISOString().slice(0, 10) });
  const pick = h('button', { type: 'button', class: 'field__trail', 'aria-label': t('o6.dobPick') }, ic('clock', { size: 22 }));
  const dob = textField({
    label: t('o6.dob'),
    value: d.dob,
    placeholder: t('o6.dobPh'),
    inputmode: 'numeric',
    autocomplete: 'bday',
    trail: pick,
    onInput: (e) => {
      const masked = fmt.dobMask(e.target.value);
      e.target.value = masked;
      store.set('driver', { dob: masked });
    },
    onBlur: (_, f) => driver().dob && checkDob(f),
  });
  dob.control.append(native);
  pick.addEventListener('click', () => {
    native.value = fmt.dobToIso(dob.input.value) || '1990-01-01';
    if (typeof native.showPicker === 'function') {
      try {
        native.showPicker();
        return;
      } catch {
        /* fall through */
      }
    }
    dob.input.focus();
  });
  native.addEventListener('change', () => {
    dob.input.value = fmt.isoToDob(native.value);
    store.set('driver', { dob: dob.input.value });
    dob.clear();
  });

  const city = selectField({
    label: t('o6.city'),
    value: d.city,
    placeholder: t('o6.cityPh'),
    options: CITIES,
    onChange: (v) => store.set('driver', { city: v }),
  });

  function checkName(f) {
    const v = driver().name.trim();
    if (v.length < 2 || !/\s/.test(v)) {
      f.setError(t('o6.errName'));
      return false;
    }
    return true;
  }

  function checkDob(f) {
    const p = fmt.parseDob(driver().dob);
    if (!p || p.year < 1900) {
      f.setError(t('o6.errDob'));
      return false;
    }
    if (fmt.ageOn(p.date) < 18) {
      f.setError(t('o6.errAge'));
      return false;
    }
    return true;
  }

  function submit() {
    const okName = checkName(name);
    const okDob = checkDob(dob);
    const okCity = Boolean(driver().city);
    if (!okCity) city.setError(t('o6.errCity'));
    const firstBad = [!okName && name.input, !okDob && dob.input, !okCity && city.input].find(Boolean);
    if (firstBad) {
      firstBad.focus();
      return;
    }
    go(D('O7'));
  }

  const { el } = screen({
    code: 'O6',
    label: t('o6.title'),
    topbar: topBar({ onBack: () => back(D('O5')), listen: reads('o6.title', 'o6.sub') }),
    steps: stepProgress(1),
    body: [pageHead(t('o6.title'), t('o6.sub')), name.el, dob.el, city.el],
    footer: [button({ label: t('common.next'), onClick: submit })],
  });
  return { el };
}

// ---------------------------------------------------------------- O7

export function O7() {
  const d = driver();
  const cards = VEHICLE_TYPES.map((v) =>
    choiceCard({ value: v.id, iconName: v.icon, title: t(v.nameKey), sub: t(v.seatsKey), checked: d.vehicleType === v.id }),
  );
  const list = h('div', { class: 'choice-list', 'aria-label': t('o7.title') }, cards);
  radioGroup(list, cards, (id) => store.set('driver', { vehicleType: id }));

  const plate = textField({
    label: t('o7.plateLabel'),
    value: d.plate,
    placeholder: t('o7.platePh'),
    help: t('o7.plateHelp'),
    autocapitalize: 'characters',
    autocomplete: 'off',
    spellcheck: false,
    maxLength: 14,
    onInput: (e) => {
      const v = fmt.plate(e.target.value);
      e.target.value = v;
      store.set('driver', { plate: v });
      preview.setText(v, t('o7.platePh'));
    },
    onBlur: (_, f) => driver().plate && check(f),
  });

  // Live yellow plate — the driver matches screen to street
  const preview = numberPlate('');
  preview.setText(d.plate, t('o7.platePh'));
  const previewWrap = h('div', { class: 'o7-plate', 'aria-hidden': 'true' }, preview);

  function check(f) {
    if (!fmt.isValidPlate(driver().plate)) {
      f.setError(t('o7.errPlate'));
      return false;
    }
    return true;
  }

  function submit() {
    if (!check(plate)) {
      plate.input.focus();
      return;
    }
    // Nothing added yet → O7b (empty list); otherwise carry on where they were
    const anyAdded = DOCUMENTS.some((x) => driver().docs[x.id] !== 'needed');
    go(D(anyAdded ? 'O8' : 'O7b'));
  }

  plate.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });

  const { el } = screen({
    code: 'O7',
    label: t('o7.title'),
    topbar: topBar({ onBack: () => back(D('O6')), listen: reads('o7.title') }),
    steps: stepProgress(2),
    body: [pageHead(t('o7.title')), list, plate.el, previewWrap],
    footer: [button({ label: t('common.next'), onClick: submit })],
  });
  return { el };
}

// ---------------------------------------------------------------- O8 / O8c

let justAdded = null;
let lastAddedCount = null;

export function O8({ code } = {}) {
  const fresh = justAdded;
  justAdded = null;
  if (code === 'O8c') {
    // Deep link to the "all documents added" state
    store.set('driver', { docs: Object.fromEntries(DOCUMENTS.map((x) => [x.id, 'uploaded'])) });
  } else if (code === 'O7b' && !fresh) {
    // O7b = the list before anything is added: every row unticked
    store.set('driver', { docs: Object.fromEntries(DOCUMENTS.map((x) => [x.id, 'needed'])) });
  } else if (code === 'O7b' && fresh) {
    // First photo just added: from here the same list is O8
    relabel(D('O8'));
  }
  const docs = driver().docs;
  const added = DOCUMENTS.filter((x) => docs[x.id] !== 'needed').length;
  const all = added === DOCUMENTS.length;
  const prevCount = lastAddedCount;
  lastAddedCount = added;

  const rows = DOCUMENTS.map((doc) =>
    docRow({
      id: doc.id,
      iconName: doc.icon,
      name: docName(doc),
      meta: t(doc.metaKey),
      state: docs[doc.id],
      isNew: fresh === doc.id,
      onClick: () => go(D(`O9/${doc.id}`)),
    }),
  );

  // Came back after skipping: payout and "How T2 trips work" are already done,
  // so the last document goes straight to checking.
  const returning = driver().howSeen && Boolean(driver().upiVerifiedFor || driver().bankVerifiedFor);
  const cta = button({
    label: all && !returning ? t('o8.ctaDone') : t('o8.cta'),
    disabled: !all,
    onClick: (_, { disabled }) => {
      if (disabled) {
        toast(t('o8.needMore'), { tone: 'info' });
        return;
      }
      if (!needOnline()) return;
      go(D(returning ? 'O13' : 'O11'));
    },
  });

  // Secondary CTA: finish sign-up now, add the rest later (O13 reminds them)
  const skip = all
    ? null
    : button({ label: t('o8.skip'), variant: 'text', onClick: () => go(D(returning ? 'O13' : 'O11')) });

  const { el } = screen({
    code: all ? 'O8c' : added ? 'O8' : 'O7b',
    label: t('o8.title'),
    topbar: topBar({ onBack: () => back(D('O7')), listen: reads('o8.title', 'o8.sub', () => t('o8.count', { n: added })) }),
    steps: stepProgress(3),
    body: [
      pageHead(t('o8.title'), t('o8.sub')),
      h('p', { class: 'doc-count', 'aria-live': 'polite' }, t('o8.count', { n: added })),
      meter(added, DOCUMENTS.length, fresh && prevCount !== null ? prevCount : added),
      h('ul', { class: 'doc-list' }, rows),
    ],
    footer: [cta, skip],
  });

  return {
    el,
    onMount() {
      if (fresh) {
        const doc = DOCUMENTS.find((x) => x.id === fresh);
        toast(t('o8.docAdded', { doc: docName(doc) }));
        vibrate(15);
      }
    },
  };
}

// ---------------------------------------------------------------- O9 (camera)

function pickDoc(arg) {
  return (
    DOCUMENTS.find((x) => x.id === arg) ||
    DOCUMENTS.find((x) => driver().docs[x.id] === 'needed') ||
    DOCUMENTS.find((x) => x.id === 'permit')
  );
}

export function O9({ arg } = {}) {
  const doc = pickDoc(arg);
  const title = doc.selfie ? t('o9.selfieTitle') : t('o9.front', { doc: docName(doc) });
  const flashEl = h('div', { class: 'camera__flash', 'aria-hidden': 'true' });
  let taking = false;

  const flashBtn = iconButton({
    icon: 'flash',
    label: t('o9.flash'),
    pressed: 'false',
    onClick: () => flashBtn.setAttribute('aria-pressed', String(flashBtn.getAttribute('aria-pressed') !== 'true')),
  });

  const shutter = h('button', {
    type: 'button',
    class: 'shutter',
    'aria-label': t('o9.shutter'),
    onClick: () => {
      if (taking) return;
      taking = true;
      flashEl.classList.add('is-firing');
      vibrate(25);
      after(260, () => go(D(`O10/${doc.id}`)));
    },
  });

  const el = h(
    'main',
    { class: 'screen camera', 'aria-label': title, dataset: { code: 'O9' } },
    h(
      'div',
      { class: 'camera__bar' },
      iconButton({ icon: 'x', label: t('o9.close'), onClick: () => back(D('O8')) }),
      h('h1', { class: 'camera__title screen__heading', tabindex: '-1' }, title),
      flashBtn,
    ),
    h(
      'div',
      { class: 'camera__view' },
      h(
        'div',
        { class: `camera__guide${doc.selfie ? ' camera__guide--face' : ''}`, 'aria-hidden': 'true' },
        h('div', { class: 'camera__subject', html: ill.docPhoto(docName(doc), '', { selfie: doc.selfie, framed: false }) }),
        h('span', { class: 'camera__scan' }),
      ),
      h('p', { class: 'camera__hint camera__chip' }, ic(doc.selfie ? 'user' : 'eye', { size: 18 }), h('span', {}, doc.selfie ? t('o9.hintSelfie') : t('o9.hint'))),
      flashEl,
    ),
    h('div', { class: 'camera__deck' }, shutter),
  );
  return { el, chrome: 'dark' };
}

// ---------------------------------------------------------------- O10

export function O10({ arg } = {}) {
  const doc = pickDoc(arg);
  const timers = timerBag();
  const items = doc.selfie ? ['o10.selfie1', 'o10.selfie2', 'o10.selfie3'] : ['o10.check1', 'o10.check2', 'o10.check3'];
  const checks = h('div', { class: 'o10-checks', 'aria-live': 'polite' }, h('p', { class: 'o10-checking t-subhead t-mute' }, spinner(), h('span', {}, t('o10.checking'))));

  const use = button({
    label: t('o10.cta'),
    disabled: true,
    onClick: (_, { disabled }) => {
      if (disabled) return;
      store.setDoc(doc.id, 'uploaded');
      justAdded = doc.id;
      // Back to whichever document list opened the camera (O7b or O8)
      backTo(inTrail(D('O8')) ? D('O8') : D('O7b'));
    },
  });

  const { el } = screen({
    code: 'O10',
    label: t('o10.title'),
    topbar: topBar({ onBack: () => back(D('O9')), listen: reads('o10.title', ...items) }),
    body: [
      pageHead(t('o10.title')),
      illustration(ill.docPhoto(docName(doc), t('o10.photoOf', { doc: docLower(doc) }), { selfie: doc.selfie }), { className: 'o10-photo' }),
      checks,
    ],
    footer: [use, button({ label: t('o10.again'), variant: 'text', onClick: () => back(D(`O9/${doc.id}`)) })],
  });

  return {
    el,
    onMount() {
      // Auto-check the photo (blur, corners, glare) — feedback within 0.4 s, done in ~0.8 s
      timers.add(
        after(700, () => {
          checks.replaceChildren(checkList(items.map((k) => t(k))));
          use.setDisabled(false);
        }),
      );
    },
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- O11

export function O11() {
  const timers = timerBag();
  let tab = driver().payout === 'bank' ? 'bank' : 'upi';
  let checking = false;
  const nameOnAccount = (driver().name.trim() || 'Santosh Pawar').toUpperCase();

  const result = h('div', { class: 'o11-result', 'aria-live': 'polite' });

  const upi = textField({
    label: t('o11.upiLabel'),
    value: driver().upi,
    placeholder: t('o11.upiPh'),
    help: t('o11.help'),
    type: 'email',
    inputmode: 'email',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: false,
    onInput: (e) => {
      const v = e.target.value.trim();
      store.set('driver', { upi: v, upiVerifiedFor: '' });
      result.replaceChildren();
      checking = false;
      timers.clear();
      if (fmt.isValidUpi(v)) timers.add(after(700, () => verify(v)));
    },
  });

  function showVerified() {
    result.replaceChildren(
      infoCard({ iconName: 'check', title: t('o11.nameOn', { name: nameOnAccount }), text: t('o11.matches'), tone: 'success' }),
    );
  }

  function verify(v, then) {
    if (!needOnline()) return;
    checking = true;
    result.replaceChildren(h('p', { class: 'o11-checking t-subhead t-mute' }, spinner(), h('span', {}, t('o11.checking'))));
    timers.add(
      after(TIMING.upiCheckMs, () => {
        checking = false;
        store.set('driver', { upiVerifiedFor: v });
        showVerified();
        then && then();
      }),
    );
  }

  const upiPanel = h('div', { class: 'o11-panel' }, upi.el, result);

  // ---- Bank account: pick a bank, account number twice, IFSC ----
  const saved = driver().bank || {};
  const bankResult = h('div', { class: 'o11-result', 'aria-live': 'polite' });
  const bankKey = () => `${fmt.digitsOnly(acc.input.value)}|${ifsc.input.value}`;
  const saveBank = () =>
    store.set('driver', {
      bank: { name: bankSel.input.value, acc: fmt.digitsOnly(acc.input.value), ifsc: ifsc.input.value },
      bankVerifiedFor: '',
    });
  const bankFieldsValid = () =>
    Boolean(bankSel.input.value) &&
    /^\d{9,18}$/.test(fmt.digitsOnly(acc.input.value)) &&
    fmt.digitsOnly(acc.input.value) === fmt.digitsOnly(acc2.input.value) &&
    fmt.isValidIfsc(ifsc.input.value);
  const bankChanged = () => {
    saveBank();
    bankResult.replaceChildren();
    checking = false;
    timers.clear();
    if (bankFieldsValid()) timers.add(after(700, () => verifyBank()));
  };

  const bankSel = selectField({
    label: t('o11.bankName'),
    value: saved.name || '',
    placeholder: t('o11.bankPh'),
    options: BANKS.map((b) => b.name),
    onChange: (name) => {
      // Pre-fill the IFSC bank code (first 4 letters + 0), like bank apps do
      const b = BANKS.find((x) => x.name === name);
      if (b && !ifsc.input.value.startsWith(b.ifsc)) ifsc.input.value = `${b.ifsc}0`;
      bankChanged();
    },
  });
  const acc = textField({
    label: t('o11.acc'),
    value: saved.acc || '',
    placeholder: t('o11.accPh'),
    type: 'password',
    inputmode: 'numeric',
    autocomplete: 'off',
    maxLength: 18,
    onInput: (e) => {
      e.target.value = fmt.digitsOnly(e.target.value);
      bankChanged();
    },
    onBlur: (_, f) => acc.input.value && !/^\d{9,18}$/.test(acc.input.value) && f.setError(t('o11.errAcc')),
  });
  const acc2 = textField({
    label: t('o11.acc2'),
    value: saved.acc || '',
    inputmode: 'numeric',
    autocomplete: 'off',
    maxLength: 18,
    onInput: (e) => {
      e.target.value = fmt.digitsOnly(e.target.value);
      bankChanged();
    },
    onBlur: (_, f) => acc2.input.value && acc2.input.value !== acc.input.value && f.setError(t('o11.errAcc2')),
  });
  const ifsc = textField({
    label: t('o11.ifsc'),
    value: saved.ifsc || '',
    placeholder: t('o11.ifscPh'),
    help: t('o11.ifscHelp'),
    autocapitalize: 'characters',
    autocomplete: 'off',
    spellcheck: false,
    maxLength: 11,
    onInput: (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      bankChanged();
    },
    onBlur: (_, f) => ifsc.input.value && !fmt.isValidIfsc(ifsc.input.value) && f.setError(t('o11.errIfsc')),
  });

  function verifyBank(then) {
    if (!needOnline()) return;
    checking = true;
    const key = bankKey();
    bankResult.replaceChildren(h('p', { class: 'o11-checking t-subhead t-mute' }, spinner(), h('span', {}, t('o11.bankChecking'))));
    timers.add(
      after(TIMING.upiCheckMs, () => {
        checking = false;
        store.set('driver', { bankVerifiedFor: key });
        showBankVerified();
        then && then();
      }),
    );
  }

  function showBankVerified() {
    bankResult.replaceChildren(
      infoCard({ iconName: 'check', title: t('o11.nameOn', { name: nameOnAccount }), text: t('o11.matches'), tone: 'success' }),
    );
  }

  const bankPanel = h(
    'div',
    { class: 'o11-panel', hidden: true },
    h('h2', { class: 't-headline' }, t('o11.addBank')),
    h('div', {}, bankSel.el, acc.el, acc2.el, ifsc.el),
    h('p', { class: 't-footnote t-mute' }, t('o11.help')),
    bankResult,
  );

  function saveBankAndGo() {
    const checksList = [
      [!bankSel.input.value, () => bankSel.setError(t('o11.errBank')), bankSel.input],
      [!/^\d{9,18}$/.test(acc.input.value), () => acc.setError(t('o11.errAcc')), acc.input],
      [acc2.input.value !== acc.input.value || !acc2.input.value, () => acc2.setError(t('o11.errAcc2')), acc2.input],
      [!fmt.isValidIfsc(ifsc.input.value), () => ifsc.setError(t('o11.errIfsc')), ifsc.input],
    ];
    const bad = checksList.filter(([isBad]) => isBad);
    if (bad.length) {
      bad.forEach(([, show]) => show());
      bad[0][2].focus();
      return;
    }
    if (checking) {
      toast(t('o11.waitCheck'), { tone: 'info' });
      return;
    }
    const done = () => {
      store.set('driver', { payout: 'bank' });
      go(D('O12a'));
    };
    if (driver().bankVerifiedFor === bankKey()) done();
    else verifyBank(() => timers.add(after(500, done)));
  }

  const seg = segmented({
    label: t('o11.title'),
    value: tab,
    options: [
      { value: 'upi', label: t('o11.tabUpi') },
      { value: 'bank', label: t('o11.tabBank') },
    ],
    onChange: (v) => {
      tab = v;
      upiPanel.hidden = v !== 'upi';
      bankPanel.hidden = v !== 'bank';
    },
  });
  upiPanel.hidden = tab !== 'upi';
  bankPanel.hidden = tab !== 'bank';

  function save() {
    if (tab === 'bank') {
      saveBankAndGo();
      return;
    }
    const v = upi.input.value.trim();
    if (!fmt.isValidUpi(v)) {
      upi.setError(t('o11.errUpi'));
      upi.input.focus();
      return;
    }
    if (checking) {
      toast(t('o11.waitCheck'), { tone: 'info' });
      return;
    }
    const done = () => {
      store.set('driver', { payout: 'upi' });
      go(D('O12a'));
    };
    if (driver().upiVerifiedFor === v) done();
    else verify(v, () => timers.add(after(500, done)));
  }

  const { el } = screen({
    code: 'O11',
    label: t('o11.title'),
    topbar: topBar({ onBack: () => back(D('O8')), listen: reads('o11.title', 'o11.help') }),
    body: [pageHeadIcon('wallet', t('o11.title')), seg, upiPanel, bankPanel],
    footer: [button({ label: t('o11.cta'), onClick: save })],
  });

  return {
    el,
    onMount() {
      const v = driver().upi;
      if (v && driver().upiVerifiedFor === v) showVerified();
      if (driver().bankVerifiedFor && driver().bankVerifiedFor === bankKey()) showBankVerified();
    },
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- O12a–c

function howPage(index) {
  const page = HOW_PAGES[index];
  const last = index === HOW_PAGES.length - 1;
  const next = () => (last ? (store.set('driver', { howSeen: true }), go(D('O13'))) : go(D(HOW_PAGES[index + 1].id)));

  const art = [ill.howFare, ill.howWaiting, ill.howQueue][index];
  const media = illustration(art(t(page.titleKey)), {
    className: 'o12-media',
    overlay: h(
      'button',
      { type: 'button', class: 'o12-video', onClick: () => toast(t('o12.videoSoon'), { tone: 'info' }) },
      ic('play', { size: 20 }),
      h('span', {}, t('o12.video')),
    ),
  });

  const { el, body } = screen({
    code: page.id,
    label: t(page.titleKey),
    topbar: topBar({ left: t('o12.count', { n: index + 1 }), listen: reads(page.titleKey, page.bodyKey) }),
    body: [
      media,
      h('h1', { class: 't-large screen__heading o12-title', tabindex: '-1' }, t(page.titleKey)),
      h('p', { class: 't-callout t-mute o12-body' }, t(page.bodyKey)),
      pageDots(HOW_PAGES.length, index, t('how.page', { n: index + 1 })),
    ],
    footer: [button({ label: last ? t('o12.understand') : t('common.next'), onClick: next })],
  });

  // Swipe between the 3 pages like a carousel
  let x0 = null;
  body.addEventListener('pointerdown', (e) => {
    x0 = e.clientX;
  });
  body.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (dx < -60) next();
    else if (dx > 60 && index > 0) back(D(HOW_PAGES[index - 1].id));
  });
  return { el };
}

export const O12a = () => howPage(0);
export const O12b = () => howPage(1);
export const O12c = () => howPage(2);

// ---------------------------------------------------------------- O13 ⏱O14

export function O13() {
  const missing = DOCUMENTS.filter((x) => driver().docs[x.id] === 'needed').length;
  if (missing) return O13Pending();
  const timers = timerBag();
  store.set('driver', { submitted: true });
  const { el } = screen({
    code: 'O13',
    label: t('o13.title'),
    topbar: topBar({ listen: reads('o13.title', 'o13.sub') }),
    body: [
      stateIcon({ iconName: 'clock', tone: 'warning' }),
      pageHead(t('o13.title'), t('o13.sub')),
      timeline([
        { label: t('o13.t1'), state: 'done' },
        { label: t('o13.t2'), state: 'done' },
        { label: t('o13.t3'), state: 'current' },
        { label: t('o13.t4'), state: 'next' },
      ]),
    ],
    footer: [
      button({
        label: t('o13.call'),
        variant: 'secondary',
        icon: 'phone',
        onClick: () => {
          window.location.href = `tel:${SUPPORT_PHONE}`;
        },
      }),
    ],
    className: 'o13',
  });
  return {
    el,
    onMount: () => timers.add(after(TIMING.checkingAdvanceMs, () => go(D('O14'), { replace: true }))),
    onUnmount: () => timers.clear(),
  };
}

/**
 * O13 after "Skip for now" on O8: nothing can be checked yet, so the
 * timeline stops at "Add your documents" and the teal button goes back to O8.
 */
function O13Pending() {
  const added = DOCUMENTS.filter((x) => driver().docs[x.id] !== 'needed').length;
  const { el } = screen({
    code: 'O13',
    label: t('o8.title'),
    topbar: topBar({ listen: reads('o8.title', 'o8.needMore') }),
    body: [
      stateIcon({ iconName: 'doc', tone: 'warning' }),
      pageHead(t('o8.title'), t('o8.needMore')),
      timeline([
        { label: t('o13.t1'), state: 'done' },
        { label: `${t('o8.title')} · ${t('o8.count', { n: added })}`, state: 'current' },
        { label: t('o13.t3'), state: 'next' },
        { label: t('o13.t4'), state: 'next' },
      ]),
    ],
    footer: [
      button({ label: t('o8.title'), icon: 'camera', onClick: () => go(D('O8')) }),
      button({
        label: t('o13.call'),
        variant: 'text',
        icon: 'phone',
        onClick: () => {
          window.location.href = `tel:${SUPPORT_PHONE}`;
        },
      }),
    ],
    className: 'o13',
  });
  return { el };
}

// ---------------------------------------------------------------- O14

export function O14() {
  store.set('driver', { ready: true });
  const { el } = screen({
    code: 'O14',
    label: t('o14.title'),
    topbar: topBar({ listen: reads('o14.title', 'o14.sub') }),
    body: [
      h(
        'div',
        { class: 'o14-hero' },
        stateIcon({ iconName: 'check', tone: 'success' }),
        h('h1', { class: 't-large screen__heading t-center', tabindex: '-1' }, t('o14.title')),
        h('p', { class: 't-callout t-mute t-center' }, t('o14.sub')),
      ),
    ],
    footer: [button({ label: t('o14.cta'), onClick: () => go(D('T1')) })],
  });
  return { el };
}
