// Dummy, static seed data. Live state lives in store.js; screens read via the store.

export const DRIVER = {
  id: 'santosh',
  role: 'driver',
  firstName: 'Santosh',
  lastName: 'Pawar',
  phone: '9876543210',
  dob: '12/03/1990',
  city: 'Mumbai',
  rating: 4.8,
  trips: 1240,
  registerSince: '21:52',
  vehicle: { plate: 'MH 02 AB 1234', type: 'auto', colour: 'Black and yellow' },
  upi: 'santosh@okaxis',
};

// The code the mock SMS "delivers" to O4. Auto-filled after ~1.5 s.
export const SMS_CODE = '472190';

export const LANGUAGES = [
  { id: 'hi', native: 'हिंदी', en: 'Hindi', speech: 'hi-IN' },
  { id: 'mr', native: 'मराठी', en: 'Marathi', speech: 'mr-IN' },
  { id: 'en', native: 'English', en: 'English', speech: 'en-IN' },
  { id: 'gu', native: 'ગુજરાતી', en: 'Gujarati', speech: 'gu-IN' },
];

export const CITIES = ['Mumbai', 'Thane', 'Navi Mumbai', 'Kalyan-Dombivli', 'Vasai-Virar'];

export const VEHICLE_TYPES = [
  { id: 'auto', icon: 'auto', nameKey: 'vehicle.auto', seatsKey: 'vehicle.autoSeats' },
  { id: 'cab', icon: 'car', nameKey: 'vehicle.cab', seatsKey: 'vehicle.cabSeats' },
];

// O7b / O8 document list, in Figma order. `seed` = state for a new driver:
// nothing added yet (O7b). O8 is the same list once photos are added.
export const DOCUMENTS = [
  { id: 'licence', icon: 'id', nameKey: 'doc.licence', metaKey: 'doc.licenceMeta', seed: 'needed' },
  { id: 'rc', icon: 'doc', nameKey: 'doc.rc', metaKey: 'doc.rcMeta', seed: 'needed' },
  { id: 'permit', icon: 'doc', nameKey: 'doc.permit', metaKey: 'doc.permitMeta', seed: 'needed', cabNameKey: 'doc.permitCab' },
  { id: 'insurance', icon: 'shield', nameKey: 'doc.insurance', metaKey: 'doc.insuranceMeta', seed: 'needed' },
  { id: 'aadhaar', icon: 'id', nameKey: 'doc.aadhaar', metaKey: 'doc.aadhaarMeta', seed: 'needed' },
  { id: 'selfie', icon: 'user', nameKey: 'doc.selfie', metaKey: 'doc.selfieMeta', seed: 'needed', selfie: true },
];

// O12a–c "How T2 trips work"
export const HOW_PAGES = [
  { id: 'O12a', icon: 'lock', titleKey: 'how.1.title', bodyKey: 'how.1.body' },
  { id: 'O12b', icon: 'clock', titleKey: 'how.2.title', bodyKey: 'how.2.body' },
  { id: 'O12c', icon: 'auto', titleKey: 'how.3.title', bodyKey: 'how.3.body' },
];

// O11 · Bank account: banks a driver can add. `ifsc` = the IFSC bank code (first 4 letters).
export const BANKS = [
  { name: 'State Bank of India', ifsc: 'SBIN' },
  { name: 'HDFC Bank', ifsc: 'HDFC' },
  { name: 'ICICI Bank', ifsc: 'ICIC' },
  { name: 'Axis Bank', ifsc: 'UTIB' },
  { name: 'Kotak Mahindra Bank', ifsc: 'KKBK' },
  { name: 'Bank of Baroda', ifsc: 'BARB' },
  { name: 'Punjab National Bank', ifsc: 'PUNB' },
  { name: 'Union Bank of India', ifsc: 'UBIN' },
];

// ---- Driver · 2 First trip ----

// The three offers the first-trip flow can hand the driver. All copy is from
// the Figma frames (T5, T5b, W1); the numbers match the rider app (₹420 etc.).
export const TRIPS = {
  airport: {
    tag: 'Booked ahead · Flight AI 864',
    rider: 'Ananya',
    riderPhone: '+910000000001', // placeholder
    pickup: 'Bay 12 · P6 East',
    pickupNote: 'You are here · Ananya is collecting her bags',
    drop: 'Andheri East',
    dropMeta: '9 km · about 35 min',
    km: 9,
    minutes: 35,
    fare: 420,
    fareNote: 'Fixed fare · tolls and bags included · paid in app',
    bags: { big: 2, small: 1 },
    people: 1,
    code: '4721',
  },
  short: {
    tag: 'Booked ahead · Flight AI 864',
    rider: 'Ananya',
    riderPhone: '+910000000001',
    pickup: 'Bay 12 · P6 East',
    pickupNote: 'You are here · Ananya is collecting her bags',
    drop: 'Sahar Village',
    dropMeta: '2 km · about 8 min',
    km: 2,
    minutes: 8,
    fare: 60,
    minimum: true,
    fareNote: 'Short trips from T2 pay at least ₹60 · paid in app',
    bags: { big: 2, small: 0 },
    people: 1,
    code: '4721',
  },
  counter: {
    tag: 'No app · booked at the T2 counter',
    rider: 'the rider',
    pickup: 'Bay 12 · you are here',
    pickupNote: 'She is walking to your auto',
    drop: 'Kurla West',
    dropMeta: '6 km · about 25 min',
    km: 6,
    minutes: 25,
    fare: 260,
    counter: true,
    fareNote: 'Paid at the counter · nothing to collect',
    bags: { big: 1, small: 0 },
    people: 1,
    code: '4721',
  },
};

// T1 · Flights landing at T2 (from the published schedule; "Now" is the 22:00 bar)
export const FLIGHTS_BY_HOUR = [
  { label: '20:00', count: 5 },
  { label: '21:00', count: 7 },
  { label: 'Now', count: 12, now: true },
  { label: '23:00', count: 10 },
  { label: '00:00', count: 6 },
  { label: '01:00', count: 4 },
];

// T4 · Near P4 West, from the airport map (static)
export const AMENITIES = [
  { icon: 'wc', label: 'Toilet', where: '2 min walk' },
  { icon: 'drop', label: 'Water', where: '1 min walk' },
  { icon: 'tea', label: 'Food', where: '3 min walk' },
];

export const QUEUE = { area: 'P4 West', bay: 'Bay 12', bayLevel: 'P6 East', startPlace: 7, registerTime: '21:52' };

export const SUPPORT_PHONE = '+910000000000'; // placeholder — not a real number

// Timings from the Figma prototype + §15 (seconds of demo time, ÷ demo speed)
export const TIMING = {
  smsAutofillMs: 1500,   // O4 "Reading the SMS automatically…"
  resendSec: 24,         // O4 "Resend code in 0:24"
  codeLockSec: 600,      // 3 wrong codes → locked 10:00
  checkingAdvanceMs: 3000, // O13 ⏱3 s → O14 (Figma timing, not scaled)
  upiCheckMs: 1200,      // mock ₹1 penny-drop check
  // Driver · 2 First trip (Figma auto-advance timings, not scaled)
  toQueueMs: 4000,       // T3 ⏱4 s → T4
  queueMs: 4000,         // T4 ⏱4 s → T4b (place counts 7 → 1)
  onTripMs: 5000,        // T9 ⏱5 s → T10
  // Countdowns (demo time, ÷ demo speed)
  offerSec: 15,          // T5 / T5b ring → E1
  freeWaitSec: 300,      // T7 free waiting 5:00, then ₹1 a minute
  noShowSec: 600,        // "Rider not here" opens at 10:00
};
