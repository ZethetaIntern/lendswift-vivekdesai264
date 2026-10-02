import React, { useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step4Schema } from '../../utils/schemaFactory';
import { Input, Select } from '../common/FormComponents';
import { usePinCodeLookup } from '../../hooks/usePinCodeLookup';

const INDIAN_STATES = [
  'Andaman & Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra & Nagar Haveli', 'Daman & Diu', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
].map(s => ({ value: s, label: s }));

const RESIDENCE_TYPES = [
  { value: 'owned', label: 'Self-Owned' },
  { value: 'rented', label: 'Rented' },
  { value: 'parental', label: 'Parental / Family' },
  { value: 'company_provided', label: 'Company Provided' },
];

/**
 * Sub-form for a single address (permanent or current).
 */
function AddressForm({ prefix, register, errors, control, setValue, watch }) {
  const { lookupPinCode, lookupState } = usePinCodeLookup();
  const pinCode = watch(`${prefix}.pinCode`);
  const residenceType = watch(`${prefix}.residenceType`);
  const state = watch(`${prefix}.state`);

  const handlePinChange = useCallback(async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setValue(`${prefix}.pinCode`, val, { shouldValidate: val.length === 6 });

    if (val.length === 6) {
      const data = await lookupPinCode(val);
      if (data) {
        setValue(`${prefix}.city`, data.city, { shouldValidate: true });
        setValue(`${prefix}.state`, data.state, { shouldValidate: true });
        setValue(`${prefix}.postOffice`, data.postOffice);
      }
    }
  }, [lookupPinCode, prefix, setValue]);

  // Check for state-PIN discrepancy (if user manually changes state after PIN lookup)
  const lookupResult = lookupState.result;
  const hasDiscrepancy = lookupResult && state && lookupResult.state !== state;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Address Line 1 */}
      <div className="sm:col-span-2">
        <Input
          id={`${prefix}-address1`}
          label="Address Line 1"
          required
          placeholder="Flat/House No., Street, Area"
          error={errors?.[prefix]?.addressLine1}
          {...register(`${prefix}.addressLine1`)}
        />
      </div>

      {/* Address Line 2 */}
      <div className="sm:col-span-2">
        <Input
          id={`${prefix}-address2`}
          label="Address Line 2"
          placeholder="Landmark, Colony (optional)"
          error={errors?.[prefix]?.addressLine2}
          {...register(`${prefix}.addressLine2`)}
        />
      </div>

      {/* PIN Code */}
      <div className="flex flex-col gap-1">
        <label htmlFor={`${prefix}-pincode`} className="text-sm font-semibold text-slate-700">
          PIN Code <span className="text-red-500" aria-label="required">*</span>
        </label>
        <div className="relative">
          <input
            id={`${prefix}-pincode`}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={watch(`${prefix}.pinCode`) || ''}
            onChange={handlePinChange}
            placeholder="6-digit PIN"
            className={`form-input ${errors?.[prefix]?.pinCode ? 'error' : ''}`}
            aria-required="true"
            aria-invalid={!!errors?.[prefix]?.pinCode}
            aria-describedby={`${prefix}-pincode-status`}
          />
          {lookupState.status === 'loading' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 rounded-full animate-spin-custom" style={{ borderWidth: '2px', borderColor: '#E2E8F0', borderTopColor: '#1F4E79' }} />
            </span>
          )}
          {lookupState.status === 'found' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" aria-hidden="true">✓</span>
          )}
        </div>
        <span id={`${prefix}-pincode-status`} className="sr-only" aria-live="polite">
          {lookupState.status === 'loading' ? 'Looking up PIN code...' :
           lookupState.status === 'found' ? `Found: ${lookupState.result?.city}, ${lookupState.result?.state}` :
           lookupState.status === 'not_found' ? 'PIN code not found' : ''}
        </span>
        {errors?.[prefix]?.pinCode && (
          <p role="alert" aria-live="polite" className="text-sm font-medium" style={{ color: '#E74C3C' }}>
            {errors[prefix].pinCode.message}
          </p>
        )}
      </div>

      {/* City */}
      <Input
        id={`${prefix}-city`}
        label="City"
        required
        placeholder="Auto-filled or type"
        error={errors?.[prefix]?.city}
        {...register(`${prefix}.city`)}
      />

      {/* State */}
      <Controller
        name={`${prefix}.state`}
        control={control}
        render={({ field }) => (
          <Select
            id={`${prefix}-state`}
            label="State"
            required
            placeholder="Select state"
            options={INDIAN_STATES}
            error={errors?.[prefix]?.state}
            value={field.value || ''}
            onChange={(e) => field.onChange(e.target.value)}
          />
        )}
      />

      {/* Post Office */}
      <Input
        id={`${prefix}-postoffice`}
        label="Post Office"
        placeholder="Auto-filled"
        error={errors?.[prefix]?.postOffice}
        {...register(`${prefix}.postOffice`)}
      />

      {/* State-PIN discrepancy warning */}
      {hasDiscrepancy && (
        <div
          className="sm:col-span-2 flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium"
          role="alert"
          aria-live="polite"
          style={{ background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.3)', color: '#b7770d' }}
        >
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          Warning: PIN code {pinCode} corresponds to {lookupResult.state}, but you selected {state}. Please verify.
        </div>
      )}

      {/* Years at address */}
      <Input
        id={`${prefix}-years`}
        label="Years at this Address"
        type="number"
        min="0"
        max="100"
        required
        placeholder="e.g. 3"
        error={errors?.[prefix]?.yearsAtAddress}
        {...register(`${prefix}.yearsAtAddress`, { valueAsNumber: true })}
      />

      {/* Residence Type */}
      <Controller
        name={`${prefix}.residenceType`}
        control={control}
        render={({ field }) => (
          <Select
            id={`${prefix}-residence-type`}
            label="Residence Type"
            required
            placeholder="Select type"
            options={RESIDENCE_TYPES}
            error={errors?.[prefix]?.residenceType}
            value={field.value || ''}
            onChange={(e) => field.onChange(e.target.value)}
          />
        )}
      />

      {/* Rent amount (conditional) */}
      {residenceType === 'rented' && (
        <Input
          id={`${prefix}-rent`}
          label="Monthly Rent (₹)"
          type="number"
          min="0"
          required
          placeholder="Monthly rent amount"
          error={errors?.[prefix]?.rentAmount}
          {...register(`${prefix}.rentAmount`, { valueAsNumber: true })}
        />
      )}
    </div>
  );
}

