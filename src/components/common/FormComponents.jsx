import React, { forwardRef } from 'react';

// ─── ErrorMessage ─────────────────────────────────────────────────────────────

/**
 * Accessible error message component.
 * Uses role="alert" and aria-live="polite" for screen reader announcements.
 */
export function ErrorMessage({ id, message, className = '' }) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={`flex items-center gap-1.5 text-sm font-medium mt-1.5 ${className}`}
      style={{ color: '#E74C3C' }}
    >
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="shrink-0"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
      <span>{message}</span>
    </p>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

/**
 * Input component with full accessibility support and react-hook-form compatibility.
 */
export const Input = forwardRef(function Input(
  {
    id,
    label,
    error,
    helperText,
    required,
    className = '',
    labelClassName = '',
    inputClassName = '',
    containerClassName = '',
    prefix,
    suffix,
    ...props
  },
  ref
) {
  const errorMsg = error?.message || (typeof error === 'string' ? error : null);
  const errorId = errorMsg ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className={`text-sm font-semibold text-slate-700 ${labelClassName}`}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-slate-400 text-sm font-medium pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          aria-required={required}
          aria-invalid={!!errorMsg}
          aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
          className={`form-input ${errorMsg ? 'error' : ''} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-10' : ''} ${inputClassName} ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-slate-400 text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>

      {helperText && !errorMsg && (
        <p id={helperId} className="text-xs text-slate-500 mt-0.5">{helperText}</p>
      )}

      <ErrorMessage id={errorId} message={errorMsg} />
    </div>
  );
});

// ─── Select ───────────────────────────────────────────────────────────────────

/**
 * Select dropdown component.
 */
export const Select = forwardRef(function Select(
  {
    id,
    label,
    error,
    helperText,
    required,
    options = [],
    placeholder = 'Select an option',
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const errorMsg = error?.message || (typeof error === 'string' ? error : null);
  const errorId = errorMsg ? `${id}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-required={required}
          aria-invalid={!!errorMsg}
          aria-describedby={errorId}
          className={`form-input appearance-none cursor-pointer pr-8 ${errorMsg ? 'error' : ''} ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </span>
      </div>
      {helperText && !errorMsg && (
        <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>
      )}
      <ErrorMessage id={errorId} message={errorMsg} />
    </div>
  );
});

// ─── RadioGroup ───────────────────────────────────────────────────────────────

/**
 * Accessible radio group component.
 */
export const RadioGroup = forwardRef(function RadioGroup(
  {
    id,
    label,
    error,
    options = [],
    required,
    name,
    value,
    onChange,
    className = '',
    containerClassName = '',
  },
  ref
) {
  const errorMsg = error?.message || (typeof error === 'string' ? error : null);
  const errorId = errorMsg ? `${id}-error` : undefined;

  return (
    <fieldset className={`flex flex-col gap-2 ${containerClassName}`}>
      {label && (
        <legend className="text-sm font-semibold text-slate-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </legend>
      )}
      <div className={`flex flex-wrap gap-3 ${className}`} role="radiogroup" aria-required={required} aria-describedby={errorId}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-2.5 cursor-pointer px-4 py-2.5 rounded-lg border-2 transition-all text-sm font-medium select-none ${
              value === opt.value
                ? 'border-primary bg-blue-50 text-primary'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
            style={value === opt.value ? { borderColor: '#1F4E79', color: '#1F4E79' } : {}}
          >
            <input
              ref={opt.value === options[0]?.value ? ref : undefined}
              type="radio"
              name={name || id}
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => onChange?.(e.target.value)}
              className="sr-only"
              aria-describedby={errorId}
            />
            {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      <ErrorMessage id={errorId} message={errorMsg} />
    </fieldset>
  );
});

// ─── CurrencyInput ────────────────────────────────────────────────────────────

/**
 * Currency input with Indian number formatting.
 */
export const CurrencyInput = forwardRef(function CurrencyInput(
  { id, label, error, helperText, required, onChange, value, ...props },
  ref
) {
  const formatValue = (val) => {
    if (!val && val !== 0) return '';
    const num = typeof val === 'string' ? parseFloat(val.replace(/[,₹\s]/g, '')) : val;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-IN');
  };

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[,\s]/g, '');
    const num = parseFloat(raw);
    if (raw === '') {
      onChange?.(null);
    } else if (!isNaN(num)) {
      onChange?.(num);
    }
  };

  return (
    <Input
      ref={ref}
      id={id}
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      type="text"
      inputMode="numeric"
      prefix="₹"
      value={value != null ? formatValue(value) : ''}
      onChange={handleChange}
      placeholder="0"
      {...props}
    />
  );
});

// ─── MaskedInput ──────────────────────────────────────────────────────────────

/**
 * Masked input that shows only last N characters.
 * Used for PAN and Aadhaar display.
 */
export const MaskedInput = forwardRef(function MaskedInput(
  {
    id,
    label,
    error,
    helperText,
    required,
    maskChar = '•',
    visibleChars = 4,
    value,
    onChange,
    onBlur,
    maxLength,
    ...props
  },
  ref
) {
  const [isFocused, setIsFocused] = React.useState(false);

  const displayValue = isFocused
    ? value || ''
    : value
      ? maskChar.repeat(Math.max(0, (value || '').length - visibleChars)) +
        (value || '').slice(-visibleChars)
      : '';

  return (
    <Input
      ref={ref}
      id={id}
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      value={isFocused ? (value || '') : displayValue}
      onChange={onChange}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        setIsFocused(false);
        onBlur?.(e);
      }}
      maxLength={maxLength}
      autoComplete="off"
      spellCheck={false}
      {...props}
    />
  );
});

// ─── Checkbox ─────────────────────────────────────────────────────────────────

/**
 * Checkbox component with accessible label and error.
 */
export const Checkbox = forwardRef(function Checkbox(
  { id, label, error, description, required, className = '', ...props },
  ref
) {
  const errorMsg = error?.message || (typeof error === 'string' ? error : null);
  const errorId = errorMsg ? `${id}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className="custom-checkbox mt-0.5 shrink-0"
          aria-required={required}
          aria-invalid={!!errorMsg}
          aria-describedby={
            [description ? `${id}-desc` : null, errorId].filter(Boolean).join(' ') || undefined
          }
          {...props}
        />
        <div className="flex flex-col gap-0.5">
          <label htmlFor={id} className="text-sm font-medium text-slate-700 cursor-pointer leading-snug">
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
          {description && (
            <p id={`${id}-desc`} className="text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
      <ErrorMessage id={errorId} message={errorMsg} />
    </div>
  );
});

export default ErrorMessage;
