/**
 * Verhoeff algorithm checksum tables for Aadhaar validation.
 * Reference: https://en.wikipedia.org/wiki/Verhoeff_algorithm
 *
 * All three tables (d, p, inv) are mandatory for a correct Verhoeff implementation:
 *   d   = multiplication table (Cayley table of D5)
 *   p   = permutation table (applied by digit position)
 *   inv = multiplicative inverse table (used in the final equality check)
 */

const d = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,2,3,4,0,6,7,8,9,5],
  [2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],
  [4,0,1,2,3,9,5,6,7,8],
  [5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],
  [7,6,5,9,8,2,1,0,4,3],
  [8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0],
];

const p = [
  [0,1,2,3,4,5,6,7,8,9],
  [1,5,7,6,2,8,3,0,9,4],
  [5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],
  [9,4,5,3,1,2,6,8,7,0],
  [4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],
  [7,0,4,6,9,1,3,2,5,8],
];

// inv: multiplicative inverse table — required for the final Verhoeff check (c must be 0 via inv)
const inv = [0,4,3,2,1,9,8,7,6,5];

/**
 * Validates a string using the strict Verhoeff checksum algorithm.
 * Uses ALL three tables: d (multiplication), p (permutation), inv (inverse).
 *
 * The algorithm:
 *   1. Reverse the digit string
 *   2. For each digit at position i: c = d[c][ p[i%8][digit] ]
 *   3. Final result c must equal inv[0] = 0 for a valid number
 *
 * @param {string} num - Numeric string to validate
 * @returns {boolean}
 */
export function verhoeffValidate(num) {
  const digits = num.split('').reverse().map(Number);
  let c = 0;
  for (let i = 0; i < digits.length; i++) {
    c = d[c][p[i % 8][digits[i]]];
  }
  // inv[0] === 0: the check digit is valid only when c reduces to 0
  return inv[c] === inv[0];
}

/**
 * Validates Indian PAN number format and entity type.
 * Format: AAAAA9999A
 * 4th character (index 3) represents entity type:
 *   P = Individual, C = Company, H = HUF, F = Firm,
 *   A = AOP, T = Trust, B = BOI, L = Local, J = Artificial, G = Govt
 * @param {string} pan
 * @returns {{ valid: boolean, entityType: string|null, message: string }}
 */
export const VALID_PAN_ENTITY_TYPES = {
  P: 'Individual',
  C: 'Company',
  H: 'HUF (Hindu Undivided Family)',
  F: 'Firm',
  A: 'Association of Persons (AOP)',
  T: 'Trust',
  B: 'Body of Individuals (BOI)',
  L: 'Local Authority',
  J: 'Artificial Juridical Person',
  G: 'Government',
};

export function validatePAN(pan) {
  if (!pan) return { valid: false, entityType: null, message: 'PAN is required' };

  const cleaned = pan.toUpperCase().trim();

  // Basic format: 5 letters + 4 digits + 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(cleaned)) {
    return { valid: false, entityType: null, message: 'Invalid PAN format (e.g., ABCDE1234F)' };
  }

  // 4th character (index 3) is the entity type
  const entityChar = cleaned[3];
  const entityType = VALID_PAN_ENTITY_TYPES[entityChar];
  if (!entityType) {
    return { valid: false, entityType: null, message: `PAN 4th character must indicate entity type — '${entityChar}' is not a recognised entity code` };
  }

  return { valid: true, entityType, message: `Valid PAN — ${entityType}` };
}

/**
 * Cross-validates PAN 4th character against the selected loan type.
 *
 * Rules (per RBI lending norms):
 *   - Personal Loan  → 4th char MUST be 'P' (Individual only)
 *   - Home Loan      → 4th char MUST be 'P' (Individual only — home loans are for individuals)
 *   - Business Loan  → 4th char can be 'P','C','F','A','B','H' (any non-government entity)
 *
 * @param {string} pan - PAN string (will be uppercased)
 * @param {string} loanType - 'personal' | 'home' | 'business'
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePANForLoanType(pan, loanType) {
  if (!pan || !loanType) return { valid: true, message: '' }; // Skip if either is missing

  const cleaned = pan.toUpperCase().trim();
  if (cleaned.length < 4) return { valid: true, message: '' }; // Format not yet complete

  const entityChar = cleaned[3];
  const entityType = VALID_PAN_ENTITY_TYPES[entityChar];

  if (!entityType) {
    return {
      valid: false,
      message: `PAN 4th character must indicate entity type — '${entityChar}' is not a recognised entity code`,
    };
  }

  // Personal & Home loans: Individual PAN only
  if ((loanType === 'personal' || loanType === 'home') && entityChar !== 'P') {
    return {
      valid: false,
      message: `PAN 4th character must indicate entity type 'P' (Individual) for ${loanType} loans. Found: '${entityChar}' (${entityType})`,
    };
  }

  // Business loans: cannot be Government or Local Authority
  if (loanType === 'business' && ['L', 'J', 'G'].includes(entityChar)) {
    return {
      valid: false,
      message: `PAN 4th character must indicate entity type — Government/Local Authority PAN not eligible for business loans. Found: '${entityChar}' (${entityType})`,
    };
  }

  return { valid: true, message: `Valid PAN — ${entityType}` };
}

/**
 * Validates Indian Aadhaar number using Verhoeff checksum.
 * @param {string} aadhaar - 12-digit Aadhaar number (spaces stripped)
 * @returns {{ valid: boolean, message: string }}
 */
export function validateAadhaar(aadhaar) {
  if (!aadhaar) return { valid: false, message: 'Aadhaar number is required' };

  const cleaned = aadhaar.replace(/\s+/g, '');

  if (!/^\d{12}$/.test(cleaned)) {
    return { valid: false, message: 'Aadhaar must be exactly 12 digits' };
  }

  // First digit cannot be 0 or 1
  if (['0', '1'].includes(cleaned[0])) {
    return { valid: false, message: 'Invalid Aadhaar number' };
  }

  const isValid = verhoeffValidate(cleaned);
  if (!isValid) {
    return { valid: false, message: 'Invalid Aadhaar checksum — please check the number' };
  }

  return { valid: true, message: 'Aadhaar verified successfully' };
}

/**
 * Validates GST number format (15 characters).
 * Format: 2-digit state code + 10-char PAN + 1-digit entity order + Z + 1-digit checksum
 * @param {string} gst
 * @returns {{ valid: boolean, message: string }}
 */
export function validateGST(gst) {
  if (!gst) return { valid: false, message: 'GST number is required' };

  const cleaned = gst.toUpperCase().trim();
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (cleaned.length !== 15) {
    return { valid: false, message: 'GST number must be exactly 15 characters' };
  }

  if (!gstRegex.test(cleaned)) {
    return { valid: false, message: 'Invalid GST number format' };
  }

  const stateCode = parseInt(cleaned.substring(0, 2));
  if (stateCode < 1 || stateCode > 38) {
    return { valid: false, message: 'Invalid state code in GST number' };
  }

  return { valid: true, message: 'Valid GST number' };
}

/**
 * Validates Indian mobile number.
 * Must be 10 digits, starting with 6-9.
 */
export function validateMobile(mobile) {
  const cleaned = mobile?.replace(/\D/g, '') || '';
  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return false;
  }
  return true;
}

/**
 * Calculates age from date of birth.
 */
export function calculateAge(dob) {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
