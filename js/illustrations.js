// Flat inline-SVG illustrations that replace the mid-fi grey placeholders.
// Colours come only from CSS classes (.ill-*) mapped to DS tokens, so they
// follow light / dark theme. Real artwork can replace these later (README).

import { PIN_OUTER, PIN_KEY } from './brand.js';

const svg = (vb, body, label) =>
  `<svg class="ill" viewBox="${vb}" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---- shared parts ----

/** Mumbai auto rickshaw, drawn facing right, origin at its rear wheel base. */
function auto(x, y, s = 1, plate = 'MH 02 AB 1234') {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse class="ill-shade" cx="58" cy="62" rx="70" ry="7"/>
    <path class="ill-teal" d="M8 18 Q12 -8 44 -10 H100 Q122 -8 128 18 Z"/>
    <path class="ill-ink" d="M0 58 V26 Q0 8 22 6 H106 Q130 8 140 32 L148 58 Z"/>
    <path class="ill-glass" d="M104 12 Q124 14 132 34 H104 Z" opacity=".9"/>
    <rect class="ill-glass" x="34" y="14" width="56" height="20" rx="4" opacity=".55"/>
    <rect class="ill-teal" x="0" y="38" width="148" height="5" opacity=".9"/>
    <circle class="ill-white" cx="142" cy="46" r="4"/>
    <rect class="ill-plate" x="50" y="43" width="70" height="14" rx="2.5"/>
    <text class="ill-plate-text" x="85" y="53" text-anchor="middle" textLength="62" lengthAdjust="spacingAndGlyphs">${esc(plate)}</text>
    <circle class="ill-ink" cx="22" cy="60" r="13"/><circle class="ill-kerb" cx="22" cy="60" r="5"/>
    <circle class="ill-ink" cx="128" cy="60" r="13"/><circle class="ill-kerb" cx="128" cy="60" r="5"/>
  </g>`;
}

/** Pickup-bay pin = the Fixride keyhole pin (brand mark on the map). */
function pin(x, y, label) {
  return `<g transform="translate(${x} ${y})">
    <ellipse class="ill-shade" cx="0" cy="40" rx="14" ry="4"/>
    <path class="ill-teal" fill-rule="evenodd" transform="translate(-16 -2) scale(.32)" d="${PIN_OUTER} ${PIN_KEY}"/>
    <rect class="ill-teal" x="-30" y="-36" width="60" height="22" rx="11"/>
    <text class="ill-label ill-label--on-teal" x="0" y="-21" text-anchor="middle">${esc(label)}</text>
  </g>`;
}

function plane(x, y, r = -12) {
  return `<g transform="translate(${x} ${y}) rotate(${r})">
    <path class="ill-white ill-stroke" d="M-30 0 Q-30 -6 -22 -6 H22 Q34 -6 36 0 Q34 6 22 6 H-22 Q-30 6 -30 0 Z"/>
    <path class="ill-white ill-stroke" d="M-2 -5 L-14 -26 H-6 L14 -5 Z"/>
    <path class="ill-white ill-stroke" d="M-2 5 L-14 26 H-6 L14 5 Z"/>
    <path class="ill-white ill-stroke" d="M-24 -5 L-31 -17 H-25 L-16 -5 Z"/>
    <circle class="ill-teal" cx="26" cy="-1" r="2"/><circle class="ill-teal" cx="18" cy="-1" r="2"/><circle class="ill-teal" cx="10" cy="-1" r="2"/>
  </g>`;
}

// ---- O1 · Welcome: auto at Mumbai T2 ----

export function welcome(label) {
  const windows = Array.from({ length: 9 }, (_, i) => `<rect class="ill-glass" x="${34 + i * 34}" y="168" width="24" height="30" rx="3" opacity=".75"/>`).join('');
  return svg(
    '0 0 362 300',
    `<rect class="ill-bg" width="362" height="300"/>
    <circle class="ill-sun" cx="296" cy="58" r="30"/>
    <path class="ill-dash" d="M24 104 C80 84 130 70 186 64"/>
    ${plane(214, 60)}
    <path class="ill-teal-dark" d="M14 150 Q100 112 181 124 T348 136 V160 H14 Z"/>
    <rect class="ill-teal" x="14" y="154" width="334" height="70"/>
    ${windows}
    <rect class="ill-white" x="146" y="132" width="70" height="28" rx="8"/>
    <text class="ill-sign" x="181" y="152" text-anchor="middle">T2</text>
    <rect class="ill-kerb" x="0" y="222" width="362" height="8"/>
    <rect class="ill-road" x="0" y="230" width="362" height="70"/>
    <path class="ill-lane" d="M0 272 H362"/>
    ${auto(34, 190, 1.2)}
    ${pin(304, 196, 'Bay 12')}`,
    label,
  );
}

// ---- O12a · Fixed fare, paid in the app ----

export function howFare(label) {
  return svg(
    '0 0 362 280',
    `<rect class="ill-bg" width="362" height="280"/>
    <circle class="ill-sun" cx="64" cy="58" r="34"/>
    <circle class="ill-sun" cx="312" cy="226" r="46"/>
    <g transform="translate(101 34)">
      <rect class="ill-white" width="160" height="212" rx="22"/>
      <rect class="ill-line" x="62" y="10" width="36" height="5" rx="2.5"/>
      <rect class="ill-teal" x="20" y="34" width="66" height="20" rx="10"/>
      <text class="ill-label ill-label--on-teal" x="53" y="48" text-anchor="middle">Fixed fare</text>
      <text class="ill-hero" x="20" y="100">₹420</text>
      <rect class="ill-line" x="20" y="116" width="120" height="6" rx="3"/>
      <rect class="ill-line" x="20" y="130" width="88" height="6" rx="3"/>
      <rect class="ill-success-soft" x="20" y="150" width="120" height="40" rx="12"/>
      <circle class="ill-success" cx="40" cy="170" r="10"/>
      <path class="ill-tick" d="M35 170 L39 174 L46 166"/>
      <text class="ill-label ill-label--success" x="58" y="174">Paid in app</text>
    </g>
    <g transform="translate(266 40)">
      <circle class="ill-teal" cx="22" cy="22" r="22"/>
      <path class="ill-tick ill-tick--white" d="M13 22 L19 28 L31 15"/>
    </g>`,
    label,
  );
}

