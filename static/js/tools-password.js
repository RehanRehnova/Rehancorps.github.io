(function () {
  const out = document.getElementById('pw-out');
  const lenEl = document.getElementById('pw-len');
  const msg = document.getElementById('pw-msg');
  const sets = document.getElementById('pw-sets');
  if (!out || !sets) return;

  const CHARSETS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digit: '0123456789',
    symbol: '!@#$%^&*()-_=+[]{};:,.?/',
  };

  sets.querySelectorAll('.tool-chip').forEach((btn) => {
    btn.addEventListener('click', () => btn.classList.toggle('is-on'));
  });

  function randomFrom(str) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return str[arr[0] % str.length];
  }

  function generate() {
    let pool = '';
    sets.querySelectorAll('.tool-chip.is-on').forEach((b) => {
      pool += CHARSETS[b.dataset.set] || '';
    });
    if (!pool) {
      if (msg) msg.textContent = 'Select at least one character set.';
      return;
    }
    let len = parseInt(lenEl.value, 10) || 20;
    len = Math.min(128, Math.max(8, len));
    lenEl.value = len;
    let pw = '';
    for (let i = 0; i < len; i++) pw += randomFrom(pool);
    out.value = pw;
    if (msg) msg.textContent = 'generated (' + len + ' chars).';
  }

  document.getElementById('pw-gen').addEventListener('click', generate);
  document.getElementById('pw-copy').addEventListener('click', () => {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).catch(() => {});
    if (msg) msg.textContent = 'copied.';
  });
  generate();
})();
