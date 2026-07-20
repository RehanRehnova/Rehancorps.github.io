(function () {
  const modeBox = document.getElementById('enc-mode');
  const input = document.getElementById('enc-in');
  const output = document.getElementById('enc-out');
  const err = document.getElementById('enc-err');
  if (!input || !output) return;

  let mode = 'base64';

  modeBox?.querySelectorAll('.tool-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      modeBox.querySelectorAll('.tool-chip').forEach((b) => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      mode = btn.dataset.v;
      err.textContent = '';
    });
  });

  function setErr(msg) {
    if (err) err.textContent = msg || '';
  }

  function toB64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  }

  function fromB64(str) {
    const bin = atob(str.replace(/\s+/g, ''));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function toHex(str) {
    return [...new TextEncoder().encode(str)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function fromHex(str) {
    const h = str.replace(/\s+/g, '').toLowerCase();
    if (h.length % 2) throw new Error('Hex length must be even');
    if (!/^[0-9a-f]*$/.test(h)) throw new Error('Invalid hex');
    const bytes = new Uint8Array(h.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(h.substr(i * 2, 2), 16);
    return new TextDecoder().decode(bytes);
  }

  document.getElementById('enc-encode')?.addEventListener('click', () => {
    try {
      setErr('');
      const v = input.value;
      if (mode === 'base64') output.value = toB64(v);
      else if (mode === 'url') output.value = encodeURIComponent(v);
      else output.value = toHex(v);
    } catch (e) {
      setErr(e.message || String(e));
    }
  });

  document.getElementById('enc-decode')?.addEventListener('click', () => {
    try {
      setErr('');
      const v = input.value;
      if (mode === 'base64') output.value = fromB64(v);
      else if (mode === 'url') output.value = decodeURIComponent(v.replace(/\+/g, ' '));
      else output.value = fromHex(v);
    } catch (e) {
      setErr(e.message || String(e));
    }
  });

  document.getElementById('enc-swap')?.addEventListener('click', () => {
    const a = input.value;
    input.value = output.value;
    output.value = a;
  });

  document.getElementById('enc-copy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
    } catch (_) {}
  });
})();
