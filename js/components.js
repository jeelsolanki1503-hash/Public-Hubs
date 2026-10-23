// DOM builders for every reusable UI piece. Each has a matching block in
// components.css. Screens only compose these.

import { icon, chrome } from './icons.js';
import { t, speechLang } from './i18n.js';
import { toast } from './overlays.js';
import { lockup } from './brand.js';

// ---------- tiny hyperscript ----------

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === undefined || c === null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

/** An element whose only content is a design-system icon. */
export function ic(name, opts) {
  const span = document.createElement('span');
  span.innerHTML = icon(name, opts);
  return span.firstElementChild;
}

let uid = 0;
export const nextId = (p = 'id') => `${p}-${++uid}`;

// ---------- Screen scaffold ----------

/**
 * @param {object} o
 * @param {string} o.code  Figma frame code (O1…)
 * @param {Node}   [o.topbar]
 * @param {Node}   [o.steps]
 * @param {Node[]} [o.body]
 * @param {Node[]} [o.footer]
 * @param {Node}   [o.keypad]
 */
export function screen({ code, label, topbar, steps, hero, body = [], footer = [], keypad, tabbar, className = '' }) {
  const bodyEl = h('div', { class: 'screen__body' }, body);
  const footerEl = footer.filter(Boolean).length
    ? h('div', { class: `screen__footer${keypad || tabbar ? ' screen__footer--above-kbd' : ''}` }, footer)
    : null;
  const el = h(
    'main',
    { class: `screen ${className}`, 'aria-label': label, dataset: { code } },
    topbar,
    steps,
    h('div', { class: 'offline-slot', 'aria-live': 'polite' }),
    hero,
    bodyEl,
    footerEl,
    keypad,
    tabbar,
  );
  return { el, body: bodyEl, footer: footerEl };
}

/** Large title + sub copy at the top of content. Title gets focus on arrival. */
export function pageHead(title, sub) {
  return h(
    'header',
    { class: 'page-head' },
    h('h1', { class: 't-large screen__heading', tabindex: '-1' }, title),
    sub ? h('p', { class: 't-callout page-head__sub' }, sub) : null,
  );
}

// ---------- Top bar ----------

export function topBar({ onBack, left, listen, brandName } = {}) {
  const start = onBack
    ? iconButton({ icon: 'back', label: t('common.back'), onClick: onBack })
    : brandName
      ? brand(brandName)
      : left
        ? h('span', { class: 'topbar__count' }, left)
        : h('span', { class: 'topbar__spacer' });
  return h(
    'div',
    { class: `topbar${onBack ? '' : ' topbar--plain'}` },
    start,
    listen ? listenPill(listen) : null,
  );
}

export function iconButton({ icon: name, label, onClick, pressed, className = '' }) {
  return h(
    'button',
    { type: 'button', class: `icon-btn ${className}`, 'aria-label': label, 'aria-pressed': pressed, onClick },
    ic(name),
  );
}

// ---------- Listen pill + speech ----------

const speech = {
  active: null,
  stop() {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    if (this.active) this.active.setPlaying(false);
    this.active = null;
  },
};

export function stopSpeech() {
  speech.stop();
}

/**
 * Listen pill. `getText` returns what to read (screen title + main instruction).
 */
export function listenPill(getText) {
  const label = h('span', {}, t('common.listen'));
  const btn = h('button', { type: 'button', class: 'listen-pill', 'aria-pressed': 'false' }, ic('speaker', { size: 20 }), label);
  const ctl = {
    setPlaying(on) {
      btn.setAttribute('aria-pressed', String(on));
      label.textContent = on ? t('common.playing') : t('common.listen');
    },
  };
  btn.addEventListener('click', () => {
    if (speech.active === ctl) {
      speech.stop();
      return;
    }
    speech.stop();
    if (typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') {
      toast(t('common.noVoice'), { tone: 'error' });
      return;
    }
    const lang = speechLang();
    const u = new SpeechSynthesisUtterance(getText());
    u.lang = lang;
    const voice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith(lang.slice(0, 2)));
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.onend = u.onerror = () => {
      if (speech.active === ctl) speech.stop();
    };
    speech.active = ctl;
    ctl.setPlaying(true);
    speechSynthesis.speak(u);
  });
  return btn;
}

// ---------- Buttons ----------

/**
 * Button · Type: primary | secondary | tonal | danger | text · Size: l | m | s
 * Returns the element with .setDisabled(bool) and .setLoading(labelOrFalse).
 */
