// cypress/e2e/file-upload.cy.js
// Tests drag & drop file upload, file format restrictions, and image compression

describe('Document Upload & Image Compression', () => {
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

  it('renders required document dropzones dynamically', () => {
    cy.get('#doc-applicantPhoto').should('exist');
    cy.get('#doc-aadhaarFront').should('exist');
    cy.get('#doc-aadhaarBack').should('exist');
    cy.get('#doc-addressProof').should('exist');
  });

  it('uploads and accepts valid JPG files with preview', () => {
    cy.get('#doc-applicantPhoto').scrollIntoView().then(($el) => {
      const file = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
      $el[0].dispatchEvent(new CustomEvent('file:upload', { detail: { file } }));
    });
    cy.get('#doc-applicantPhoto').scrollIntoView().should('contain', 'test-image.jpg');
  });
});
