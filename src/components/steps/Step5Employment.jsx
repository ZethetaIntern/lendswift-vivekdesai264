import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step5Schema } from '../../utils/schemaFactory';
import { Input, Select } from '../common/FormComponents';
import { calculateEMI } from '../../utils/emiCalculator';

const EMPLOYMENT_TYPES = [
  { value: 'salaried', label: '💼 Salaried', description: 'Working for an employer' },
  { value: 'self_employed', label: '🧑‍💼 Self-Employed', description: 'Freelancer, professional, consultant' },
  { value: 'business_owner', label: '🏭 Business Owner', description: 'Own a registered business' },
];

const COMPANY_TYPES = [
  { value: 'government', label: 'Government / PSU' },
  { value: 'psu', label: 'Public Sector Undertaking' },
  { value: 'private_listed', label: 'Private Listed Company' },
  { value: 'private_unlisted', label: 'Private Unlisted Company' },
  { value: 'mnc', label: 'MNC / Multinational' },
];

const BUSINESS_TYPES = [
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'pvt_ltd', label: 'Private Limited (Pvt. Ltd.)' },
  { value: 'llp', label: 'LLP' },
  { value: 'public_limited', label: 'Public Limited' },
];

const SALARY_CREDIT_MODES = [
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
];

/**
 * Step 5: Employment & Income — uses discriminated union for 3 employment types.
 */
