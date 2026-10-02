import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step1Schema } from '../../utils/schemaFactory';
import { formatIndianCurrency, getTenureOptions, getLoanPurposes, LOAN_CONFIG, calculateEMI } from '../../utils/emiCalculator';
import { Select } from '../common/FormComponents';
import { ErrorMessage } from '../common/FormComponents';

const LOAN_TYPES = [
  {
    value: 'personal',
    label: 'Personal Loan',
    icon: '👤',
    description: 'Quick funds for personal needs',
    rateLabel: '10.5% p.a.',
    max: '₹10 Lakhs',
    color: '#1F4E79',
    bgColor: 'rgba(31,78,121,0.06)',
  },
  {
    value: 'home',
    label: 'Home Loan',
    icon: '🏠',
    description: 'Finance your dream home',
    rateLabel: '8.5% p.a.',
    max: '₹1 Crore',
    color: '#27AE60',
    bgColor: 'rgba(39,174,96,0.06)',
  },
  {
    value: 'business',
    label: 'Business Loan',
    icon: '💼',
    description: 'Grow your business faster',
    rateLabel: '14% p.a.',
    max: '₹50 Lakhs',
    color: '#F39C12',
    bgColor: 'rgba(243,156,18,0.06)',
  },
];

/**
 * Step 1: Loan Type Selection
 * Handles: loan type, amount (with limits), tenure, and purpose.
 */
