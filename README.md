# 💰 LendSwift — Digital Loan Application Platform

> A fully digital, RBI-compliant, WCAG 2.1 AA accessible multi-step loan application wizard built for modern Indian financial institutions.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Cypress](https://img.shields.io/badge/Cypress-16-17202C?logo=cypress&logoColor=white)](https://www.cypress.io/)
[![WCAG](https://img.shields.io/badge/WCAG-2.1%20AA-27AE60)](https://www.w3.org/WAI/WCAG21/quickref/)
[![ESLint](https://img.shields.io/badge/ESLint-0%20warnings-27AE60)](https://eslint.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## 🔗 Live Demo

> **[https://your-live-url-here.vercel.app](https://your-live-url-here.vercel.app)**
> *(Replace this URL with your deployment link after pushing to Vercel / Netlify / GitHub Pages)*

---

## 📋 Project Overview

**LendSwift** is a production-grade, 8-step loan application wizard targeting an **85%+ form completion rate**. It supports Personal, Home, and Business loans with bespoke validation, conditional step routing, real-time EMI calculations, and bank-grade encrypted auto-save — all running 100% in the browser with zero backend dependency for the core collection flow.

### Why LendSwift?

Traditional loan forms suffer from ~65% abandonment. LendSwift combats this with:

| Feature | Implementation |
|---------|---------------|
| Progressive disclosure | Only relevant fields shown per step |
| Encrypted auto-save | AES-256-GCM draft saved every 30s, 72hr TTL |
| Inline validation | Zod + React Hook Form — errors shown field-by-field |
| Conditional routing | Step 6 (Co-Applicant) only appears when legally required |
| Live EMI calculator | Real-time reducing-balance EMI with affordability meter |
| Code-split loading | All 8 steps lazy-loaded via `React.lazy()` — bundle < 300KB |
| WCAG 2.1 AA | Full keyboard navigation, `aria-live` error announcements |

### Loan Products

| Product | Amount Range | Rate | Tenure |
|---------|-------------|------|--------|
| Personal Loan | ₹50K – ₹10L | 10.5% p.a. | 12–60 months |
| Home Loan | ₹5L – ₹1Cr | 8.5% p.a. | 60–360 months |
| Business Loan | ₹1L – ₹50L | 14% p.a. | 12–84 months |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 |
| Build Tool | Vite 8 |
| Form Management | React Hook Form 7 |
| Validation | Zod 4 (discriminated unions, cross-step `superRefine`) |
| Styling | Tailwind CSS 4 |
| File Upload | React Dropzone 20 |
| E-Signature | react-signature-canvas |
| Encryption | Web Crypto API — AES-256-GCM + PBKDF2 |
| UUID | uuid 14 |
| E2E Testing | Cypress 16 + cypress-axe |

---

## ⚙️ Setup & Installation

### Prerequisites

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x

### 1 — Clone & Install

```bash
git clone https://github.com/ZethetaIntern/loan-application.git
cd loan-application
npm install
```

### 2 — Start the Development Server

```bash
npm run dev
```

Opens at **[http://localhost:5173](http://localhost:5173)** with Hot Module Replacement.

### 3 — Build for Production

```bash
npm run build       # Outputs to /dist
npm run preview     # Preview production build locally at :4173
```

### 4 — Lint (must pass before any commit)

```bash
npx eslint src/ --ext .js,.jsx --max-warnings 0
```

---

## 🧪 Cypress E2E Testing

The test suite covers **15 distinct user journeys** across 11 test files using Cypress 16 + cypress-axe.

### Run All Tests (CI / Headless)

```bash
# Starts Vite dev server on :5173, then runs the full Cypress suite headlessly
npm run test
```

### Open Interactive Cypress Runner

```bash
npm run cy:open
```

### Run Headlessly (dev server already running)

```bash
npm run cy:run
```

### Run a Single Test File

```bash
npx cypress run --spec "cypress/e2e/personal-loan-happy-path.cy.js"
```

### Run Stress Tests Only

```bash
npx cypress run --spec "cypress/e2e/stress-test.cy.js"
```

### Run Accessibility Audit Only

```bash
npx cypress run --spec "cypress/e2e/accessibility-axe.cy.js"
```

---

### 📊 Test Coverage — 15 Journeys

| # | File | Scenario | Category |
|---|------|----------|----------|
| 1 | `personal-loan-happy-path.cy.js` | Full 8-step personal loan (< ₹5L, no co-applicant) | Happy Path |
| 2 | `home-loan-happy-path.cy.js` | Full 8-step home loan with mandatory co-applicant | Happy Path |
| 3 | `business-loan-happy-path.cy.js` | Business loan with GST + discriminated-union schema | Happy Path |
| 4 | `validation-errors.cy.js` | Invalid PAN, Aadhaar checksum fail, underage DOB | Validation |
| 5 | `empty-submissions.cy.js` | Empty step → all `aria-live` errors announced | Validation + A11y |
| 6 | `file-upload.cy.js` | Oversized file rejection, JPEG compression display | File Handling |
| 7 | `e-signature.cy.js` | Empty signature blocked, draw-clear-redraw cycle | E-Signature |
| 8 | `auto-save-resume.cy.js` | Fill steps 1–3, hard-reload, resume from modal | State Persistence |
| 9 | `keyboard-navigation.cy.js` | Tab + Enter only — zero mouse interactions | WCAG 2.1 AA |
| 10 | `accessibility-axe.cy.js` | cypress-axe audit on every step — zero violations | WCAG 2.1 AA |
| 11 | `stress-test.cy.js` | 20× rapid Next spam, double-submit prevention | Stress / Edge Cases |
| 12 | `stress-test.cy.js` | PAN invalid 4th char → specific entity-type error | Stress / Validation |
| 13 | `stress-test.cy.js` | Back-nav + amount change → Step 6 dynamically appears | Conditional Routing |
| 14 | `auto-save-resume.cy.js` | Draft > 72h is silently expired and cleared | Persistence Edge Case |
| 15 | `stress-test.cy.js` | Review → Edit Step 2 → resubmit full flow | Edit Flow |

---

## 📁 Project Structure

```
loan-application/
├── cypress/
│   ├── e2e/                    # 11 test files, 15 user journeys
│   ├── fixtures/               # Test data + images
│   └── support/
│       ├── commands.js         # Custom cy.fill* helper commands
│       └── e2e.js
├── src/
│   ├── components/
│   │   ├── common/             # Input, Select, RadioGroup, Checkbox, FileUpload, SignatureCanvas
│   │   ├── steps/              # Step1–Step8 (React.lazy() loaded)
│   │   └── wizard/             # WizardContainer + StepNavigation + ProgressBar
│   ├── hooks/
│   │   ├── useAutoSave.js      # AES-256-GCM encrypted 30s auto-save
│   │   ├── useVerification.js  # PAN/Aadhaar OTP simulation
│   │   ├── usePinCodeLookup.js # Offline PIN → city/state lookup
│   │   └── useImageCompression.js
│   └── utils/
│       ├── schemaFactory.js    # Cross-step Zod schema builder
│       ├── emiCalculator.js    # Reducing-balance EMI + amortisation
│       ├── encryption.js       # Web Crypto API helpers
│       ├── imageCompression.js # Canvas API recursive compressor
│       ├── validators.js       # Verhoeff, PAN entity-type, GST
│       └── pinCodeData.js      # 6-digit PIN lookup table
├── index.html
├── vite.config.js
├── cypress.config.js
├── package.json
├── README.md
└── ARCHITECTURE.md             # Deep-dive on all engineering decisions
```

---

## ♿ Accessibility

LendSwift is built to **WCAG 2.1 Level AA** throughout:

- ✅ Skip-to-content link (visible on keyboard focus)
- ✅ All fields: explicit `<label>`, `aria-required`, `aria-invalid`, `aria-describedby`
- ✅ Errors: `role="alert"` + `aria-live="polite"` — announced by screen readers on appearance
- ✅ Radio groups: `<fieldset>` / `<legend>` semantics
- ✅ Modals: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trapped with `autoFocus`
- ✅ Submit button: `aria-busy="true"` during async submission
- ✅ Colour contrast: all text ≥ 4.5:1 ratio (verified with cypress-axe)
- ✅ Step transitions: scroll-to-top + focus reset on every step change

---

## 🔒 Security

| Threat | Defence |
|--------|---------|
| Draft data in localStorage | AES-256-GCM + PBKDF2 (100,000 iterations) |
| Corrupted/tampered drafts | 4-layer recovery: decrypt → parse → validate → TTL |
| Aadhaar leakage | Masked in UI; Verhoeff checksum validation client-side |
| PAN leakage | Masked in Review; entity-type validated against loan type |
| Double-submit | Button `disabled` + `aria-busy` immediately on first click |
| Stale drafts | 72-hour TTL enforced on every page load |

---

## 📄 License

MIT © 2024 LendSwift Financial Services  
*Licensed by RBI · DPDPA 2023 Compliant*
