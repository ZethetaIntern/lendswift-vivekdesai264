// cypress/support/e2e.js
// This file is loaded automatically before each test file.

import './commands';
import 'cypress-axe';

// Hide fetch/XHR logs for cleaner test output
const originalLog = Cypress.log;
Cypress.log = function (opts, ...rest) {
  if (opts.displayName === 'fetch' || opts.displayName === 'xhr') {
    return;
  }
  return originalLog.apply(this, [opts, ...rest]);
};

// Global before: ensure consistent state
beforeEach(() => {
  // Intercept and handle any unhandled promise rejections gracefully
  Cypress.on('uncaught:exception', (err, runnable) => {
    // Ignore Web Crypto API errors in test environment (no HTTPS)
    if (err.message.includes('crypto') || err.message.includes('Encryption')) {
      return false;
    }
    return true;
  });
});
