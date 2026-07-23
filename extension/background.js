/* REHNOVA Passfill — service worker (Chrome / Edge / Brave / Firefox)
 * Copyright (c) 2026 REHNOVA. All rights reserved. See LICENSE. */
importScripts('config.js', 'lib/crypto.js', 'lib/vault.js');

const Vault = self.RehnovaVault;
const PINGED_KEY = 'passfill_install_counted';

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Passfill]', details.reason, '— local AES vault ready');
  if (details.reason === 'install') {
    countInstall().catch(function () {});
  }
});

async function countInstall() {
  var enable = true;
  var ns = 'rehnova';
  var key = 'passfill-installs';
  try {
    if (typeof PASSFILL_COUNT_ENABLE === 'boolean') enable = PASSFILL_COUNT_ENABLE;
    if (typeof PASSFILL_COUNT_NS === 'string' && PASSFILL_COUNT_NS) ns = PASSFILL_COUNT_NS;
    if (typeof PASSFILL_COUNT_KEY === 'string' && PASSFILL_COUNT_KEY) key = PASSFILL_COUNT_KEY;
  } catch (_) {}
  if (!enable) return;

  var already = await new Promise(function (resolve) {
    chrome.storage.local.get([PINGED_KEY], function (res) {
      resolve(!!res[PINGED_KEY]);
    });
  });
  if (already) return;

  var url = 'https://api.counterapi.dev/v1/' + encodeURIComponent(ns) + '/' + encodeURIComponent(key) + '/up';
  try {
    var res = await fetch(url, { method: 'GET' });
    if (res.ok) {
      chrome.storage.local.set({ [PINGED_KEY]: true });
    }
  } catch (_) {
    /* offline — ignore */
  }
}

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
