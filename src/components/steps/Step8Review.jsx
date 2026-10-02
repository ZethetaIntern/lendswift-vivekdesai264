import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';
import { step8Schema } from '../../utils/schemaFactory';
import { Checkbox } from '../common/FormComponents';
import {
  calculateEMI,
  calculateAffordability,
  formatIndianCurrency,
  LOAN_CONFIG,
} from '../../utils/emiCalculator';

const LOAN_LABELS = { personal: 'Personal Loan', home: 'Home Loan', business: 'Business Loan' };
const EMP_LABELS = { salaried: 'Salaried', self_employed: 'Self-Employed', business_owner: 'Business Owner' };

/* ─── Section renderer ───────────────────────────────────────────────────── */
function ReviewSection({ title, icon, onEdit, stepId, children }) {
  return (
    <div className="review-section mb-4">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(135deg, #F8FAFC, #EFF6FF)', borderBottom: '1px solid #E2E8F0' }}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-base">{icon}</span>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        </div>
        <button
          type="button"
          onClick={() => onEdit(stepId)}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors hover:bg-white"
          style={{ color: '#1F4E79', border: '1px solid rgba(31,78,121,0.2)' }}
          aria-label={`Edit ${title}`}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
          Edit
        </button>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ReviewRow({ label, value, highlight }) {
  return (
    <div className="review-row">
      <span className="review-label">{label}</span>
      <span
        className="review-value"
        style={highlight ? { color: '#1F4E79', fontSize: '1rem' } : {}}
      >
        {value || '—'}
      </span>
    </div>
  );
}

/* ─── Success Modal ──────────────────────────────────────────────────────── */
function SuccessModal({ referenceId, emi, loanType, onReset }) {
  const config = LOAN_CONFIG[loanType] || {};
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="success-modal-title">
      <div className="modal-card">
        {/* Animated check icon */}
        <div
          className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center animate-success-pop"
          style={{ background: 'linear-gradient(135deg, #27AE60, #1e8449)' }}
          aria-hidden="true"
        >
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>

        <h2 id="success-modal-title" className="text-2xl font-extrabold text-slate-800 mb-1">
          Application Submitted! 🎉
        </h2>
        <p className="text-slate-500 text-sm mb-4">
          Your loan application has been received and is under review.
        </p>

        {/* Reference number */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{ background: 'rgba(31,78,121,0.05)', border: '1px solid rgba(31,78,121,0.15)' }}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Application Reference Number
          </p>
          <p
            className="text-lg font-extrabold tracking-wide font-mono"
            style={{ color: '#1F4E79' }}
            aria-label={`Reference number: ${referenceId}`}
          >
            {referenceId}
          </p>
        </div>

        {/* EMI detail */}
        {emi > 0 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-5" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <span className="text-sm text-slate-600">Your EMI</span>
            <span className="text-xl font-extrabold" style={{ color: config.color || '#1F4E79' }}>
              {formatIndianCurrency(emi)}/mo
            </span>
          </div>
        )}

        <p className="text-xs text-slate-400 mb-5">
          Save your reference number. Our team will contact you within 1–2 business days.
        </p>

        <button
          id="submit-new-application"
          onClick={onReset}
          className="btn-primary w-full"
          autoFocus
        >
          Start New Application
        </button>
      </div>
    </div>
  );
}

/* ─── Step 8: Review & Submit ────────────────────────────────────────────── */
const Step8Review = ({ onBack, allFormData, onReset }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const step1 = allFormData.step1 || {};
  const step2 = allFormData.step2 || {};
  const step3 = allFormData.step3 || {};
  const step4 = allFormData.step4 || {};
  const step5 = allFormData.step5 || {};
  const step6 = allFormData.step6 || {};

  const loanType = step1.loanType;
  const config = loanType ? LOAN_CONFIG[loanType] : null;

  // EMI calculation
  const emiData = (loanType && step1.loanAmount && step1.tenure)
    ? calculateEMI(step1.loanAmount, step1.tenure, loanType)
    : null;

  // Affordability
  const monthlyIncome = step5.monthlyIncome || 0;
  const affordability = emiData
    ? calculateAffordability(emiData.emi, monthlyIncome)
    : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step8Schema),
    mode: 'onChange',
  });

  const onSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const ref = `LS-${uuidv4().toUpperCase().slice(0, 8)}`;
    setReferenceId(ref);
    setShowSuccess(true);
    setIsSubmitting(false);
  };

  const addr = step4.permanentAddress;

  return (
    <>
      {showSuccess && (
        <SuccessModal
          referenceId={referenceId}
          emi={emiData?.emi || 0}
          loanType={loanType}
          onReset={onReset}
        />
      )}

      <div className="rounded-2xl shadow-card overflow-hidden bg-white" style={{ boxShadow: 'var(--shadow-card)' }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl" aria-hidden="true">✅</span>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Review & Submit</h1>
              <p className="text-sm text-slate-500">
                Please review all details carefully before submitting
              </p>
            </div>
          </div>
        </div>

        <form id="step-8-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="p-6 flex flex-col gap-2">

            {/* ── Loan Details ── */}
            <ReviewSection title="Loan Details" icon="💰" onEdit={() => onBack(1)} stepId={1}>
              <ReviewRow label="Loan Type" value={LOAN_LABELS[loanType] || loanType} />
              <ReviewRow
                label="Loan Amount"
                value={formatIndianCurrency(step1.loanAmount)}
                highlight
              />
              <ReviewRow
                label="Tenure"
                value={`${step1.tenure} months (${Math.round(step1.tenure / 12 * 10) / 10} years)`}
              />
              <ReviewRow label="Purpose" value={step1.purpose} />
              <ReviewRow label="Interest Rate" value={`${config?.rate}% p.a. (reducing balance)`} />
            </ReviewSection>

            {/* ── EMI Summary ── */}
            {emiData && (
              <div
                className="rounded-xl p-4 mb-2"
                style={{
                  background: config ? `linear-gradient(135deg, ${config.color}08, ${config.color}04)` : '#F8FAFC',
                  border: `1px solid ${config?.color || '#E2E8F0'}25`,
                }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-wide mb-3"
                  style={{ color: config?.color || '#1F4E79' }}
                >
                  EMI Breakdown
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {[
                    { label: 'Monthly EMI', value: formatIndianCurrency(emiData.emi), big: true },
                    { label: 'Total Interest', value: formatIndianCurrency(emiData.totalInterest) },
                    { label: 'Processing Fee', value: formatIndianCurrency(emiData.processingFee) },
                    { label: 'Total Cost', value: formatIndianCurrency(emiData.totalCostOfBorrowing) },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-0.5">
                      <p
                        className={`font-extrabold ${item.big ? 'text-xl' : 'text-base'}`}
                        style={{ color: config?.color || '#1F4E79' }}
                      >
                        {item.value}
                      </p>
                      <p className="text-xs text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>

                {/* Affordability bar */}
                {affordability && monthlyIncome > 0 && (
                  <div className="mt-4 pt-3 border-t" style={{ borderColor: `${config?.color || '#E2E8F0'}20` }}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">EMI-to-Income Ratio</span>
                      <span
                        className="font-bold"
                        style={{
                          color: affordability.status === 'safe' ? '#27AE60' :
                                 affordability.status === 'warning' ? '#F39C12' : '#E74C3C',
                        }}
                      >
                        {affordability.percentage}
                      </span>
                    </div>
                    <div className="affordability-bar">
                      <div
                        className="affordability-fill"
                        style={{
                          width: `${Math.min(affordability.ratio * 100, 100)}%`,
                          background: affordability.status === 'safe' ? '#27AE60' :
                                      affordability.status === 'warning' ? '#F39C12' : '#E74C3C',
                        }}
                      />
                    </div>
                    {!affordability.isAffordable && (
                      <p
                        className="text-xs font-medium mt-1.5 flex items-center gap-1"
                        style={{ color: '#E74C3C' }}
                        role="alert"
                        aria-live="polite"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                        </svg>
                        EMI exceeds 50% of income. Approval may require additional documentation.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Personal Info ── */}
            <ReviewSection title="Personal Information" icon="👤" onEdit={() => onBack(2)} stepId={2}>
              <ReviewRow label="Full Name" value={step2.fullName} />
              <ReviewRow label="Date of Birth" value={step2.dateOfBirth} />
              <ReviewRow label="Gender" value={step2.gender && (step2.gender.charAt(0).toUpperCase() + step2.gender.slice(1).replace(/_/g, ' '))} />
              <ReviewRow label="Marital Status" value={step2.maritalStatus && (step2.maritalStatus.charAt(0).toUpperCase() + step2.maritalStatus.slice(1))} />
              <ReviewRow label="Email" value={step2.email} />
              <ReviewRow label="Mobile" value={step2.mobile ? `+91 ${step2.mobile}` : '—'} />
            </ReviewSection>

            {/* ── KYC ── */}
            <ReviewSection title="KYC Verification" icon="🔐" onEdit={() => onBack(3)} stepId={3}>
              <ReviewRow
                label="PAN Number"
                value={step3.panNumber
                  ? `${'•'.repeat(6)}${step3.panNumber.slice(-4)}`
                  : '—'}
              />
              <ReviewRow
                label="PAN Status"
                value={step3.panVerified ? '✓ Digitally Verified' : 'Document Required'}
              />
              <ReviewRow
                label="Aadhaar Number"
                value={step3.aadhaarNumber
                  ? `XXXX XXXX ${step3.aadhaarNumber.slice(-4)}`
                  : '—'}
              />
              <ReviewRow
                label="Aadhaar Status"
                value={step3.aadhaarVerified ? '✓ OTP Verified' : 'Pending Verification'}
              />
            </ReviewSection>

            {/* ── Address ── */}
            <ReviewSection title="Address" icon="🏠" onEdit={() => onBack(4)} stepId={4}>
              {addr && (
                <>
                  <ReviewRow
                    label="Permanent Address"
                    value={[addr.addressLine1, addr.city, addr.state, addr.pinCode]
                      .filter(Boolean).join(', ')}
                  />
                  <ReviewRow label="Residence Type" value={addr.residenceType?.replace(/_/g, ' ')} />
                  {step4.sameAsPermanent && (
                    <ReviewRow label="Current Address" value="Same as permanent" />
                  )}
                </>
              )}
            </ReviewSection>

            {/* ── Employment ── */}
            <ReviewSection title="Employment & Income" icon="💼" onEdit={() => onBack(5)} stepId={5}>
              <ReviewRow label="Employment Type" value={EMP_LABELS[step5.employmentType] || step5.employmentType} />
              <ReviewRow
                label={step5.employmentType === 'salaried' ? 'Employer' : 'Business Name'}
                value={step5.employerName || step5.businessName || '—'}
              />
              <ReviewRow
                label="Monthly Income"
                value={step5.monthlyIncome ? formatIndianCurrency(step5.monthlyIncome) : '—'}
                highlight
              />
              {step5.gstNumber && <ReviewRow label="GST Number" value={step5.gstNumber} />}
            </ReviewSection>

            {/* ── Co-Applicant ── */}
            {step6.hasCoApplicant && step6.coApplicant && (
              <ReviewSection title="Co-Applicant" icon="👥" onEdit={() => onBack(6)} stepId={6}>
                <ReviewRow label="Name" value={step6.coApplicant.fullName} />
                <ReviewRow label="Relationship" value={step6.coApplicant.relationship} />
                <ReviewRow
                  label="Monthly Income"
                  value={step6.coApplicant.monthlyIncome
                    ? formatIndianCurrency(step6.coApplicant.monthlyIncome)
                    : '—'}
                />
              </ReviewSection>
            )}

            {/* ── Documents ── */}
            <ReviewSection title="Documents" icon="📄" onEdit={() => onBack(7)} stepId={7}>
              <ReviewRow label="Aadhaar Card" value="✓ Uploaded" />
              <ReviewRow label="Address Proof" value="✓ Uploaded" />
              <ReviewRow label="E-Signature" value="✓ Captured" />
            </ReviewSection>

            {/* ── Mandatory Regulatory Consents ── */}
            <div
              className="rounded-xl p-5 mt-4"
              style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}
            >
              <h2 className="text-sm font-bold text-orange-800 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                Regulatory Declarations (Required)
              </h2>

              <div className="flex flex-col gap-4">
                <Checkbox
                  id="consent-accuracy"
                  label="I declare that all information and documents provided are accurate, complete, and genuine."
                  description="False information may lead to application rejection or legal action."
                  required
                  error={errors.consentAccuracy}
                  {...register('consentAccuracy')}
                />

                <Checkbox
                  id="consent-credit-check"
                  label="I authorise LendSwift to perform credit bureau checks (CIBIL, Experian, CRIF) on my profile."
                  description="A soft enquiry will be performed at this stage."
                  required
                  error={errors.consentCreditCheck}
                  {...register('consentCreditCheck')}
                />

                <Checkbox
                  id="consent-terms"
                  label="I have read and agree to the Terms & Conditions of LendSwift."
                  required
                  error={errors.consentTerms}
                  {...register('consentTerms')}
                />

                <Checkbox
                  id="consent-privacy"
                  label="I have read and agree to the Privacy Policy and consent to data processing under DPDPA 2023."
                  required
                  error={errors.consentPrivacy}
                  {...register('consentPrivacy')}
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <button type="button" onClick={onBack} className="btn-secondary">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
              Back
            </button>
            <button
              type="submit"
              id="step8-submit"
              className="btn-primary"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div
                    className="w-4 h-4 rounded-full animate-spin-custom"
                    style={{ borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}
                    aria-hidden="true"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                  </svg>
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Step8Review;
