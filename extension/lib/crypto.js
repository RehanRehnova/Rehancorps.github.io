/**
 * REHNOVA Passfill — PBKDF2 + AES-GCM (Web Crypto).
 * Master passphrase never stored; only salt + ciphertext at rest.
 */
(function (root) {
  const PBKDF2_ITERS = 310000;
  const VERIFY_PLAIN = 'REHNOVA_PASSFILL_OK_v1';

  function b64encode(buf) {
    const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  function b64decode(str) {
    const bin = atob(str);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function deriveKey(passphrase, saltBytes) {
    const enc = new TextEncoder();
    const base = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: PBKDF2_ITERS,
        hash: 'SHA-256',
      },
      base,
      { name: 'AES-GCM', length: 256 },
      true, // extractable so we can park raw key in session storage
      ['encrypt', 'decrypt']
    );
  }

  async function exportRawKey(key) {
    const raw = await crypto.subtle.exportKey('raw', key);
    return b64encode(raw);
  }

  async function importRawKey(b64) {
    return crypto.subtle.importKey(
      'raw',
      b64decode(b64),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptString(key, plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ct = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plaintext)
    );
    // iv (12) || ciphertext
    const combined = new Uint8Array(iv.length + ct.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ct), iv.length);
    return b64encode(combined);
  }

  async function decryptString(key, b64) {
    const combined = b64decode(b64);
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(pt);
  }

  async function makeSalt() {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  async function createMasterBundle(passphrase, credentialsJson) {
    const salt = await makeSalt();
    const key = await deriveKey(passphrase, salt);
    const verify = await encryptString(key, VERIFY_PLAIN);
    const sealed = await encryptString(key, credentialsJson);
    return {
      salt: b64encode(salt),
      verify,
      sealed,
      key,
      rawKeyB64: await exportRawKey(key),
    };
  }

  async function unlockWithPassphrase(passphrase, saltB64, verifyB64) {
    const key = await deriveKey(passphrase, b64decode(saltB64));
    try {
      const check = await decryptString(key, verifyB64);
      if (check !== VERIFY_PLAIN) throw new Error('bad passphrase');
    } catch {
      throw new Error('Wrong master passphrase');
    }
    return {
      key,
      rawKeyB64: await exportRawKey(key),
    };
  }

  const api = {
    PBKDF2_ITERS,
    VERIFY_PLAIN,
    b64encode,
    b64decode,
    deriveKey,
    exportRawKey,
    importRawKey,
    encryptString,
    decryptString,
    createMasterBundle,
    unlockWithPassphrase,
  };

  root.RehnovaCrypto = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : self);
