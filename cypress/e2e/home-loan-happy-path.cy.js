// cypress/e2e/home-loan-happy-path.cy.js
// Happy path: Home Loan (always requires co-applicant)

describe('Home Loan Happy Path', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
  });

  it('completes the full 8-step home loan application with co-applicant', () => {
    cy.get('#start-application').click();

    // ── Step 1: Loan Type ─────────────────────────────────────────
    cy.contains('label', 'Home Loan').click();
    cy.get('#loan-amount').clear().type('5000000');
    cy.get('#loan-tenure').select('180');
    cy.get('#loan-purpose').select('Purchase New Home');
    cy.get('#step1-next').click();

    // ── Step 2: Personal Info ─────────────────────────────────────
    cy.get('#full-name').type('Priya Mehta');
    cy.get('#date-of-birth').type('1985-11-20');
    cy.contains('label', 'Female').click();
    cy.contains('label', 'Married').click();
    cy.get('#email').type('priya.mehta@gmail.com');
    cy.get('#mobile').type('8765432109');
    cy.get('#father-name').type('Vikram Mehta');
    cy.get('#mother-name').type('Kavita Mehta');
    cy.get('#step2-next').click();

    // ── Step 3: KYC ───────────────────────────────────────────────
    cy.get('#pan-number').focus().type('BCQPM5678G');
    cy.get('#aadhaar-consent').check();
    cy.get('#aadhaar-number').focus().type('499118665246');
    cy.get('#data-consent').check();
    cy.get('#step3-next').click();

    // ── Step 4: Address ───────────────────────────────────────────
    cy.get('#permanentAddress-address1').type('Villa 12, Green Valley Estate, Koramangala');
    cy.get('#permanentAddress-pincode').type('560034');
    cy.wait(800);
    cy.get('#permanentAddress-years').type('8');
    cy.get('#permanentAddress-residence-type').select('owned');
    cy.get('#same-as-permanent').check();
    cy.get('#step4-next').click();

    // ── Step 5: Employment ────────────────────────────────────────
    cy.contains('label', '🧑‍💼 Self-Employed').click();
    cy.get('#business-name-se').type("Dr. Priya's Wellness Clinic");
    cy.get('#profession-type').type('Medical Doctor');
    cy.get('#business-since-se').type('2015-06-01');
    cy.get('#monthly-income-se').type('150000');
    cy.get('#step5-next').click();

    // ── Step 6: Co-Applicant (required for Home Loan) ─────────────
    cy.contains('Co-applicant Required').should('be.visible');

    cy.get('#co-full-name').type('Arjun Mehta');
    cy.get('#co-relationship').select('spouse');
    cy.get('#co-dob').type('1983-03-10');
    cy.get('#co-mobile').type('9988776655');
    cy.get('#co-email').type('arjun.mehta@email.com');
    cy.get('#co-pan').type('DEFPM4321H');
    cy.get('#co-employment-type').select('salaried');
    cy.get('#co-monthly-income').type('120000');
    cy.get('#step6-next').click();

    // ── Step 7: Documents ─────────────────────────────────────────
    // (abbreviated — signature only for test)
    cy.get('#e-signature canvas').then(($canvas) => {
      const rect = $canvas[0].getBoundingClientRect();
      cy.wrap($canvas)
        .trigger('mousedown', { clientX: rect.left + 40, clientY: rect.top + 60 })
        .trigger('mousemove', { clientX: rect.left + 200, clientY: rect.top + 90 })
        .trigger('mouseup');
    });

    cy.get('#step7-next').click();

    // ── Step 8: Review & Submit ───────────────────────────────────
    cy.contains('Home Loan').should('be.visible');
    cy.contains('Arjun Mehta').should('be.visible'); // Co-applicant shown

    cy.get('#consent-accuracy').check();
    cy.get('#consent-credit-check').check();
    cy.get('#consent-terms').check();
    cy.get('#consent-privacy').check();

    cy.get('#step8-submit').click();
    cy.contains('Application Submitted', { timeout: 10000 }).should('be.visible');
  });
});
