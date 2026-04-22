# MedQuire — Full Application Implementation Plan

## Overview

Build the complete MedQuire mobile application: a ChatGPT-style health literacy tool that translates complex medication information into plain language. The system comprises a **React Native (Expo)** frontend and a **Node.js/Express** backend.

All decisions below are grounded in the system markdown files and design-tokens.css.

---

## Design Token System (Extracted)

All styling in React Native uses a `tokens.js` file that maps CSS variables to JS values:

| Role | Value |
|---|---|
| Primary | `#4077f1` |
| On-Primary | `#ffffff` |
| Primary Container | `#d0ddfb` |
| Secondary | `#485f85` |
| Surface | `#fafafa` |
| Background | `#fafafa` |
| On-Surface | `#18181b` |
| On-Surface-Variant | `#48484f` |
| Outline | `#7a7a85` |
| Outline-Variant | `#cacace` |
| Error | `#ef4444` |
| Error Container | `#fbd0d0` |
| Success | `#10bc83` |
| Accent | `#ec7b18` |
| **Font** | Outfit |
| Body Large | 16px / 500 |
| Title Large | 22px / 600 |
| Headline Small | 24px / 500 |

---

## Project Structure

```
MedQuire/
├── app/                          # React Native (Expo) frontend
│   ├── assets/
│   │   └── logo.png
│   ├── src/
│   │   ├── tokens/
│   │   │   └── tokens.js         # Design token JS constants
│   │   ├── context/
│   │   │   └── AuthContext.js    # Auth state + Supabase session
│   │   ├── services/
│   │   │   ├── api.js            # Backend API calls
│   │   │   └── supabase.js       # Supabase client
│   │   ├── navigation/
│   │   │   └── AppNavigator.js   # Stack + Tab navigator
│   │   ├── screens/
│   │   │   ├── SplashScreen.js
│   │   │   ├── OnboardingScreen.js
│   │   │   ├── HomeScreen.js     # Core engine (single screen)
│   │   │   ├── CabinetScreen.js
│   │   │   ├── InteractionScreen.js
│   │   │   └── SettingsScreen.js
│   │   └── components/
│   │       ├── InputBar.js
│   │       ├── SummaryCard.js
│   │       ├── SkeletonCard.js
│   │       ├── AuthModal.js
│   │       ├── EmptyState.js
│   │       ├── DrugListItem.js
│   │       └── Disclaimer.js
│   ├── App.js
│   └── package.json
│
└── backend/                      # Node.js + Express
    ├── src/
    │   ├── routes/
    │   │   ├── search.js
    │   │   ├── autocomplete.js
    │   │   ├── eli12.js
    │   │   └── interactions.js
    │   └── services/
    │       ├── openFDA.js
    │       └── deepSeek.js
    ├── index.js
    └── package.json
```

---

## Proposed Changes

### Component 1 — Backend (Node.js/Express)

#### [NEW] `backend/package.json`
#### [NEW] `backend/index.js`
Express entry point. CORS enabled, JSON body parser, routes mounted.

#### [NEW] `backend/src/services/openFDA.js`
- `fetchDrugLabel(drugName)` → queries `api.fda.gov/drug/label.json`
- `fetchInteractions(drugKeys[])` → queries `api.fda.gov/drug/label.json` for each drug
- Normalizes response into: `{ indications, dosage, warnings, side_effects }`
- Returns `null` for missing fields (no fabrication)

#### [NEW] `backend/src/services/deepSeek.js`
- `generateSummary(normalizedData)` → POST to DeepSeek `/chat/completions`
- `generateELI12(normalizedData)` → same but with simplified prompt
- Strict system prompt: *"Only rewrite the provided data. Do not add medical advice. Do not guess."*
- Returns structured JSON: `{ what_it_does, how_to_take, warnings, side_effects }`

#### [NEW] `backend/src/routes/autocomplete.js`
- `GET /api/autocomplete?q=<query>` → debounce handled on client; returns list of drug name suggestions from OpenFDA

