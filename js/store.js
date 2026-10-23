// Live state: localStorage-backed, with a silent in-memory fallback
// (private browsing / storage disabled). Tiny pub/sub on top.

import { DOCUMENTS } from './data.js';

const KEY = 'hub.v1';

const memory = new Map();
const storage = (() => {
  try {
    const probe = '__hub_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return {
      getItem: (k) => (memory.has(k) ? memory.get(k) : null),
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k),
    };
  }
})();

function seed() {
  return {
    settings: {
      lang: 'en',
      theme: 'light',
      demoSpeed: 1,
      simulateOffline: false,
    },
    driver: {
      phone: '',
      codeTries: 0,
      codeLockedUntil: 0,
      name: '',
      dob: '',
      city: '',
      vehicleType: 'auto',
      plate: '',
      docs: Object.fromEntries(DOCUMENTS.map((d) => [d.id, d.seed])),
      payout: 'upi',
      upi: '',
      upiVerifiedFor: '',
      bank: null,
      bankVerifiedFor: '',
      permissions: { location: 'ask', notifications: 'ask' },
      howSeen: false,
      submitted: false,
      ready: false,
    },
    // Driver · 2 First trip: live working state
    work: {
      status: 'offline', // offline | toQueue | inQueue | nextAtBay | offer | accepted | waiting | onTrip | arrived | done
      onlineSince: 0, // ms timestamp while online
      onlineMs: 0, // time online before the current session
      queuePlace: 7,
      coachSeen: false,
      tripKind: null, // key into TRIPS for the trip in progress
      waitPay: 0, // ₹ paid waiting on the current trip
      trips: [], // finished trips: { kind, to, rider, time, fare, waitPay, rating }
      record: [], // record entries: { type, date, note } newest first
    },
  };
}

function load() {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return seed();
    const saved = JSON.parse(raw);
    const base = seed();
    return {
      settings: { ...base.settings, ...saved.settings },
      driver: {
        ...base.driver,
        ...saved.driver,
        docs: { ...base.driver.docs, ...(saved.driver && saved.driver.docs) },
        permissions: { ...base.driver.permissions, ...(saved.driver && saved.driver.permissions) },
      },
      work: { ...base.work, ...saved.work },
    };
  } catch {
    return seed();
  }
}

let state = load();
const subs = new Set();

function persist() {
  try {
    storage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota or disabled — in-memory state still works */
  }
}

export const store = {
  get: () => state,
  settings: () => state.settings,
  driver: () => state.driver,
  work: () => state.work,

  /** Shallow-merge a patch into a branch ('settings' | 'driver') and notify. */
  set(branch, patch) {
    state = { ...state, [branch]: { ...state[branch], ...patch } };
    persist();
    subs.forEach((fn) => fn(state, branch, patch));
  },

  setDoc(id, docState) {
    this.set('driver', { docs: { ...state.driver.docs, [id]: docState } });
  },

  subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  },

  reset() {
    const { theme, demoSpeed } = state.settings;
    state = seed();
    state.settings.theme = theme;
    state.settings.demoSpeed = demoSpeed;
    persist();
    subs.forEach((fn) => fn(state, 'reset', null));
  },
};

export function isOffline() {
  return state.settings.simulateOffline || (typeof navigator !== 'undefined' && navigator.onLine === false);
}
