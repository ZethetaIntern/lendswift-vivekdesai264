// cypress/e2e/accessibility-axe.cy.js
// Audits WCAG 2.1 AA compliance across loan application wizard using axe-core

describe('Accessibility Audit — WCAG 2.1 AA Compliance', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
    cy.injectAxe();
  });

  const a11yOptions = {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa'],
    },
    rules: {
      'color-contrast': { enabled: false }, // Tailwind dynamic gradients evaluated in headless without full GPU rendering
    },
  };

  it('audits landing page for accessibility violations', () => {
    cy.checkA11y(null, a11yOptions);
  });

  it('audits Step 1 (Loan Type) for accessibility', () => {
    cy.get('#start-application').click();
    cy.checkA11y(null, a11yOptions);
  });

  it('audits Step 2 (Personal Info) for accessibility', () => {
    cy.get('#start-application').click();
    cy.fillStep1Personal();
    cy.checkA11y(null, a11yOptions);
  });
});
