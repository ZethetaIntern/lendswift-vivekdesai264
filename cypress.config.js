import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
    viewportWidth: 1280,
    viewportHeight: 800,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    pageLoadTimeout: 30000,
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    env: {
      // Test credentials / data
      testPAN: 'ABCPE1234F',
      testAadhaar: '234123412346',
    },
  },
});
