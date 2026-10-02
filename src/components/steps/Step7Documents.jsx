import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step7Schema } from '../../utils/schemaFactory';
import FileUpload from '../common/FileUpload';
import SignatureCanvasComponent from '../common/SignatureCanvas';

/**
 * Returns the required documents based on loan type and employment type.
 */
function getRequiredDocuments(loanType, employmentType, panVerified) {
  const docs = {
    identity: [
      { id: 'aadhaarFront', label: 'Aadhaar Card (Front)', required: true },
      { id: 'aadhaarBack', label: 'Aadhaar Card (Back)', required: true },
      {
        id: 'panCard',
        label: 'PAN Card',
        required: !panVerified,
        note: panVerified ? '(Optional — digitally verified)' : '(Required)',
      },
    ],
    photo: [
      { id: 'applicantPhoto', label: 'Recent Passport-size Photo', required: true },
    ],
    address: [
      {
        id: 'addressProof',
        label: 'Address Proof',
        required: true,
        helperText: 'Utility bill, bank statement, or rental agreement (last 3 months)',
      },
    ],
    income: getIncomeDocuments(loanType, employmentType),
    property: getPropertyDocuments(loanType),
  };

  return docs;
}

function getIncomeDocuments(loanType, employmentType) {
  if (employmentType === 'salaried') {
    return [
      { id: 'salarySlip', label: 'Salary Slips (last 3 months)', required: true },
      { id: 'bankStatement', label: 'Bank Statement (last 6 months)', required: true },
      { id: 'form16', label: 'Form 16 / ITR', required: loanType === 'home' },
    ];
  }
  if (employmentType === 'self_employed') {
    return [
      { id: 'itrReturn', label: 'ITR (last 2 years)', required: true },
      { id: 'bankStatement', label: 'Bank Statement (last 6 months)', required: true },
      { id: 'profitLoss', label: 'Profit & Loss Statement', required: loanType !== 'personal' },
    ];
  }
  if (employmentType === 'business_owner') {
    return [
      { id: 'itrReturn', label: 'ITR + CA Certified P&L (last 2 years)', required: true },
      { id: 'bankStatement', label: 'Business Bank Statement (last 12 months)', required: true },
      { id: 'gstReturns', label: 'GST Returns (last 4 quarters)', required: true },
      { id: 'businessLicense', label: 'Business License / Registration', required: true },
    ];
  }
  return [{ id: 'incomeProof', label: 'Income Proof', required: true }];
}

function getPropertyDocuments(loanType) {
  if (loanType === 'home') {
    return [
      { id: 'propertyDeed', label: 'Property Sale Agreement / Title Deed', required: true },
      { id: 'buildingApproval', label: 'Building Plan Approval', required: false },
      { id: 'nocBuilder', label: 'NOC from Builder / Society', required: false },
    ];
  }
  return [];
}

/**
 * Step 7: Document Upload & E-Signature
 */
const Step7Documents = ({ onNext, onBack, allFormData }) => {
  const existingData = allFormData.step7 || {};
  const loanType = allFormData.step1?.loanType;
  const employmentType = allFormData.step5?.employmentType;
  const panVerified = allFormData.step3?.panVerified;

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step7Schema),
    defaultValues: existingData,
    mode: 'onChange',
  });

  const docs = getRequiredDocuments(loanType, employmentType, panVerified);

  const onSubmit = (data) => {
    onNext(data);
  };

  const renderDocumentGroup = (title, docList, icon) => (
    <section aria-label={title} key={title}>
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {docList.map((doc) => (
          <div key={doc.id}>
            <Controller
              name={doc.id}
              control={control}
              defaultValue={existingData[doc.id] || null}
              render={({ field }) => (
                <FileUpload
                  id={`doc-${doc.id}`}
                  label={doc.label + (doc.note ? ` ${doc.note}` : '')}
                  required={doc.required}
                  error={errors[doc.id]}
                  helperText={doc.helperText}
                  value={field.value}
                  onChange={(file) => {
                    field.onChange(file);
                    setValue(doc.id, file, { shouldValidate: true });
                  }}
                  accept={{
                    'image/jpeg': ['.jpg', '.jpeg'],
                    'image/png': ['.png'],
                    'application/pdf': ['.pdf'],
                  }}
                  maxSize={5 * 1024 * 1024}
                  compress={true}
                />
              )}
            />
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="rounded-2xl shadow-card overflow-hidden bg-white" style={{ boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl" aria-hidden="true">📄</span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Documents & Signature</h1>
            <p className="text-sm text-slate-500">Upload supporting documents and provide your e-signature</p>
          </div>
        </div>
      </div>

      <form id="step-7-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="p-6 flex flex-col gap-8">

          {/* Upload notice */}
          <div
            className="flex items-start gap-3 p-3 rounded-xl text-sm"
            role="note"
            style={{ background: 'rgba(31,78,121,0.04)', border: '1px solid rgba(31,78,121,0.12)' }}
          >
            <svg className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#1F4E79' }} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <div>
              <p className="font-semibold" style={{ color: '#1F4E79' }}>Upload Guidelines</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Accepted: JPEG, PNG, PDF · Max 5MB per file · Images auto-compressed to 1200px max width
              </p>
            </div>
          </div>

          {/* Identity Documents */}
          {renderDocumentGroup('Identity Documents', docs.identity, '🪪')}

          {/* Photograph */}
          {renderDocumentGroup('Applicant Photograph', docs.photo, '📷')}

          {/* Address Proof */}
          {renderDocumentGroup('Address Proof', docs.address, '🏠')}

          {/* Income Documents */}
          {docs.income.length > 0 && renderDocumentGroup('Income Documents', docs.income, '💰')}

          {/* Property Documents (Home Loan) */}
          {docs.property.length > 0 && renderDocumentGroup('Property Documents', docs.property, '🏗️')}

          {/* E-Signature */}
          <section aria-label="E-Signature">
            <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span aria-hidden="true">✍️</span>
              Electronic Signature
            </h2>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
              <Controller
                name="eSignature"
                control={control}
                defaultValue={existingData.eSignature || null}
                render={({ field }) => (
                  <SignatureCanvasComponent
                    id="e-signature"
                    label="Sign here"
                    required
                    error={errors.eSignature}
                    value={field.value}
                    onChange={(dataUrl) => {
                      field.onChange(dataUrl || '');
                      setValue('eSignature', dataUrl || '', { shouldValidate: true });
                    }}
                  />
                )}
              />
              <p className="text-xs text-slate-400 mt-2">
                By signing above, you confirm all uploaded documents are genuine and the information provided is accurate.
              </p>
            </div>
          </section>
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button type="button" onClick={onBack} className="btn-secondary">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
            Back
          </button>
          <button type="submit" id="step7-next" className="btn-primary">
            Review Application
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step7Documents;
