# Fixride Driver / Fixride — clickable prototype

A static, mobile-only HTML/CSS/JS prototype that works like a live app, built
from the Figma file **BCS-06 · Driver app (Santosh) · Mid-fi wireframes**
(`EXX6NVjEcnaQdljdIi3gTF`).

Flows are built one at a time. **Built so far:**
- Driver · 1 Sign up & onboarding (first login) — frames O1–O14, O5b and O8c
- Driver · 2 First trip: going online → first drop — frames T1, T2s, T3, T4, T4b, T5, T5b, W1, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16
- Driver · 3 Edge cases & failure states — frames E0, E1–E15 (E1/E2/E3/E7/E9/E11/E12b/E13 are overlays; E5/E6b/E8/E10/E12/E14/E15 are their own screens)

- Screens, layout, copy and routing come from the Figma section
  *Driver app · end-to-end flow → 1 · Sign up & onboarding (first login)*.
- Every visual comes from the **Design system** page: the Hub tokens
  (colour, spacing, radius, size), the `Hub/` text styles, the 65 icons
  (copied path-for-path from "05 · Icons") and the component states
  (buttons, fields, code boxes, option cards, document rows, OS pop-up,
  banners, toasts, timeline).

No framework, no build step, no runtime dependencies except Google Fonts
(Inter + Noto Sans Devanagari).

**Device:** the phone is always the iPhone 17 Pro canvas, **402 × 874**,
with a 54 px status bar and 34 px home indicator. On short windows the whole
device is zoomed down uniformly, so layout never squashes. On a real phone
(≤ 520 px wide) it fills the screen and uses safe-area insets.

**Brand:** the Fixride logo comes from the Figma page *Logo · Fixride*
(Option 1 · the fixed pickup pin). It appears in:
- the 2 s splash
- the O1 top bar ("Fixride" + "Driver" tag, like Uber Driver)
- the app picker icons
- the favicon
- the pickup-bay pins in the illustrations
- the OS permission pop-up ("Fixride Driver")

Brand marks live in `js/brand.js`.

## Splash (2 s)

Route `#/driver/splash`. The app picker and "Driver sign up" open it, and it
leaves history when it fades into O1.

| Time | What moves |
| --- | --- |
| 0–0.6 s | White pin drops onto the teal screen with a squash, and a shadow lands under it |
| 0.46–0.8 s | Keyhole "locks" into the pin (the fixed pickup) |
| 0.56–1.6 s | Two soft ripples spread from the pin |
| 0.78–1.3 s | "Fixride" wordmark slides out from behind the pin, so the pin moves into the lockup position |
| 1.15 s | "DRIVER" tag fades up |
| 1.74–2.0 s | Lockup fades and grows slightly, then O1 fades in |

With reduced motion, the static lockup shows for 2 s.

## Run locally

Any static file server works. From this folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. ES modules don't load from `file://`, so
the page has to be served.

## Deploy to GitHub Pages

All paths are relative, routing uses the URL hash, `.nojekyll` is present and
`404.html` is a byte-for-byte copy of `index.html`.

1. Push the contents of this `hub-app/` folder to the root of a repo, on `main`.
2. In **Settings → Pages**, choose branch `main`, folder `/ (root)`.
   (If you keep it in a sub-folder, move it to `/docs` and pick `/docs`.)
3. Open `https://<user>.github.io/<repo>/`.

If you edit `index.html`, copy it over `404.html` again.

## Prototype panel

On desktop, a panel sits next to the phone. On a phone (≤ 520 px), long-press
the top edge of the screen to open it. It has:

- flow starts (app picker, driver sign up) and a link to every screen
- language (English, हिंदी, मराठी, ગુજરાતી)
- theme (light / dark), demo speed for timers (1× / 10×)
- simulate offline
- reset all data

## Screen index — Driver · 1 Sign up & onboarding