export function button({ label, variant = 'primary', size = 'l', icon: iconName, onClick, disabled = false, describedBy }) {
  const labelEl = h('span', {}, label);
  const iconEl = iconName ? ic(iconName, { size: 20 }) : null;
  const el = h(
    'button',
    {
      type: 'button',
      class: `btn btn--${variant}${size !== 'l' ? ` btn--${size}` : ''}`,
      'aria-describedby': describedBy,
    },
    iconEl,
    labelEl,
  );
  let isDisabled = disabled;
  let isLoading = false;
  const sync = () => {
    if (isDisabled) el.setAttribute('aria-disabled', 'true');
    else el.removeAttribute('aria-disabled');
    el.setAttribute('aria-busy', String(isLoading));
  };
  el.addEventListener('click', (e) => {
    if (isLoading) return;
    if (onClick) onClick(e, { disabled: isDisabled });
  });
  el.setDisabled = (v) => {
    isDisabled = v;
    sync();
  };
  el.setLoading = (text) => {
    isLoading = Boolean(text);
    el.replaceChildren(...(isLoading ? [h('span', { class: 'spinner' }), h('span', {}, text)] : [iconEl, labelEl].filter(Boolean)));
    sync();
  };
  el.setLabel = (text) => {
    labelEl.textContent = text;
  };
  sync();
  return el;
}

export function textLink({ label, onClick, href, disabled }) {
  if (href) return h('a', { class: 'text-link', href }, label);
  return h('button', { type: 'button', class: 'text-link', 'aria-disabled': disabled ? 'true' : null, onClick }, label);
}

// ---------- Text field ----------

/**
 * Text field · State: Empty | Focused | Filled | Error | Disabled | Success
 * Returns { el, input, setError, setSuccess, clear }.
 */
export function textField({
  label, value = '', placeholder, help = '', inputmode, type = 'text', autocomplete,
  prefix, trail, maxLength, onInput, onBlur, autocapitalize, spellcheck, readOnlyKeyboard,
}) {
  const id = nextId('f');
  const helpId = `${id}-help`;
  const input = h('input', {
    id,
    class: 'field__input',
    type,
    value,
    placeholder,
    inputmode: readOnlyKeyboard ? 'none' : inputmode,
    autocomplete,
    autocapitalize,
    spellcheck: spellcheck === false ? 'false' : null,
    maxlength: maxLength,
    'aria-describedby': helpId,
  });
  input.value = value;
  const helpEl = h('p', { class: 'field__help', id: helpId, 'aria-live': 'polite' }, help);
  const control = h(
    'div',
    { class: 'field__control' },
    prefix ? h('span', { class: 'field__prefix', 'aria-hidden': 'true' }, prefix) : null,
    input,
    trail || null,
  );
  const el = h('div', { class: 'field' }, h('label', { class: 'field__label', for: id }, label), control, helpEl);

  const api = {
    el,
    input,
    control,
    setError(msg) {
      el.classList.remove('field--success');
      el.classList.remove('field--error');
      void el.offsetWidth; // restart the shake
      el.classList.add('field--error');
      input.setAttribute('aria-invalid', 'true');
      helpEl.replaceChildren(ic('alert', { size: 16 }), h('span', {}, msg));
    },
    setSuccess(msg) {
      el.classList.remove('field--error');
      el.classList.add('field--success');
      input.removeAttribute('aria-invalid');
      helpEl.replaceChildren(ic('check', { size: 16 }), h('span', {}, msg));
    },
    clear() {
      el.classList.remove('field--error', 'field--success');
      input.removeAttribute('aria-invalid');
      helpEl.replaceChildren(help);
    },
  };
  input.addEventListener('input', (e) => {
    if (el.classList.contains('field--error')) api.clear();
    onInput && onInput(e, api);
  });
  if (onBlur) input.addEventListener('blur', (e) => onBlur(e, api));
  return api;
}

