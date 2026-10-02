# 🏗 LendSwift — Technical Architecture

> **Internal engineering reference document**  
> Explains the key design decisions, data-flow patterns, and rationale behind the LendSwift multi-step loan application.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Wizard Pattern — Step Registry Architecture](#2-wizard-pattern--step-registry-architecture)
3. [Schema Factory — Cross-Step Validation](#3-schema-factory--cross-step-validation)
4. [State Persistence — Encrypted Auto-Save](#4-state-persistence--encrypted-auto-save)
5. [Client-Side Image Compression](#5-client-side-image-compression)
6. [EMI Financial Engine](#6-emi-financial-engine)
7. [Accessibility Architecture](#7-accessibility-architecture)
8. [Data Flow Diagram](#8-data-flow-diagram)
9. [Security Model](#9-security-model)

---

## 1. System Overview

LendSwift is a **single-page application (SPA)** with no backend dependency for the core loan collection flow. All validation, financial calculations, document compression, and state persistence happen entirely in the browser.

```
Browser (React SPA)
    │
    ├── WizardContainer        ← Orchestrates all 8 steps + global state
    │       │
    │       ├── schemaFactory  ← Builds the correct Zod schema per step
    │       ├── useAutoSave    ← Debounced AES-256-GCM → localStorage
    │       └── FormProvider   ← React Hook Form context per step
    │
    ├── Step Components (1–8)  ← Each step is fully self-contained
    │
    └── Utility Layer
            ├── emiCalculator.js       ← Pure financial math
            ├── imageCompression.js    ← Canvas API file compressor
            ├── encryption.js          ← Web Crypto API (AES-256-GCM)
            └── validators.js          ← Verhoeff, PAN, GST, mobile
```

**Key architectural goal:** Zero coupling between steps. Each step only reads `allFormData` passed as a prop and emits a validated payload via `onNext(stepData)`. Steps do not write to any shared store directly.

---

## 2. Wizard Pattern — Step Registry Architecture

### Decision: Step Registry vs. Monolithic Context

**Rejected alternative: Monolithic single-form context**

A common approach for multi-step forms is to wrap the entire application in a single `<FormProvider>` and persist all field registrations across steps. This approach was **explicitly rejected** for the following reasons:

| Concern | Monolithic Form | Step Registry (chosen) |
|---------|----------------|----------------------|
| Re-render performance | Every field change triggers all 60+ registered fields to re-validate | Only the current step's ~10 fields re-render |
| Schema complexity | One mega-schema with dozens of `.optional()` escape hatches | Per-step schema — strict and minimal |
| Bundle size | All step components hydrated on initial load | Lazy-loadable (future) |
| Test isolation | Can't test Step 3 in isolation without simulating Steps 1–2 | Each step can be mounted and tested independently |
| Conditional fields | Complex watchers across steps pollute form context | Co-applicant step is simply not mounted when not needed |

### Step Registry Implementation

```js
// WizardContainer.jsx
const STEP_COMPONENTS = {
  1: Step1LoanType,
  2: Step2PersonalInfo,
  3: Step3KYC,
  4: Step4Address,
  5: Step5Employment,
  6: Step6CoApplicant,   // conditionally routed — may be skipped
  7: Step7Documents,
  8: Step8Review,
};
```

Each step is mounted fresh on navigation. The `useForm` instance is re-created per step with `defaultValues` pre-populated from `allFormData[stepKey]`:

```js
const methods = useForm({
  resolver: zodResolver(schema),         // step-specific Zod schema
  mode: 'onChange',
  defaultValues: allFormData[`step${currentStep}`] || {},  // pre-fill on back navigation
});
```

### Conditional Step Routing — Step 6

Step 6 (Co-Applicant) follows a **conditional step routing** pattern. The routing logic lives in a pure function so it can be called from both the navigation handler and the schema factory without duplication:

```js
function shouldShowCoApplicant(step1Data) {
  const { loanType, loanAmount } = step1Data;
  if (loanType === 'personal' && loanAmount > 500000) return true;  // Personal > ₹5L
  if (loanType === 'home') return true;                              // Home: always
  if (loanType === 'business' && loanAmount > 2000000) return true; // Business > ₹20L
  return false;
}
```

When navigating forward and the result is `false`, `nextStep` jumps from 5 → 7, bypassing Step 6 entirely. The ProgressBar receives `skippedSteps={[6]}` and renders it as a dimmed, non-clickable indicator.

### Cross-Step Data Lifetime

```
Step 1 submits → allFormData.step1 is set
Step 2 submits → allFormData.step2 is set
...
Step 8 (Review) reads all of allFormData.step1–step7 as read-only props
```

`allFormData` lives in `useState` inside `WizardContainer`. It is never mutated — each step produces a new object via spread:

```js
const handleNext = useCallback(async (stepData) => {
  const updated = { ...allFormData, [stepKey]: stepData };
  setAllFormData(updated);
}, [currentStep, allFormData]);
```

---

## 3. Schema Factory — Cross-Step Validation

### The Problem: 14 Cross-Step Validation Dependencies

A standard Zod schema validates fields within a single object. But LendSwift has **14 validation rules that span multiple steps**:

- Step 1 `loanType` controls which Step 5 employment fields are required
- Step 1 `loanType` + `loanAmount` controls whether Step 6 co-applicant is mandatory
- Step 3 `panVerified` (boolean) controls whether Step 7 PAN card upload is required
- Step 1 `loanType` controls which Step 7 income proof documents are required

### Solution: `schemaFactory(stepIndex, allFormData)`

The schema factory is a pure function that receives the current step number and the entire `allFormData` object, then returns the correct Zod schema:

```js
export function schemaFactory(stepIndex, allFormData = {}) {
  const { step1 = {}, step3 = {} } = allFormData;

  switch (stepIndex) {
    case 5:
      // z.discriminatedUnion dispatches to sub-schema based on employmentType value
      return step5Schema; // union of: salariedSchema | selfEmployedSchema | businessOwnerSchema

    case 6: {
      const requiresCoApplicant = shouldShowCoApplicant(step1);
      if (requiresCoApplicant) {
        // Augment base schema with a mandatory hasCoApplicant=true constraint
        return step6Schema.superRefine((data, ctx) => {
          if (!data.hasCoApplicant) {
            ctx.addIssue({ code: 'custom', path: ['hasCoApplicant'],
              message: 'A co-applicant is mandatory for this loan type and amount' });
          }
        });
      }
      return step6Schema; // co-applicant is optional

    case 7: {
      // PAN verified in Step 3? → PAN card upload becomes optional
      if (step3.panVerified) {
        return step7Schema.omit({ panCard: true }).extend({ panCard: z.any().optional() });
      }
      return step7Schema.extend({
        panCard: z.any().refine(f => f != null, { message: 'PAN card required (not digitally verified)' }),
      });
    }
  }
}
```

### `z.discriminatedUnion` for Employment (Step 5)

Step 5 uses Zod's `discriminatedUnion` to select the correct sub-schema based on the `employmentType` field value, eliminating all `.optional()` workarounds:

```js
export const step5Schema = z.discriminatedUnion('employmentType', [
  z.object({ employmentType: z.literal('salaried'),       ...salariedFields }),
  z.object({ employmentType: z.literal('self_employed'),  ...selfEmployedFields }),
  z.object({ employmentType: z.literal('business_owner'), ...businessOwnerFields }),
]);
```

**Why `discriminatedUnion` over `union`?**

Zod's `z.union()` attempts each schema in sequence and returns errors from **all** branches if none match — producing confusing, multi-branch error messages. `z.discriminatedUnion()` uses the literal discriminant value (`employmentType`) to select exactly one branch before validating, resulting in clean, targeted error messages.

Business-owner specific cross-field rules are enforced via `.superRefine()`:
- GST number format (15-char regex + state code 01–38 range check)
- Annual turnover ≥ ₹1,00,000
- Monthly income ≥ ₹25,000 (higher floor than salaried/self-employed)

---

## 4. State Persistence — Encrypted Auto-Save

### Architecture Overview

```
useAutoSave hook
    │
    ├── setInterval(30_000ms)   ← fires every 30 seconds
    │       │
    │       └── save()
    │               │
    │               ├── getValues()                 ← RHF: reads current field state
    │               ├── JSON.stringify({ data, savedAt, loanType })
    │               ├── encrypt(json, PASSPHRASE)   ← AES-256-GCM
    │               └── localStorage.setItem(key, ciphertext)
    │
    └── on unmount → save()    ← ensures last state is captured on navigation
```

### Encryption: Web Crypto API (AES-256-GCM)

The `encrypt()` / `decrypt()` functions use the **browser's native `window.crypto.subtle`** API — no third-party crypto library required. This avoids bundle bloat and leverages hardware-accelerated encryption where available.

```js
// src/utils/encryption.js

// Key derivation: PBKDF2 with SHA-256, 100,000 iterations
async function deriveKey(passphrase, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encryption: random 12-byte IV prepended to ciphertext
async function encrypt(plaintext, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, encode(plaintext)
  );
  // Store: base64(salt + iv + ciphertext)
  return btoa(concat(salt, iv, new Uint8Array(ciphertext)));
}
```

**Storage key strategy:**

```js
// Key per loan type prevents cross-contamination of drafts
const getDraftKey = (loanType) => `lendswift_draft_${loanType}`;
// e.g., "lendswift_draft_personal", "lendswift_draft_home"
```

### 72-Hour TTL

On page load, `WizardContainer` iterates all known draft keys, decrypts each, and checks the `savedAt` timestamp:

```js
const TTL_MS = 72 * 60 * 60 * 1000; // 72 hours
if (Date.now() - new Date(parsed.savedAt).getTime() > TTL_MS) {
  localStorage.removeItem(key); // silently expire
  continue;
}
```

If a valid draft is found, a **DraftResumeModal** is displayed with the save timestamp. The user can:
- **Resume** — restores `allFormData` and jumps to the last completed step + 1
- **Start Fresh** — clears the draft and begins at Step 1

### Save Status Indicator

The `AutoSaveIndicator` component in the wizard header renders four states: `idle` → `saving` → `saved` → `error`, with a 3-second auto-reset to `idle` after success. The spinning indicator during `saving` uses a CSS animation (no JS requestAnimationFrame loop) to remain performant during form interaction.

---

## 5. Client-Side Image Compression

### Why Client-Side?

Uploading raw camera photos (typically 3–8 MB JPEGs) to a server adds latency, increases bandwidth costs, and can cause timeouts on slow mobile connections. LendSwift compresses images **before** any upload, entirely in the browser.

### Implementation: Non-Blocking Canvas API

The compression pipeline uses the Canvas API via `HTMLCanvasElement.toBlob()`, which is **asynchronous and non-blocking** — it does not freeze the UI thread.

```
File (original)
    │
    ├── URL.createObjectURL(file)   ← creates Blob URL
    │
    ├── new Image().onload          ← async load (no blocking)
    │       │
    │       └── compressRecursive(img, file, maxWidth=1200, quality=0.7)
    │               │
    │               ├── canvas.drawImage(img, ...)   ← resize to ≤1200px width
    │               │       (maintains aspect ratio)
    │               │
    │               ├── canvas.toBlob(cb, type, quality)  ← async conversion
    │               │
    │               ├── if (blob.size > 2MB && quality > 0.2):
    │               │       quality -= 0.1
    │               │       recurse → compressRecursive(...)
    │               │
    │               └── else: resolve(new File([blob], name, { type }))
    │
    └── URL.revokeObjectURL(url)    ← prevent memory leak
```

**Key implementation details:**

- **Recursive quality reduction** — starts at `0.7`, steps down by `0.1` per pass until `blob.size ≤ 2MB` or `quality = 0.2` (floor)
- **Aspect ratio preservation** — only `width` is clamped to `maxWidth=1200px`; `height` is scaled proportionally
- **Safety timeout** — 400ms fallback resolves with the original file if `img.onload` never fires (e.g., in headless test environments where `URL.createObjectURL` is mocked)
- **PNG → JPEG conversion** — PNGs are converted to JPEG for compression (PNGs with transparency are first composited on a white background via `ctx.fillRect`)
- **Output metadata** — The `FileUpload` component displays both original and compressed size side-by-side using `formatFileSize()` helper

### `useImageCompression` Hook

```js
export function useImageCompression() {
  const [isCompressing, setIsCompressing] = useState(false);

  const compress = useCallback(async (file) => {
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file);
      return { original: file, compressed, ratio: file.size / compressed.size };
    } finally {
      setIsCompressing(false);
    }
  }, []);

  return { compress, isCompressing };
}
```

---

## 6. EMI Financial Engine

### Formula: Reducing-Balance (Diminishing Balance)

```
        P × r × (1 + r)^n
EMI = ————————————————————
          (1 + r)^n − 1

Where:
  P = Principal (loan amount)
  r = Monthly interest rate (annual_rate / 12 / 100)
  n = Number of monthly instalments (tenure in months)
```

**Edge case:** When `r = 0` (theoretically), EMI = P / n (simple division). This guard prevents a division-by-zero error.

### Processing Fee Clamp

```js
const rawFee = P * (config.processingFee / 100);  // 1% of principal
const processingFee = Math.min(25000, Math.max(2000, rawFee));
// Clamped: minimum ₹2,000, maximum ₹25,000
```

### Amortisation Schedule

`calculateEMI()` also generates the first 12 months of the amortisation schedule as a `breakdown[]` array, enabling a future amortisation table component without recalculating.

### Indian Number Formatting

The `formatIndianCurrency()` function implements the Indian numbering system (lakhs/crores) without relying on `Intl.NumberFormat` (which has patchy support for `en-IN` in older browsers):

```js
// "₹1,00,000" not "₹100,000"
const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
```

### Affordability Thresholds (EMI-to-Income Ratio)

| Ratio | Status | Colour |
|-------|--------|--------|
| ≤ 50% | `safe` | Green |
| 51–70% | `warning` | Amber |
| > 70% | `critical` | Red |

When `status !== 'safe'`, a `role="alert"` warning is rendered below the affordability bar in Step 8.

---

## 7. Accessibility Architecture

### Component-Level ARIA Pattern

Every form primitive in `FormComponents.jsx` follows a consistent accessible pattern:

```
<div> (container)
  <label htmlFor={id}>         ← explicit label association
    {label}
    <span aria-label="required">*</span>   ← asterisk announced as "required"
  </label>

  <input
    id={id}
    aria-required={required}
    aria-invalid={!!errorMsg}
    aria-describedby={[errorId, helperId].join(' ')}   ← chains error + helper
  />

  <p id={errorId} role="alert" aria-live="polite">    ← screen reader announces on mount
    {errorMsg}
  </p>
</div>
```

### Focus Management on Step Change

When `currentStep` changes, the `WizardContainer` fires:

```js
useEffect(() => {
  stepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}, [currentStep]);
```

This ensures keyboard users and screen reader users are always positioned at the top of the newly rendered step rather than left at an arbitrary DOM position from the previous step.

### Skip Link

```html
<a href="#main-content" class="skip-link sr-only focus:not-sr-only ...">
  Skip to main content
</a>
```

Hidden by default (`sr-only` = `position: absolute; clip: rect(0,0,0,0)`), revealed when focused via keyboard. This satisfies **WCAG 2.4.1 Bypass Blocks**.

---

## 8. Data Flow Diagram

```
User Input
    │
    ▼
React Hook Form (uncontrolled)
    │
    ├── onChange → Zod resolver → per-field error → aria-live announcement
    │
    └── onSubmit (handleSubmit)
            │
            ├── zodResolver validates full step schema (incl. cross-step rules from schemaFactory)
            │
            ├── SUCCESS → onNext(stepData) → WizardContainer.handleNext()
            │                   │
            │                   ├── allFormData[stepKey] = stepData    (immutable spread)
            │                   ├── completedSteps.push(currentStep)
            │                   └── setCurrentStep(nextStep)           (with skip logic)
            │
            └── FAILURE → formState.errors → each field renders ErrorMessage
                                                       │
                                                       └── role="alert" aria-live="polite"
                                                               → screen reader announces error
```

---

## 9. Security Model

| Threat | Mitigation |
|--------|-----------|
| Draft data exposure in localStorage | AES-256-GCM encryption with PBKDF2 key derivation (100k iterations) |
| Aadhaar number leakage | Masked in UI (`XXXX XXXX 1234`), never sent to any server in this phase |
| PAN number leakage | Masked in Review (`••••••1234`), validated client-side only |
| XSS via file uploads | Files processed via Canvas API; `innerHTML` never used for user data |
| Double-submit attacks | Submit button disabled (`disabled={isSubmitting}`) + `aria-busy` during async op |
| Draft cross-contamination | Separate localStorage keys per loan type (`lendswift_draft_personal`, etc.) |
| Stale draft attacks | 72-hour TTL checked on page load; expired drafts silently removed |

---

> **Document last updated:** October 2024  
> **Maintainer:** Lead Front-End Engineering, LendSwift