| Code | Screen | Route | Wiring (from the Figma prototype) |
| --- | --- | --- | --- |
| — | Splash (2 s) | `#/driver/splash` | ⏱ 2 s → O1 (fade) |
| O1 | Welcome | `#/driver/O1` | Get started → O2 · I already have an account → O3 |
| O2 | Choose language | `#/driver/O2` | Hindi · Marathi · English · Gujarati tiles (radio group, re-renders the app) · Continue → O3 |
| O3 | Mobile number | `#/driver/O3` | Mock keypad (never takes focus from the field), 10-digit check on Get code or on leaving the field · Get code → O4 |
| O4 | Enter code | `#/driver/O4` | SMS auto-reads after 1.5 s → Verified → O5 · Change → O3 · resend countdown 0:24 |
| O5 | Allow location & alerts | `#/driver/O5` | Allow → O5b |
| O5b | System permission pop-up | `#/driver/O5b` | Allow While Using App / Allow Once → O6 · Don’t Allow → close |
| O6 | Your details (step 1 of 3) | `#/driver/O6` | Next → O7 (name, date of birth, city checked) |
| O7 | Your vehicle (step 2 of 3) | `#/driver/O7` | Auto / Cab · plate auto-formats · Next → O7b (or O8 if documents were already added) |
| O7b | Add documents · none added yet (added screen) | `#/driver/O7b` | 0 of 6, every row unticked · Each row → O9 · **Send for checking** (primary, locked until 6 of 6) · **Skip for now** (secondary) → O11 |
| O8 | Add documents (step 3 of 3) | `#/driver/O8` | Same list once photos are added (n of 6) · Each row → O9 · button locked until 6 of 6 · **Skip for now** → O11 |
| O9 | Camera | `#/driver/O9/<doc>` | Shutter → O10 · × → back |
| O10 | Check the photo | `#/driver/O10/<doc>` | Use this photo → back to the list (O7b becomes O8 after the first document) · Take again → O9 |
| O8c | All documents added | `#/driver/O8c` | Next: how you get paid → O11 |
| O11 | Get paid | `#/driver/O11` | **UPI ID** tab: UPI ID checked (₹1 check, name match). **Bank account** tab: "Add your bank account" form (bank, account number twice, IFSC pre-filled from the bank) with the same ₹1 check · Save → O12a |
| O12a–c | How T2 trips work | `#/driver/O12a` … `O12c` | Next → next page (or swipe) · I understand → O13 |
| O13 | Checking documents | `#/driver/O13` | ⏱ 3 s → O14 · Call support (`tel:`). If documents were skipped: "Add your documents · n of 6 added", no auto-advance, Add your documents → O8 (now ends in "Send for checking" → O13) |
| O14 | You are ready | `#/driver/O14` | Go to home → T1 |

### Screen index — Driver · 2 First trip

