// cypress/support/commands.js
// Custom Cypress commands for LendSwift loan application tests

/**
 * Fills Step 1 with Personal Loan defaults (< 5L)
 */
Cypress.Commands.add('fillStep1Personal', (options = {}) => {
  const {
    loanType = 'personal',
    amount = '300000',
    tenure = '36',
    purpose = 'Medical Emergency',
  } = options;

  cy.contains('label', loanType === 'personal' ? 'Personal Loan' :
               loanType === 'home' ? 'Home Loan' : 'Business Loan').click();

  cy.get('#loan-amount').clear().type(amount);
  cy.get('#loan-tenure').select(tenure);
  cy.get('#loan-purpose').select(purpose);
  cy.get('#step1-next').click();
});

/**
 * Fills Step 1 with Home Loan defaults
 */
Cypress.Commands.add('fillStep1Home', () => {
  cy.fillStep1Personal({
    loanType: 'home',
    amount: '5000000',
    tenure: '180',
    purpose: 'Purchase New Home',
  });
});

/**
 * Fills Step 1 with Business Loan defaults (> 20L)
 */
Cypress.Commands.add('fillStep1Business', () => {
  cy.fillStep1Personal({
    loanType: 'business',
    amount: '3000000',
    tenure: '60',
    purpose: 'Business Expansion',
  });
});

/**
 * Fills Step 2: Personal Information with defaults
 */
Cypress.Commands.add('fillStep2Personal', (options = {}) => {
  const {
    name = 'Rajesh Kumar Sharma',
    dob = '1990-05-15',
    gender = 'Male',
    maritalStatus = 'Single',
    email = 'rajesh.sharma@email.com',
    mobile = '9876543210',
    fatherName = 'Ramesh Kumar Sharma',
    motherName = 'Sunita Sharma',
  } = options;

  cy.get('#full-name').type(name);
  cy.get('#date-of-birth').type(dob);
  cy.contains('label', gender).click();
  cy.contains('label', maritalStatus).click();
  cy.get('#email').type(email);
  cy.get('#mobile').type(mobile);
  cy.get('#father-name').type(fatherName);
  cy.get('#mother-name').type(motherName);
  cy.get('#step2-next').click();
});

/**
 * Fills Step 3: KYC with valid defaults
 */
Cypress.Commands.add('fillStep3KYC', (options = {}) => {
  const {
    pan = 'ABCPE1234F',
    aadhaar = '234123412346',
    verify = false,
  } = options;

  cy.get('#pan-number').focus().type(pan);

  if (verify) {
    cy.contains('button', 'Verify').first().click();
    cy.wait(2000); // Wait for verification simulation
  }

  cy.get('#aadhaar-consent').check();
  cy.get('#aadhaar-number').focus().type(aadhaar);
  cy.get('#data-consent').check();
  cy.get('#step3-next').click();
});

/**
 * Fills Step 4: Address with defaults
 */
Cypress.Commands.add('fillStep4Address', (options = {}) => {
  const {
    address = 'Flat 4B, Sunshine Apartments, MG Road',
    pinCode = '560001',
    years = '5',
    residenceType = 'owned',
    sameAsCurrent = true,
  } = options;

  cy.get('#permanentAddress-address1').type(address);
  cy.get('#permanentAddress-pincode').type(pinCode);
  cy.wait(800); // PIN lookup

  cy.get('#permanentAddress-years').type(years);
  cy.get('#permanentAddress-residence-type').select(residenceType);

  if (sameAsCurrent) {
    cy.get('#same-as-permanent').check();
  }

  cy.get('#step4-next').click();
});

/**
 * Fills Step 5: Employment — Salaried
 */
Cypress.Commands.add('fillStep5Salaried', (options = {}) => {
  const {
    employer = 'Infosys Limited',
    designation = 'Senior Software Engineer',
    since = '2018-03-01',
    companyType = 'private_listed',
    income = '80000',
    salaryMode = 'bank',
  } = options;

  cy.contains('label', '💼 Salaried').click();
  cy.get('#employer-name').type(employer);
  cy.get('#designation').type(designation);
  cy.get('#employment-since').type(since);
  cy.get('#company-type').select(companyType);
  cy.get('#monthly-income-salaried').type(income);
  cy.get('#salary-account').select(salaryMode);
  cy.get('#step5-next').click();
});