const Step5Employment = ({ onNext, onBack, allFormData }) => {
  const existingData = allFormData.step5 || {};
  const [empType, setEmpType] = useState(existingData.employmentType || '');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(step5Schema),
    defaultValues: existingData.employmentType ? existingData : {},
    mode: 'onChange',
  });

  /**
   * Stale-data defense: whenever empType changes, immediately wipe ALL registered
   * fields from the previous employment type. This prevents background data leakage
   * where a user fills Salaried fields, switches to Self-Employed, and the hidden
   * salaried values (employerName, designation, etc.) still exist in form state.
   *
   * `reset({ employmentType: type })` is the canonical RHF way to clear all
   * registered fields atomically while preserving the new discriminant value.
   */
  useEffect(() => {
    if (empType) {
      reset({ employmentType: empType });
    }
  }, [empType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEmpTypeChange = (type) => {
    setEmpType(type);
    // Note: reset is handled by the useEffect above to guarantee it runs
    // after the React render cycle, ensuring all field refs are cleared.
    setValue('employmentType', type, { shouldValidate: false });
  };

  const onSubmit = (data) => {
    onNext(data);
  };

  const loanType = allFormData.step1?.loanType;
  const monthlyIncome = watch('monthlyIncome');
  const [emi, setEmi] = useState(0);

  useEffect(() => {
    if (allFormData.step1?.loanAmount && allFormData.step1?.tenure && loanType) {
      try {
        const result = calculateEMI(allFormData.step1.loanAmount, allFormData.step1.tenure, loanType);
        setEmi(result.emi);
      } catch { setEmi(0); }
    }
  }, [allFormData.step1, loanType]);

  const ratio = monthlyIncome && emi ? emi / monthlyIncome : 0;
  const isAffordable = ratio <= 0.5;

  return (
    <div className="rounded-2xl shadow-card overflow-hidden bg-white" style={{ boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl" aria-hidden="true">💼</span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Employment & Income</h1>
            <p className="text-sm text-slate-500">Your employment and income details</p>
          </div>
        </div>
      </div>

      <form id="step-5-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="p-6 flex flex-col gap-6">

          {/* Employment type selection */}
          <fieldset>
            <legend className="text-sm font-bold text-slate-700 mb-3">
              Employment Type <span className="text-red-500" aria-label="required">*</span>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Select employment type">
              {EMPLOYMENT_TYPES.map((type) => {
                const isSelected = empType === type.value;
                return (
                  <label
                    key={type.value}
                    className={`flex flex-col gap-1 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    style={isSelected ? { borderColor: '#1F4E79', background: 'rgba(31,78,121,0.05)' } : {}}
                  >
                    <input
                      type="radio"
                      name="employmentType"
                      value={type.value}
                      checked={empType === type.value}
                      onChange={() => handleEmpTypeChange(type.value)}
                      className="sr-only"
                    />
                    <span className="text-base font-semibold text-slate-800">{type.label}</span>
                    <span className="text-xs text-slate-500">{type.description}</span>
                  </label>
                );
              })}
            </div>
            {!empType && (
              <p className="text-xs text-slate-400 mt-2">Please select your employment type to continue</p>
            )}
          </fieldset>

          {/* Dynamic sub-form based on employment type */}
          {empType === 'salaried' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fadeInUp">
              <Input
                id="employer-name"
                label="Employer Name"
                required
                placeholder="Company name"
                error={errors.employerName}
                {...register('employerName')}
              />
              <Input
                id="designation"
                label="Designation / Job Title"
                required
                placeholder="e.g. Software Engineer"
                error={errors.designation}
                {...register('designation')}
              />
              <Input
                id="employment-since"
                label="Employed Since"
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                error={errors.employmentSince}
                helperText="Date you started this job"
                {...register('employmentSince')}
              />
              <Controller
                name="companyType"
                control={control}
                render={({ field }) => (
                  <Select
                    id="company-type"
                    label="Company Type"
                    required
                    placeholder="Select company type"
                    options={COMPANY_TYPES}
                    error={errors.companyType}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
              <Input
                id="monthly-income-salaried"
                label="Monthly Net Income (₹)"
                type="number"
                required
                min="10000"
                placeholder="Take-home salary"
                inputMode="numeric"
                error={errors.monthlyIncome}
                helperText="Minimum ₹10,000"
                {...register('monthlyIncome', { valueAsNumber: true })}
              />
              <Controller
                name="salaryAccount"
                control={control}
                render={({ field }) => (
                  <Select
                    id="salary-account"
                    label="Salary Credit Mode"
                    required
                    placeholder="Select mode"
                    options={SALARY_CREDIT_MODES}
                    error={errors.salaryAccount}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
            </div>
          )}

          {empType === 'self_employed' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fadeInUp">
              <div className="sm:col-span-2">
                <Input
                  id="business-name-se"
                  label="Business / Practice Name"
                  required
                  placeholder="e.g. Dr. Sharma's Clinic"
                  error={errors.businessName}
                  {...register('businessName')}
                />
              </div>
              <Input
                id="profession-type"
                label="Profession / Business Type"
                required
                placeholder="e.g. Doctor, Chartered Accountant"
                error={errors.profession}
                {...register('profession')}
              />
              <Input
                id="business-since-se"
                label="In Business Since"
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                error={errors.businessSince}
                {...register('businessSince')}
              />
              <Input
                id="monthly-income-se"
                label="Monthly Income (₹)"
                type="number"
                required
                min="15000"
                placeholder="Average monthly income"
                inputMode="numeric"
                error={errors.monthlyIncome}
                helperText="Minimum ₹15,000"
                {...register('monthlyIncome', { valueAsNumber: true })}
              />
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="itr-filed"
                  className="custom-checkbox"
                  {...register('itrFiled')}
                />
                <label htmlFor="itr-filed" className="text-sm text-slate-700 cursor-pointer">
                  Filed ITR in last 2 years
                </label>
              </div>
            </div>
          )}

          {empType === 'business_owner' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fadeInUp">
              <div className="sm:col-span-2">
                <Input
                  id="business-name-bo"
                  label="Business Name"
                  required
                  placeholder="Registered business name"
                  error={errors.businessName}
                  {...register('businessName')}
                />
              </div>
              <Controller
                name="businessType"
                control={control}
                render={({ field }) => (
                  <Select
                    id="business-type"
                    label="Business Structure"
                    required
                    placeholder="Select type"
                    options={BUSINESS_TYPES}
                    error={errors.businessType}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
              <Input
                id="gst-number"
                label="GST Number"
                required
                placeholder="27AAPFU0939F1ZV"
                inputClassName="uppercase font-mono tracking-wide"
                error={errors.gstNumber}
                helperText="15-character GST identification number"
                {...register('gstNumber', {
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }
                })}
              />
              <Input
                id="business-since-bo"
                label="Business Established Since"
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                error={errors.businessSince}
                {...register('businessSince')}
              />
              <Input
                id="monthly-income-bo"
                label="Monthly Net Income / Draw (₹)"
                type="number"
                required
                min="25000"
                placeholder="Monthly income from business"
                inputMode="numeric"
                error={errors.monthlyIncome}
                helperText="Minimum ₹25,000"
                {...register('monthlyIncome', { valueAsNumber: true })}
              />
              <Input
                id="annual-turnover"
                label="Annual Turnover (₹)"
                type="number"
                required
                min="100000"
                placeholder="Last financial year turnover"
                inputMode="numeric"
                error={errors.annualTurnover}
                helperText="Minimum ₹1 Lakh"
                {...register('annualTurnover', { valueAsNumber: true })}
              />
            </div>
          )}

          {/* Affordability indicator */}
          {empType && monthlyIncome > 0 && emi > 0 && (
            <div className="p-4 rounded-xl animate-fadeInUp" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">EMI Affordability</p>
                <p className={`text-sm font-bold ${isAffordable ? 'text-green-600' : 'text-red-600'}`}>
                  {(ratio * 100).toFixed(1)}% of income
                </p>
              </div>
              <div className="affordability-bar">
                <div
                  className="affordability-fill"
                  style={{
                    width: `${Math.min(ratio * 100, 100)}%`,
                    background: ratio > 0.7 ? '#E74C3C' : ratio > 0.5 ? '#F39C12' : '#27AE60',
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                {isAffordable
                  ? '✓ Within recommended limit (max 50% of income)'
                  : '⚠ EMI exceeds 50% of income — approval may be difficult'}
              </p>
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
          <button type="submit" id="step5-next" className="btn-primary" disabled={!empType}>
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

export default Step5Employment;
