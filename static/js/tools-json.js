(function () {
  const inp = document.getElementById('json-in');
  const out = document.getElementById('json-out');
  const err = document.getElementById('json-err');
  if (!inp || !out) return;

  function parse() {
    try {
      return { ok: true, data: JSON.parse(inp.value) };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  document.getElementById('json-pretty').addEventListener('click', () => {
    const r = parse();
    if (!r.ok) {
      err.textContent = r.error;
      return;
    }
    err.textContent = '';
    out.value = JSON.stringify(r.data, null, 2);
  });

  document.getElementById('json-minify').addEventListener('click', () => {
    const r = parse();
    if (!r.ok) {
      err.textContent = r.error;
      return;
    }
    err.textContent = '';
    out.value = JSON.stringify(r.data);
  });

  document.getElementById('json-copy').addEventListener('click', () => {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).catch(() => {});
    err.textContent = 'copied.';
  });
})();
