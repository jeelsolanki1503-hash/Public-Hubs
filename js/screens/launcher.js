// Launcher (#/): app picker + flow starts.

import { h, ic, screen, badge } from '../components.js';
import { toast } from '../overlays.js';
import { go } from '../router.js';
import { t } from '../i18n.js';
import { appIconSvg, lockup } from '../brand.js';

function appCard({ title, sub, onClick, built }) {
  return h(
    'button',
    { type: 'button', class: 'choice-card', onClick },
    h('span', { class: 'launcher__logo', 'aria-hidden': 'true', html: appIconSvg() }),
    h('span', { class: 'choice-card__body' }, h('span', { class: 't-headline' }, title), h('span', { class: 't-subhead t-mute' }, sub), built ? null : badge(t('common.notBuilt'))),
    ic('chev', { size: 20 }),
  );
}

function flowRow(label, onClick, built) {
  return h(
    'li',
    {},
    h(
      'button',
      { type: 'button', class: 'doc-row', onClick },
      h('span', { class: 'doc-row__body' }, h('span', { class: 'doc-row__name' }, label), built ? null : h('span', { class: 'doc-row__meta' }, t('common.notBuilt'))),
      ic('chev', { size: 16 }),
    ),
  );
}

export function Launcher() {
  const soon = () => toast(t('launcher.soon'), { tone: 'info' });
  const { el } = screen({
    code: 'launcher',
    label: t('launcher.title'),
    body: [
      h(
        'div',
        { class: 'launcher' },
        h(
          'header',
          { class: 'page-head' },
          lockup({ size: 'm' }),
          h('h1', { class: 't-large screen__heading', tabindex: '-1' }, t('launcher.title')),
          h('p', { class: 't-callout page-head__sub' }, t('launcher.sub')),
        ),
        h(
          'div',
          { class: 'launcher__apps' },
          appCard({ title: t('launcher.driver'), sub: t('launcher.driverSub'), onClick: () => go('/driver/splash'), built: true }),
          appCard({ title: t('launcher.rider'), sub: t('launcher.riderSub'), onClick: soon, built: false }),
        ),
        h('h2', { class: 't-label t-mute launcher__section' }, t('launcher.flows').toUpperCase()),
        h(
          'ul',
          { class: 'doc-list' },
          flowRow(t('launcher.flowSignup'), () => go('/driver/splash'), true),
          flowRow(t('launcher.flowFirstTrip'), () => go('/driver/T1'), true),
          flowRow(t('launcher.flowEdge'), () => go('/driver/E0'), true),
          flowRow(t('launcher.flowRider'), soon, false),
        ),
      ),
    ],
  });
  return { el };
}