| Code | Screen | Route | Wiring |
| --- | --- | --- | --- |
| T1 | Home (offline, first time) | `#/driver/T1` | Switch / Go online at T2 → T2s sheet · tabs → T14, T15 · coach mark shown once |
| T2s | Join the T2 queue (sheet) | opens over T1 | Navigate to P4 West → T3 · Not now closes |
| T3 | Driving to waiting area | `#/driver/T3` | ⏱ 4 s → T4 · Go offline → T1 |
| T4 | In the T2 queue | `#/driver/T4` | Place ring counts 7 → 1 over 4 s → T4b · Leave the queue (dialog) → T1 |
| T4b | You are next: move up to Bay 12 | `#/driver/T4b` | I am at Bay 12 → T5 · Other offers (sheet) → T5b / W1 |
| T5 | New trip offer | `#/driver/T5` | 15 s ring (amber under 5 s) · Accept → T7 · Say no (sheet) → T4 · ⏱ 15 s → "Trip offer ran out" dialog → T4 |
| T5b | Short trip offer (hub minimum fare) | `#/driver/T5b` | Same + "Next demo: counter rider" → W1 |
| W1 | Walk-up rider from the counter | `#/driver/W1` | Rider is at my auto → T8 |
| T6 | Go to pickup bay (fallback map) | `#/driver/T6` | I have reached Bay 12 → T7 · Cancel trip (sheet) → T4 |
| T7 | Waiting at the bay | `#/driver/T7` | Live 5:00 free-wait ring (teal → warning amber under 1 min) · at 0 → paid waiting (₹1 / min, teal) · at 10 min → "Rider did not come" (sheet) → T4 with ₹42 · Send auto photo (toast) · Call (`tel:`) · Rider is here → T8 |
| T8 | Start the trip | `#/driver/T8` | Bag checks (checked by default) · 4-digit code (`4721`; auto-check on complete, keypad + hardware keyboard) · Bags don't match (sheet) → T4 · Start trip → T9 |
| T9 | On the trip | `#/driver/T9` | ⏱ 5 s → T10 · SOS (sheet, red) → tel:112 · Help → T15 |
| T10 | You have arrived | `#/driver/T10` | Swipe to end trip (85% threshold, keyboard Enter / arrow keys) → T11 sheet |
| T11 | All bags out? (sheet) | opens over T10 | Yes, all N bags are out → T12 (trip saved to earnings and record) |
| T12 | Trip done | `#/driver/T12` | Earn hero + fare break-down + Good / Not good rating · Done → T13 sheet |
| T13 | What next? (sheet) | opens over T12 | Go back to the T2 queue → T3 · Go offline → T1 |
| T14 | Earnings (tab) | `#/driver/T14` | Today / This week segmented · stat tiles · trip list · payout row → T15 |
| T15 | Account (tab) | `#/driver/T15` | My record → T16 · Payments → O11 · Language → O2 · Help → toast · Log out (dialog) → launcher |
| T16 | My record | `#/driver/T16` | History list (say-no, rider cancels, airport problems, finished trips) · back → T15 |

### Screen index — Driver · 3 Edge cases

| Code | Screen | Route | Wiring |
| --- | --- | --- | --- |
| E0 | Edge cases index (prototype start) | `#/driver/E0` | Tap a case → opens the right host screen with the overlay or navigates to the edge screen |
| E1 | You missed a trip | dialog on T4 | OK → T4 (back of queue) |
| E2 | Say no? (sheet) | sheet on T5 | Take this trip → close · Yes, say no → T4 (record "sayNo") |
| E3 | Cancel this trip? (sheet) | sheet on T6 | Keep the trip → close · Yes, cancel → T4 (₹42 fee, record "driverCancel") |
| E4 | Rider cancelled (dialog) | dialog on T7 | Back to the queue → T4 (keep place, ₹42, record "riderCancel") |
| E5 | Rider is late · paid waiting | `#/driver/E5` | ₹1/min pay ticks up · Rider is here → T8 · Rider not here → E6 sheet |
| E6 | Mark the rider as not here? (sheet) | sheet on E5 | Yes → E6b · Wait a bit more → close |
| E6b | Trip ended · Not your fault | `#/driver/E6b` | Hero + ₹42 card + "record is safe" + "keep place" cards · Back to the queue → T4 |
| E7 | Bags don't match (sheet) | sheet on T8 | Bags fit → close · Bags don't fit → T4 (record "badBags") |
| E8 | Wrong start code | `#/driver/E8` | Pre-fills "4729", shows the DS error state and "2 tries left" hint |
| E9 | SOS (sheet) | sheet on T9 | Red "Call 112 · Police" at top · Share live location · Call app support (24×7) · I am okay |
| E10 | No internet on the trip | `#/driver/E10` | Toggles simulate-offline and lands on T9 so the dark offline banner shows at the top |
| E11 | Rider left a bag (dialog) | dialog on T13 | Call rider · I did not find a bag |
| E12 | Report an airport problem | `#/driver/E12` | Trip row · "What happened?" radio group (5 options) · optional note · Send → E12b |
| E12b | Report sent (dialog) | dialog on E12 | OK → T15 |
| E13 | Left the waiting area (dialog) | dialog on T3 | Navigate back → T3 · Go offline → T1 |
| E14 | Document photo not clear | `#/driver/E14` | O8c list with one doc in rejected state (red "Photo not clear" + "Retake") → O9 |
| E15 | Wrong SMS code | `#/driver/E15` | O4 pre-filled with "472190" and the DS wrong-code state |