#### [NEW] `backend/src/routes/search.js`
- `POST /api/search` with body `{ drug_name }`
- Pipeline: OpenFDA → normalize → validate → DeepSeek → validate → return
- Response contract:
```json
{
  "drug_name": "string",
  "source": "OpenFDA",
  "summary": {
    "what_it_does": "string | null",
    "how_to_take": "string | null",
    "warnings": "string | null",
    "side_effects": "string | null"
  },
  "eli12": { "enabled": false, "content": null }
}
```

#### [NEW] `backend/src/routes/eli12.js`
- `POST /api/eli12` with body `{ drug_name, fda_data }`
- Returns same contract with `eli12.enabled: true` and `eli12.content`

#### [NEW] `backend/src/routes/interactions.js`
- `POST /api/interactions` with body `{ drug_keys: [] }`
- Queries OpenFDA for each drug; cross-references adverse events
- Only outputs: `"potential_interaction"` | `"insufficient_data"`
- **NEVER outputs "safe"**

---

### Component 2 — Frontend: Token System

#### [NEW] `app/src/tokens/tokens.js`
All design values as JS constants, extracted from `design-tokens.css`:
- Colors (primary, surface, error, success, accent, outline, etc.)
- Typography (family: 'Outfit', sizes, weights, line heights)
- Spacing (multiples of 4: 4, 8, 12, 16, 20, 24, 32, 40, 48)
- Border radius (8, 12, 16, 24)

---

### Component 3 — Frontend: Foundation

#### [NEW] `app/src/services/supabase.js`
Supabase client init with URL + anon key from env vars.

#### [NEW] `app/src/services/api.js`
All backend fetch calls:
- `searchMedication(drugName)`
- `getAutocomplete(query)`
- `getELI12(drugName, fdaData)`
- `checkInteractions(drugKeys)`

Includes: request cancellation (AbortController), retry logic (max 2), timeout 8s.

#### [NEW] `app/src/context/AuthContext.js`
- Supabase session state
- `signIn()`, `signUp()`, `signOut()`
- `user`, `isGuest` flags consumed app-wide

---

### Component 4 — Navigation

#### [NEW] `app/src/navigation/AppNavigator.js`
- Stack navigator: Splash → Onboarding → Main (Tab)
- Tab navigator: Home | Cabinet | Settings
- Route guard: Cabinet + Interaction require auth (trigger modal instead of navigate if guest)
- Onboarding only shown once (AsyncStorage flag)

---

### Component 5 — Screens

#### [NEW] `app/src/screens/SplashScreen.js`
- Full-screen teal background (`primary` color token)
- MedQuire logo centered with animated pulse/scale in
- Auto-navigates after 1.5s
- Checks AsyncStorage for `hasSeenOnboarding` → routes to Onboarding or Home

#### [NEW] `app/src/screens/OnboardingScreen.js`
- 3-slide horizontal FlatList/PagerView
- **Slide 1:** "Understand your medication instantly" — hero illustration
- **Slide 2:** "Search. Read. Understand." — search flow illustration
- **Slide 3:** "Clear, safe, and easy to use" — checkmark/confidence illustration
- Progress dots indicator
- "Next" and "Skip" buttons (token-styled)
- On complete: set `hasSeenOnboarding = true` → navigate to Home

#### [NEW] `app/src/screens/HomeScreen.js`  *(Core Engine)*
- Header: Cabinet icon (top-right), Profile icon (top-right)
- Dynamic content area (6 states):
  - **Empty** → `<EmptyState type="initial" />`
  - **Loading** → `<SkeletonCard />`
  - **Success** → `<SummaryCard data={result} />`
  - **Partial** → `<SummaryCard data={result} />` (hides null sections)
  - **Not Found** → `<EmptyState type="not_found" />`
  - **Error** → `<EmptyState type="error" onRetry={retry} />`
- Autocomplete dropdown (renders above input bar)
- Persistent `<InputBar />` at bottom
- `<AuthModal />` overlay (conditionally rendered)

