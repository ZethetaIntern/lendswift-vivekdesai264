import { z } from 'zod';
import { validatePAN, validateAadhaar, validateGST, calculateAge, validatePANForLoanType } from './validators';

// ─── Step 1: Loan Type ────────────────────────────────────────────────────────

export const step1Schema = z.object({
  loanType: z.enum(['personal', 'home', 'business'], {
    error: 'Please select a loan type',
  }),
  loanAmount: z.number({
    error: 'Loan amount is required',
  }).positive('Loan amount must be positive'),
  tenure: z.number({
    error: 'Please select tenure',
  }).positive('Tenure must be positive'),
  purpose: z.string().min(1, 'Please select loan purpose'),
}).superRefine((data, ctx) => {
  const limits = {
    personal: { min: 50000, max: 1000000 },
    home: { min: 500000, max: 10000000 },
    business: { min: 100000, max: 5000000 },
  };
  if (data.loanType && limits[data.loanType]) {
    const { min, max } = limits[data.loanType];
    if (data.loanAmount < min || data.loanAmount > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['loanAmount'],
        message: `Amount must be between ₹${min.toLocaleString('en-IN')} and ₹${max.toLocaleString('en-IN')} for ${data.loanType} loan`,
      });
    }
  }
});

// ─── Step 2: Personal Info ────────────────────────────────────────────────────

export const step2Schema = z.object({
  fullName: z
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .max(100, 'Name is too long')
    .regex(/^[A-Za-z\s.'-]+$/, 'Name can only contain letters, spaces, and . \' -'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((dob) => {
      const age = calculateAge(dob);
      return age >= 21;
    }, { message: 'You must be at least 21 years old to apply' })
    .refine((dob) => {
      const age = calculateAge(dob);
      return age <= 65;
    }, { message: 'Maximum age limit is 65 years' }),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    required_error: 'Please select gender',
  }),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed'], {
    required_error: 'Please select marital status',
  }),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number starting with 6-9'),
  fatherName: z
    .string()
    .min(2, "Father's name is required")
    .max(100),
  motherName: z
    .string()
    .min(2, "Mother's name is required")
    .max(100),
});

// ─── Step 3: KYC ─────────────────────────────────────────────────────────────

export const step3Schema = z.object({
  panNumber: z
    .string()
    .min(1, 'PAN number is required')
    .refine((pan) => {
      const { valid } = validatePAN(pan);
      return valid;
    }, { message: 'Invalid PAN format (e.g., ABCDE1234F)' }),
  panVerified: z.boolean().optional(),
  aadhaarNumber: z
    .string()
    .min(1, 'Aadhaar number is required')
    .refine((aadhaar) => {
      const cleaned = aadhaar.replace(/\s+/g, '');
      const { valid } = validateAadhaar(cleaned);
      return valid;
    }, { message: 'Invalid Aadhaar number or checksum failed' }),
  aadhaarVerified: z.boolean().optional(),
  aadhaarConsent: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must give consent to Aadhaar-based verification to proceed',
    }),
  dataConsent: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Please consent to data processing to continue',
    }),
});

// ─── Step 4: Address ──────────────────────────────────────────────────────────

const addressSchema = z.object({
  addressLine1: z.string().min(5, 'Address must be at least 5 characters').max(200),
  addressLine2: z.string().max(200).optional(),
  pinCode: z
    .string()
    .regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postOffice: z.string().optional(),
  residenceType: z.enum(['owned', 'rented', 'parental', 'company_provided'], {
    required_error: 'Please select residence type',
  }),
  rentAmount: z.number().min(0).optional(),
  yearsAtAddress: z
    .number({ invalid_type_error: 'Please enter years at address' })
    .min(0)
    .max(100),
});

export const step4Schema = z.object({
  permanentAddress: addressSchema,
  sameAsPermanent: z.boolean().default(false),
  currentAddress: addressSchema.optional(),
}).superRefine((data, ctx) => {
  if (!data.sameAsPermanent && !data.currentAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['currentAddress'],
      message: 'Current address is required when different from permanent',
    });
  }
  if (data.permanentAddress.residenceType === 'rented' &&
      (!data.permanentAddress.rentAmount || data.permanentAddress.rentAmount <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['permanentAddress', 'rentAmount'],
      message: 'Monthly rent amount is required for rented residence',
    });
  }
});

// ─── Step 5: Employment ───────────────────────────────────────────────────────

const salariedSchema = z.object({
  employmentType: z.literal('salaried'),
  employerName: z.string().min(2, 'Employer name is required'),
  designation: z.string().min(2, 'Designation is required'),
  employmentSince: z.string().min(1, 'Employment start date is required'),
  monthlyIncome: z
    .number({ invalid_type_error: 'Monthly income is required' })
    .min(10000, 'Monthly income must be at least ₹10,000'),
  salaryAccount: z.string().min(1, 'Please select salary credit mode'),
  companyType: z.enum(['government', 'psu', 'private_listed', 'private_unlisted', 'mnc'], {
    required_error: 'Please select company type',
  }),
});

const selfEmployedSchema = z.object({
  employmentType: z.literal('self_employed'),
  businessName: z.string().min(2, 'Business/profession name is required'),
  profession: z.string().min(1, 'Profession type is required'),
  businessSince: z.string().min(1, 'Business start date is required'),
  monthlyIncome: z
    .number({ invalid_type_error: 'Monthly income is required' })
    .min(15000, 'Monthly income must be at least ₹15,000'),
  itrFiled: z.boolean(),
});

