import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step2Schema } from '../../utils/schemaFactory';
import { Input, RadioGroup } from '../common/FormComponents';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

/**
 * Step 2: Personal Information
 * Captures: full name, DOB (21-65 age validation), gender, marital status,
 * email, mobile (Indian 6-9 format), father's and mother's name.
 */
const Step2PersonalInfo = ({ onNext, onBack, allFormData }) => {
  const existingData = allFormData.step2 || {};
  const loanType = allFormData.step1?.loanType;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: existingData,
    mode: 'onChange',
  });

  const gender = watch('gender');
  const maritalStatus = watch('maritalStatus');

  // Cross-step: compute max tenure based on age (65 - current age)
  const dob = watch('dateOfBirth');
  const today = new Date();
  const maxDob = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];
  const minDob = new Date(today.getFullYear() - 65, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];

  const onSubmit = (data) => {
    onNext(data);
  };

  return (
    <div className="rounded-2xl shadow-card overflow-hidden bg-white" style={{ boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl" aria-hidden="true">👤</span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Personal Information</h1>
            <p className="text-sm text-slate-500">Tell us a bit about yourself</p>
          </div>
        </div>
      </div>

      <form id="step-2-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Full Name */}
          <div className="sm:col-span-2">
            <Input
              id="full-name"
              label="Full Name"
              required
              placeholder="As per Aadhaar / PAN card"
              error={errors.fullName}
              helperText="Enter your full legal name (no initials)"
              {...register('fullName')}
            />
          </div>

          {/* Date of Birth */}
          <Input
            id="date-of-birth"
            label="Date of Birth"
            type="date"
            required
            max={maxDob}
            min={minDob}
            error={errors.dateOfBirth}
            helperText="Must be 21–65 years old"
            {...register('dateOfBirth')}
          />

          {/* Gender */}
          <div className="flex flex-col gap-1">
            <RadioGroup
              id="gender"
              label="Gender"
              required
              name="gender"
              value={gender}
              onChange={(val) => setValue('gender', val, { shouldValidate: true })}
              options={GENDER_OPTIONS}
              error={errors.gender}
              className="flex-wrap"
            />
          </div>

          {/* Marital Status */}
          <div className="flex flex-col gap-1">
            <RadioGroup
              id="marital-status"
              label="Marital Status"
              required
              name="maritalStatus"
              value={maritalStatus}
              onChange={(val) => setValue('maritalStatus', val, { shouldValidate: true })}
              options={MARITAL_STATUS_OPTIONS}
              error={errors.maritalStatus}
              className="flex-wrap"
            />
          </div>

          {/* Email */}
          <Input
            id="email"
            label="Email Address"
            type="email"
            required
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
            {...register('email')}
          />

          {/* Mobile */}
          <Input
            id="mobile"
            label="Mobile Number"
            type="tel"
            required
            placeholder="10-digit mobile number"
            autoComplete="tel"
            maxLength={10}
            inputMode="numeric"
            error={errors.mobile}
            helperText="Must start with 6, 7, 8, or 9"
            prefix="+91"
            {...register('mobile')}
          />

          {/* Father's Name */}
          <Input
            id="father-name"
            label="Father's Name"
            required
            placeholder="As per official records"
            error={errors.fatherName}
            {...register('fatherName')}
          />

          {/* Mother's Name */}
          <Input
            id="mother-name"
            label="Mother's Name"
            required
            placeholder="As per official records"
            error={errors.motherName}
            {...register('motherName')}
          />

          {/* Loan type reminder */}
          {loanType && (
            <div className="sm:col-span-2 flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(31,78,121,0.05)', border: '1px solid rgba(31,78,121,0.1)', color: '#1F4E79' }}>
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>
                Applying for a{' '}
                <strong style={{ textTransform: 'capitalize' }}>{loanType} Loan</strong>
                . Maximum tenure depends on your age — up to{' '}
                {dob
                  ? Math.max(0, Math.floor(
                      (new Date(new Date().getFullYear() - 65, new Date().getMonth(), new Date().getDate()) -
                        new Date(dob)) / (1000 * 60 * 60 * 24 * 365)
                    ) + ' years remaining')
                  : '(enter DOB to see)'}
              </span>
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
          <button type="submit" id="step2-next" className="btn-primary">
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

export default Step2PersonalInfo;
