(function () {
  const pass = document.getElementById('aes-pass');
  const input = document.getElementById('aes-in');
  const output = document.getElementById('aes-out');
  const err = document.getElementById('aes-err');
  if (!input || !output) return;

  function setErr(m) {
    if (err) err.textContent = m || '';
  }

  function b64(bytes) {
    let bin = '';
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  }

  function unb64(str) {
    const bin = atob(str);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }

  async function deriveKey(passphrase, salt) {
    const base = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  document.getElementById('aes-enc')?.addEventListener('click', async () => {
    try {
      setErr('');
      if (!pass.value) throw new Error('Enter a passphrase');
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(pass.value, salt);
      const ct = new Uint8Array(
        await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(input.value))
      );
      const pack = new Uint8Array(salt.length + iv.length + ct.length);
      pack.set(salt, 0);
      pack.set(iv, salt.length);
      pack.set(ct, salt.length + iv.length);
      output.value = b64(pack);
    } catch (e) {
      setErr(e.message || String(e));
    }
  });

  document.getElementById('aes-dec')?.addEventListener('click', async () => {
    try {
      setErr('');
      if (!pass.value) throw new Error('Enter a passphrase');
      const pack = unb64(input.value.trim());
      if (pack.length < 16 + 12 + 16) throw new Error('Ciphertext package too short');
      const salt = pack.slice(0, 16);
      const iv = pack.slice(16, 28);
      const ct = pack.slice(28);
      const key = await deriveKey(pass.value, salt);
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
      output.value = new TextDecoder().decode(pt);
    } catch (e) {
      setErr('Decrypt failed — wrong passphrase or corrupt package.');
    }
  });

  document.getElementById('aes-copy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
    } catch (_) {}
  });
})();
