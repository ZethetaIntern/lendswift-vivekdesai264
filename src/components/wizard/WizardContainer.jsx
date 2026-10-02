import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProgressBar, StepNavigation } from './StepNavigation';
import { useAutoSave } from '../../hooks/useAutoSave';
import { schemaFactory } from '../../utils/schemaFactory';
import { decrypt, DRAFT_PASSPHRASE } from '../../utils/encryption';

// ── Code-split: all 8 steps are lazy-loaded on demand.
// This keeps the initial bundle < 300KB and ensures FCP < 2.5s.
const Step1LoanType     = lazy(() => import('../steps/Step1LoanType'));
const Step2PersonalInfo = lazy(() => import('../steps/Step2PersonalInfo'));
const Step3KYC          = lazy(() => import('../steps/Step3KYC'));
const Step4Address      = lazy(() => import('../steps/Step4Address'));
const Step5Employment   = lazy(() => import('../steps/Step5Employment'));
const Step6CoApplicant  = lazy(() => import('../steps/Step6CoApplicant'));
const Step7Documents    = lazy(() => import('../steps/Step7Documents'));
const Step8Review       = lazy(() => import('../steps/Step8Review'));

const TOTAL_STEPS = 8;

const STEP_COMPONENTS = {
  1: Step1LoanType,
  2: Step2PersonalInfo,
  3: Step3KYC,
  4: Step4Address,
  5: Step5Employment,
  6: Step6CoApplicant,
  7: Step7Documents,
  8: Step8Review,
};

/**
 * Determines if Step 6 (Co-Applicant) should be shown.
 * Rules:
 * - Personal Loan > 5L: required
 * - Home Loan: always required
 * - Business Loan > 20L: required
 */
function shouldShowCoApplicant(step1Data) {
  if (!step1Data?.loanType) return false;
  const { loanType, loanAmount } = step1Data;
  if (loanType === 'personal' && loanAmount > 500000) return true;
  if (loanType === 'home') return true;
  if (loanType === 'business' && loanAmount > 2000000) return true;
  return false;
}

/**
 * Suspense fallback — branded skeleton while a lazy step chunk loads.
 * Uses pure CSS animation so it's completely non-blocking.
 */
function StepSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden bg-white animate-pulse"
      style={{ boxShadow: 'var(--shadow-card)', minHeight: '420px' }}
      aria-label="Loading step content…"
      role="status"
    >
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="h-6 w-40 rounded-lg bg-slate-200 mb-3" />
        <div className="h-4 w-64 rounded bg-slate-100" />
      </div>
      <div className="p-6 flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="h-3.5 w-28 rounded bg-slate-200" />
            <div className="h-10 rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Draft Resume Modal
 */