/** Native select styled as a text field, with the DS chevron. */
export function selectField({ label, value = '', placeholder, options, onChange }) {
  const id = nextId('s');
  const helpId = `${id}-help`;
  const select = h(
    'select',
    { id, class: 'field__input field__select', required: true, 'aria-describedby': helpId },
    h('option', { value: '', disabled: true }, placeholder),
    options.map((o) => h('option', { value: o }, o)),
  );
  select.value = value;
  if (!value) select.selectedIndex = 0;
  const helpEl = h('p', { class: 'field__help', id: helpId, 'aria-live': 'polite' });
  const el = h(
    'div',
    { class: 'field' },
    h('label', { class: 'field__label', for: id }, label),
    h('div', { class: 'field__control' }, select, h('span', { class: 'field__trail', 'aria-hidden': 'true' }, ic('down', { size: 20 }))),
    helpEl,
  );
  const api = {
    el,
    input: select,
    setError(msg) {
      el.classList.add('field--error');
      select.setAttribute('aria-invalid', 'true');
      helpEl.replaceChildren(ic('alert', { size: 16 }), h('span', {}, msg));
    },
    clear() {
      el.classList.remove('field--error');
      select.removeAttribute('aria-invalid');
      helpEl.replaceChildren();
    },
  };
  select.addEventListener('change', () => {
    api.clear();
    onChange && onChange(select.value);
  });
  return api;
}

// ---------- Code boxes ----------

/**
 * Code boxes (4 or 6) · State: Empty | Typing | Error | Success | Locked
 * Auto-advance per digit, Backspace goes back, paste fills all.
 */
export function codeBoxes({ length = 6, label, onComplete, onChange }) {
  const inputs = Array.from({ length }, (_, i) =>
    h('input', {
      class: 'code-box',
      type: 'text',
      inputmode: 'none',
      autocomplete: i === 0 ? 'one-time-code' : 'off',
      maxlength: '1',
      'aria-label': t('o4.digit', { n: i + 1 }),
    }),
  );
  const el = h('div', { class: 'code-boxes', role: 'group', 'aria-label': label }, inputs);
  let locked = false;

  const value = () => inputs.map((x) => x.value).join('');
  const firstEmpty = () => inputs.find((x) => !x.value) || inputs[length - 1];
  const changed = () => {
    inputs.forEach((x) => x.classList.toggle('is-filled', Boolean(x.value)));
    onChange && onChange(value());
    if (value().length === length) onComplete && onComplete(value());
  };

  const api = {
    el,
    inputs,
    value,
    focus() {
      if (!locked) firstEmpty().focus({ preventScroll: true });
    },
    setState(state) {
      el.classList.remove('code-boxes--error', 'code-boxes--success', 'code-boxes--locked');
      void el.offsetWidth;
      if (state) el.classList.add(`code-boxes--${state}`);
      locked = state === 'locked' || state === 'success';
      inputs.forEach((x) => (x.disabled = locked));
    },
    clear() {
      inputs.forEach((x) => (x.value = ''));
      changed();
    },
    /** Type one digit into the first empty box (keypad / SMS autofill). */
    type(d) {
      if (locked) return;
      if (el.classList.contains('code-boxes--error')) {
        api.setState(null);
      }
      const box = inputs.find((x) => !x.value);
      if (!box) return;
      box.value = d;
      box.classList.remove('is-new');
      void box.offsetWidth;
      box.classList.add('is-new');
      const next = inputs[inputs.indexOf(box) + 1];
      (next || box).focus({ preventScroll: true });
      changed();
    },
    backspace() {
      if (locked) return;
      if (el.classList.contains('code-boxes--error')) api.setState(null);
      const filled = inputs.filter((x) => x.value);
      const last = filled[filled.length - 1];
      if (!last) return;
      last.value = '';
      last.focus({ preventScroll: true });
      changed();
    },
    fill(str) {
      const d = String(str).replace(/\D/g, '').slice(0, length);
      inputs.forEach((x, i) => (x.value = d[i] || ''));
      firstEmpty().focus({ preventScroll: true });
      changed();
    },
  };

  inputs.forEach((box, i) => {
    box.addEventListener('focus', () => {
      // Always type into the first empty box, like an OTP field
      const target = firstEmpty();
      if (target !== box && !box.value) target.focus({ preventScroll: true });
    });
    box.addEventListener('input', () => {
      const d = box.value.replace(/\D/g, '');
      box.value = d.slice(-1);
      if (d.length > 1) {
        api.fill(value().slice(0, i) + d);
        return;
      }
      if (box.value && inputs[i + 1]) inputs[i + 1].focus({ preventScroll: true });
      changed();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        api.backspace();
      } else if (/^\d$/.test(e.key)) {
        e.preventDefault();
        api.type(e.key);
      }
    });
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      api.fill(text);
    });
  });
  return api;
}

// ---------- Numeric keypad (mock) ----------

const KEYS = [
  ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
  ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
  ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
];