#### [NEW] `app/src/screens/CabinetScreen.js`
- Auth-guarded
- FlatList of saved medications
- Each item: drug name + one-line summary → taps re-renders on Home
- Empty cabinet state
- "Check Interactions" CTA when ≥2 drugs selected

#### [NEW] `app/src/screens/InteractionScreen.js`
- Auth-guarded
- Multi-select from cabinet
- Interaction result states: Caution / Risk / Unknown
- Never outputs "Safe"
- Consult professional prompt always shown

#### [NEW] `app/src/screens/SettingsScreen.js`
- Account info (if logged in)
- Sign out button
- App version
- Disclaimer text

---

### Component 6 — UI Components

#### [NEW] `app/src/components/InputBar.js`
- Fixed bottom; keyboard-aware (`KeyboardAvoidingView`)
- Text input + send button (primary color)
- Send disabled when empty
- Triggers search on submit
- Debounce autocomplete 350ms

#### [NEW] `app/src/components/SummaryCard.js`
- Drug name header + OpenFDA source badge
- 4 sections in strict order: What it does / How to take it / Warnings / Side effects
- Missing sections → *"We do not have enough reliable information for this section."*
- ELI12 toggle switch (re-triggers API)
- Save button (auth-gated → triggers AuthModal)
- Export button (auth-gated → share sheet)
- **Disclaimer always at bottom** (never hidden)
- Warnings section uses accent/error color for emphasis

#### [NEW] `app/src/components/SkeletonCard.js`
- Animated shimmer placeholders matching SummaryCard structure
- Appears instantly (<100ms)
- Prevents layout shift

#### [NEW] `app/src/components/AuthModal.js`
- Bottom sheet modal overlay
- Tab: Sign In / Sign Up
- Email + Password fields
- Validates on submit only
- On success: closes modal, executes pending action
- On dismiss: returns to previous state, no data loss

#### [NEW] `app/src/components/EmptyState.js`
- Props: `type` (`initial` | `not_found` | `error` | `offline` | `empty_cabinet`)
- Each type has: icon + short title + CTA action
- Calm tone; no alarming language

#### [NEW] `app/src/components/DrugListItem.js`
- Used in autocomplete dropdown + cabinet list
- Drug name (title style) + optional short description
- Clear 44px min tap target

#### [NEW] `app/src/components/Disclaimer.js`
- Reusable disclaimer text block
- Always rendered at bottom of SummaryCard
- Token-styled caption text; never hidden

---

## User Review Required

> [!IMPORTANT]
> **Environment Variables Required Before Build:**
> You will need to provide the following before the app can run:
> - `SUPABASE_URL` and `SUPABASE_ANON_KEY` — from your Supabase project
> - `DEEPSEEK_API_KEY` — from your DeepSeek account
> - `BACKEND_URL` — the URL of the running Express backend (can be `http://localhost:3000` for local dev)

> [!WARNING]
> **Expo vs Bare React Native:** The build will use **Expo Managed Workflow** for fastest setup. If you need custom native modules (e.g., react-native-splash-screen), you may need to eject to bare workflow. I'll use Expo's built-in splash screen config to avoid this.

> [!NOTE]
> **No Spacing.md file exists** in the skills folder. I will derive spacing from the design token scale (multiples of 4/8) and the layout.md constraints.

---

## Verification Plan

### Automated
- `npx expo start` → confirm app boots without errors
- Test each screen renders correctly in Expo Go

### Manual Verification
- Splash → Onboarding → Home flow works end-to-end
- Searching "ibuprofen" returns a Summary Card inline
- ELI12 toggle triggers a new simplified response
- Guest user tapping Save triggers AuthModal
- AuthModal closes and completes the pending save after login
- Cabinet shows saved medications
- Interaction checker outputs caution/unknown (never "safe")
- All 6 Home states (empty, loading, success, partial, not found, error) are reachable
- Disclaimer always visible on SummaryCard
- All colors come from token values (no hardcoded hex in component files)
