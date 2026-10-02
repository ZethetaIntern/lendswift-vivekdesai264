// cypress/e2e/e-signature.cy.js
// Tests SignatureCanvas drawing, clear/reset, and validation

describe('E-Signature Canvas', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
    cy.get('#start-application').click();
    cy.fillStep1Personal();
    cy.fillStep2Personal();
    cy.fillStep3KYC();
    cy.fillStep4Address();
    cy.fillStep5Salaried();

    // Skip step 6 if not shown
    cy.get('body').then(($body) => {
      if ($body.find('#step6-next').length) {
        cy.get('#step6-next').click();
      }
    });
  });

  it('renders signature canvas and allows drawing signature', () => {
    cy.get('#e-signature canvas').should('exist');
    cy.drawSignature();
    cy.contains('Signature captured').should('be.visible');
  });

  it('allows clearing the drawn signature', () => {
    cy.drawSignature();
    cy.contains('Signature captured').should('be.visible');
    cy.contains('button', 'Clear').click();
    cy.contains('No signature drawn').should('be.visible');
  });
});