/**
 * Fills Step 5: Employment — Self Employed
 */
Cypress.Commands.add('fillStep5SelfEmployed', (options = {}) => {
  const {
    businessName = 'Dr. Sharma Medical Clinic',
    profession = 'Medical Doctor',
    since = '2015-06-01',
    income = '120000',
  } = options;

  cy.contains('label', '🧑‍💼 Self-Employed').click();
  cy.get('#business-name-se').type(businessName);
  cy.get('#profession-type').type(profession);
  cy.get('#business-since-se').type(since);
  cy.get('#monthly-income-se').type(income);
  cy.get('#step5-next').click();
});

/**
 * Fills Step 5: Employment — Business Owner
 */
Cypress.Commands.add('fillStep5BusinessOwner', (options = {}) => {
  const {
    businessName = 'TechVenture Pvt Ltd',
    businessType = 'pvt_ltd',
    gst = '27AACPT1234C1ZK',
    since = '2010-01-01',
    income = '200000',
    turnover = '20000000',
  } = options;

  cy.contains('label', '🏭 Business Owner').click();
  cy.get('#business-name-bo').type(businessName);
  cy.get('#business-type').select(businessType);
  cy.get('#gst-number').type(gst);
  cy.get('#business-since-bo').type(since);
  cy.get('#monthly-income-bo').type(income);
  cy.get('#annual-turnover').type(turnover);
  cy.get('#step5-next').click();
});

/**
 * Fills Step 6: Co-Applicant
 */
Cypress.Commands.add('fillStep6CoApplicant', (options = {}) => {
  const {
    name = 'Spouse Name',
    relationship = 'spouse',
    dob = '1988-01-01',
    mobile = '8877665544',
    pan = 'DEFPM4321H',
    empType = 'salaried',
    income = '50000',
  } = options;

  cy.get('#co-full-name').type(name);
  cy.get('#co-relationship').select(relationship);
  cy.get('#co-dob').type(dob);
  cy.get('#co-mobile').type(mobile);
  cy.get('#co-pan').type(pan);
  cy.get('#co-employment-type').select(empType);
  cy.get('#co-monthly-income').type(income);
  cy.get('#step6-next').click();
});

/**
 * Draws a simple e-signature on the canvas
 */
Cypress.Commands.add('drawSignature', () => {
  cy.get('#e-signature canvas').should('be.visible').then(($canvas) => {
    const canvas = $canvas[0];
    canvas.dispatchEvent(new CustomEvent('signature:draw'));
  });
});

/**
 * Fills all 4 mandatory review consents and submits
 */
Cypress.Commands.add('submitWithConsents', () => {
  cy.get('#consent-accuracy').check();
  cy.get('#consent-credit-check').check();
  cy.get('#consent-terms').check();
  cy.get('#consent-privacy').check();
  cy.get('#step8-submit').click();
});

/**
 * Custom .tab() command for keyboard navigation tests
 */
Cypress.Commands.add('tab', { prevSubject: ['optional', 'element'] }, (subject) => {
  return cy.document().then((doc) => {
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(doc.querySelectorAll(focusableSelector)).filter((el) => {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0 || el.classList.contains('sr-only') || el.getAttribute('href') === '#main-content';
    });

    if (!focusables.length) return null;

    let target;
    const isBody = !subject || !subject.length || subject[0] === doc.body || subject[0].tagName?.toLowerCase() === 'body';
    if (isBody) {
      target = focusables[0];
    } else {
      const currentIndex = focusables.indexOf(subject[0]);
      if (currentIndex !== -1 && currentIndex + 1 < focusables.length) {
        target = focusables[currentIndex + 1];
      } else {
        target = focusables[0];
      }
    }

    if (target) {
      target.focus();
      return cy.wrap(target, { log: false });
    }
  });
});

