/**
 * REHNOVA Passfill — local credential store with optional AES-GCM master lock.
 * Disk: salt + sealed blob. Memory/session: AES key while unlocked.
 */
(function (root) {
  const STORE_KEY = 'rehnova_passfill_v2';
  const SESSION_KEY = 'rehnova_passfill_session_key';
  const LEGACY_KEYS = ['rehnova_vault_v2', 'rehnova_vault_v1'];
  const Crypto = root.RehnovaCrypto;

  const DEFAULT_SETTINGS = {
    length: 20,
    lower: true,
    upper: true,
    digit: true,
    symbol: true,
    autoFill: true,
    offerSave: true,
    lockOnClose: true,
  };

  function emptyDisk() {
    return {
      version: 2,
      credentials: [],
      settings: Object.assign({}, DEFAULT_SETTINGS),
      crypto: null, // { salt, verify, sealed } when master enabled
    };
  }

  function diskGet() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORE_KEY].concat(LEGACY_KEYS), (res) => {
        let data = res[STORE_KEY];
        if (!data) {
          // migrate older Vault keys
          for (let i = 0; i < LEGACY_KEYS.length; i++) {
            if (res[LEGACY_KEYS[i]] && typeof res[LEGACY_KEYS[i]] === 'object') {
              data = res[LEGACY_KEYS[i]];
              break;
            }
          }
          if (data) {
            const migrated = {
              version: 2,
              credentials: Array.isArray(data.credentials) ? data.credentials : [],
              settings: Object.assign({}, DEFAULT_SETTINGS, data.settings || {}),
              crypto: data.crypto || null,
            };
            chrome.storage.local.set({ [STORE_KEY]: migrated }, () => resolve(migrated));
            return;
          }
          resolve(emptyDisk());
          return;
        }
        resolve({
          version: 2,
          credentials: Array.isArray(data.credentials) ? data.credentials : [],
          settings: Object.assign({}, DEFAULT_SETTINGS, data.settings || {}),
          crypto: data.crypto || null,
        });
      });
    });
  }

  function diskSet(state) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORE_KEY]: state }, () => resolve(state));
    });
  }

  // Fallback when storage.session is missing (rare / old engines)
  let memorySessionKey = null;

  function sessionGetRawKey() {
    return new Promise((resolve) => {
      if (chrome.storage && chrome.storage.session) {
        chrome.storage.session.get([SESSION_KEY], (res) => {
          resolve((res && res[SESSION_KEY]) || memorySessionKey || null);
        });
        return;
      }
      resolve(memorySessionKey);
    });
  }

  function sessionSetRawKey(b64) {
    memorySessionKey = b64 || null;
    return new Promise((resolve) => {
      if (!chrome.storage || !chrome.storage.session) {
        resolve();
        return;
      }
      if (!b64) {
        chrome.storage.session.remove([SESSION_KEY], () => resolve());
      } else {
        chrome.storage.session.set({ [SESSION_KEY]: b64 }, () => resolve());
      }
    });
  }

  function uid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function hostFromOrigin(origin) {
    try {
      return new URL(origin).hostname;
    } catch {
      return String(origin || '');
    }
  }

  async function getCryptoKey() {
    const raw = await sessionGetRawKey();
    if (!raw) return null;
    try {
      return await Crypto.importRawKey(raw);
    } catch {
      return null;
    }
  }

  async function status() {
    const disk = await diskGet();
    const hasMaster = !!(disk.crypto && disk.crypto.salt && disk.crypto.sealed != null);
    const key = hasMaster ? await getCryptoKey() : null;
    const unlocked = !hasMaster || !!key;
    let count = 0;
    if (unlocked) {
      try {
        const creds = await listCredentialsInternal(disk, key, hasMaster);
        count = creds.length;
      } catch {
        count = 0;
      }
    }
    return {
      hasMaster,
      unlocked,
      locked: hasMaster && !key,
      count,
      settings: disk.settings,
    };
  }

  async function listCredentialsInternal(disk, key, hasMaster) {
    if (!hasMaster) {
      return Array.isArray(disk.credentials) ? disk.credentials.slice() : [];
    }
    if (!key) throw new Error('Vault is locked');
    if (!disk.crypto.sealed) return [];
    const json = await Crypto.decryptString(key, disk.crypto.sealed);
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  }

  async function persistCredentials(disk, key, hasMaster, credentials) {
    if (!hasMaster) {
      disk.credentials = credentials;
      disk.crypto = null;
      return diskSet(disk);
    }
    if (!key) throw new Error('Vault is locked');
    const sealed = await Crypto.encryptString(key, JSON.stringify(credentials));
    disk.crypto = Object.assign({}, disk.crypto, { sealed });
    disk.credentials = []; // never leave plaintext on disk when locked mode on
    return diskSet(disk);
  }

  async function requireUnlocked() {
    const st = await status();
    if (st.locked) {
      const err = new Error('Vault is locked — unlock with master passphrase');
      err.code = 'LOCKED';
      throw err;
    }
    const disk = await diskGet();
    const hasMaster = !!(disk.crypto && disk.crypto.salt);
    const key = hasMaster ? await getCryptoKey() : null;
    return { disk, key, hasMaster };
  }

  async function getSettings() {
    const disk = await diskGet();
    return disk.settings;
  }

  async function updateSettings(patch) {
    const disk = await diskGet();
    disk.settings = Object.assign({}, disk.settings, patch);
    await diskSet(disk);
    return disk.settings;
  }

  async function listCredentials() {
    const { disk, key, hasMaster } = await requireUnlocked();
    return (await listCredentialsInternal(disk, key, hasMaster)).sort(
      (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
    );
  }

  async function findForHost(host) {
    const list = await listCredentials();
    const h = String(host || '').toLowerCase();
    return list.filter((c) => {
      const ch = (c.host || hostFromOrigin(c.origin) || '').toLowerCase();
      return ch === h || h.endsWith('.' + ch) || ch.endsWith('.' + h);
    });
  }

  async function findForOrigin(origin) {
    try {
      return findForHost(new URL(origin).hostname);
    } catch {
      return [];
    }
  }

  async function upsertCredential({ origin, username, password, title }) {
    const { disk, key, hasMaster } = await requireUnlocked();
    const creds = await listCredentialsInternal(disk, key, hasMaster);
    const host = hostFromOrigin(origin);
    const user = String(username || '').trim();
    const pass = String(password || '');
    if (!host || !pass) throw new Error('host and password required');

    const now = Date.now();
    const existing = creds.find(
      (c) =>
        (c.host || hostFromOrigin(c.origin)).toLowerCase() === host.toLowerCase() &&
        String(c.username || '').toLowerCase() === user.toLowerCase()
    );

    let row;
    if (existing) {
      existing.password = pass;
      existing.origin = origin || existing.origin;
      existing.updatedAt = now;
      if (title) existing.title = title;
      row = existing;
    } else {
      row = {
        id: uid(),
        origin: origin || 'https://' + host,
        host,
        username: user,
        password: pass,
        title: title || host,
        createdAt: now,
        updatedAt: now,
      };
      creds.push(row);
    }
    await persistCredentials(disk, key, hasMaster, creds);
    return { id: row.id, host: row.host, username: row.username, updatedAt: row.updatedAt };
  }

  async function deleteCredential(id) {
    const { disk, key, hasMaster } = await requireUnlocked();
    let creds = await listCredentialsInternal(disk, key, hasMaster);
    creds = creds.filter((c) => c.id !== id);
    await persistCredentials(disk, key, hasMaster, creds);
    return true;
  }

  async function clearAll() {
    const settings = (await diskGet()).settings;
    await sessionSetRawKey(null);
    const empty = emptyDisk();
    empty.settings = settings;
    await diskSet(empty);
    return true;
  }

  /** Enable master passphrase and seal current credentials. */
  async function setupMaster(passphrase) {
    if (!passphrase || String(passphrase).length < 8) {
      throw new Error('Master passphrase must be at least 8 characters');
    }
    const disk = await diskGet();
    if (disk.crypto && disk.crypto.salt) {
      throw new Error('Master lock already set — unlock and use change master');
    }
    const creds = Array.isArray(disk.credentials) ? disk.credentials : [];
    const bundle = await Crypto.createMasterBundle(passphrase, JSON.stringify(creds));
    disk.crypto = {
      salt: bundle.salt,
      verify: bundle.verify,
      sealed: bundle.sealed,
      kdf: 'PBKDF2-SHA256',
      iters: Crypto.PBKDF2_ITERS,
      cipher: 'AES-GCM-256',
    };
    disk.credentials = [];
    await diskSet(disk);
    await sessionSetRawKey(bundle.rawKeyB64);
    return { hasMaster: true, unlocked: true };
  }

  async function unlock(passphrase) {
    const disk = await diskGet();
    if (!disk.crypto || !disk.crypto.salt) {
      throw new Error('No master lock configured');
    }
    const { rawKeyB64 } = await Crypto.unlockWithPassphrase(
      passphrase,
      disk.crypto.salt,
      disk.crypto.verify
    );
    // ensure sealed decrypts
    const key = await Crypto.importRawKey(rawKeyB64);
    await listCredentialsInternal(disk, key, true);
    await sessionSetRawKey(rawKeyB64);
    return { unlocked: true };
  }

  async function lock() {
    await sessionSetRawKey(null);
    return { locked: true };
  }

  async function changeMaster(oldPass, newPass) {
    if (!newPass || String(newPass).length < 8) {
      throw new Error('New master passphrase must be at least 8 characters');
    }
    const disk = await diskGet();
    if (!disk.crypto || !disk.crypto.salt) {
      throw new Error('No master lock configured');
    }
    const { key: oldKey } = await Crypto.unlockWithPassphrase(
      oldPass,
      disk.crypto.salt,
      disk.crypto.verify
    );
    const creds = await listCredentialsInternal(disk, oldKey, true);
    const bundle = await Crypto.createMasterBundle(newPass, JSON.stringify(creds));
    disk.crypto = {
      salt: bundle.salt,
      verify: bundle.verify,
      sealed: bundle.sealed,
      kdf: 'PBKDF2-SHA256',
      iters: Crypto.PBKDF2_ITERS,
      cipher: 'AES-GCM-256',
    };
    disk.credentials = [];
    await diskSet(disk);
    await sessionSetRawKey(bundle.rawKeyB64);
    return { ok: true };
  }

  async function removeMaster(passphrase) {
    const disk = await diskGet();
    if (!disk.crypto || !disk.crypto.salt) {
      return { hasMaster: false };
    }
    const { key } = await Crypto.unlockWithPassphrase(
      passphrase,
      disk.crypto.salt,
      disk.crypto.verify
    );
    const creds = await listCredentialsInternal(disk, key, true);
    disk.credentials = creds;
    disk.crypto = null;
    await diskSet(disk);
    await sessionSetRawKey(null);
    return { hasMaster: false, unlocked: true };
  }

  /** Encrypted export always uses master if set; else plaintext JSON with warning flag. */
  async function exportVault() {
    const disk = await diskGet();
    const hasMaster = !!(disk.crypto && disk.crypto.salt);
    if (hasMaster) {
      // export sealed package (portable encrypted backup)
      return {
        format: 'rehnova-passfill-export',
        version: 2,
        exportedAt: new Date().toISOString(),
        encrypted: true,
        crypto: {
          salt: disk.crypto.salt,
          verify: disk.crypto.verify,
          sealed: disk.crypto.sealed,
          kdf: disk.crypto.kdf || 'PBKDF2-SHA256',
          iters: disk.crypto.iters || Crypto.PBKDF2_ITERS,
          cipher: disk.crypto.cipher || 'AES-GCM-256',
        },
        settings: disk.settings,
      };
    }
    const { disk: d, key, hasMaster: hm } = await requireUnlocked();
    const creds = await listCredentialsInternal(d, key, hm);
    return {
      format: 'rehnova-passfill-export',
      version: 2,
      exportedAt: new Date().toISOString(),
      encrypted: false,
      credentials: creds,
      settings: d.settings,
      warning: 'PLAINTEXT — protect this file. Enable master lock for encrypted exports.',
    };
  }

  async function importVault(payload, passphrase) {
    const fmt = payload && payload.format;
    if (fmt !== 'rehnova-passfill-export' && fmt !== 'rehnova-vault-export') {
      throw new Error('Invalid REHNOVA Passfill export file');
    }
    if (payload.encrypted) {
      if (!passphrase) throw new Error('Passphrase required for encrypted import');
      const { key, rawKeyB64 } = await Crypto.unlockWithPassphrase(
        passphrase,
        payload.crypto.salt,
        payload.crypto.verify
      );
      const json = await Crypto.decryptString(key, payload.crypto.sealed);
      const creds = JSON.parse(json);
      if (!Array.isArray(creds)) throw new Error('Corrupt export');

      const disk = await diskGet();
      // keep crypto from import (re-seal with same master material)
      disk.crypto = {
        salt: payload.crypto.salt,
        verify: payload.crypto.verify,
        sealed: payload.crypto.sealed,
        kdf: payload.crypto.kdf,
        iters: payload.crypto.iters,
        cipher: payload.crypto.cipher,
      };
      disk.credentials = [];
      if (payload.settings) {
        disk.settings = Object.assign({}, DEFAULT_SETTINGS, payload.settings);
      }
      await diskSet(disk);
      await sessionSetRawKey(rawKeyB64);
      return { imported: creds.length, encrypted: true };
    }

    // plaintext import
    const creds = Array.isArray(payload.credentials) ? payload.credentials : [];
    const disk = await diskGet();
    if (disk.crypto && disk.crypto.salt) {
      // merge into sealed vault — must be unlocked
      const { key, hasMaster } = await requireUnlocked();
      const existing = await listCredentialsInternal(disk, key, hasMaster);
      const map = new Map(existing.map((c) => [c.host + '\0' + (c.username || ''), c]));
      creds.forEach((c) => {
        const k = (c.host || '') + '\0' + (c.username || '');
        map.set(k, Object.assign({ id: uid() }, c));
      });
      await persistCredentials(disk, key, true, Array.from(map.values()));
      return { imported: creds.length, encrypted: false };
    }
    disk.credentials = creds.map((c) =>
      Object.assign({ id: c.id || uid() }, c)
    );
    if (payload.settings) {
      disk.settings = Object.assign({}, DEFAULT_SETTINGS, payload.settings);
    }
    disk.crypto = null;
    await diskSet(disk);
    return { imported: creds.length, encrypted: false };
  }

  const api = {
    STORE_KEY,
    DEFAULT_SETTINGS,
    status,
    getSettings,
    updateSettings,
    listCredentials,
    findForHost,
    findForOrigin,
    upsertCredential,
    deleteCredential,
    clearAll,
    setupMaster,
    unlock,
    lock,
    changeMaster,
    removeMaster,
    exportVault,
    importVault,
    hostFromOrigin,
  };

  root.RehnovaVault = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : self);
