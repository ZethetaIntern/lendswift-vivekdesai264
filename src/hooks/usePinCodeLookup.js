import { useState, useCallback, useRef } from 'react';
import PIN_CODE_DATA from '../utils/pinCodeData';

/**
 * Hook for auto-filling address fields based on Indian PIN codes.
 * Simulates a debounced API call with a short delay.
 */
export function usePinCodeLookup() {
  const [lookupState, setLookupState] = useState({
    status: 'idle', // 'idle' | 'loading' | 'found' | 'not_found' | 'error'
    result: null,
  });

  const debounceRef = useRef(null);

  /**
   * Looks up address data for a given PIN code.
   * @param {string} pin - 6-digit PIN code
   * @returns {Promise<Object|null>} Address data or null
   */
  const lookupPinCode = useCallback((pin) => {
    return new Promise((resolve) => {
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        setLookupState({ status: 'idle', result: null });
        resolve(null);
        return;
      }

      setLookupState({ status: 'loading', result: null });

      // Simulate API delay
      debounceRef.current = setTimeout(() => {
        const data = PIN_CODE_DATA[pin];

        if (data) {
          setLookupState({ status: 'found', result: data });
          resolve(data);
        } else {
          setLookupState({ status: 'not_found', result: null });
          resolve(null);
        }
      }, 600);
    });
  }, []);

  const resetLookup = useCallback(() => {
    setLookupState({ status: 'idle', result: null });
  }, []);

  return { lookupPinCode, lookupState, resetLookup };
}

// Alias for case-insensitivity and blueprint naming compatibility
export const usePincodeLookup = usePinCodeLookup;
export default usePinCodeLookup;