const Step1LoanType = ({ onNext, allFormData }) => {
  const existingData = allFormData.step1 || {};

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      loanType: existingData.loanType || '',
      loanAmount: existingData.loanAmount || null,
      tenure: existingData.tenure || null,
      purpose: existingData.purpose || '',
    },
    mode: 'onChange',
  });

  const selectedType = watch('loanType');
  const loanAmount = watch('loanAmount');
  const tenure = watch('tenure');

  const config = selectedType ? LOAN_CONFIG[selectedType] : null;
  const tenureOptions = selectedType ? getTenureOptions(selectedType) : [];
  const purposeOptions = selectedType ? getLoanPurposes(selectedType) : [];

  // EMI preview calculation
  const [emiPreview, setEmiPreview] = useState(null);
  useEffect(() => {
    if (selectedType && loanAmount && tenure) {
      try {
        const result = calculateEMI(loanAmount, tenure, selectedType);
        setEmiPreview(result);
      } catch {
        setEmiPreview(null);
      }
    } else {
      setEmiPreview(null);
    }
  }, [selectedType, loanAmount, tenure]);

  const handleLoanTypeSelect = (type) => {
    setValue('loanType', type, { shouldValidate: true });
    setValue('loanAmount', null, { shouldValidate: false });
    setValue('tenure', null, { shouldValidate: false });
    setValue('purpose', '', { shouldValidate: false });
    setEmiPreview(null);
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[,\s]/g, '');
    const num = parseFloat(raw);
    setValue('loanAmount', isNaN(num) ? null : num, { shouldValidate: true });
  };

  const onSubmit = (data) => {
    onNext(data);
  };

  const amountValue = loanAmount ? loanAmount.toLocaleString('en-IN') : '';

  return (
    <div
      className="rounded-2xl shadow-card overflow-hidden"
      style={{ background: 'white', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Step header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl" aria-hidden="true">💰</span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Choose Your Loan</h1>
            <p className="text-sm text-slate-500">Select the loan type that fits your needs</p>
          </div>
        </div>
      </div>

      <form id="step-1-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="p-6 flex flex-col gap-6">

          {/* Loan type selection */}
          <fieldset>
            <legend className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
              Loan Type <span className="text-red-500" aria-label="required">*</span>
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Select loan type">
              {LOAN_TYPES.map((type) => {
                const isSelected = selectedType === type.value;
                return (
                  <label
                    key={type.value}
                    className={`loan-card cursor-pointer flex flex-col gap-2 ${isSelected ? 'selected' : ''}`}
                    style={isSelected ? { borderColor: type.color, background: type.bgColor } : {}}
                  >
                    <input
                      type="radio"
                      name="loanType"
                      value={type.value}
                      className="sr-only"
                      checked={selectedType === type.value}
                      onChange={() => handleLoanTypeSelect(type.value)}
                      aria-label={`${type.label} — ${type.rateLabel} starting — up to ${type.max}`}
                    />
                    <div className="flex items-start justify-between">
                      <span className="text-2xl" aria-hidden="true">{type.icon}</span>
                      {isSelected && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: type.color }}
                          aria-hidden="true"
                        >
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{type.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold" style={{ color: type.color }}>
                        From {type.rateLabel}
                      </span>
                      <span className="text-xs text-slate-400">Up to {type.max}</span>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.loanType && (
              <ErrorMessage message={errors.loanType.message} id="loanType-error" />
            )}
          </fieldset>

          {/* Loan details (shown after type selection) */}
          {selectedType && config && (
            <div className="flex flex-col gap-5 animate-fadeInUp">
              {/* Amount input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="loan-amount" className="text-sm font-semibold text-slate-700">
                  Loan Amount <span className="text-red-500" aria-label="required">*</span>
                </label>

                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 font-medium text-sm pointer-events-none">₹</span>
                  <input
                    id="loan-amount"
                    type="text"
                    inputMode="numeric"
                    className={`form-input pl-8 ${errors.loanAmount ? 'error' : ''}`}
                    value={amountValue}
                    onChange={handleAmountChange}
                    placeholder="Enter amount"
                    aria-required="true"
                    aria-invalid={!!errors.loanAmount}
                    aria-describedby={errors.loanAmount ? 'loanAmount-error' : 'loanAmount-hint'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p id="loanAmount-hint" className="text-xs text-slate-400">
                    Min: {formatIndianCurrency(config.minAmount)} — Max: {formatIndianCurrency(config.maxAmount)}
                  </p>
                </div>

                {/* Amount slider */}
                <div className="mt-1">
                  <input
                    type="range"
                    aria-label={`Loan amount slider: ${formatIndianCurrency(loanAmount || config.minAmount)}`}
                    min={config.minAmount}
                    max={config.maxAmount}
                    step={selectedType === 'home' ? 100000 : 10000}
                    value={loanAmount || config.minAmount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setValue('loanAmount', val, { shouldValidate: true });
                      e.target.style.setProperty('--val', `${((val - config.minAmount) / (config.maxAmount - config.minAmount)) * 100}%`);
                    }}
                    className="w-full"
                    style={{
                      '--val': loanAmount
                        ? `${((loanAmount - config.minAmount) / (config.maxAmount - config.minAmount)) * 100}%`
                        : '0%',
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{formatIndianCurrency(config.minAmount)}</span>
                    <span>{formatIndianCurrency(config.maxAmount)}</span>
                  </div>
                </div>

                <ErrorMessage id="loanAmount-error" message={errors.loanAmount?.message} />
              </div>

              {/* Tenure */}
              <Select
                id="loan-tenure"
                label="Loan Tenure"
                required
                placeholder="Select tenure"
                options={tenureOptions}
                {...register('tenure', { valueAsNumber: true })}
                error={errors.tenure}
              />

              {/* Purpose */}
              <Select
                id="loan-purpose"
                label="Loan Purpose"
                required
                placeholder="Select purpose"
                options={purposeOptions}
                {...register('purpose')}
                error={errors.purpose}
              />

              {/* EMI Preview */}
              {emiPreview && emiPreview.emi > 0 && (
                <div
                  className="rounded-xl p-4 animate-fadeInUp"
                  style={{
                    background: `linear-gradient(135deg, ${config.color}10, ${config.color}05)`,
                    border: `1px solid ${config.color}20`,
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: config.color }}>
                    EMI Preview
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xl font-extrabold" style={{ color: config.color }}>
                        {formatIndianCurrency(emiPreview.emi)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Monthly EMI</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-slate-700">
                        {formatIndianCurrency(emiPreview.totalInterest)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Total Interest</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-slate-700">
                        {formatIndianCurrency(emiPreview.totalPayable)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Total Payable</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    Rate: {config.rate}% p.a. · Processing fee: {formatIndianCurrency(emiPreview.processingFee)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            id="step1-next"
            className="btn-primary"
            aria-label="Continue to Personal Information"
          >
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

export default Step1LoanType;