`<doc>` is one of `licence`, `rc`, `permit`, `insurance`, `aadhaar`, `selfie`.

## How it behaves

- **Live state.** Language, phone, details, vehicle, documents, UPI and theme
  persist in `localStorage` (in-memory fallback if storage is blocked). Going
  back keeps what was typed.
- **Validation.** Fields are checked when you leave them and on submit, with
  the design system's error look (red border + alert icon + "how to fix" text,
  read out via `aria-live`): "Enter all 10 digits", "Enter your full name, as
  on your licence", "You must be 18 or older to drive", "Enter the number as on
  your plate, like MH 02 AB 1234", "Enter your UPI ID, like name@bank",
  "Enter your account number, 9 to 18 digits", "The two account numbers don’t
  match", "Enter the 11-character IFSC, like HDFC0001234". Once an error shows,
  the next keystroke clears it, and it only comes back on submit or when you
  leave the field. The mock keypad never counts as leaving it.
- **Code boxes.** Auto-advance, Backspace, paste fills all, hardware keyboard
  works anywhere on the screen. SMS code `472190` auto-fills after 1.5 s.
  Wrong code → "That code is wrong. 2 tries left."; three wrong → locked with a
  10:00 countdown.
- **Listen** reads the screen's title and main instruction with
  `speechSynthesis` in the chosen language (`en-IN`, `hi-IN`, `mr-IN`) and
  shows the Playing… state.
- **Offline.** Real `navigator.onLine` plus the panel's simulate switch show
  the dark offline banner. Get code, resend, UPI check and sending documents
  say "No internet. Try again when you're back online."
- **Motion.** Slide-in-right forward, slide-in-left back, fades for language
  changes, scale-in for the OS pop-up, pop on ticks, shutter flash. All
  collapse under `prefers-reduced-motion`.
- **Accessibility.** Landmarks, focus moves to each screen's title,
  `role="radiogroup"` with arrow keys on language tiles, vehicle cards and the
  UPI / Bank switch, focus trap in the pop-up, 44 px minimum targets, 56 px main
  buttons, no text lighter than #757575.

## Hi-fi layer

The Figma flow frames are greyscale mid-fi. The prototype is the hi-fi
version, built only from the design-system palette and components:

- **Illustrations instead of grey boxes** (`js/illustrations.js`, inline SVG,
  themed by `--ill-*` tokens): the auto at T2 (O1), the fixed fare, paid
  waiting and T2 queue pages (O12a–c), and the document or selfie the camera
  "sees" (O9, O10).
- **Brand moments in teal:** the Fixride lockup, icon tiles on page heads and
  cards, the "Tap Listen" hint, the selected vehicle tile, document icons, the
  camera guide and scan line.
- **Meaning colours:** added documents, photo checks, the UPI name match, timeline
  steps that are done and "You are ready" are success green. "Checking documents"
  is warning amber with a pulsing ring.
- **Yellow plate** preview on O7, the only place yellow is used.
- **Main buttons are teal** (#0D5C63, pressed #084B50; #5ED6CF with ink text in
  dark mode), following the updated design system: "One teal button per screen",
  and "Safe choice is the teal one".
