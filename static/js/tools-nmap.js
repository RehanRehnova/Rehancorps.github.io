(function () {
  const target = document.getElementById('nm-target');
  const ports = document.getElementById('nm-ports');
  const custom = document.getElementById('nm-custom');
  const customWrap = document.getElementById('nm-custom-wrap');
  const out = document.getElementById('nm-out');
  const copyBtn = document.getElementById('nm-copy');
  if (!target || !out) return;

  let profile = '-sV -sC';

  document.querySelectorAll('#nm-profile .tool-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#nm-profile .tool-chip').forEach((b) => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      profile = btn.dataset.v || '';
      build();
    });
  });

  function portArg() {
    const v = ports.value;
    if (v === 'custom') {
      customWrap.hidden = false;
      const c = (custom.value || '').trim();
      return c ? `-p ${c}` : '';
    }
    customWrap.hidden = true;
    return v;
  }

  function build() {
    const parts = ['nmap'];
    if (profile) parts.push(profile);
    const p = portArg();
    if (p) parts.push(p);
    if (document.getElementById('nm-open')?.checked) parts.push('--open');
    if (document.getElementById('nm-reason')?.checked) parts.push('--reason');
    if (document.getElementById('nm-v')?.checked) parts.push('-v');
    if (document.getElementById('nm-oN')?.checked) parts.push('-oN report.txt');
    if (document.getElementById('nm-oX')?.checked) parts.push('-oX report.xml');
    const t = (target.value || '').trim() || '<target>';
    parts.push(t);
    out.textContent = parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  [target, ports, custom].forEach((el) => el?.addEventListener('input', build));
  document.querySelectorAll('.tool-checks input').forEach((el) => el.addEventListener('change', build));
  ports?.addEventListener('change', build);

  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(out.textContent);
      copyBtn.textContent = 'Copied';
      setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
    } catch (_) {}
  });

  build();
})();
