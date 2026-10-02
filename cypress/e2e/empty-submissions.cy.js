// cypress/e2e/empty-submissions.cy.js
// Tests that empty submissions on all steps trigger accessible aria-live validation messages

describe('Empty Submissions & Accessibility Error Announcements', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
    cy.get('#start-application').click();
  });

  it('Step 1 — empty submission triggers aria-live error announcement', () => {
    cy.get('#step1-next').click();
    cy.get('[role="alert"]').should('exist').and('have.attr', 'aria-live', 'polite');
    cy.contains('Please select a loan type').should('be.visible');
  });

  it('Step 2 — empty submission validates required personal fields', () => {
    cy.fillStep1Personal();
    cy.get('#step2-next').click();
    cy.get('[role="alert"]').should('exist');
    cy.contains('Full name must be at least 3 characters').should('be.visible');
    cy.contains('Date of birth is required').should('be.visible');
  });

  it('Step 3 — empty submission requires KYC fields', () => {
    cy.fillStep1Personal();
    cy.fillStep2Personal();
    cy.get('#step3-next').click();
    cy.get('[role="alert"]').should('exist');
    cy.contains('PAN number is required').should('be.visible');
  });

  it('Step 4 — empty submission requires complete address details', () => {
    cy.fillStep1Personal();
    cy.fillStep2Personal();
    cy.fillStep3KYC();
    cy.get('#step4-next').click();
    cy.get('[role="alert"]').should('exist');
    cy.contains('Address must be at least 5 characters').should('be.visible');
  });
});
