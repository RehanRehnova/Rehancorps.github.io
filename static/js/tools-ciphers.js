(function () {
  const input = document.getElementById('cip-in');
  const output = document.getElementById('cip-out');
  const shiftEl = document.getElementById('cip-shift');
  const keyEl = document.getElementById('cip-key');
  const shiftWrap = document.getElementById('cip-shift-wrap');
  const keyWrap = document.getElementById('cip-key-wrap');
  if (!input || !output) return;

  let mode = 'rot13';

  document.querySelectorAll('#cip-mode .tool-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#cip-mode .tool-chip').forEach((b) => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      mode = btn.dataset.v;
      if (shiftWrap) shiftWrap.hidden = mode !== 'caesar';
      if (keyWrap) keyWrap.hidden = mode !== 'xor';
    });
  });
  if (shiftWrap) shiftWrap.hidden = true;
  if (keyWrap) keyWrap.hidden = true;

  function caesar(str, shift) {
    const s = ((shift % 26) + 26) % 26;
    return str.replace(/[a-z]/gi, (ch) => {
      const base = ch <= 'Z' ? 65 : 97;
      return String.fromCharCode(((ch.charCodeAt(0) - base + s) % 26) + base);
    });
  }

  function xor(str, key) {
    if (!key) return '';
    let out = '';
    for (let i = 0; i < str.length; i++) {
      out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return out;
  }

  function toHex(str) {
    return [...str].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  }

  function fromHex(hex) {
    const h = hex.replace(/\s+/g, '');
    let s = '';
    for (let i = 0; i < h.length; i += 2) s += String.fromCharCode(parseInt(h.substr(i, 2), 16));
    return s;
  }

  function transform(dir) {
    const text = input.value;
    if (mode === 'rot13') {
      output.value = caesar(text, dir === 'dec' ? -13 : 13);
    } else if (mode === 'caesar') {
      const sh = parseInt(shiftEl?.value || '3', 10) || 0;
      output.value = caesar(text, dir === 'dec' ? -sh : sh);
    } else {
      const key = keyEl?.value || '';
      if (dir === 'enc') {
        output.value = toHex(xor(text, key));
      } else {
        try {
          output.value = xor(fromHex(text), key);
        } catch {
          output.value = '';
        }
      }
    }
  }

  document.getElementById('cip-enc')?.addEventListener('click', () => transform('enc'));
  document.getElementById('cip-dec')?.addEventListener('click', () => transform('dec'));
  document.getElementById('cip-copy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
    } catch (_) {}
  });
})();