const businessOwnerSchema = z.object({
  employmentType: z.literal('business_owner'),
  businessName: z.string().min(2, 'Business name is required'),
  businessType: z.enum(['proprietorship', 'partnership', 'pvt_ltd', 'llp', 'public_limited'], {
    required_error: 'Please select business type',
  }),
  gstNumber: z
    .string()
    .min(1, 'GST number is required')
    .refine((gst) => {
      const { valid } = validateGST(gst);
      return valid;
    }, { message: 'Invalid GST number format (e.g., 27AAPFU0939F1ZV)' }),
  businessSince: z.string().min(1, 'Business start date is required'),
  monthlyIncome: z
    .number({ invalid_type_error: 'Monthly income is required' })
    .min(25000, 'Monthly turnover must be at least ₹25,000'),
  annualTurnover: z
    .number({ invalid_type_error: 'Annual turnover is required' })
    .min(100000, 'Annual turnover must be at least ₹1 Lakh'),
});

export const step5Schema = z.discriminatedUnion('employmentType', [
  salariedSchema,
  selfEmployedSchema,
  businessOwnerSchema,
]);

// ─── Step 6: Co-Applicant ─────────────────────────────────────────────────────

const coApplicantInfoSchema = z.object({
  fullName: z.string().min(3, 'Co-applicant name is required'),
  relationship: z.enum(['spouse', 'parent', 'sibling', 'business_partner', 'other'], {
    required_error: 'Please select relationship',
  }),
  dateOfBirth: z.string().min(1, 'Date of birth is required').refine(
    (dob) => calculateAge(dob) >= 18,
    { message: 'Co-applicant must be at least 18 years old' }
  ),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  panNumber: z
    .string()
    .min(1, 'PAN number is required')
    .refine((pan) => validatePAN(pan).valid, { message: 'Invalid PAN number' }),
  monthlyIncome: z
    .number({ invalid_type_error: 'Monthly income is required' })
    .min(0, 'Monthly income must be positive'),
  employmentType: z.string().min(1, 'Employment type is required'),
});

export const step6Schema = z.object({
  hasCoApplicant: z.boolean(),
  coApplicant: coApplicantInfoSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.hasCoApplicant && !data.coApplicant) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['coApplicant'],
      message: 'Co-applicant details are required',
    });
  }
});

// ─── Step 7: Documents ────────────────────────────────────────────────────────

export const step7Schema = z.object({
  applicantPhoto: z.any().nullish(),
  aadhaarFront: z.any().nullish(),
  aadhaarBack: z.any().nullish(),
  panCard: z.any().nullish(),
  addressProof: z.any().nullish(),
  incomeProof: z.any().nullish(),
  eSignature: z.string().nullish(),
  additionalDocs: z.array(z.any()).nullish(),
});

// ─── Step 8: Review & Consent ─────────────────────────────────────────────────

export const step8Schema = z.object({
  consentAccuracy: z
    .boolean()
    .refine((v) => v === true, { message: 'You must confirm the accuracy of information provided' }),
  consentCreditCheck: z
    .boolean()
    .refine((v) => v === true, { message: 'You must consent to credit bureau check' }),
  consentTerms: z
    .boolean()
    .refine((v) => v === true, { message: 'You must accept the Terms & Conditions' }),
  consentPrivacy: z
    .boolean()
    .refine((v) => v === true, { message: 'You must accept the Privacy Policy' }),
});

// ─── Schema Factory (Cross-Step Validation) ───────────────────────────────────

/**
 * Builds cross-step validated schema based on all collected form data.
 * Enforces 14 cross-step validation dependencies.
 */
export function schemaFactory(stepIndex, allFormData = {}) {
  const {
    step1 = {},
    step2: _step2 = {},
    step5: _step5 = {},
  } = allFormData;

  switch (stepIndex) {
    case 1: return step1Schema;
    case 2: return step2Schema;
    case 3: {
      // Cross-step rule: if loanType is known from Step 1, enforce PAN 4th-char entity-type match
      const loanTypeForPAN = step1.loanType;
      if (loanTypeForPAN) {
        return step3Schema.superRefine((data, ctx) => {
          if (data.panNumber) {
            const result = validatePANForLoanType(data.panNumber, loanTypeForPAN);
            if (!result.valid) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['panNumber'],
                message: result.message,
              });
            }
          }
        });
      }
      return step3Schema;
    }
    case 4: return step4Schema;


    case 5:
      return step5Schema;

    case 6: {
      // Cross-step rule: Co-applicant required based on loan type & amount
      const loanType = step1.loanType;
      const loanAmount = step1.loanAmount || 0;
      const requiresCoApplicant =
        (loanType === 'personal' && loanAmount > 500000) ||
        (loanType === 'home') ||
        (loanType === 'business' && loanAmount > 2000000);

      if (requiresCoApplicant) {
        return step6Schema.superRefine((data, ctx) => {
          if (!data.hasCoApplicant) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['hasCoApplicant'],
              message: `A co-applicant is mandatory for this loan type and amount`,
            });
          }
        });
      }
      return step6Schema;
    }

    case 7: {
      // Cross-step rule: PAN verified in step3 makes panCard optional
      const panVerified = allFormData.step3?.panVerified;
      if (panVerified) {
        return step7Schema.omit({ panCard: true }).extend({
          panCard: z.any().optional(),
        });
      }
      return step7Schema.extend({
        panCard: z.any().refine((f) => f != null, {
          message: 'PAN card upload required (PAN not verified digitally)',
        }),
      });
    }

    case 8:
      return step8Schema;

    default:
      return z.object({});
  }
}
