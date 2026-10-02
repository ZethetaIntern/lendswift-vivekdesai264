/**
 * AES-256-GCM encryption/decryption using the Web Crypto API.
 * Used to securely encrypt form state saved to localStorage.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // bytes for GCM

/**
 * Derives an AES-GCM key from a passphrase using PBKDF2.
 * @param {string} passphrase
 * @param {Uint8Array} salt
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(passphrase, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Converts ArrayBuffer to base64 string.
 */
function bufToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts base64 string to Uint8Array.
 */
function base64ToBuf(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypts data with AES-256-GCM.
 * Returns a JSON string containing: { salt, iv, ciphertext } — all base64 encoded.
 * @param {string} plaintext - Data to encrypt
 * @param {string} passphrase - Encryption passphrase
 * @returns {Promise<string>} Encrypted payload as JSON string
 */
export async function encrypt(plaintext, passphrase) {
  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const key = await deriveKey(passphrase, salt);
    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoder.encode(plaintext)
    );

    return JSON.stringify({
      salt: bufToBase64(salt),
      iv: bufToBase64(iv),
      ciphertext: bufToBase64(ciphertext),
    });
  } catch (err) {
    throw new Error('Encryption failed', { cause: err });
  }
}

/**
 * Decrypts data encrypted with AES-256-GCM.
 * @param {string} encryptedPayload - JSON string from encrypt()
 * @param {string} passphrase - Same passphrase used for encryption
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decrypt(encryptedPayload, passphrase) {
  try {
    const { salt, iv, ciphertext } = JSON.parse(encryptedPayload);

    const saltBuf = base64ToBuf(salt);
    const ivBuf = base64ToBuf(iv);
    const ciphertextBuf = base64ToBuf(ciphertext);

    const key = await deriveKey(passphrase, saltBuf);
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: ivBuf },
      key,
      ciphertextBuf
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    throw new Error('Decryption failed — data may be corrupted or passphrase mismatch', { cause: err });
  }
}

/**
 * Generates the localStorage key for a draft.
 * @param {string} loanType - 'personal' | 'home' | 'business'
 * @returns {string}
 */
export function getDraftKey(loanType) {
  return `lendswift_draft_${loanType || 'unknown'}`;
}

/**
 * The passphrase used to encrypt drafts.
 * In a real app this would be user-specific (e.g., derived from session token).
 */
export const DRAFT_PASSPHRASE = 'LendSwift-AES256-SecureDraft-2024';
