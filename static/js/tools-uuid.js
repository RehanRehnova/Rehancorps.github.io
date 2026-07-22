(function () {
  const out = document.getElementById('uuid-out');
  const nEl = document.getElementById('uuid-n');
  const msg = document.getElementById('uuid-msg');
  if (!out) return;

  function genOne() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  function generate() {
    let n = parseInt(nEl.value, 10) || 1;
    n = Math.min(50, Math.max(1, n));
    nEl.value = n;
    const lines = [];
    for (let i = 0; i < n; i++) lines.push(genOne());
    out.value = lines.join('\n');
    if (msg) msg.textContent = n + ' UUID(s) generated.';
  }

  document.getElementById('uuid-gen').addEventListener('click', generate);
  document.getElementById('uuid-copy').addEventListener('click', () => {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).catch(() => {});
    if (msg) msg.textContent = 'copied.';
  });
  generate();
})();
