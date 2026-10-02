import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step3Schema } from '../../utils/schemaFactory';
import { MaskedInput, Checkbox } from '../common/FormComponents';
import { useVerification } from '../../hooks/useVerification';

/**
 * Verification status badge component.
 */
function VerificationBadge({ state, onVerify, onReset, isDisabled }) {
  if (state.status === 'loading') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(31,78,121,0.06)', border: '1px solid rgba(31,78,121,0.15)' }}>
        <div
          className="w-4 h-4 rounded-full animate-spin-custom"
          style={{ borderWidth: '2px', borderColor: '#E2E8F0', borderTopColor: '#1F4E79' }}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-slate-600">{state.message}</span>
      </div>
    );
  }

  if (state.status === 'success') {
    return (
      <div className="flex items-center justify-between gap-2">
        <div className="badge-verified animate-scaleIn" role="status" aria-live="polite">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          {state.message}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-slate-600 underline"
          aria-label="Reset verification"
        >
          Reset
        </button>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="badge-error" role="alert" aria-live="assertive">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
          {state.message}
        </div>
        <button
          type="button"
          onClick={onVerify}
          className="btn-accent self-start text-xs py-1 px-2.5"
        >
          Retry
        </button>
      </div>
    );
  }

  // idle
  return (
    <button
      type="button"
      onClick={onVerify}
      disabled={isDisabled}
      className="btn-accent self-start"
      style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
    >
      Verify
    </button>
  );
}

/**
 * Step 3: KYC — PAN and Aadhaar verification with masking and consent checkboxes.
 */