function DraftResumeModal({ draft, onResume, onStartFresh }) {
  const savedTime = draft.savedAt
    ? new Date(draft.savedAt).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : 'recently';

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="draft-modal-title">
      <div className="modal-card">
        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(31,78,121,0.1)' }}>
          <svg className="w-7 h-7" style={{ color: '#1F4E79' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 3a9 9 0 019 9H13V3zM3 12a9 9 0 0015 6.71L14.29 15A5.001 5.001 0 017 12H3zm17 5.71A9.004 9.004 0 0022 12h-4a5.001 5.001 0 01-8 3.29L13.71 18A9.004 9.004 0 0020 17.71z" />
          </svg>
        </div>
        <h2 id="draft-modal-title" className="text-xl font-bold text-slate-800 mb-2">
          Resume Your Application?
        </h2>
        <p className="text-slate-500 text-sm mb-1">
          We found a saved draft from <strong>{savedTime}</strong>.
        </p>
        <p className="text-slate-400 text-xs mb-6">
          Your progress has been securely saved. Would you like to continue where you left off?
        </p>

        <div className="flex flex-col gap-3">
          <button
            id="btn-resume-draft"
            onClick={onResume}
            className="btn-primary w-full"
            autoFocus
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            Resume Application
          </button>
          <button
            id="btn-start-fresh"
            onClick={onStartFresh}
            className="btn-secondary w-full"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Auto-save status indicator
 */
function AutoSaveIndicator({ status, lastSaved }) {
  if (status === 'saving') {
    return (
      <div className="autosave-indicator">
        <div className="animate-spin-custom w-3 h-3 rounded-full" style={{ borderWidth: '2px', borderColor: '#E2E8F0', borderTopColor: '#1F4E79' }} />
        <span>Saving...</span>
      </div>
    );
  }
  if (status === 'saved') {
    return (
      <div className="autosave-indicator" style={{ color: '#27AE60', background: 'rgba(39,174,96,0.08)', borderColor: 'rgba(39,174,96,0.2)' }}>
        <div className="autosave-dot" style={{ background: '#27AE60' }} />
        <span>Saved</span>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="autosave-indicator" style={{ color: '#E74C3C', background: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.2)' }}>
        <span>Save failed</span>
      </div>
    );
  }
  if (lastSaved) {
    return (
      <div className="autosave-indicator">
        <div className="autosave-dot" />
        <span>Auto-saved</span>
      </div>
    );
  }
  return null;
}

/**
 * Main Wizard Container — manages all 8 steps, cross-step state, navigation, and auto-save.
 */
const WizardContainer = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [allFormData, setAllFormData] = useState({});
  const [direction, setDirection] = useState('forward');
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const stepRef = useRef(null);

  const loanType = allFormData.step1?.loanType;
  const coApplicantRequired = shouldShowCoApplicant(allFormData.step1);

  // Skipped steps (Step 6 when co-applicant not needed)
  const skippedSteps = coApplicantRequired ? [] : [6];

  const schema = schemaFactory(currentStep, allFormData);

  const methods = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: allFormData[`step${currentStep}`] || {},
  });

  const { getValues, reset } = methods;

  // Auto-save hook
  const { saveStatus, lastSaved, clearDraft } = useAutoSave({
    getValues,
    loanType: loanType || 'unknown',
    enabled: currentStep > 1 && currentStep < 8,
  });

  // Check for draft on mount — with full corruption defense
  useEffect(() => {
    const checkDraft = async () => {
      const allDraftKeys = ['personal', 'home', 'business', 'unknown'];
      for (const type of allDraftKeys) {
        const key = `lendswift_draft_${type}`;
        const rawValue = localStorage.getItem(key);
        if (!rawValue) continue;

        try {
          // Step 1: Decrypt (catches: wrong passphrase, tampered ciphertext, truncated base64)
          let decrypted;
          try {
            decrypted = await decrypt(rawValue, DRAFT_PASSPHRASE);
          } catch {
            localStorage.removeItem(key);
            continue;
          }

          // Step 2: JSON parse (catches: truncated writes, manual edits)
          let parsed;
          try {
            parsed = JSON.parse(decrypted);
          } catch {
            localStorage.removeItem(key);
            continue;
          }

          // Step 3: Structural validation (catches: schema changes between app versions)
          if (
            !parsed ||
            typeof parsed !== 'object' ||
            !parsed.savedAt ||
            !parsed.data ||
            typeof parsed.data !== 'object'
          ) {
            localStorage.removeItem(key);
            continue;
          }

          // Step 4: TTL check (72 hours)
          const TTL_MS = 72 * 60 * 60 * 1000;
          if (Date.now() - new Date(parsed.savedAt).getTime() > TTL_MS) {
            localStorage.removeItem(key);
            continue;
          }

          // All checks passed — show resume modal
          setPendingDraft({ ...parsed, key });
          setShowDraftModal(true);
        } catch {
          // Catch-all: silently purge unexpected corrupt entries
          localStorage.removeItem(key);
        }
        break;

      }
    };
    checkDraft();
  }, []);


  // Sync form with step data when navigating
  useEffect(() => {
    const stepKey = `step${currentStep}`;
    reset(allFormData[stepKey] || {});
    // Focus top of step
    if (stepRef.current) {
      stepRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep, reset]); // eslint-disable-line

  const handleResumeDraft = () => {
    if (!pendingDraft?.data) return;
    setAllFormData(pendingDraft.data);
    // Restore to the furthest completed step
    const keys = Object.keys(pendingDraft.data).filter(k => k.startsWith('step'));
    const lastStep = keys.reduce((max, k) => {
      const n = parseInt(k.replace('step', ''));
      return n > max ? n : max;
    }, 1);
    const restoreStep = Math.min(lastStep + 1, TOTAL_STEPS);
    setCurrentStep(restoreStep);
    setCompletedSteps(keys.map(k => parseInt(k.replace('step', ''))).filter(n => n < restoreStep));
    setShowDraftModal(false);
    if (pendingDraft.key) localStorage.removeItem(pendingDraft.key);
  };

  const handleStartFresh = () => {
    if (pendingDraft?.key) localStorage.removeItem(pendingDraft.key);
    setShowDraftModal(false);
    setPendingDraft(null);
  };

  const handleNext = useCallback(async (stepData) => {
    const stepKey = `step${currentStep}`;
    const updated = { ...allFormData, [stepKey]: stepData };
    setAllFormData(updated);
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
    setDirection('forward');

    let nextStep = currentStep + 1;
    // Skip step 6 if co-applicant not required
    if (nextStep === 6 && !shouldShowCoApplicant(updated.step1)) {
      nextStep = 7;
    }

    setCurrentStep(Math.min(nextStep, TOTAL_STEPS));
  }, [currentStep, allFormData]);

  const handleBack = useCallback((targetStep) => {
    setDirection('back');
    if (typeof targetStep === 'number') {
      setCurrentStep(targetStep);
      return;
    }
    let prevStep = currentStep - 1;
    // Skip step 6 if co-applicant not required
    if (prevStep === 6 && !shouldShowCoApplicant(allFormData.step1)) {
      prevStep = 5;
    }
    setCurrentStep(Math.max(1, prevStep));
  }, [currentStep, allFormData.step1]);

  const handleStepClick = useCallback((stepId) => {
    if (completedSteps.includes(stepId)) {
      setDirection(stepId < currentStep ? 'back' : 'forward');
      setCurrentStep(stepId);
    }
  }, [completedSteps, currentStep]);

  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setCompletedSteps([]);
    setAllFormData({});
    clearDraft();
    reset({});
  }, [clearDraft, reset]);

  const CurrentStepComponent = STEP_COMPONENTS[currentStep];

  return (
    <>
      {showDraftModal && pendingDraft && (
        <DraftResumeModal
          draft={pendingDraft}
          onResume={handleResumeDraft}
          onStartFresh={handleStartFresh}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-6" ref={stepRef}>
        {/* Header card */}
        <div
          className="glass rounded-2xl shadow-card p-5 mb-5"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          {/* Top bar: logo + autosave */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1F4E79, #27AE60)' }}
                aria-hidden="true"
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-bold text-slate-800 text-sm">LendSwift</span>
            </div>
            <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
          </div>

          {/* Progress bar */}
          <ProgressBar
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            skippedSteps={skippedSteps}
          />

          {/* Step navigation */}
          <div className="mt-4">
            <StepNavigation
              currentStep={currentStep}
              completedSteps={completedSteps}
              skippedSteps={skippedSteps}
              onStepClick={handleStepClick}
            />
          </div>
        </div>

        {/* Step content — wrapped in Suspense for React.lazy() code-splitting */}
        <FormProvider {...methods}>
          <div
            key={currentStep}
            className={direction === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft'}
          >
            <Suspense fallback={<StepSkeleton />}>
              <CurrentStepComponent
                onNext={handleNext}
                onBack={handleBack}
                isFirstStep={currentStep === 1}
                isLastStep={currentStep === TOTAL_STEPS}
                allFormData={allFormData}
                currentStep={currentStep}
                onReset={handleReset}
                coApplicantRequired={coApplicantRequired}
              />
            </Suspense>
          </div>
        </FormProvider>
      </div>
    </>
  );
};

export default WizardContainer;
