(function () {
  const pat = document.getElementById('re-pat');
  const text = document.getElementById('re-text');
  const out = document.getElementById('re-out');
  const err = document.getElementById('re-err');
  const flagsEl = document.getElementById('re-flags');
  if (!pat || !out) return;

  flagsEl.querySelectorAll('.tool-chip').forEach((btn) => {
    btn.addEventListener('click', () => btn.classList.toggle('is-on'));
  });

  function flags() {
    let f = '';
    flagsEl.querySelectorAll('.tool-chip.is-on').forEach((b) => {
      f += b.dataset.f || '';
    });
    return f;
  }

  function run() {
    err.textContent = '';
    let re;
    try {
      re = new RegExp(pat.value, flags());
    } catch (e) {
      err.textContent = e.message;
      out.value = '';
      return;
    }
    const src = text.value || '';
    if (!pat.value) {
      out.value = '';
      return;
    }
    const matches = [];
    if (re.global) {
      let m;
      let guard = 0;
      while ((m = re.exec(src)) !== null && guard++ < 500) {
        matches.push(
          '[' + m.index + '] ' + JSON.stringify(m[0]) +
          (m.length > 1 ? '  groups: ' + m.slice(1).map((g) => JSON.stringify(g)).join(', ') : '')
        );
        if (m[0] === '') re.lastIndex++;
      }
    } else {
      const m = re.exec(src);
      if (m) {
        matches.push(
          '[' + m.index + '] ' + JSON.stringify(m[0]) +
          (m.length > 1 ? '  groups: ' + m.slice(1).map((g) => JSON.stringify(g)).join(', ') : '')
        );
      }
    }
    out.value = matches.length
      ? matches.length + ' match(es):\n' + matches.join('\n')
      : 'No matches.';
  }

  document.getElementById('re-run').addEventListener('click', run);
  document.getElementById('re-copy').addEventListener('click', () => {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).catch(() => {});
    err.textContent = 'copied.';
  });
})();
