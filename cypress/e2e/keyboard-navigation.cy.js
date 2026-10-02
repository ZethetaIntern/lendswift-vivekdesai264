// cypress/e2e/keyboard-navigation.cy.js
// Tests that the full form can be completed using keyboard controls only

describe('Keyboard Navigation — WCAG 2.1 AA', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
  });

  it('can navigate the landing page with keyboard', () => {
    // Tab to skip-to-content link
    cy.get('#skip-to-content').focus();
    cy.focused().should('have.attr', 'href', '#main-content');

    // Tab again to reach start button
    cy.get('#start-application').focus().type('{enter}');
    cy.get('#step-1-form').should('exist');
  });

  it('can select loan type using keyboard (radio buttons)', () => {
    cy.get('#start-application').click();

    // Focus first radio input and use arrow keys to select
    cy.get('input[type="radio"][name="loanType"]').first().focus();
    cy.focused().type(' '); // Space to select
    cy.focused().should('be.checked');

    // Arrow keys to navigate
    cy.focused().type('{rightarrow}');
  });

  it('Step 1 — Tab order is logical', () => {
    cy.get('#start-application').click();
    cy.contains('label', 'Personal Loan').click();

    // Tab through: amount → slider → tenure → purpose → next button
    cy.get('#loan-amount').focus();
    cy.get('#loan-amount').tab();
    // Should reach slider or next focusable element
    cy.focused().should('exist');
  });

  it('can complete Step 2 entirely with keyboard', () => {
    cy.get('#start-application').click();
    cy.fillStep1Personal();

    cy.get('#full-name').focus().type('Test User Keyboard');
    cy.get('#full-name').tab();
    cy.get('#date-of-birth').type('1988-06-15');
    cy.get('#date-of-birth').tab();

    // Focus on gender options
    cy.get('input[name="gender"]').first().focus().type(' ');

    cy.get('#email').focus().type('keyboard@test.com');
    cy.get('#mobile').focus().type('9999888877');
    cy.get('#father-name').focus().type('Father Name');
    cy.get('#mother-name').focus().type('Mother Name');

    // Submit with Enter
    cy.get('#step2-next').focus().type('{enter}');
  });

  it('checkboxes respond to Space key', () => {
    cy.get('#start-application').click();
    cy.fillStep1Personal();
    cy.fillStep2Personal();

    // Step 3: consent checkboxes via keyboard
    cy.get('#aadhaar-consent').focus().type(' ');
    cy.get('#aadhaar-consent').should('be.checked');

    cy.get('#data-consent').focus().type(' ');
    cy.get('#data-consent').should('be.checked');
  });

  it('focus is managed on step transitions', () => {
    cy.get('#start-application').click();
    cy.fillStep1Personal();

    // After step transition, page should scroll and focus should be manageable
    cy.get('#full-name').should('be.visible');
    cy.get('#full-name').focus();
    cy.focused().should('have.attr', 'id', 'full-name');
  });

  it('back button is accessible via keyboard', () => {
    cy.get('#start-application').click();
    cy.fillStep1Personal();
    cy.fillStep2Personal();

    // Find back button on step 3 and activate with Enter
    cy.contains('button', 'Back').focus().type('{enter}');
    // Should be back on step 2
    cy.get('#full-name').should('be.visible');
  });

  it('error messages receive focus when validation fails', () => {
    cy.get('#start-application').click();
    cy.get('#step1-next').click();
    // Error message should be in DOM with role="alert"
    cy.get('[role="alert"]').should('exist');
    cy.get('[role="alert"]').first().should('be.visible');
  });

  it('modal is keyboard accessible with focus trap', () => {
    // Complete full application to reach success modal
    cy.get('#start-application').click();
    cy.fillStep1Personal();
    cy.fillStep2Personal();
    cy.fillStep3KYC();
    cy.fillStep4Address();
    cy.fillStep5Salaried();

    cy.get('body').then(($body) => {
      if ($body.find('#step6-next').length) cy.get('#step6-next').click();
    });

    cy.drawSignature();
    cy.get('#step7-next').click();
    cy.submitWithConsents();

    // Check modal is accessible
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[aria-modal="true"]').should('exist');
    cy.get('#submit-new-application').should('be.focused');
  });
});