// ---- O12b · Waiting is paid ----

export function howWaiting(label) {
  const r = 70;
  const c = 2 * Math.PI * r;
  return svg(
    '0 0 362 280',
    `<rect class="ill-bg" width="362" height="280"/>
    <circle class="ill-sun" cx="300" cy="60" r="38"/>
    <g transform="translate(181 140)">
      <circle class="ill-white" r="96"/>
      <circle class="ill-track" r="${r}"/>
      <circle class="ill-arc" r="${r}" stroke-dasharray="${c * 0.72} ${c}" transform="rotate(-90)"/>
      <text class="ill-hero ill-hero--sm" x="0" y="8" text-anchor="middle">5:00</text>
      <text class="ill-caption" x="0" y="32" text-anchor="middle">free waiting</text>
    </g>
    <g transform="translate(24 28)">
      <rect class="ill-success-soft" width="98" height="36" rx="18"/>
      <text class="ill-label ill-label--success" x="49" y="23" text-anchor="middle">+₹1 / min</text>
    </g>
    <g transform="translate(250 196)">
      <rect class="ill-teal" width="92" height="36" rx="18"/>
      <text class="ill-label ill-label--on-teal" x="46" y="23" text-anchor="middle">Bay 12</text>
    </g>`,
    label,
  );
}

// ---- O12c · How the T2 queue works ----

export function howQueue(label) {
  return svg(
    '0 0 362 280',
    `<rect class="ill-bg" width="362" height="280"/>
    <rect class="ill-teal" x="22" y="34" width="96" height="30" rx="8"/>
    <text class="ill-label ill-label--on-teal" x="70" y="54" text-anchor="middle">P4 West</text>
    <path class="ill-dash" d="M70 64 V96"/>
    <rect class="ill-kerb" x="0" y="150" width="362" height="8"/>
    <rect class="ill-road" x="0" y="158" width="362" height="122"/>
    <path class="ill-lane" d="M0 236 H362"/>
    ${auto(206, 170, 0.62, 'MH 02 AB 1234')}
    ${auto(110, 170, 0.62, 'MH 02 CD 5678')}
    ${auto(14, 170, 0.62, 'MH 04 EF 9012')}
    <g transform="translate(232 124)">
      <rect class="ill-white" x="-22" y="-16" width="44" height="22" rx="11"/>
      <text class="ill-label" x="0" y="-1" text-anchor="middle">1st</text>
    </g>
    ${pin(322, 108, 'Bay 12')}
    <path class="ill-arrow" d="M318 210 H340 M332 202 L340 210 L332 218"/>`,
    label,
  );
}

// ---- O9 / O10 · document and selfie "photos" ----

/** A document lying on a table, as the camera would see it. */
export function docPhoto(title, label, { selfie = false, framed = true } = {}) {
  if (selfie) {
    return svg(
      '0 0 362 220',
      `${framed ? '<rect class="ill-table" width="362" height="220"/>' : ''}
      <circle class="ill-bg" cx="181" cy="110" r="96"/>
      <circle class="ill-teal" cx="181" cy="92" r="34"/>
      <path class="ill-teal" d="M113 196 Q120 136 181 134 Q242 136 249 196 Z"/>
      <circle class="ill-white" cx="168" cy="88" r="3"/><circle class="ill-white" cx="194" cy="88" r="3"/>
      <path class="ill-smile" d="M170 102 Q181 110 192 102"/>`,
      label,
    );
  }
  return svg(
    '0 0 362 220',
    `${framed ? '<rect class="ill-table" width="362" height="220"/>' : ''}
    <g transform="translate(181 110) rotate(${framed ? -3 : 0})">
      <rect class="ill-shade" x="-118" y="-74" width="240" height="152" rx="10"/>
      <rect class="ill-paper" x="-122" y="-78" width="240" height="152" rx="10"/>
      <rect class="ill-teal" x="-122" y="-78" width="240" height="30" rx="10"/>
      <rect class="ill-teal" x="-122" y="-60" width="240" height="12"/>
      <text class="ill-label ill-label--on-teal" x="-108" y="-58">${esc(title.toUpperCase())}</text>
      <rect class="ill-bg" x="-108" y="-36" width="52" height="64" rx="6"/>
      <circle class="ill-teal" cx="-82" cy="-14" r="11"/>
      <path class="ill-teal" d="M-100 26 Q-98 4 -82 4 Q-66 4 -64 26 Z"/>
      <rect class="ill-paper-line" x="-42" y="-32" width="120" height="7" rx="3.5"/>
      <rect class="ill-paper-line" x="-42" y="-16" width="94" height="7" rx="3.5"/>
      <rect class="ill-paper-line" x="-42" y="0" width="108" height="7" rx="3.5"/>
      <rect class="ill-paper-line" x="-42" y="16" width="70" height="7" rx="3.5"/>
      <circle class="ill-stamp" cx="88" cy="44" r="18"/>
      <rect class="ill-paper-line" x="-108" y="44" width="150" height="6" rx="3"/>
      <rect class="ill-paper-line" x="-108" y="56" width="110" height="6" rx="3"/>
    </g>`,
    label,
  );
}