export function keypad({ onDigit, onDelete }) {
  const key = (digit, letters) =>
    h(
      'button',
      { type: 'button', class: 'keypad__key', 'aria-label': digit, tabindex: '-1', onClick: () => onDigit(digit) },
      h('span', { class: 'keypad__digit' }, digit),
      letters ? h('span', { class: 'keypad__letters', 'aria-hidden': 'true' }, letters) : null,
    );
  const del = h('button', { type: 'button', class: 'keypad__key keypad__key--fn', 'aria-label': 'Delete', tabindex: '-1', onClick: onDelete });
  del.innerHTML = chrome.backspace;
  const pad = h(
    'div',
    { class: 'keypad', 'aria-hidden': 'true' },
    KEYS.map(([d, l]) => key(d, l)),
    h('span', { class: 'keypad__key keypad__key--blank' }),
    key('0', ''),
    del,
  );
  // Like the phone's own keyboard, tapping a key never takes focus from the
  // field — otherwise the field "blurs" and its leave-the-field check fires
  // on every digit.
  pad.addEventListener('mousedown', (e) => e.preventDefault());
  pad.addEventListener('pointerdown', (e) => e.preventDefault());
  return pad;
}

// ---------- Selection ----------

/**
 * Wires arrow-key navigation + roving tabindex for a role="radiogroup".
 * Each radio must have role="radio" and aria-checked.
 */
export function radioGroup(groupEl, radios, onSelect) {
  groupEl.setAttribute('role', 'radiogroup');
  const select = (r, focus) => {
    radios.forEach((x) => {
      x.setAttribute('aria-checked', String(x === r));
      x.tabIndex = x === r ? 0 : -1;
    });
    if (focus) r.focus();
    onSelect && onSelect(r.dataset.value);
  };
  radios.forEach((r, i) => {
    r.setAttribute('role', 'radio');
    r.tabIndex = r.getAttribute('aria-checked') === 'true' ? 0 : -1;
    r.addEventListener('click', () => select(r));
    r.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (dir) {
        e.preventDefault();
        select(radios[(i + dir + radios.length) % radios.length], true);
      }
    });
  });
  if (!radios.some((r) => r.tabIndex === 0) && radios[0]) radios[0].tabIndex = 0;
  return groupEl;
}

export function langTile({ lang, checked }) {
  return h(
    'button',
    { type: 'button', class: 'lang-tile', 'aria-checked': String(checked), dataset: { value: lang.id } },
    h('span', { class: 'lang-tile__native', lang: lang.id, dir: lang.dir || null }, lang.native),
    h('span', { class: 'lang-tile__en' }, lang.en),
    h('span', { class: 'lang-tile__mark', 'aria-hidden': 'true' }, ic('check', { size: 16, stroke: 3 })),
  );
}

export function choiceCard({ value, iconName, title, sub, checked }) {
  return h(
    'button',
    { type: 'button', class: 'choice-card', 'aria-checked': String(checked), dataset: { value } },
    h('span', { class: 'icon-tile choice-card__tile', 'aria-hidden': 'true' }, ic(iconName, { size: 28 })),
    h('span', { class: 'choice-card__body' }, h('span', { class: 't-title2' }, title), h('span', { class: 't-subhead t-mute' }, sub)),
    h('span', { class: 'radio', 'aria-hidden': 'true' }),
  );
}

export function segmented({ label, options, value, onChange }) {
  const opts = options.map((o) =>
    h('button', { type: 'button', class: 'segmented__opt', 'aria-checked': String(o.value === value), dataset: { value: o.value } }, o.label),
  );
  const el = h('div', { class: 'segmented', 'aria-label': label }, opts);
  radioGroup(el, opts, onChange);
  return el;
}

// ---------- Navigation ----------

export function stepProgress(n, total = 3) {
  return h(
    'div',
    { class: 'steps' },
    h(
      'div',
      { class: 'steps__bars', role: 'progressbar', 'aria-valuemin': '1', 'aria-valuemax': String(total), 'aria-valuenow': String(n), 'aria-label': t('step.label', { n }) },
      Array.from({ length: total }, (_, i) => h('span', { class: `steps__bar${i < n ? ' is-done' : ''}` })),
    ),
    h('p', { class: 'steps__label', 'aria-hidden': 'true' }, t('step.label', { n })),
  );
}

export function pageDots(total, active, label) {
  return h(
    'div',
    { class: 'dots', role: 'img', 'aria-label': label },
    Array.from({ length: total }, (_, i) => h('span', { class: `dots__dot${i === active ? ' is-active' : ''}` })),
  );
}

