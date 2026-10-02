/**
 * EMI Calculator using reducing-balance (equal installment) formula.
 *
 *         P × r × (1 + r)^n
 * EMI = ———————————————————————
 *          (1 + r)^n − 1
 *
 * Where:
 *   P = Principal loan amount
 *   r = Monthly interest rate (annual rate / 12 / 100)
 *   n = Number of monthly installments (tenure in months)
 */

export const LOAN_CONFIG = {
  personal: {
    rate: 10.5,       // % per annum
    processingFee: 1, // % of principal
    minAmount: 50000,
    maxAmount: 1000000, // 10L
    label: 'Personal Loan',
    color: '#1F4E79',
  },
  home: {
    rate: 8.5,
    processingFee: 1,
    minAmount: 500000,
    maxAmount: 10000000, // 1Cr
    label: 'Home Loan',
    color: '#27AE60',
  },
  business: {
    rate: 14,
    processingFee: 1,
    minAmount: 100000,
    maxAmount: 5000000, // 50L
    label: 'Business Loan',
    color: '#F39C12',
  },
};

/**
 * Calculate EMI details for a loan.
 * @param {number} principal - Loan principal in INR
 * @param {number} tenureMonths - Loan tenure in months
 * @param {string} loanType - 'personal' | 'home' | 'business'
 * @returns {Object} EMI breakdown details
 */
export function calculateEMI(principal, tenureMonths, loanType) {
  const config = LOAN_CONFIG[loanType];
  if (!config) throw new Error(`Unknown loan type: ${loanType}`);

  const annualRate = config.rate;
  const r = annualRate / 12 / 100; // monthly interest rate
  const n = tenureMonths;
  const P = principal;

  if (P <= 0 || n <= 0) {
    return {
      emi: 0, totalPayable: 0, totalInterest: 0,
      processingFee: 0, totalCostOfBorrowing: 0,
      annualRate, breakdown: [],
    };
  }

  let emi;
  if (r === 0) {
    emi = P / n;
  } else {
    const factor = Math.pow(1 + r, n);
    emi = (P * r * factor) / (factor - 1);
  }

  const totalPayable = emi * n;
  const totalInterest = totalPayable - P;
  const rawFee = P * (config.processingFee / 100);
  const processingFee = Math.min(25000, Math.max(2000, rawFee));
  const totalCostOfBorrowing = totalPayable + processingFee;

  // Generate amortization schedule (first 12 months for preview)
  const breakdown = [];
  let balance = P;
  for (let month = 1; month <= Math.min(n, 12); month++) {
    const interestForMonth = balance * r;
    const principalForMonth = emi - interestForMonth;
    balance -= principalForMonth;
    breakdown.push({
      month,
      emi: Math.round(emi),
      principal: Math.round(principalForMonth),
      interest: Math.round(interestForMonth),
      balance: Math.max(0, Math.round(balance)),
    });
  }

  return {
    emi: Math.round(emi),
    totalPayable: Math.round(totalPayable),
    totalInterest: Math.round(totalInterest),
    processingFee: Math.round(processingFee),
    totalCostOfBorrowing: Math.round(totalCostOfBorrowing),
    annualRate,
    breakdown,
  };
}

/**
 * Format number in Indian number system (e.g., 1,00,000)
 * @param {number} num
 * @returns {string}
 */
export function formatIndianCurrency(num) {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  const numStr = Math.round(num).toString();
  const lastThree = numStr.slice(-3);
  const rest = numStr.slice(0, -3);
  const formatted = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;
  return '₹' + formatted;
}

/**
 * Parse Indian currency string back to number.
 * @param {string} str
 * @returns {number}
 */
export function parseIndianCurrency(str) {
  if (!str) return 0;
  return Number(str.replace(/[₹,\s]/g, '')) || 0;
}

/**
 * Calculate EMI-to-income ratio.
 * @param {number} emi - Monthly EMI amount
 * @param {number} monthlyIncome - Monthly income amount
 * @returns {{ ratio: number, percentage: string, isAffordable: boolean, status: string }}
 */
export function calculateAffordability(emi, monthlyIncome) {
  if (!monthlyIncome || monthlyIncome <= 0) {
    return { ratio: 0, percentage: '0%', isAffordable: true, status: 'unknown' };
  }

  const ratio = emi / monthlyIncome;
  const percentage = (ratio * 100).toFixed(1) + '%';
  const isAffordable = ratio <= 0.5;
  let status = 'safe';
  if (ratio > 0.7) status = 'critical';
  else if (ratio > 0.5) status = 'warning';

  return { ratio, percentage, isAffordable, status };
}

/**
 * Get tenure options for a given loan type.
 * @param {string} loanType
 * @returns {Array<{value: number, label: string}>}
 */
export function getTenureOptions(loanType) {
  const options = {
    personal: [12, 24, 36, 48, 60],
    home: [60, 120, 180, 240, 300, 360],
    business: [12, 24, 36, 48, 60, 84],
  };
  return (options[loanType] || [12, 24, 36]).map(m => ({
    value: m,
    label: m >= 12 ? `${m / 12} ${m === 12 ? 'Year' : 'Years'} (${m} months)` : `${m} Months`,
  }));
}

/**
 * Get loan purpose options for a given loan type.
 */
export function getLoanPurposes(loanType) {
  const purposes = {
    personal: [
      'Medical Emergency', 'Wedding Expenses', 'Travel', 'Debt Consolidation',
      'Home Renovation', 'Education', 'Consumer Electronics', 'Other',
    ],
    home: [
      'Purchase New Home', 'Under-Construction Property', 'Home Renovation',
      'Balance Transfer', 'Plot Purchase', 'Other',
    ],
    business: [
      'Working Capital', 'Equipment Purchase', 'Business Expansion',
      'Inventory Finance', 'Trade Finance', 'Debt Consolidation', 'Other',
    ],
  };
  return (purposes[loanType] || []).map(p => ({ value: p, label: p }));
}