const Step3KYC = ({ onNext, onBack, allFormData }) => {
  const existingData = allFormData.step3 || {};
  const { verifyPAN, verifyAadhaar, panState, aadhaarState, resetPAN, resetAadhaar } = useVerification();

  const [panRawValue, setPanRawValue] = useState(existingData.panNumber || '');
  const [aadhaarRawValue, setAadhaarRawValue] = useState(existingData.aadhaarNumber || '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      panNumber: existingData.panNumber || '',
      aadhaarNumber: existingData.aadhaarNumber || '',
      aadhaarConsent: existingData.aadhaarConsent || false,
      dataConsent: existingData.dataConsent || false,
      panVerified: panState.status === 'success',
      aadhaarVerified: aadhaarState.status === 'success',
    },
    mode: 'onChange',
  });

  const aadhaarConsent = watch('aadhaarConsent');

  const handlePANChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setPanRawValue(val);
    setValue('panNumber', val, { shouldValidate: true });
    if (panState.status !== 'idle') resetPAN();
  };

  const handleAadhaarChange = (e) => {
    // Allow digits and spaces
    const val = e.target.value.replace(/[^\d\s]/g, '').slice(0, 14);
    setAadhaarRawValue(val);
    setValue('aadhaarNumber', val.replace(/\s/g, ''), { shouldValidate: true });
    if (aadhaarState.status !== 'idle') resetAadhaar();
  };

  const handleVerifyPAN = async () => {
    const success = await verifyPAN(panRawValue);
    setValue('panVerified', success, { shouldValidate: false });
  };

  const handleVerifyAadhaar = async () => {
    if (!aadhaarConsent) {
      alert('Please provide Aadhaar consent before verification');
      return;
    }
    const success = await verifyAadhaar(aadhaarRawValue);
    setValue('aadhaarVerified', success, { shouldValidate: false });
  };

  const onSubmit = (data) => {
    onNext({
      ...data,
      panVerified: panState.status === 'success',
      aadhaarVerified: aadhaarState.status === 'success',
    });
  };

  return (
    <div className="rounded-2xl shadow-card overflow-hidden bg-white" style={{ boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl" aria-hidden="true">🔐</span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">KYC Verification</h1>
            <p className="text-sm text-slate-500">Verify your identity documents digitally</p>
          </div>
        </div>
      </div>

      <form id="step-3-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="p-6 flex flex-col gap-6">

          {/* Security notice */}
          <div
            className="flex items-start gap-3 p-3 rounded-xl text-sm"
            style={{ background: 'rgba(39,174,96,0.06)', border: '1px solid rgba(39,174,96,0.2)' }}
            role="note"
          >
            <svg className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#27AE60' }} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
            <div>
              <p className="font-semibold" style={{ color: '#1e8449' }}>Bank-grade security</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Your KYC data is encrypted end-to-end and never stored in plaintext. We comply with RBI data security guidelines.
              </p>
            </div>
          </div>

          {/* PAN Section */}
          <section aria-label="PAN Verification" className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold text-white" style={{ background: '#1F4E79' }}>P</div>
              <div>
                <p className="text-sm font-bold text-slate-800">PAN Card Verification</p>
                <p className="text-xs text-slate-500">Permanent Account Number — 10 characters</p>
              </div>
            </div>

            <MaskedInput
              id="pan-number"
              label="PAN Number"
              required
              placeholder="ABCDE1234F"
              value={panRawValue}
              onChange={handlePANChange}
              onBlur={() => trigger('panNumber')}
              maxLength={10}
              visibleChars={4}
              error={errors.panNumber}
              helperText="Format: AAAAA9999A (4th character indicates entity type)"
              inputClassName="uppercase font-mono tracking-widest"
            />

            <VerificationBadge
              state={panState}
              onVerify={handleVerifyPAN}
              onReset={resetPAN}
              isDisabled={!panRawValue || panRawValue.length < 10}
            />

            {panState.status === 'success' && (
              <div className="text-xs text-slate-500 animate-fadeIn px-1">
                ✓ PAN card upload in Step 7 is now <strong className="text-green-700">optional</strong>
              </div>
            )}
          </section>

          {/* Aadhaar Section */}
          <section aria-label="Aadhaar Verification" className="flex flex-col gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold text-white" style={{ background: '#27AE60' }}>A</div>
              <div>
                <p className="text-sm font-bold text-slate-800">Aadhaar Verification</p>
                <p className="text-xs text-slate-500">12-digit Unique Identity Number — Verhoeff checksum</p>
              </div>
            </div>

            {/* Consent first */}
            <Checkbox
              id="aadhaar-consent"
              label="I consent to Aadhaar-based e-KYC verification"
              description="By checking this, you authorize LendSwift to verify your Aadhaar details with UIDAI for the purpose of KYC."
              required
              error={errors.aadhaarConsent}
              {...register('aadhaarConsent')}
            />

            <MaskedInput
              id="aadhaar-number"
              label="Aadhaar Number"
              required
              placeholder="XXXX XXXX XXXX"
              value={aadhaarRawValue}
              onChange={handleAadhaarChange}
              onBlur={() => trigger('aadhaarNumber')}
              visibleChars={4}
              maxLength={14}
              error={errors.aadhaarNumber}
              helperText="12 digits — validated using Verhoeff checksum algorithm"
              inputMode="numeric"
              inputClassName="font-mono tracking-widest"
            />

            <VerificationBadge
              state={aadhaarState}
              onVerify={handleVerifyAadhaar}
              onReset={resetAadhaar}
              isDisabled={!aadhaarConsent || aadhaarRawValue.replace(/\s/g, '').length < 12}
            />

            {aadhaarState.status === 'success' && aadhaarState.maskedMobile && (
              <div className="text-xs text-slate-500 animate-fadeIn px-1">
                ✓ OTP verified on mobile ending in {aadhaarState.maskedMobile}
              </div>
            )}
          </section>

          {/* Data Processing Consent */}
          <Checkbox
            id="data-consent"
            label="I consent to processing of my personal data for loan evaluation"
            description="LendSwift will process your data as per DPDPA 2023 and RBI guidelines. Read our Privacy Policy."
            required
            error={errors.dataConsent}
            {...register('dataConsent')}
          />
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button type="button" onClick={onBack} className="btn-secondary">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            Back
          </button>
          <button type="submit" id="step3-next" className="btn-primary">
            Continue
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step3KYC;