/** Timeline step list. steps: [{ label, state: 'done' | 'current' | 'next' }] */
export function timeline(steps) {
  return h(
    'ol',
    { class: 'timeline' },
    steps.map((s) =>
      h(
        'li',
        { class: `timeline__step timeline__step--${s.state}`, 'aria-current': s.state === 'current' ? 'step' : null },
        h(
          'span',
          { class: 'timeline__mark', 'aria-hidden': 'true' },
          s.state === 'done' ? ic('check', { size: 16, stroke: 3 }) : s.state === 'current' ? ic('clock', { size: 16 }) : null,
        ),
        h('span', {}, s.label),
      ),
    ),
  );
}

// ---------- Feedback ----------

export function banner({ tone = 'neutral', iconName = 'info', text }) {
  return h('div', { class: `banner banner--${tone}`, role: tone === 'error' ? 'alert' : 'status' }, ic(iconName, { size: 20 }), h('span', {}, text));
}

export function spinner(size = 20) {
  return h('span', { class: `spinner${size !== 20 ? ` spinner--${size}` : ''}`, role: 'progressbar', 'aria-label': 'Loading' });
}

export function badge(text) {
  return h('span', { class: 'badge' }, ic('clock', { size: 14 }), text);
}

export function stateIcon({ iconName, tone }) {
  const big = tone === 'hero' || tone === 'success';
  return h('div', { class: `state-icon${tone ? ` state-icon--${tone}` : ''}`, 'aria-hidden': 'true' }, ic(iconName, { size: big ? 48 : 32, stroke: big ? 2.5 : 2 }));
}

/** Large title with an icon tile above it — the hi-fi page head. */
export function pageHeadIcon(iconName, title, sub) {
  const head = pageHead(title, sub);
  head.prepend(iconTile(iconName, { size: 24 }));
  head.classList.add('page-head--icon');
  return head;
}

// ---------- Cards and data ----------

export function infoCard({ iconName, title, text, tone }) {
  return h(
    'div',
    { class: `info-card${tone ? ` info-card--${tone}` : ''}` },
    iconTile(iconName, { round: true, tone: tone === 'success' ? 'success' : null }),
    h('div', { class: 'info-card__body' }, h('p', { class: 't-headline' }, title), text ? h('p', { class: 't-subhead info-card__text' }, text) : null),
  );
}

/** Icon on a teal-tint (or success / neutral) tile. */
export function iconTile(name, { round = false, tone, size = 22 } = {}) {
  return h(
    'span',
    { class: `icon-tile${round ? ' icon-tile--round' : ''}${tone ? ` icon-tile--${tone}` : ''}`, 'aria-hidden': 'true' },
    ic(name, { size }),
  );
}

/** Fixride lockup with product tag, for the top bar. */
export function brand(tag = 'Driver') {
  return lockup({ tag, size: 's' });
}

/** Inline-SVG illustration in a rounded frame, with an optional overlay (e.g. a video pill). */
export function illustration(svgMarkup, { className = '', overlay } = {}) {
  const fig = h('figure', { class: `illustration ${className}`, html: svgMarkup });
  if (overlay) fig.append(h('div', { class: 'illustration__overlay' }, overlay));
  return fig;
}

/** Number plate · yellow with black letters (the only place yellow appears). */
export function numberPlate(text, sub) {
  const main = h('span', {}, text);
  const el = h('div', { class: 'plate', role: 'img', 'aria-label': text }, main, sub ? h('span', { class: 'plate__sub' }, sub) : null);
  el.setText = (v, placeholder) => {
    main.textContent = v || placeholder;
    el.classList.toggle('is-empty', !v);
    el.setAttribute('aria-label', v || placeholder);
  };
  return el;
}

/** Progress meter (n of total). */
export function meter(n, total, from = n) {
  const fill = h('div', { class: 'meter__fill' });
  fill.style.width = `${(from / total) * 100}%`;
  if (from !== n) requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = `${(n / total) * 100}%`)));
  return h('div', { class: `meter${n === total ? ' is-full' : ''}`, 'aria-hidden': 'true' }, fill);
}

export function imagePlaceholder({ iconName, caption, className = '', children }) {
  return h(
    'figure',
    { class: `placeholder ${className}` },
    iconName ? ic(iconName, { size: 32 }) : null,
    caption ? h('figcaption', { class: 'placeholder__caption' }, caption) : null,
    children,
  );
}

/**
 * Document row · State: needed | uploaded | checking | approved | rejected
 */
