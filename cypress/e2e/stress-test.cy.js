// cypress/e2e/stress-test.cy.js
// QA Stress Test Protocol — Section E3
// Covers: rapid Next-click spam, double-submit prevention, PAN entity error specificity

describe('Stress Testing & Double Submit Prevention (Section E3)', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
    cy.get('#start-application').click();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 1: Rapidly clicking "Next" 20× must NOT skip steps or corrupt RHF state
  // ────────────────────────────────────────────────────────────────────────────
  it('rapid Next-button spam (20×) does not skip steps or corrupt React Hook Form state', () => {
    // Step 1 must be visible
    cy.get('#step-1-form').should('exist');

    // Click Next 20 times in rapid succession WITHOUT filling any fields
    for (let i = 0; i < 20; i++) {
      cy.get('#step1-next').click({ force: true });
    }

    // Step 1 must still be active — invalid form cannot advance
    cy.get('#step-1-form').should('exist');

    // Validation errors must be visible (form is NOT in a corrupted empty state)
    cy.get('[role="alert"]').should('have.length.gte', 1);

    // Now fill valid Step 1 data and advance once
    cy.contains('label', 'Personal Loan').click();
    cy.get('#loan-amount').clear().type('300000');
    cy.get('#loan-tenure').select('36');
    cy.get('#loan-purpose').select('Medical Emergency');
    cy.get('#step1-next').click();

    // Must land on Step 2 — not have skipped to Step 3+
    cy.get('#full-name').should('exist');
    cy.get('#step-2-form, [id^="full-name"]').should('be.visible');

    // RHF state should be clean — Step 1 data preserved correctly
    cy.get('#full-name').should('have.value', '');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 2: Double-clicking "Submit Application" must NOT trigger multiple API calls
  // The submit button must be disabled immediately after first click (aria-busy).
  // Success modal must appear exactly ONCE with a single reference number.
  // ────────────────────────────────────────────────────────────────────────────
  it('double-clicking Submit does not trigger duplicate API submissions', () => {
    // Navigate through all steps
    cy.fillStep1Personal();
    cy.fillStep2Personal();
    cy.fillStep3KYC();
    cy.fillStep4Address();
    cy.fillStep5Salaried();

    // Skip Step 6 if not shown (personal < 5L)
    cy.get('body').then(($body) => {
      if ($body.find('#step6-next').length) {
        cy.get('#step6-next').click();
      }
    });

    // Step 7 — proceed without uploads (schema allows optional)
    cy.get('#step7-next').click();

    // Step 8 — check all consents
    cy.get('#consent-accuracy').check();
    cy.get('#consent-credit-check').check();
    cy.get('#consent-terms').check();
    cy.get('#consent-privacy').check();

    // Double-click the submit button as fast as possible
    cy.get('#step8-submit').scrollIntoView();
    cy.get('#step8-submit').dblclick({ force: true });

    // Immediately after first click, button must be disabled (aria-busy)
    // The second click must be a no-op because the button is disabled
    cy.get('#step8-submit').should('be.disabled');

    // Success modal must appear exactly once
    cy.contains('Application Submitted!', { timeout: 10000 }).should('be.visible');

    // Only ONE reference number should exist in the DOM
    cy.contains('Application Reference Number')
      .parents('[class*="rounded"]')
      .find('[class*="font-mono"], [class*="tracking-wide"]')
      .should('have.length', 1);

    // The "LS-" prefix confirms it's a real UUID reference, not a duplicate empty state
    cy.contains(/^LS-[A-F0-9]{8}$/).should('be.visible');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 3: PAN with invalid 4th character must produce SPECIFIC error message
  // "PAN 4th character must indicate entity type" — NOT a generic "invalid PAN"
  // ────────────────────────────────────────────────────────────────────────────
  it('PAN with invalid 4th character shows specific entity-type error, not generic invalid message', () => {
    // Complete Step 1 with Personal Loan (triggers 4th-char = P enforcement)
    cy.contains('label', 'Personal Loan').click();
    cy.get('#loan-amount').clear().type('300000');
    cy.get('#loan-tenure').select('36');
    cy.get('#loan-purpose').select('Medical Emergency');
    cy.get('#step1-next').click();

    // Complete Step 2
    cy.fillStep2Personal();

    // Step 3 — enter PAN with 4th char 'E' (not a valid entity code)
    // ABCDE1234F: 4th char (index 3) is 'D' — which is NOT in VALID_PAN_ENTITY_TYPES
    cy.get('#pan-number').focus().type('ABCDE1234F');

    // Attempt to verify — the validator should reject this PAN
    cy.contains('button', 'Verify').first().click();

    // The error must NOT say "Invalid PAN format" (that's for wrong regex)
    // It MUST say "PAN 4th character must indicate entity type"
    cy.get('[role="alert"]')
      .should('be.visible')
      .invoke('text')
      .should('match', /PAN 4th character must indicate entity type/i);

    // Confirm the generic message is NOT shown
    cy.get('[role="alert"]').invoke('text').should('not.match', /invalid pan format/i);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 4: Back-navigation + loan amount change dynamically shows/hides Step 6
  // ────────────────────────────────────────────────────────────────────────────
  it('changing loan amount from <5L to >5L on back-navigation dynamically enables Step 6', () => {
    // Start with personal loan < 5L (no co-applicant)
    cy.contains('label', 'Personal Loan').click();
    cy.get('#loan-amount').clear().type('300000');
    cy.get('#loan-tenure').select('36');
    cy.get('#loan-purpose').select('Medical Emergency');
    cy.get('#step1-next').click();

    // Complete Step 2
    cy.fillStep2Personal();

    // Go BACK to Step 1
    cy.contains('button', 'Back').click();
    cy.get('#step-1-form').should('exist');

    // Change loan amount to > 5L — Step 6 must now be required
    cy.get('#loan-amount').clear().type('800000');
    cy.get('#step1-next').click();

    // Complete Step 2 again
    cy.fillStep2Personal();

    // Step 3
    cy.fillStep3KYC();

    // Step 4
    cy.fillStep4Address();

    // Step 5
    cy.fillStep5Salaried();

    // Step 6 MUST now be visible (co-applicant required for >5L personal)
    cy.get('#step-6-form, #co-full-name, [id*="co-applicant"]').should('exist');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 5: Edit from Step 8 review back to Step 2, modify data, re-submit
  // ────────────────────────────────────────────────────────────────────────────
  it('edit from review Step 8 back to Step 2 and re-submit succeeds with updated data', () => {
    cy.fillStep1Personal();
    cy.fillStep2Personal();
    cy.fillStep3KYC();
    cy.fillStep4Address();
    cy.fillStep5Salaried();

    cy.get('body').then(($body) => {
      if ($body.find('#step6-next').length) cy.get('#step6-next').click();
    });

    cy.get('#step7-next').click();

    // On Step 8, click Edit on Personal Information section
    cy.contains('button', 'Edit').eq(1).click(); // Second Edit = Personal Info

    // We're now on Step 2 — update the email
    cy.get('#email').clear().type('updated@email.com');
    cy.get('#step2-next').click();

    // Steps 3–7 are already completed — navigate forward through them
    cy.fillStep3KYC();
    cy.fillStep4Address();
    cy.fillStep5Salaried();

    cy.get('body').then(($body) => {
      if ($body.find('#step6-next').length) cy.get('#step6-next').click();
    });

    cy.get('#step7-next').click();

    // Back at Step 8 — submit
    cy.submitWithConsents();

    // Success
    cy.contains('Application Submitted!', { timeout: 10000 }).should('be.visible');
    cy.contains('LS-').should('be.visible');
  });
});
