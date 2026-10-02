// cypress/e2e/business-loan-happy-path.cy.js
// Happy path: Business Loan > 20L (requires co-applicant), Business Owner employment

describe('Business Loan Happy Path', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
  });

  it('completes the full 8-step business loan application with business owner employment', () => {
    cy.get('#start-application').click();

    // ── Step 1 ────────────────────────────────────────────────────
    cy.contains('label', 'Business Loan').click();
    cy.get('#loan-amount').clear().type('3000000');
    cy.get('#loan-tenure').select('60');
    cy.get('#loan-purpose').select('Business Expansion');
    cy.get('#step1-next').click();

    // ── Step 2 ────────────────────────────────────────────────────
    cy.get('#full-name').type('Suresh Agarwal');
    cy.get('#date-of-birth').type('1975-07-08');
    cy.contains('label', 'Male').click();
    cy.contains('label', 'Married').click();
    cy.get('#email').type('suresh.agarwal@biztech.in');
    cy.get('#mobile').type('7654321098');
    cy.get('#father-name').type('Mahesh Agarwal');
    cy.get('#mother-name').type('Pushpa Agarwal');
    cy.get('#step2-next').click();

    // ── Step 3 ────────────────────────────────────────────────────
    cy.get('#pan-number').focus().type('AACPA1234C');
    cy.get('#aadhaar-consent').check();
    cy.get('#aadhaar-number').focus().type('234123412346');
    cy.get('#data-consent').check();
    cy.get('#step3-next').click();

    // ── Step 4 ────────────────────────────────────────────────────
    cy.get('#permanentAddress-address1').type('Plot 7, Industrial Area Phase 2, Chandigarh');
    cy.get('#permanentAddress-pincode').type('160001');
    cy.wait(800);
    cy.get('#permanentAddress-years').type('12');
    cy.get('#permanentAddress-residence-type').select('owned');
    cy.get('#same-as-permanent').check();
    cy.get('#step4-next').click();

    // ── Step 5: Business Owner ────────────────────────────────────
    cy.contains('label', '🏭 Business Owner').click();
    cy.get('#business-name-bo').type('BizTech Solutions Pvt Ltd');
    cy.get('#business-type').select('pvt_ltd');
    cy.get('#gst-number').type('03AACPA1234C1ZK');
    cy.get('#business-since-bo').type('2005-04-01');
    cy.get('#monthly-income-bo').type('200000');
    cy.get('#annual-turnover').type('25000000');
    cy.get('#step5-next').click();

    // ── Step 6: Co-Applicant (required > 20L) ────────────────────
    cy.contains('Co-applicant Required').should('be.visible');
    cy.get('#co-full-name').type('Meena Agarwal');
    cy.get('#co-relationship').select('spouse');
    cy.get('#co-dob').type('1978-09-15');
    cy.get('#co-mobile').type('8877665544');
    cy.get('#co-pan').type('BEFPA5678D');
    cy.get('#co-employment-type').select('homemaker');
    cy.get('#co-monthly-income').type('0');
    cy.get('#step6-next').click();

    // ── Step 7: Documents + Signature ────────────────────────────
    cy.get('#e-signature canvas').then(($canvas) => {
      const rect = $canvas[0].getBoundingClientRect();
      cy.wrap($canvas)
        .trigger('mousedown', { clientX: rect.left + 30, clientY: rect.top + 70 })
        .trigger('mousemove', { clientX: rect.left + 180, clientY: rect.top + 100 })
        .trigger('mousemove', { clientX: rect.left + 280, clientY: rect.top + 60 })
        .trigger('mouseup');
    });
    cy.get('#step7-next').click();

    // ── Step 8: Review & Submit ───────────────────────────────────
    cy.contains('Business Loan').should('be.visible');
    cy.contains('BizTech Solutions Pvt Ltd').should('be.visible');
    cy.contains('Business Owner').should('be.visible');

    cy.get('#consent-accuracy').check();
    cy.get('#consent-credit-check').check();
    cy.get('#consent-terms').check();
    cy.get('#consent-privacy').check();

    cy.get('#step8-submit').click();
    cy.contains('Application Submitted', { timeout: 10000 }).should('be.visible');
    cy.contains('LS-').should('be.visible');
  });
});
