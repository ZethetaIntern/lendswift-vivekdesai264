// cypress/e2e/validation-errors.cy.js
// Validates that all required field errors appear and clear correctly

describe('Validation Errors — All Steps', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
    cy.get('#start-application').click();
  });

  it('Step 1 — shows errors for empty fields on submit', () => {
    // Try to proceed without selecting loan type
    cy.get('#step1-next').click();
    cy.contains('Please select a loan type').should('be.visible');
  });

  it('Step 1 — shows amount limit error for Personal Loan > 10L', () => {
    cy.contains('label', 'Personal Loan').click();
    cy.get('#loan-amount').type('2000000');
    cy.get('#loan-tenure').select('36');
    cy.get('#loan-purpose').select('Medical Emergency');
    cy.get('#step1-next').click();
    cy.contains('10,00,000').should('be.visible');
  });

  it('Step 2 — shows age validation error for DOB < 21', () => {
    cy.contains('label', 'Personal Loan').click();
    cy.get('#loan-amount').type('300000');
    cy.get('#loan-tenure').select('36');
    cy.get('#loan-purpose').select('Travel');
    cy.get('#step1-next').click();

    cy.get('#date-of-birth').type('2010-01-01');
    cy.get('#step2-next').click();
    cy.contains('at least 21 years').should('be.visible');
  });

  it('Step 2 — shows mobile validation error for invalid format', () => {
    cy.contains('label', 'Personal Loan').click();
    cy.get('#loan-amount').type('300000');
    cy.get('#loan-tenure').select('36');
    cy.get('#loan-purpose').select('Travel');
    cy.get('#step1-next').click();

    cy.get('#mobile').type('1234567890'); // starts with 1 — invalid
    cy.get('#mobile').blur();
    cy.contains('valid 10-digit').should('be.visible');
  });

  it('Step 2 — mobile error clears after entering valid number', () => {
    cy.contains('label', 'Personal Loan').click();
    cy.get('#loan-amount').type('300000');
    cy.get('#loan-tenure').select('36');
    cy.get('#loan-purpose').select('Travel');
    cy.get('#step1-next').click();

    cy.get('#mobile').type('1234567890');
    cy.get('#mobile').blur();
    cy.contains('valid 10-digit').should('be.visible');

    cy.get('#mobile').clear().type('9876543210');
    cy.get('#mobile').blur();
    cy.contains('valid 10-digit').should('not.exist');
  });

  it('Step 3 — shows PAN format error', () => {
    // Navigate to step 3
    cy.fillStep1Personal();
    cy.fillStep2Personal();

    cy.get('#pan-number').focus().type('INVALID');
    cy.get('#pan-number').blur();
    cy.contains('Invalid PAN format').should('be.visible');
  });

  it('Step 3 — requires Aadhaar consent before proceeding', () => {
    cy.fillStep1Personal();
    cy.fillStep2Personal();

    cy.get('#pan-number').focus().type('ABCPE1234F');
    // Try to verify Aadhaar without consent
    cy.get('#aadhaar-number').focus().type('234123412346');
    cy.get('#data-consent').check();
    cy.get('#step3-next').click();
    cy.contains('consent to Aadhaar').should('be.visible');
  });

  it('Step 8 — shows errors if consents not checked', () => {
    // Would need to fill all steps — abbreviated test
    cy.fillStep1Personal();
    cy.fillStep2Personal();
    cy.fillStep3KYC();
    cy.fillStep4Address();
    cy.fillStep5Salaried();

    // Reach step 8 (step 6 may be skipped for < 5L personal)
    // Skip step 6 if present
    cy.get('body').then(($body) => {
      if ($body.find('#step6-next').length) cy.get('#step6-next').click();
    });

    cy.get('#step7-next').click();

    // Try submitting without consents
    cy.get('#step8-submit').click();
    cy.contains('confirm the accuracy').should('be.visible');
    cy.contains('credit bureau check').should('be.visible');
    cy.contains('Terms & Conditions').should('be.visible');
    cy.contains('Privacy Policy').should('be.visible');
  });
});
