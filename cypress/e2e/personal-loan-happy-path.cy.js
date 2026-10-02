// cypress/e2e/personal-loan-happy-path.cy.js
// Happy path: Personal Loan < 5L (no co-applicant required)

describe('Personal Loan Happy Path', () => {
  beforeEach(() => {
    cy.visit('/');
    // Clear any saved drafts
    cy.clearLocalStorage();
  });

  it('completes the full 8-step personal loan application', () => {
    // ── Landing Page ──────────────────────────────────────────────
    cy.get('#start-application').should('be.visible').click();

    cy.get('#step-1-form').should('exist');

    // Select Personal Loan
    cy.contains('label', 'Personal Loan').click();
    cy.get('#loan-amount').type('300000');

    // Select tenure
    cy.get('#loan-tenure').select('36');

    // Select purpose
    cy.get('#loan-purpose').select('Medical Emergency');

    cy.get('#step1-next').click();

    // ── Step 2: Personal Info ─────────────────────────────────────
    cy.get('#full-name').type('Rajesh Kumar Sharma');
    cy.get('#date-of-birth').type('1990-05-15');

    // Gender
    cy.contains('label', 'Male').click();

    // Marital Status
    cy.contains('label', 'Single').click();

    cy.get('#email').type('rajesh.sharma@email.com');
    cy.get('#mobile').type('9876543210');
    cy.get('#father-name').type('Ramesh Kumar Sharma');
    cy.get('#mother-name').type('Sunita Sharma');

    cy.get('#step2-next').click();

    // ── Step 3: KYC ───────────────────────────────────────────────
    // Enter PAN (format AAAAA9999A — valid entity 'P')
    cy.get('#pan-number').focus().type('ABCPE1234F');

    // Verify PAN
    cy.contains('button', 'Verify').first().click();
    cy.contains('verified', { matchCase: false }).should('be.visible');

    // Aadhaar consent
    cy.get('#aadhaar-consent').check();

    // Enter Aadhaar (valid Verhoeff: 234123412346)
    cy.get('#aadhaar-number').focus().type('234123412346');

    // Data consent
    cy.get('#data-consent').check();

    cy.get('#step3-next').click();

    // ── Step 4: Address ───────────────────────────────────────────
    // Permanent address
    cy.get('#permanentAddress-address1').type('Flat 4B, Sunshine Apartments, MG Road');
    cy.get('#permanentAddress-pincode').type('560001');

    // Wait for PIN lookup
    cy.wait(800);

    // Years at address
    cy.get('#permanentAddress-years').type('5');

    // Residence type
    cy.get('#permanentAddress-residence-type').select('owned');

    // Same as permanent
    cy.get('#same-as-permanent').check();

    cy.get('#step4-next').click();

    // ── Step 5: Employment ────────────────────────────────────────
    // Select Salaried
    cy.contains('label', '💼 Salaried').click();

    cy.get('#employer-name').type('Infosys Limited');
    cy.get('#designation').type('Senior Software Engineer');
    cy.get('#employment-since').type('2018-03-01');
    cy.get('#company-type').select('private_listed');
    cy.get('#monthly-income-salaried').type('80000');
    cy.get('#salary-account').select('bank');

    cy.get('#step5-next').click();

    // ── Step 6: Co-Applicant (skipped for < 5L personal) ─────────
    // Should skip directly to step 7 or show optional co-applicant
    // If shown, just continue without adding co-applicant
    cy.get('body').then(($body) => {
      if ($body.find('#step6-next').length) {
        // Step 6 shown as optional
        cy.get('#step6-next').click();
      }
    });

    // ── Step 7: Documents ─────────────────────────────────────────
    // Upload test images using fixtures
    cy.get('#doc-aadhaarFront').as('aadhaarFront');
    cy.fixture('test-image.jpg', 'base64').then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent, 'image/jpeg');
      const file = new File([blob], 'aadhaar-front.jpg', { type: 'image/jpeg' });
      const dt = new DataTransfer();
      dt.items.add(file);
      cy.get('#doc-aadhaarFront-input').then((input) => {
        input[0].files = dt.files;
        cy.wrap(input).trigger('change', { force: true });
      });
    });

    // Draw e-signature
    cy.get('#e-signature canvas').then(($canvas) => {
      const canvas = $canvas[0];
      const rect = canvas.getBoundingClientRect();
      cy.wrap($canvas)
        .trigger('mousedown', { clientX: rect.left + 50, clientY: rect.top + 50 })
        .trigger('mousemove', { clientX: rect.left + 150, clientY: rect.top + 80 })
        .trigger('mousemove', { clientX: rect.left + 250, clientY: rect.top + 50 })
        .trigger('mouseup');
    });

    cy.get('#step7-next').click();

    // ── Step 8: Review & Submit ───────────────────────────────────
    // Verify loan details are shown
    cy.contains('Personal Loan').should('be.visible');
    cy.contains('₹3,00,000').should('be.visible');

    // Check all 4 consents
    cy.get('#consent-accuracy').check();
    cy.get('#consent-credit-check').check();
    cy.get('#consent-terms').check();
    cy.get('#consent-privacy').check();

    // Submit
    cy.get('#step8-submit').click();

    // ── Success Modal ─────────────────────────────────────────────
    cy.contains('Application Submitted', { timeout: 10000 }).should('be.visible');
    cy.contains('LS-').should('be.visible'); // Reference number
  });
});