- Ink (#111111) is kept for text, toasts, the offline banner and the Listen
  pill's "Playing…" state.
- Selection controls (language tick, radios, step bars) stay ink, as on boards
  08 and 09. There are no drop shadows.

## Decisions where Figma and the design system meet

- **Design system wins on looks.** Selected language tile gets the DS black tick;
  the camera guide box is teal; the UPI name match is a success-green card;
  "Checking documents" uses warning amber with a clock; the OS pop-up uses
  system blue; the disabled button is #E3E3E3 with #757575 text.
- **Flow wins on content.** All English copy is verbatim from the frames. The one
  exception, by request: the fourth language tile is Gujarati instead of Urdu.
- **Live behaviour over shortcuts.** In Figma, "Use this photo" jumps straight to
  O8c. Here each photo adds that document and returns to the list. A new driver
  starts on O7b (0 of 6), which becomes O8 after the first photo and O8c when all
  6 are in.
- **Cab drivers** see "Cab permit" instead of "Auto permit".

## Not built yet (marked in the UI)

- **Gujarati copy.** Gujarati is selectable, but its text is not written yet. The
  app shows English and says so in a toast.
- **"Watch 30-sec video"** on O12a–c shows a "Videos are not built yet" toast.
- **This week** in Earnings shows a toast; only Today is live.
- **Voice note / photo** on the "Report an airport problem" screen (E12)
  shows a "not built yet" toast.
- **The rider app and the other driver flows** are listed on the app picker as not
  built yet.
- **Out of scope:** real SMS, camera, GPS and payments. A mock viewfinder, mock
  SMS, mock ₹1 UPI check and a placeholder support number are used instead.

Edge-case frames from the "Driver · 3 Edge cases" section (E14 blurry photo,
E15 wrong SMS code as its own screen) belong to a later flow. O4 already shows
the wrong-code state inline.

## Assets handoff

The prototype ships with no image assets. Illustrations are inline SVG from
`js/illustrations.js`. Photos, maps and video fall back to placeholders. Drop
real assets in with these relative paths (never a leading `/`):

| Where in the UI | Suggested path | Format | Target size |
| --- | --- | --- | --- |
| App logos (Fixride, Fixride Driver) — already inline in `js/brand.js` | `assets/logo-ride.svg`, `assets/logo-driver.svg` | SVG | 128 × 128 |
| Welcome illustrations (A1, O1) | `assets/illustrations/welcome-<app>.svg` | SVG | 362 × 340 |
| Baggage belt illustration (C2) | `assets/illustrations/belt.svg` | SVG | 362 × 150 |
| Driver / rider photos | `assets/photos/<personId>.jpg` | JPG / WebP | 256 × 256 |
| Auto photo at the bay (C5, T7) | `assets/photos/vehicle-<plate>.jpg` | JPG / WebP | 800 × 480 |
| Map tiles / static map (C7, T3, T9) | `assets/maps/<screen>.png` | PNG / WebP | 804 × 800 |
| Waiting-area / lane photo (T2s, T4) | `assets/photos/p4-west.jpg` | JPG / WebP | 800 × 480 |
| Onboarding videos (O12a–c) | `assets/video/how-t2-works-<n>.mp4` | MP4 | 720 × 1280 |
| QR code on poster (W1) | `assets/qr-t2.svg` | SVG | 512 × 512 |
| Favicon | `favicon.svg` | SVG | 512 × 512 |
| iOS touch icon | `apple-touch-icon.png` | PNG | 180 × 180 |

## File layout

```
hub-app/
├── index.html · 404.html · .nojekyll · favicon.svg · README.md
├── css/
│   ├── reset.css          reset + reduced-motion guard
│   ├── variables.css      Hub tokens (light + dark) from the Figma design system
│   ├── base.css           phone frame, status bar, launcher, prototype panel
│   ├── components.css     every reusable piece and its states
│   ├── screens-driver.css driver screen layouts only
│   └── animations.css     keyframes + route transitions
└── js/
    ├── app.js             routes, theme, language, offline banner
    ├── router.js          hash router, screen stack, transitions
    ├── store.js           localStorage adapter + pub/sub + reset
    ├── data.js            dummy seeds (Santosh, documents, timings)
    ├── i18n.js            EN / HI / MR strings + t()
    ├── format.js          phone, plate, date, ₹, mm:ss
    ├── clock.js           countdowns (× demo speed) and fixed delays
    ├── icons.js           the 65 DS icons + mock status-bar glyphs
    ├── illustrations.js   themed inline-SVG scenes (welcome, how-it-works, documents)
    ├── brand.js           Fixride pin, app icon and lockup (from Logo · Fixride)
    ├── components.js      DOM builders for every reusable piece
    ├── overlays.js        OS pop-up, dialog, bottom sheet, toast
    ├── devpanel.js        prototype panel
    └── screens/
        ├── launcher.js
        ├── driver-onboarding.js   O1–O14, O5b, O8c
        └── driver-trip.js         T1 placeholder
```

`screens-rider.css` and the rider, edge-case and trip screen modules will be
added as their flows are built.
