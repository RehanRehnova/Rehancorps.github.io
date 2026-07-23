/* REHNOVA Passfill — detect password fields, suggest, save, autofill
 * Copyright (c) 2026 REHNOVA. All rights reserved. See LICENSE. */
(function () {
  if (window.__rehnovaPassfillInjected) return;
  window.__rehnovaPassfillInjected = true;

  const NS = 'rehnova-vault'; // CSS class prefix (stable)
  const gen = () =>
    (globalThis.RehnovaPassword && globalThis.RehnovaPassword.generatePassword) ||
    null;

  function rpc(type, payload) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(Object.assign({ type }, payload || {}), (res) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!res || !res.ok) {
            const err = new Error((res && res.error) || 'rpc failed');
            err.code = res && res.code;
            reject(err);
          } else resolve(res.result);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  function isLockedErr(e) {
    return e && (e.code === 'LOCKED' || /locked/i.test(String(e.message || '')));
  }

  function setNativeValue(el, value) {
    if (!el) return;
    const proto =
      el.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) desc.set.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function isVisible(el) {
    if (!el || el.disabled || el.readOnly) return false;
    const st = window.getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function isPasswordField(el) {
    if (!el || el.tagName !== 'INPUT') return false;
    const t = (el.type || '').toLowerCase();
    if (t === 'password') return true;
    const ac = (el.autocomplete || '').toLowerCase();
    return ac === 'new-password' || ac === 'current-password';
  }

  function isUsernameField(el) {
    if (!el || el.tagName !== 'INPUT') return false;
    const t = (el.type || '').toLowerCase();
    if (['hidden', 'submit', 'button', 'checkbox', 'radio', 'file', 'password'].includes(t))
      return false;
    const name = ((el.name || '') + ' ' + (el.id || '') + ' ' + (el.autocomplete || '') + ' ' + (el.placeholder || '')).toLowerCase();
    return /user|email|login|account|identifier|phone|tel|name/.test(name) || t === 'email' || t === 'text' || t === 'tel';
  }

  function findUsernameNear(pw) {
    const form = pw.form || pw.closest('form');
    const scope = form || document;
    const inputs = Array.from(scope.querySelectorAll('input')).filter(isVisible);
    const idx = inputs.indexOf(pw);
    // Prefer fields before the password in the same form
    for (let i = idx - 1; i >= 0; i--) {
      if (isUsernameField(inputs[i])) return inputs[i];
    }
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i] !== pw && isUsernameField(inputs[i])) return inputs[i];
    }
    return null;
  }

  function ensureRoot() {
    let root = document.getElementById(NS + '-root');
    if (!root) {
      root = document.createElement('div');
      root.id = NS + '-root';
      root.setAttribute('data-rehnova', '1');
      document.documentElement.appendChild(root);
    }
    return root;
  }

  function removeEl(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function placeNear(field, panel, offsetY) {
    const r = field.getBoundingClientRect();
    const top = window.scrollY + r.bottom + (offsetY || 6);
    let left = window.scrollX + r.left;
    const maxL = window.scrollX + window.innerWidth - 280;
    if (left > maxL) left = Math.max(8, maxL);
    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
  }

  /* ── generate chip on password fields ── */
  function attachChip(pw) {
    if (pw.dataset.rehnovaBound) return;
    pw.dataset.rehnovaBound = '1';

    const wrap = () => {
      if (!isVisible(pw)) return;
      removeEl(NS + '-chip-' + (pw.dataset.rehnovaId || ''));
      if (!pw.dataset.rehnovaId) pw.dataset.rehnovaId = String(Math.random()).slice(2);

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.id = NS + '-chip-' + pw.dataset.rehnovaId;
      chip.className = NS + '-chip';
      chip.textContent = '⚡ gen';
      chip.title = 'Passfill — generate strong password';
      chip.addEventListener('mousedown', (e) => e.preventDefault());
      chip.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          const settings = await rpc('GET_SETTINGS');
          const fn = gen();
          if (!fn) return;
          const password = fn(settings);
          setNativeValue(pw, password);
          pw.focus();
          showToast('password generated — save after signup if you want it vaulted');
          // Offer save after generate on new-password fields
          scheduleSaveOffer(pw);
        } catch (err) {
          showToast('generate failed');
        }
      });

      ensureRoot().appendChild(chip);
      positionChip(pw, chip);
    };

    pw.addEventListener('focus', wrap);
    pw.addEventListener('blur', () => {
      setTimeout(() => {
        const chip = document.getElementById(NS + '-chip-' + pw.dataset.rehnovaId);
        if (chip && !chip.matches(':hover')) chip.remove();
      }, 200);
    });
  }

  function positionChip(pw, chip) {
    const r = pw.getBoundingClientRect();
    chip.style.top = window.scrollY + r.top + r.height / 2 - 12 + 'px';
    chip.style.left = window.scrollX + r.right - 58 + 'px';
  }

  /* ── save offer after login / form submit ── */
  let saveTimer = null;
  function scheduleSaveOffer(pw) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => offerSave(pw), 400);
  }

  async function offerSave(pw) {
    if (!pw || !pw.value) return;
    try {
      const settings = await rpc('GET_SETTINGS');
      if (settings && settings.offerSave === false) return;
    } catch {
      /* continue */
    }

    const userEl = findUsernameNear(pw);
    const username = userEl ? userEl.value.trim() : '';
    const password = pw.value;
    if (!password || password.length < 4) return;

    removeEl(NS + '-save');
    const panel = document.createElement('div');
    panel.id = NS + '-save';
    panel.className = NS + '-panel';
    panel.innerHTML =
      '<div class="' +
      NS +
      '-panel__h">Save to Passfill?</div>' +
      '<div class="' +
      NS +
      '-panel__meta">' +
      location.hostname +
      (username ? ' · ' + escapeHtml(username) : '') +
      '</div>' +
      '<div class="' +
      NS +
      '-panel__row">' +
      '<button type="button" class="' +
      NS +
      '-btn ' +
      NS +
      '-btn--solid" data-act="yes">Save</button>' +
      '<button type="button" class="' +
      NS +
      '-btn" data-act="no">Not now</button>' +
      '</div>';

    placeNear(pw, panel, 8);
    ensureRoot().appendChild(panel);

    panel.querySelector('[data-act="no"]').addEventListener('click', () => panel.remove());
    panel.querySelector('[data-act="yes"]').addEventListener('click', async () => {
      try {
        await rpc('SAVE', {
          credential: {
            origin: location.origin,
            username,
            password,
            title: location.hostname,
          },
        });
        panel.remove();
        showToast('saved locally for ' + location.hostname);
      } catch (err) {
        if (isLockedErr(err)) showToast('locked — open Passfill and unlock');
        else showToast('save failed');
      }
    });

    setTimeout(() => {
      if (panel.isConnected) panel.remove();
    }, 20000);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── autofill on visit ── */
  async function tryAutofill() {
    try {
      const st = await rpc('STATUS');
      if (st && st.locked) {
        // soft hint only once per page load
        if (!window.__rehnovaLockedHint) {
          window.__rehnovaLockedHint = true;
          // silent — user unlocks via popup
        }
        return;
      }
    } catch {
      /* continue */
    }

    let settings;
    try {
      settings = await rpc('GET_SETTINGS');
    } catch {
      return;
    }
    if (settings && settings.autoFill === false) return;

    let matches;
    try {
      matches = await rpc('FIND_ORIGIN', { origin: location.origin });
    } catch (err) {
      if (isLockedErr(err)) return;
      return;
    }
    if (!matches || !matches.length) return;

    const passwords = Array.from(document.querySelectorAll('input')).filter(
      (el) => isPasswordField(el) && isVisible(el)
    );
    if (!passwords.length) return;

    // Single match → offer fill bar; multiple → pick list
    showFillBar(matches, passwords);
  }

  function showFillBar(matches, passwordFields) {
    removeEl(NS + '-fill');
    const bar = document.createElement('div');
    bar.id = NS + '-fill';
    bar.className = NS + '-fillbar';

    if (matches.length === 1) {
      const m = matches[0];
      bar.innerHTML =
        '<span class="' +
        NS +
        '-fillbar__t">Passfill · fill <strong>' +
        escapeHtml(m.username || '(no user)') +
        '</strong>?</span>' +
        '<button type="button" class="' +
        NS +
        '-btn ' +
        NS +
        '-btn--solid" data-act="fill">Fill</button>' +
        '<button type="button" class="' +
        NS +
        '-btn" data-act="x">×</button>';
      bar.querySelector('[data-act="fill"]').addEventListener('click', () => {
        applyCred(m, passwordFields);
        bar.remove();
      });
    } else {
      const opts = matches
        .map(
          (m, i) =>
            '<button type="button" class="' +
            NS +
            '-fillbar__opt" data-i="' +
            i +
            '">' +
            escapeHtml(m.username || m.host || 'account') +
            '</button>'
        )
        .join('');
      bar.innerHTML =
        '<span class="' +
        NS +
        '-fillbar__t">Passfill · pick account</span>' +
        '<div class="' +
        NS +
        '-fillbar__opts">' +
        opts +
        '</div>' +
        '<button type="button" class="' +
        NS +
        '-btn" data-act="x">×</button>';
      bar.querySelectorAll('[data-i]').forEach((btn) => {
        btn.addEventListener('click', () => {
          applyCred(matches[parseInt(btn.getAttribute('data-i'), 10)], passwordFields);
          bar.remove();
        });
      });
    }

    bar.querySelector('[data-act="x"]').addEventListener('click', () => bar.remove());
    ensureRoot().appendChild(bar);
  }

  function applyCred(cred, passwordFields) {
    passwordFields.forEach((pw) => {
      setNativeValue(pw, cred.password);
      const user = findUsernameNear(pw);
      if (user && cred.username) setNativeValue(user, cred.username);
    });
    showToast('filled · ' + (cred.username || cred.host));
  }

  function showToast(msg) {
    removeEl(NS + '-toast');
    const t = document.createElement('div');
    t.id = NS + '-toast';
    t.className = NS + '-toast';
    t.textContent = msg;
    ensureRoot().appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  /* ── scan + observe ── */
  function scan() {
    document.querySelectorAll('input').forEach((el) => {
      if (isPasswordField(el)) attachChip(el);
    });
  }

  function wireForms() {
    document.addEventListener(
      'submit',
      (e) => {
        const form = e.target;
        if (!form || form.tagName !== 'FORM') return;
        const pw = Array.from(form.querySelectorAll('input')).find(
          (el) => isPasswordField(el) && el.value
        );
        if (pw) scheduleSaveOffer(pw);
      },
      true
    );

    // Also catch SPA / button logins: password field with value + blur
    document.addEventListener(
      'change',
      (e) => {
        const el = e.target;
        if (isPasswordField(el) && el.value && el.value.length >= 6) {
          // debounce; only offer if username also present
          const user = findUsernameNear(el);
          if (user && user.value) scheduleSaveOffer(el);
        }
      },
      true
    );
  }

  const mo = new MutationObserver(() => {
    clearTimeout(mo._t);
    mo._t = setTimeout(scan, 300);
  });

  function init() {
    scan();
    wireForms();
    tryAutofill();
    mo.observe(document.documentElement, { childList: true, subtree: true });
    // Re-check after late SPA login forms
    setTimeout(scan, 1500);
    setTimeout(tryAutofill, 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