/**
 * Step 4: Address — permanent and current (with same-as toggle), PIN code auto-fill, residence type.
 */
const Step4Address = ({ onNext, onBack, allFormData }) => {
  const existingData = allFormData.step4 || {};

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      permanentAddress: existingData.permanentAddress || { yearsAtAddress: 0 },
      sameAsPermanent: existingData.sameAsPermanent ?? false,
      currentAddress: existingData.currentAddress || { yearsAtAddress: 0 },
    },
    mode: 'onChange',
  });

  const sameAsPermanent = watch('sameAsPermanent');
  const permanentAddress = watch('permanentAddress');

  const handleSameToggle = (e) => {
    const checked = e.target.checked;
    setValue('sameAsPermanent', checked);
    if (checked) {
      setValue('currentAddress', { ...permanentAddress });
    }
  };

  const onSubmit = (data) => {
    if (data.sameAsPermanent) {
      data.currentAddress = { ...data.permanentAddress };
    }
    onNext(data);
  };

  return (
    <div className="rounded-2xl shadow-card overflow-hidden bg-white" style={{ boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl" aria-hidden="true">🏠</span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Address Details</h1>
            <p className="text-sm text-slate-500">Permanent and current address information</p>
          </div>
        </div>
      </div>

      <form id="step-4-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="p-6 flex flex-col gap-6">

          {/* Permanent Address */}
          <section aria-label="Permanent Address">
            <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: '#1F4E79' }}>P</span>
              Permanent Address
            </h2>
            <AddressForm
              prefix="permanentAddress"
              register={register}
              errors={errors}
              control={control}
              setValue={setValue}
              watch={watch}
            />
          </section>

          {/* Same as permanent toggle */}
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <input
              type="checkbox"
              id="same-as-permanent"
              className="custom-checkbox"
              checked={sameAsPermanent}
              onChange={handleSameToggle}
              aria-label="Current address is same as permanent address"
            />
            <label htmlFor="same-as-permanent" className="text-sm font-semibold text-slate-700 cursor-pointer">
              Current address is same as permanent address
            </label>
          </div>

          {/* Current Address (conditional) */}
          {!sameAsPermanent && (
            <section aria-label="Current Address" className="animate-fadeInUp">
              <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: '#27AE60' }}>C</span>
                Current Address
              </h2>
              <AddressForm
                prefix="currentAddress"
                register={register}
                errors={errors}
                control={control}
                setValue={setValue}
                watch={watch}
              />
            </section>
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
          <button type="submit" id="step4-next" className="btn-primary">
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

export default Step4Address;
