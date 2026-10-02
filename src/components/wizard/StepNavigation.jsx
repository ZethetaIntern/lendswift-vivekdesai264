import React from 'react';

const STEP_LABELS = [
  { id: 1, label: 'Loan Type', icon: '💰' },
  { id: 2, label: 'Personal Info', icon: '👤' },
  { id: 3, label: 'KYC', icon: '🔐' },
  { id: 4, label: 'Address', icon: '🏠' },
  { id: 5, label: 'Employment', icon: '💼' },
  { id: 6, label: 'Co-Applicant', icon: '👥' },
  { id: 7, label: 'Documents', icon: '📄' },
  { id: 8, label: 'Review', icon: '✅' },
];

/**
 * Animated progress bar showing overall completion percentage.
 */
export const ProgressBar = ({ currentStep, totalSteps = 8, skippedSteps = [] }) => {
  const effectiveTotal = totalSteps - skippedSteps.length;
  const effectiveCurrent = currentStep - skippedSteps.filter(s => s < currentStep).length;
  const percentage = Math.min(100, Math.round(((effectiveCurrent - 1) / effectiveTotal) * 100));

  return (
    <div className="w-full" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`Step ${currentStep} of ${totalSteps} — ${percentage}% complete`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs font-bold" style={{ color: '#1F4E79' }}>
          {percentage}% Complete
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
        <div
          className="progress-fill h-full rounded-full"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #1F4E79, #27AE60)',
          }}
        />
      </div>
    </div>
  );
};

/**
 * Step navigation breadcrumb showing all steps with status indicators.
 */
export const StepNavigation = ({ currentStep, completedSteps = [], skippedSteps = [], onStepClick }) => {
  return (
    <nav
      aria-label="Form progress"
      className="hidden md:flex items-start gap-0 overflow-x-auto pb-2"
    >
      {STEP_LABELS.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isSkipped = skippedSteps.includes(step.id);
        const isClickable = isCompleted && onStepClick && !isSkipped;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-[56px]">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${step.id}: ${step.label} — ${isCurrent ? 'current' : isCompleted ? 'completed' : isSkipped ? 'skipped' : 'upcoming'}`}
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                  transition-all duration-300 border-2 relative
                  ${isSkipped ? 'border-slate-200 bg-slate-50 text-slate-300' :
                    isCompleted ? 'border-transparent text-white cursor-pointer hover:scale-110' :
                    isCurrent ? 'border-transparent text-white shadow-lg scale-110' :
                    'border-slate-200 bg-white text-slate-400 cursor-not-allowed'}
                `}
                style={
                  isCompleted ? { background: '#27AE60' } :
                  isCurrent ? { background: '#1F4E79', boxShadow: '0 0 0 4px rgba(31,78,121,0.2)' } :
                  {}
                }
              >
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                ) : isSkipped ? (
                  <span aria-hidden="true">—</span>
                ) : (
                  <span aria-hidden="true">{step.id}</span>
                )}

                {isCurrent && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-25"
                    style={{ background: '#1F4E79' }}
                    aria-hidden="true"
                  />
                )}
              </button>

              <span
                className={`mt-1.5 text-center text-[10px] font-semibold leading-tight max-w-[52px] ${
                  isCurrent ? 'text-slate-800' :
                  isCompleted ? 'text-green-700' :
                  isSkipped ? 'text-slate-300' :
                  'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEP_LABELS.length - 1 && (
              <div
                className="flex-1 h-0.5 mt-4.5 mx-1 min-w-[8px] transition-colors duration-500"
                aria-hidden="true"
                style={{
                  background: isCompleted && !isSkipped ? '#27AE60' : '#E2E8F0',
                  marginTop: '18px',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default StepNavigation;
