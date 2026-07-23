/* REHNOVA Passfill — service worker (Chrome / Edge / Brave / Firefox)
 * Copyright (c) 2026 REHNOVA. All rights reserved. See LICENSE. */
importScripts('lib/crypto.js', 'lib/vault.js');

const Vault = self.RehnovaVault;

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Passfill]', details.reason, '— local AES vault ready');
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handle(msg)
    .then((result) => sendResponse({ ok: true, result }))
    .catch((err) =>
      sendResponse({
        ok: false,
        error: String(err && err.message ? err.message : err),
        code: err && err.code ? err.code : undefined,
      })
    );
  return true;
});

async function handle(msg) {
  const type = msg && msg.type;
  switch (type) {
    case 'STATUS':
      return Vault.status();
    case 'GET_SETTINGS':
      return Vault.getSettings();
    case 'UPDATE_SETTINGS':
      return Vault.updateSettings(msg.patch || {});
    case 'LIST':
      return Vault.listCredentials();
    case 'FIND_ORIGIN':
      return Vault.findForOrigin(msg.origin);
    case 'FIND_HOST':
      return Vault.findForHost(msg.host);
    case 'SAVE':
      return Vault.upsertCredential(msg.credential || {});
    case 'DELETE':
      return Vault.deleteCredential(msg.id);
    case 'CLEAR_ALL':
      return Vault.clearAll();
    case 'SETUP_MASTER':
      return Vault.setupMaster(msg.passphrase);
    case 'UNLOCK':
      return Vault.unlock(msg.passphrase);
    case 'LOCK':
      return Vault.lock();
    case 'CHANGE_MASTER':
      return Vault.changeMaster(msg.oldPassphrase, msg.newPassphrase);
    case 'REMOVE_MASTER':
      return Vault.removeMaster(msg.passphrase);
    case 'EXPORT':
      return Vault.exportVault();
    case 'IMPORT':
      return Vault.importVault(msg.payload, msg.passphrase);
    default:
      throw new Error('unknown message: ' + type);
  }
}
