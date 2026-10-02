import { useState, useCallback } from 'react';
import { validatePAN, validateAadhaar } from '../utils/validators';

/**
 * Simulates KYC verification API calls with a 1.5-second delay.
 * Handles PAN and Aadhaar verification with loading, success, and error states.
 */

const VERIFY_DELAY = 1500; // ms

// Simulated API: PANs starting with 'AABCD' are always valid, others pass format check only
// In production, this would call a real NSDL/UIDAI API.
function simulatePANVerification(pan) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const { valid, entityType, message } = validatePAN(pan);
      if (!valid) {
        reject(new Error(message));
        return;
      }
      // Simulate occasional server-side rejection (for demo: PANs ending in '0' fail)
      if (pan.slice(-1) === '0') {
        reject(new Error('PAN not found in NSDL database'));
        return;
      }
      resolve({ entityType, message: `PAN verified — ${entityType}` });
    }, VERIFY_DELAY);
  });
}

function simulateAadhaarVerification(aadhaar) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const cleaned = aadhaar.replace(/\s+/g, '');
      const { valid, message } = validateAadhaar(cleaned);
      if (!valid) {
        reject(new Error(message));
        return;
      }
      // Simulate OTP sent (in real app would show OTP modal)
      resolve({ message: 'Aadhaar verified via OTP simulation', maskedMobile: '******1234' });
    }, VERIFY_DELAY);
  });
}

/**
 * Hook for managing KYC verification state.
 * @returns {{ verifyPAN, verifyAadhaar, panState, aadhaarState, resetPAN, resetAadhaar }}
 */
export function useVerification() {
  const [panState, setPanState] = useState({
    status: 'idle', // 'idle' | 'loading' | 'success' | 'error'
    message: '',
    entityType: null,
  });

  const [aadhaarState, setAadhaarState] = useState({
    status: 'idle',
    message: '',
    maskedMobile: null,
  });

  const verifyPAN = useCallback(async (pan) => {
    if (!pan) {
      setPanState({ status: 'error', message: 'PAN number is required', entityType: null });
      return false;
    }

    setPanState({ status: 'loading', message: 'Verifying PAN...', entityType: null });

    try {
      const result = await simulatePANVerification(pan.toUpperCase().trim());
      setPanState({
        status: 'success',
        message: result.message,
        entityType: result.entityType,
      });
      return true;
    } catch (err) {
      setPanState({ status: 'error', message: err.message, entityType: null });
      return false;
    }
  }, []);

  const verifyAadhaar = useCallback(async (aadhaar) => {
    if (!aadhaar) {
      setAadhaarState({ status: 'error', message: 'Aadhaar number is required', maskedMobile: null });
      return false;
    }

    setAadhaarState({ status: 'loading', message: 'Sending OTP to registered mobile...', maskedMobile: null });

    try {
      const result = await simulateAadhaarVerification(aadhaar);
      setAadhaarState({
        status: 'success',
        message: result.message,
        maskedMobile: result.maskedMobile,
      });
      return true;
    } catch (err) {
      setAadhaarState({ status: 'error', message: err.message, maskedMobile: null });
      return false;
    }
  }, []);

  const resetPAN = useCallback(() => {
    setPanState({ status: 'idle', message: '', entityType: null });
  }, []);

  const resetAadhaar = useCallback(() => {
    setAadhaarState({ status: 'idle', message: '', maskedMobile: null });
  }, []);

  return { verifyPAN, verifyAadhaar, panState, aadhaarState, resetPAN, resetAadhaar };
}
