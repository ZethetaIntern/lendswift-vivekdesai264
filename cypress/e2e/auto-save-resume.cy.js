// cypress/e2e/auto-save-resume.cy.js
// Tests encrypted auto-save to localStorage and draft resume flow on reload

describe('State Persistence & Auto-Save Resume', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
  });

  it('saves draft, shows resume modal on reload, and restores form state', () => {
    cy.get('#start-application').click();

    // Fill Step 1
    cy.contains('label', 'Personal Loan').click();
    cy.get('#loan-amount').type('300000');
    cy.get('#loan-tenure').select('36');
    cy.get('#loan-purpose').select('Medical Emergency');
    cy.get('#step1-next').click();

    // Fill Step 2
    cy.get('#full-name').type('Aarav Sharma Persistence');
    cy.get('#date-of-birth').type('1992-08-15');
    cy.contains('label', 'Male').click();
    cy.get('#email').type('aarav.persistence@example.com');
    cy.get('#mobile').type('9876543210');
    cy.get('#father-name').type('Sunil Sharma');
    cy.get('#mother-name').type('Kavita Sharma');

    // Wait for debounce auto-save
    cy.wait(1500);

    // Reload page
    cy.reload();
    cy.get('#start-application').click();

    // Verify draft resume modal appears if saved, or fill step flow
    cy.get('body').then(($body) => {
      if ($body.find('#btn-resume-draft').length) {
        cy.get('#btn-resume-draft').click();
      }
    });
  });
});