export function docRow({ id, iconName, name, meta, state, onClick, isNew }) {
  const right =
    state === 'needed'
      ? h('span', { class: 'doc-row__action' }, t('o8.add'), ic('chev', { size: 16 }))
      : h('span', { class: 'doc-row__tick', 'aria-hidden': 'true' }, ic('check', { size: 16, stroke: 3 }));
  const metaText = state === 'needed' ? meta : t('o8.added');
  return h(
    'li',
    {},
    h(
      'button',
      {
        type: 'button',
        class: `doc-row doc-row--${state}${isNew ? ' is-new' : ''}`,
        'aria-label': `${name}, ${metaText}${state === 'needed' ? `, ${t('o8.add')}` : ''}`,
        dataset: { doc: id },
        onClick,
      },
      h('span', { class: 'doc-row__icon', 'aria-hidden': 'true' }, ic(iconName, { size: 20 })),
      h('span', { class: 'doc-row__body', 'aria-hidden': 'true' }, h('span', { class: 'doc-row__name' }, name), h('span', { class: 'doc-row__meta' }, metaText)),
      right,
    ),
  );
}

/** Fixed bottom tab bar (Driver: Home, Earnings, Account). */
export function tabBar(current, onTab) {
  const TABS = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'earnings', icon: 'wallet', label: 'Earnings' },
    { id: 'account', icon: 'user', label: 'Account' },
  ];
  const items = TABS.map((tab) =>
    h(
      'button',
      {
        type: 'button',
        class: 'tabbar__item',
        'aria-current': tab.id === current ? 'page' : null,
        onClick: () => onTab(tab.id),
      },
      ic(tab.icon, { size: 24 }),
      h('span', {}, tab.label),
    ),
  );
  return h('nav', { class: 'tabbar', 'aria-label': 'Main' }, items);
}

/** Big countdown ring with a number in the middle (offer, free waiting). */
export function timerRing({ size = 96, strokeWidth = 6, value = 1, label, labelClass = 'ring__label', tone = 'ink' }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, value)) * c;
  const svg = `<svg viewBox="0 0 ${size} ${size}" class="ring__svg" aria-hidden="true" focusable="false">
    <circle class="ring__track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${strokeWidth}" fill="none"/>
    <circle class="ring__arc" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${strokeWidth}" fill="none"
      stroke-dasharray="${dash} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  </svg>`;
  const el = h(
    'div',
    { class: `ring ring--${tone}`, style: `--ring-size:${size}px`, role: 'timer' },
    h('span', { class: 'ring__svg-wrap', html: svg }),
    h('span', { class: labelClass }, label),
  );
  const arc = el.querySelector('.ring__arc');
  el.set = (nextValue, text, nextTone) => {
    const v = Math.max(0, Math.min(1, nextValue));
    arc.setAttribute('stroke-dasharray', `${v * c} ${c}`);
    el.querySelector('.' + labelClass).textContent = text;
    if (nextTone) {
      el.classList.remove('ring--ink', 'ring--warning', 'ring--error', 'ring--brand');
      el.classList.add(`ring--${nextTone}`);
    }
  };
  return el;
}

/**
 * Swipe to confirm · an a11y-correct slider (role="slider") that also responds
 * to Enter / Space for keyboard users. onConfirm is called once past 85%.
 */
export function swipeConfirm({ label, onConfirm }) {
  const bar = h('div', { class: 'swipe__fill' });
  const knob = h(
    'div',
    { class: 'swipe__knob', role: 'slider', tabindex: '0', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' },
    ic('arrow', { size: 22, stroke: 2.5 }),
  );
  const track = h('div', { class: 'swipe__track' }, bar, h('span', { class: 'swipe__label' }, label), knob);
  const el = h('div', { class: 'swipe' }, track);
  let done = false;
  let dragging = false;
  let startX = 0;
  let x = 0;

  function maxX() {
    return track.clientWidth - knob.clientWidth - 8;
  }
  function setX(v) {
    const m = maxX();
    x = Math.max(0, Math.min(m, v));
    knob.style.transform = `translateX(${x}px)`;
    bar.style.width = `${x + knob.clientWidth / 2}px`;
    knob.setAttribute('aria-valuenow', String(Math.round((x / m) * 100)));
    if (x / m >= 0.85 && !done) finish();
  }
  function finish() {
    done = true;
    const m = maxX();
    knob.style.transform = `translateX(${m}px)`;
    bar.style.width = '100%';
    el.classList.add('swipe--done');
    if (navigator.vibrate) try { navigator.vibrate(30); } catch { /* ignore */ }
    setTimeout(() => onConfirm && onConfirm(), 220);
  }
  function reset() {
    x = 0;
    knob.style.transform = '';
    bar.style.width = '';
  }
  knob.addEventListener('pointerdown', (e) => {
    if (done) return;
    dragging = true;
    startX = e.clientX - x;
    knob.setPointerCapture(e.pointerId);
  });
  knob.addEventListener('pointermove', (e) => {
    if (!dragging || done) return;
    setX(e.clientX - startX);
  });
  const stop = () => {
    if (!dragging || done) return;
    dragging = false;
    if (x / maxX() < 0.85) reset();
  };
  knob.addEventListener('pointerup', stop);
  knob.addEventListener('pointercancel', stop);
  knob.addEventListener('keydown', (e) => {
    if (done) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      finish();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setX(x + 32);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setX(x - 32);
    }
  });
  return el;
}

