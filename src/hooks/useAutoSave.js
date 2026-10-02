import { useEffect, useRef, useCallback, useState } from 'react';
import { encrypt, decrypt, getDraftKey, DRAFT_PASSPHRASE } from '../utils/encryption';

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

/**
 * Custom hook for encrypted auto-save of form state to localStorage.
 * Saves every 30 seconds and on unmount.
 * Supports draft resume modal on page load.
 *
 * @param {Object} params
 * @param {Function} params.getValues - react-hook-form getValues()
 * @param {string} params.loanType - Current loan type ('personal'|'home'|'business')
 * @param {boolean} params.enabled - Whether auto-save is active
 */
export function useAutoSave({ getValues, loanType, enabled = true }) {
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSaved, setLastSaved] = useState(null);
  const intervalRef = useRef(null);
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      setSaveStatus('saving');

      const formData = getValues();
      const serialized = JSON.stringify({
        data: formData,
        savedAt: new Date().toISOString(),
        loanType,
      });

      const encrypted = await encrypt(serialized, DRAFT_PASSPHRASE);
      const key = getDraftKey(loanType || 'unknown');
      localStorage.setItem(key, encrypted);

      setSaveStatus('saved');
      setLastSaved(new Date());

      // Reset to idle after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      isSavingRef.current = false;
    }
  }, [getValues, loanType, enabled]);

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(save, AUTO_SAVE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Save on unmount
      save();
    };
  }, [save, enabled]);

  /**
   * Clears the saved draft from localStorage.
   */
  const clearDraft = useCallback(() => {
    const key = getDraftKey(loanType || 'unknown');
    localStorage.removeItem(key);
    setSaveStatus('idle');
    setLastSaved(null);
  }, [loanType]);

  return { save, saveStatus, lastSaved, clearDraft };
}

/**
 * Hook to detect and restore saved drafts on page load.
 * Returns draft data and control functions.
 */
export function useFormPersistence(loanType) {
  const [draftModal, setDraftModal] = useState(null); // null | { data, savedAt }

  /**
   * Checks localStorage for a saved draft and decrypts it.
   */
  const checkForDraft = useCallback(async () => {
    const key = getDraftKey(loanType || 'unknown');
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const decrypted = await decrypt(encrypted, DRAFT_PASSPHRASE);
      const parsed = JSON.parse(decrypted);
      const TTL_MS = 72 * 60 * 60 * 1000;
      if (parsed.savedAt && (Date.now() - new Date(parsed.savedAt).getTime() > TTL_MS)) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }, [loanType]);

  /**
   * Initiates draft check and shows resume modal if draft found.
   */
  const initDraftCheck = useCallback(async () => {
    const draft = await checkForDraft();
    if (draft && draft.data) {
      setDraftModal({
        data: draft.data,
        savedAt: new Date(draft.savedAt),
        loanType: draft.loanType,
      });
    }
  }, [checkForDraft]);

  const dismissDraft = useCallback(() => {
    setDraftModal(null);
    // Clear the draft so it doesn't show again
    const key = getDraftKey(loanType || 'unknown');
    localStorage.removeItem(key);
  }, [loanType]);

  return { draftModal, initDraftCheck, dismissDraft };
}
