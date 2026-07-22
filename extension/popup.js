/* REHNOVA Passfill — popup (lock gate + generator + vault + backup) */
(function () {
  const $ = (id) => document.getElementById(id);

  function rpc(type, payload) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(Object.assign({ type }, payload || {}), (res) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!res || !res.ok) {
          const e = new Error((res && res.error) || 'failed');
          e.code = res && res.code;
          reject(e);
        } else resolve(res.result);
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── gate / lock UI ── */
  async function boot() {
    const st = await rpc('STATUS');
    if (st.locked) {
      showGate('unlock');
      return;
    }
    hideGate();
    await initApp(st);
  }

  function showGate(mode) {
    $('gate').hidden = false;
    $('app').hidden = true;
    $('lockBtn').hidden = true;
    $('gatePass2').hidden = mode !== 'setup';
    $('gatePass').value = '';
    $('gatePass2').value = '';
    $('gateMsg').textContent = '';
    if (mode === 'setup') {
      $('gateLabel').textContent = 'Create master lock';
      $('gateHint').textContent =
        'AES-256-GCM with PBKDF2. Passphrase is never stored — only salt + ciphertext.';
      $('gateGo').textContent = 'Enable lock';
      $('gateGo').dataset.mode = 'setup';
    } else {
      $('gateLabel').textContent = 'Unlock vault';
      $('gateHint').textContent =
        'Vault is encrypted on disk. Unlock for this browser session.';
      $('gateGo').textContent = 'Unlock';
      $('gateGo').dataset.mode = 'unlock';
    }
    $('gatePass').focus();
  }

  function hideGate() {
    $('gate').hidden = true;
    $('app').hidden = false;
  }

  $('gateGo').addEventListener('click', async () => {
    const mode = $('gateGo').dataset.mode;
    const p = $('gatePass').value;
    $('gateMsg').textContent = '';
    try {
      if (mode === 'setup') {
        if (p !== $('gatePass2').value) throw new Error('Passphrases do not match');
        await rpc('SETUP_MASTER', { passphrase: p });
        $('gateMsg').textContent = 'Master lock enabled';
        await boot();
      } else {
        await rpc('UNLOCK', { passphrase: p });
        await boot();
      }
    } catch (e) {
      $('gateMsg').textContent = e.message || String(e);
    }
  });

  $('gatePass').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('gateGo').click();
  });

  $('lockBtn').addEventListener('click', async () => {
    await rpc('LOCK');
    showGate('unlock');
  });

  /* ── main app ── */
  const out = $('out');
  const lenEl = $('len');
  const msg = $('msg');
  const listEl = $('list');
  const emptyEl = $('empty');
  const countEl = $('count');
  const sets = $('sets');

  function currentOpts() {
    const opts = {
      length: parseInt(lenEl.value, 10) || 20,
      lower: false,
      upper: false,
      digit: false,
      symbol: false,
    };
    sets.querySelectorAll('.chip.is-on').forEach((b) => {
      opts[b.dataset.set] = true;
    });
    return opts;
  }

  function generate() {
    const opts = currentOpts();
    const pw = globalThis.RehnovaPassword.generatePassword(opts);
    out.value = pw;
    msg.textContent = 'generated · ' + pw.length + ' chars';
    rpc('UPDATE_SETTINGS', {
      patch: {
        length: opts.length,
        lower: opts.lower,
        upper: opts.upper,
        digit: opts.digit,
        symbol: opts.symbol,
      },
    }).catch(() => {});
  }

  sets.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', () => btn.classList.toggle('is-on'));
  });
  $('gen').addEventListener('click', generate);

  $('copy').addEventListener('click', async () => {
    if (!out.value) return;
    try {
      await navigator.clipboard.writeText(out.value);
      msg.textContent = 'copied to clipboard';
    } catch {
      out.select();
      document.execCommand('copy');
      msg.textContent = 'copied';
    }
  });

  $('fill').addEventListener('click', async () => {
    if (!out.value) generate();
    const password = out.value;
    if (!password) return;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        msg.textContent = 'no active tab';
        return;
      }
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (pw) => {
          function setVal(el, value) {
            const proto = window.HTMLInputElement.prototype;
            const desc = Object.getOwnPropertyDescriptor(proto, 'value');
            if (desc && desc.set) desc.set.call(el, value);
            else el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          const candidates = Array.from(document.querySelectorAll('input')).filter((el) => {
            const t = (el.type || '').toLowerCase();
            return t === 'password' || el.autocomplete === 'new-password';
          });
          const active = document.activeElement;
          if (
            active &&
            active.tagName === 'INPUT' &&
            (active.type === 'password' || active.type === 'text')
          ) {
            setVal(active, pw);
            return;
          }
          candidates.forEach((el) => setVal(el, pw));
        },
        args: [password],
      });
      msg.textContent = 'filled password field(s) on page';
    } catch {
      msg.textContent = 'fill failed — open a normal https page first';
    }
  });

  async function renderList() {
    try {
      const creds = await rpc('LIST');
      listEl.innerHTML = '';
      countEl.textContent = String(creds.length);
      emptyEl.hidden = creds.length > 0;

      creds.forEach((c) => {
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML =
          '<div class="item__host">' +
          escapeHtml(c.host || c.title || 'site') +
          '</div>' +
          '<div class="item__user">' +
          escapeHtml(c.username || '—') +
          '</div>' +
          '<div class="item__acts">' +
          '<button type="button" data-act="copy">copy</button>' +
          '<button type="button" class="del" data-act="del">del</button>' +
          '</div>';
        item.querySelector('[data-act="copy"]').addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(c.password);
            msg.textContent = 'password copied · ' + (c.host || '');
          } catch {
            msg.textContent = 'copy failed';
          }
        });
        item.querySelector('[data-act="del"]').addEventListener('click', async () => {
          if (!confirm('Delete login for ' + (c.host || 'this site') + '?')) return;
          await rpc('DELETE', { id: c.id });
          renderList();
        });
        listEl.appendChild(item);
      });
    } catch (e) {
      if (e.code === 'LOCKED' || /locked/i.test(e.message || '')) {
        showGate('unlock');
        return;
      }
      msg.textContent = e.message;
    }
  }

  async function loadSettings() {
    const s = await rpc('GET_SETTINGS');
    lenEl.value = s.length || 20;
    sets.querySelectorAll('.chip').forEach((b) => {
      b.classList.toggle('is-on', s[b.dataset.set] !== false);
    });
    $('autoFill').checked = s.autoFill !== false;
    $('offerSave').checked = s.offerSave !== false;
  }

  function renderSecurity(st) {
    $('secUnlocked').hidden = false;
    $('lockBtn').hidden = !st.hasMaster;
    if (st.hasMaster) {
      $('secStatus').textContent = 'Master lock: ON · AES-256-GCM · PBKDF2 310k';
      $('secActions').hidden = true;
      $('masterForm').hidden = true;
      $('masterOn').hidden = false;
      $('headSub').textContent = 'encrypted · session unlocked';
    } else {
      $('secStatus').textContent = 'Master lock: OFF — enable AES so disk stays sealed';
      $('secActions').hidden = false;
      $('masterOn').hidden = true;
      $('headSub').textContent = 'local · set a master lock';
    }
  }

  $('enableMaster').addEventListener('click', () => {
    $('masterForm').hidden = false;
    $('secActions').hidden = true;
  });
  $('cancelMaster').addEventListener('click', () => {
    $('masterForm').hidden = true;
    $('secActions').hidden = false;
  });
  $('saveMaster').addEventListener('click', async () => {
    const a = $('newMaster').value;
    const b = $('newMaster2').value;
    try {
      if (a !== b) throw new Error('Passphrases do not match');
      await rpc('SETUP_MASTER', { passphrase: a });
      msg.textContent = 'AES master lock enabled';
      $('newMaster').value = '';
      $('newMaster2').value = '';
      const st = await rpc('STATUS');
      renderSecurity(st);
    } catch (e) {
      msg.textContent = e.message;
    }
  });

  $('changeMaster').addEventListener('click', () => {
    $('changeForm').hidden = !$('changeForm').hidden;
  });
  $('doChangeMaster').addEventListener('click', async () => {
    try {
      if ($('chgMaster').value !== $('chgMaster2').value) {
        throw new Error('New passphrases do not match');
      }
      await rpc('CHANGE_MASTER', {
        oldPassphrase: $('oldMaster').value,
        newPassphrase: $('chgMaster').value,
      });
      msg.textContent = 'master passphrase updated';
      $('changeForm').hidden = true;
      $('oldMaster').value = $('chgMaster').value = $('chgMaster2').value = '';
    } catch (e) {
      msg.textContent = e.message;
    }
  });

  $('removeMaster').addEventListener('click', async () => {
    const p = prompt('Enter master passphrase to remove AES lock (credentials become plaintext on disk):');
    if (p == null) return;
    try {
      await rpc('REMOVE_MASTER', { passphrase: p });
      msg.textContent = 'master lock removed';
      const st = await rpc('STATUS');
      renderSecurity(st);
    } catch (e) {
      msg.textContent = e.message;
    }
  });

  /* backup */
  $('exportBtn').addEventListener('click', async () => {
    try {
      const data = await rpc('EXPORT');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rehnova-passfill-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      $('backupMsg').textContent = data.encrypted
        ? 'exported encrypted backup'
        : 'exported PLAINTEXT — protect this file';
    } catch (e) {
      $('backupMsg').textContent = e.message;
    }
  });

  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      let passphrase;
      if (payload.encrypted) {
        passphrase = prompt('Encrypted backup — enter master passphrase:');
        if (passphrase == null) return;
      }
      const res = await rpc('IMPORT', { payload, passphrase });
      $('backupMsg').textContent = 'imported ' + res.imported + ' credential(s)';
      await renderList();
      const st = await rpc('STATUS');
      renderSecurity(st);
    } catch (err) {
      $('backupMsg').textContent = err.message || String(err);
    }
  });

  $('autoFill').addEventListener('change', (e) => {
    rpc('UPDATE_SETTINGS', { patch: { autoFill: e.target.checked } });
  });
  $('offerSave').addEventListener('change', (e) => {
    rpc('UPDATE_SETTINGS', { patch: { offerSave: e.target.checked } });
  });

  $('clearAll').addEventListener('click', async () => {
    if (!confirm('Wipe ALL saved credentials? This cannot be undone.')) return;
    if (!confirm('Really wipe the entire vault?')) return;
    await rpc('CLEAR_ALL');
    await renderList();
    const st = await rpc('STATUS');
    renderSecurity(st);
    msg.textContent = 'vault wiped';
  });

  async function initApp(st) {
    hideGate();
    await loadSettings();
    generate();
    await renderList();
    renderSecurity(st || (await rpc('STATUS')));
  }

  boot().catch((e) => {
    msg.textContent = e.message || String(e);
  });
})();
