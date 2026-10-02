import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step6Schema } from '../../utils/schemaFactory';
import { Input, Select } from '../common/FormComponents';

const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'business_partner', label: 'Business Partner' },
  { value: 'other', label: 'Other' },
];

const EMPLOYMENT_TYPES = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'retired', label: 'Retired' },
  { value: 'homemaker', label: 'Homemaker' },
  { value: 'student', label: 'Student' },
];

/**
 * Determines co-applicant requirement based on loan type and amount.
 */
function getCoApplicantMessage(step1Data) {
  if (!step1Data) return null;
  const { loanType, loanAmount } = step1Data;

  if (loanType === 'home') {
    return { required: true, reason: 'A co-applicant is mandatory for Home Loans.' };
  }
  if (loanType === 'personal' && loanAmount > 500000) {
    return { required: true, reason: 'A co-applicant is required for Personal Loans above ₹5 Lakhs.' };
  }
  if (loanType === 'business' && loanAmount > 2000000) {
    return { required: true, reason: 'A co-applicant is required for Business Loans above ₹20 Lakhs.' };
  }
  return { required: false, reason: 'Co-applicant is optional for this loan.' };
}

/**
 * Step 6: Co-Applicant — conditional based on loan type and amount.
 */
const Step6CoApplicant = ({ onNext, onBack, allFormData, coApplicantRequired }) => {
  const existingData = allFormData.step6 || {};
  const step1 = allFormData.step1 || {};
  const coApplicantInfo = getCoApplicantMessage(step1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step6Schema),
    defaultValues: {
      hasCoApplicant: existingData.hasCoApplicant ?? coApplicantRequired,
      coApplicant: existingData.coApplicant || {},
    },
    mode: 'onChange',
  });

  const hasCoApplicant = watch('hasCoApplicant');

  const today = new Date();
  const maxDob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];

  const onSubmit = (data) => {
    if (!data.hasCoApplicant) {
      data.coApplicant = undefined;
    }
    onNext(data);
  };

  return (
    <div className="rounded-2xl shadow-card overflow-hidden bg-white" style={{ boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl" aria-hidden="true">👥</span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Co-Applicant Details</h1>
            <p className="text-sm text-slate-500">Adding a co-applicant can improve your eligibility</p>
          </div>
        </div>
      </div>

      <form id="step-6-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="p-6 flex flex-col gap-6">

          {/* Requirement notice */}
          <div
            className="flex items-start gap-3 p-3.5 rounded-xl text-sm"
            role="note"
            style={{
              background: coApplicantRequired ? 'rgba(31,78,121,0.05)' : 'rgba(39,174,96,0.05)',
              border: `1px solid ${coApplicantRequired ? 'rgba(31,78,121,0.15)' : 'rgba(39,174,96,0.15)'}`,
            }}
          >
            <svg
              className="w-5 h-5 mt-0.5 shrink-0"
              style={{ color: coApplicantRequired ? '#1F4E79' : '#27AE60' }}
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <div>
              <p className="font-semibold" style={{ color: coApplicantRequired ? '#1F4E79' : '#27AE60' }}>
                {coApplicantRequired ? 'Co-applicant Required' : 'Co-applicant Optional'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {coApplicantInfo?.reason || ''}
              </p>
            </div>
          </div>

          {/* Toggle (disabled if required) */}
          {!coApplicantRequired && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <input
                type="checkbox"
                id="has-co-applicant"
                className="custom-checkbox"
                checked={hasCoApplicant}
                onChange={(e) => setValue('hasCoApplicant', e.target.checked, { shouldValidate: true })}
                aria-label="Add a co-applicant to this application"
              />
              <div>
                <label htmlFor="has-co-applicant" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Add a co-applicant
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  A co-applicant can increase your loan eligibility and reduce interest rates
                </p>
              </div>
            </div>
          )}

          {/* Co-applicant form */}
          {(hasCoApplicant || coApplicantRequired) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fadeInUp">
              <div className="sm:col-span-2">
                <Input
                  id="co-full-name"
                  label="Co-Applicant Full Name"
                  required
                  placeholder="Full legal name"
                  error={errors.coApplicant?.fullName}
                  {...register('coApplicant.fullName')}
                />
              </div>

              <Controller
                name="coApplicant.relationship"
                control={control}
                render={({ field }) => (
                  <Select
                    id="co-relationship"
                    label="Relationship"
                    required
                    placeholder="Select relationship"
                    options={RELATIONSHIP_OPTIONS}
                    error={errors.coApplicant?.relationship}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />

              <Input
                id="co-dob"
                label="Date of Birth"
                type="date"
                required
                max={maxDob}
                error={errors.coApplicant?.dateOfBirth}
                helperText="Must be at least 18 years old"
                {...register('coApplicant.dateOfBirth')}
              />

              <Input
                id="co-mobile"
                label="Mobile Number"
                type="tel"
                required
                maxLength={10}
                inputMode="numeric"
                placeholder="10-digit mobile"
                prefix="+91"
                error={errors.coApplicant?.mobile}
                {...register('coApplicant.mobile')}
              />

              <Input
                id="co-email"
                label="Email Address"
                type="email"
                placeholder="optional"
                error={errors.coApplicant?.email}
                {...register('coApplicant.email')}
              />

              <Input
                id="co-pan"
                label="PAN Number"
                required
                placeholder="ABCDE1234F"
                inputClassName="uppercase font-mono tracking-widest"
                error={errors.coApplicant?.panNumber}
                helperText="Co-applicant's PAN card"
                {...register('coApplicant.panNumber', {
                  onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
                })}
              />

              <Controller
                name="coApplicant.employmentType"
                control={control}
                render={({ field }) => (
                  <Select
                    id="co-employment-type"
                    label="Employment Type"
                    required
                    placeholder="Select type"
                    options={EMPLOYMENT_TYPES}
                    error={errors.coApplicant?.employmentType}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />

              <Input
                id="co-monthly-income"
                label="Monthly Income (₹)"
                type="number"
                required
                min="0"
                placeholder="Monthly income"
                inputMode="numeric"
                error={errors.coApplicant?.monthlyIncome}
                {...register('coApplicant.monthlyIncome', { valueAsNumber: true })}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button type="button" onClick={onBack} className="btn-secondary">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            Back
          </button>
          <button type="submit" id="step6-next" className="btn-primary">
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

export default Step6CoApplicant;