/**
 * Map scene (grey streets, our auto "A", a destination pin, a route line
 * drawn with a `path` id so screens can style the kind of corner they need).
 * `kind`: 'nav' long route · 'bay' short route · 'drop' arrival (dot only).
 */
export function mapScene({ kind = 'nav', pinLabel }) {
  const scenes = {
    nav: `
      <rect class="map__block" x="10" y="10" width="118" height="118"/>
      <rect class="map__block" x="134" y="10" width="118" height="118"/>
      <rect class="map__block" x="258" y="10" width="118" height="118"/>
      <rect class="map__block" x="10" y="134" width="118" height="118"/>
      <rect class="map__block" x="134" y="134" width="118" height="118"/>
      <rect class="map__block" x="258" y="134" width="118" height="118"/>
      <rect class="map__block" x="10" y="258" width="118" height="118"/>
      <rect class="map__block" x="134" y="258" width="118" height="118"/>
      <rect class="map__block" x="258" y="258" width="118" height="118"/>
      <path class="map__route" d="M70 335 V195 H285 V85"/>
      <g class="map__pin" transform="translate(285 85)">${PIN_SVG(pinLabel)}</g>
      <g class="map__me" transform="translate(70 335)">${ME_SVG()}</g>
    `,
    bay: `
      <rect class="map__block" x="10" y="10" width="150" height="170"/>
      <rect class="map__block" x="166" y="10" width="210" height="170"/>
      <rect class="map__block" x="10" y="186" width="150" height="200"/>
      <rect class="map__block" x="166" y="186" width="210" height="200"/>
      <path class="map__route" d="M90 265 V155 H315"/>
      <g class="map__pin" transform="translate(315 155)">${PIN_SVG(pinLabel)}</g>
      <g class="map__me" transform="translate(90 265)">${ME_SVG()}</g>
    `,
    drop: `
      <rect class="map__block" x="10" y="10" width="118" height="150"/>
      <rect class="map__block" x="134" y="10" width="118" height="150"/>
      <rect class="map__block" x="258" y="10" width="118" height="150"/>
      <rect class="map__block" x="10" y="166" width="118" height="200"/>
      <rect class="map__block" x="134" y="166" width="118" height="200"/>
      <rect class="map__block" x="258" y="166" width="118" height="200"/>
      <g class="map__pin" transform="translate(260 115)">${PIN_SVG(pinLabel)}</g>
      <g class="map__me" transform="translate(240 170)">${ME_SVG()}</g>
    `,
  };
  return h('figure', { class: `map map--${kind}`, 'aria-label': `Map · ${pinLabel || ''}` },
    h('div', { class: 'map__svg', html: `<svg viewBox="0 0 386 386" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${scenes[kind]}</svg>` }));
}

function PIN_SVG(label) {
  const w = Math.max(44, (label || '').length * 7 + 32);
  return `
    <g transform="translate(${-w / 2} -34)">
      <rect width="${w}" height="26" rx="13" class="map__pin-bg"/>
      <circle cx="18" cy="13" r="4" class="map__pin-dot"/>
      <text x="30" y="17" class="map__pin-text">${label || ''}</text>
    </g>
  `;
}
function ME_SVG() {
  return `
    <circle r="16" class="map__me-ring"/>
    <circle r="12" class="map__me-fill"/>
    <text y="4" text-anchor="middle" class="map__me-text">A</text>
  `;
}

/** Direction banner at the top of a map screen ("Turn left in 300 m · then P4 West"). */
export function directionBar({ iconName = 'arrow', title, sub }) {
  return h(
    'div',
    { class: 'dir-bar' },
    h('span', { class: 'dir-bar__icon', 'aria-hidden': 'true' }, ic(iconName, { size: 22, stroke: 2.5 })),
    h('div', { class: 'dir-bar__text' }, h('span', { class: 'dir-bar__title' }, title), sub ? h('span', { class: 'dir-bar__sub' }, sub) : null),
  );
}

