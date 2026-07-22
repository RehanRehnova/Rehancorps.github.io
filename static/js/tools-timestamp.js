(function () {
  const unixEl = document.getElementById('ts-unix');
  const isoEl = document.getElementById('ts-iso');
  const out = document.getElementById('ts-out');
  const err = document.getElementById('ts-err');
  if (!out) return;

  function clearErr() {
    if (err) err.textContent = '';
  }
  function setErr(m) {
    if (err) err.textContent = m;
  }

  function fromDate(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      setErr('Invalid date.');
      return;
    }
    clearErr();
    const sec = Math.floor(d.getTime() / 1000);
    out.value = [
      'Unix (s):  ' + sec,
      'Unix (ms): ' + d.getTime(),
      'UTC:       ' + d.toISOString(),
      'Local:     ' + d.toString(),
    ].join('\n');
    unixEl.value = String(sec);
    isoEl.value = d.toISOString();
  }

  document.getElementById('ts-now').addEventListener('click', () => fromDate(new Date()));

  document.getElementById('ts-from-unix').addEventListener('click', () => {
    clearErr();
    let n = String(unixEl.value || '').trim();
    if (!n) return setErr('Enter a unix timestamp.');
    n = Number(n);
    if (!isFinite(n)) return setErr('Not a number.');
    if (n > 1e12) n = Math.floor(n); // ms
    else n = Math.floor(n * 1000);
    fromDate(new Date(n));
  });

  document.getElementById('ts-from-iso').addEventListener('click', () => {
    clearErr();
    const s = (isoEl.value || '').trim();
    if (!s) return setErr('Enter a date string.');
    fromDate(new Date(s));
  });

  document.getElementById('ts-copy').addEventListener('click', () => {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).catch(() => {});
    if (err) err.textContent = 'copied.';
  });

  fromDate(new Date());
})();
