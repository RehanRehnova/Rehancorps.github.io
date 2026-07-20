(function () {
  const input = document.getElementById('jwt-in');
  const header = document.getElementById('jwt-header');
  const payload = document.getElementById('jwt-payload');
  const meta = document.getElementById('jwt-meta');
  if (!input) return;

  function b64urlDecode(str) {
    let s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function pretty(jsonStr) {
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      return jsonStr;
    }
  }

  function decode() {
    const raw = (input.value || '').trim();
    if (!raw) {
      header.textContent = '—';
      payload.textContent = '—';
      if (meta) meta.textContent = '';
      return;
    }
    const parts = raw.split('.');
    if (parts.length < 2) {
      header.textContent = 'Invalid JWT';
      payload.textContent = '—';
      return;
    }
    try {
      header.textContent = pretty(b64urlDecode(parts[0]));
      payload.textContent = pretty(b64urlDecode(parts[1]));
      if (meta) {
        meta.textContent =
          parts.length >= 3
            ? `3 segments · signature present (not verified) · ${parts[2].length} chars`
            : 'Unsigned / incomplete token';
      }
    } catch (e) {
      header.textContent = 'Decode error';
      payload.textContent = e.message || String(e);
    }
  }

  document.getElementById('jwt-run')?.addEventListener('click', decode);
  document.getElementById('jwt-clear')?.addEventListener('click', () => {
    input.value = '';
    header.textContent = '—';
    payload.textContent = '—';
    if (meta) meta.textContent = '';
  });
  input.addEventListener('paste', () => setTimeout(decode, 0));
})();