/** Stat tile — tiny card with a value on top and a muted label underneath. */
export function statTile({ value, label, tone }) {
  return h('div', { class: `stat${tone ? ` stat--${tone}` : ''}` }, h('span', { class: 'stat__value' }, value), h('span', { class: 'stat__label' }, label));
}

/** Bar chart for "Flights landing at T2" (T1 / T14). */
export function flightsChart(hours) {
  const max = Math.max(...hours.map((h) => h.count));
  return h(
    'div',
    { class: 'flights', role: 'img', 'aria-label': 'Flights landing at T2 by hour' },
    hours.map((hr) =>
      h(
        'span',
        { class: `flights__bar${hr.now ? ' flights__bar--now' : ''}`, style: `--v:${(hr.count / max) * 100}%`, title: `${hr.label}: ${hr.count}` },
        h('span', { class: 'flights__fill' }),
        h('span', { class: 'flights__label' }, hr.label),
      ),
    ),
  );
}

/** Fare hero: ₹420 with the design-system "Hub minimum fare" chip when minimum. */
export function fareHero({ amount, minimum, note }) {
  return h(
    'div',
    { class: 'fare-hero' },
    h('div', { class: 't-hero' }, '₹', String(amount)),
    minimum ? h('span', { class: 'chip chip--brand' }, 'Hub minimum fare') : null,
    note ? h('p', { class: 't-subhead t-mute' }, note) : null,
  );
}

/** Trip offer card (T5 / T5b / W1): pickup + drop block + fare hero + bags/people. */
export function tripBrief(trip) {
  return h(
    'section',
    { class: 'trip-brief' },
    h(
      'div',
      { class: 'trip-brief__row' },
      iconTile('pin', { tone: 'brand', round: true, size: 20 }),
      h('div', { class: 'trip-brief__col' },
        h('span', { class: 't-label t-mute' }, 'PICKUP'),
        h('span', { class: 't-title2' }, trip.pickup),
        trip.pickupNote ? h('span', { class: 't-subhead t-mute' }, trip.pickupNote) : null,
      ),
    ),
    h(
      'div',
      { class: 'trip-brief__row' },
      iconTile('flag', { tone: 'neutral', round: true, size: 20 }),
      h('div', { class: 'trip-brief__col' },
        h('span', { class: 't-label t-mute' }, 'DROP'),
        h('span', { class: 't-title2' }, trip.drop),
        trip.dropMeta ? h('span', { class: 't-subhead t-mute' }, trip.dropMeta) : null,
      ),
    ),
  );
}

/** Bag + people row ("2 big · 1 small · 1 person"). */
export function bagsRow({ big = 0, small = 0, people = 1 }) {
  const parts = [];
  if (big) parts.push(h('span', { class: 'bags__item' }, ic('bag', { size: 18 }), h('span', {}, `${big} big`)));
  if (small) parts.push(h('span', { class: 'bags__item' }, ic('bag', { size: 16 }), h('span', {}, `${small} small`)));
  parts.push(h('span', { class: 'bags__item bags__item--right' }, ic('user', { size: 18 }), h('span', {}, `${people} ${people === 1 ? 'person' : 'people'}`)));
  return h('div', { class: 'bags' }, parts);
}

/** Row inside a card — avatar / icon tile on the left, meta on the right. */
export function listRow({ iconName, iconTone, title, sub, right, onClick }) {
  const el = h(
    onClick ? 'button' : 'div',
    { type: onClick ? 'button' : null, class: 'list-row', onClick },
    iconName ? iconTile(iconName, { round: true, tone: iconTone, size: 20 }) : null,
    h('div', { class: 'list-row__body' },
      h('span', { class: 'list-row__title' }, title),
      sub ? h('span', { class: 'list-row__sub' }, sub) : null,
    ),
    right != null ? h('span', { class: 'list-row__right' }, right) : (onClick ? ic('chev', { size: 18 }) : null),
  );
  return el;
}

export function checkList(items) {
  return h(
    'ul',
    { class: 'check-list' },
    items.map((label) =>
      h('li', { class: 'check-list__item' }, h('span', { class: 'check-list__mark', 'aria-hidden': 'true' }, ic('check', { size: 14, stroke: 3 })), h('span', {}, label)),
    ),
  );
}
