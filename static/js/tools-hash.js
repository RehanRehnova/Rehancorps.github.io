(function () {
  const input = document.getElementById('hash-in');
  const run = document.getElementById('hash-run');
  const clear = document.getElementById('hash-clear');
  const idIn = document.getElementById('hash-id');
  const idOut = document.getElementById('hash-id-out');
  if (!input) return;

  const algs = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

  async function digest(alg, text) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest(alg, data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function compute() {
    const text = input.value;
    for (const alg of algs) {
      const el = document.querySelector(`code[data-alg="${alg}"]`);
      if (!el) continue;
      try {
        el.textContent = await digest(alg, text);
      } catch {
        el.textContent = 'unsupported';
      }
    }
  }

  function identify(hex) {
    const h = hex.replace(/\s+/g, '').toLowerCase();
    if (!h) return '—';
    if (!/^[0-9a-f]+$/.test(h)) return 'Not hex — may be base64 or another encoding.';
    const map = {
      32: 'MD5 (32 hex) — weak, legacy only',
      40: 'SHA-1 (40 hex) — legacy',
      56: 'SHA-224 (56 hex)',
      64: 'SHA-256 (64 hex) or MD5 binary misread',
      96: 'SHA-384 (96 hex)',
      128: 'SHA-512 (128 hex)',
    };
    return map[h.length] || `Unknown digest length (${h.length} hex chars)`;
  }

  run?.addEventListener('click', compute);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) compute();
  });
  clear?.addEventListener('click', () => {
    input.value = '';
    document.querySelectorAll('#hash-out code').forEach((c) => (c.textContent = '—'));
  });
  idIn?.addEventListener('input', () => {
    if (idOut) idOut.textContent = identify(idIn.value);
  });

  document.querySelectorAll('[data-copy-from]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = btn.parentElement?.querySelector('code');
      if (!code || code.textContent === '—') return;
      try {
        await navigator.clipboard.writeText(code.textContent);
        btn.textContent = 'ok';
        setTimeout(() => (btn.textContent = 'copy'), 900);
      } catch (_) {}
    });
  });
})();
