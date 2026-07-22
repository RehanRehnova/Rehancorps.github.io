/* Terminal — only on pages that include #term-body */
(function () {
  const body = document.getElementById('term-body');
  const input = document.getElementById('term-input');
  if (!body || !input) return;

  const cmds = {
    help: `Available:
  whoami   — who is behind REHNOVA
  about    — what I do
  scope    — where I operate
  stack    — tools & languages
  mission  — why REHNOVA exists
  contact  — how to reach
  clear    — clear terminal`,

    whoami: `Anonym
Offensive security operator. Builder of REHNOVA.
Based in ops, not compliance.`,

    about: `The offensive operator. Breaks paths that matter — AD, Entra ID, cloud, infra — then automate the manual grind.

REHNOVA came from that gap: real engagements need real tooling.`,

    scope: `Articles / Web based tools / Cloud / Scripts / communities etc are the perimeters.`,

    stack: `Go, Rust, C, Python, PowerShell, Linux, 
ADCS, Kerberos, OIDC, loaders, EDR evasion, C2`,

    mission: `One platform to handle the kill-chain:
recon → exploit → post → report.
No bloat. Just ops.`,

    contact: `rehnova@proton.me — Selective engagements.`
  };

  function print(html) {
    const d = document.createElement('div');
    d.style.marginBottom = '10px';
    d.innerHTML = html.replace(/\n/g, '<br>');
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }

  function run(raw) {
    const c = raw.trim().toLowerCase();
    if (!c) return;
    print(`<span style="color:rgba(255,255,255,.25)">rehnova:~$</span> <span style="color:#fff">${raw}</span>`);
    if (c === 'clear') {
      body.innerHTML = '';
      return;
    }
    if (cmds[c]) print(cmds[c]);
    else print(`command not found: ${c}. Type help.`);
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      run(input.value);
      input.value = '';
    }
  });

  document.querySelectorAll('[data-cmd]').forEach((b) =>
    b.addEventListener('click', () => {
      run(b.dataset.cmd);
      input.focus();
    })
  );

  const wrap = document.getElementById('term-wrap');
  if (wrap) wrap.addEventListener('click', () => input.focus());

  setTimeout(() => run('whoami'), 400);
})();

/* Contact copy toast — all pages */
(function () {
  const toast = document.getElementById('c-copied');
  if (!toast) return;
  document.querySelectorAll('[data-copy]').forEach((r) => {
    r.addEventListener('click', () => {
      const val = r.getAttribute('data-copy');
      if (!val) return;
      navigator.clipboard.writeText(val).catch(() => {});
      toast.style.opacity = '1';
      setTimeout(() => {
        toast.style.opacity = '0';
      }, 1400);
    });
  });
})();

/* Subtle scroll reveal — professional, minimal, site-wide */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mark(el) {
    if (!el || el.hasAttribute('data-reveal')) return;
    el.setAttribute('data-reveal', '');
  }

  /* Auto-tag major blocks so every page gets motion without hand-wiring everything */
  document.querySelectorAll(
    [
      'main.page > section',
      'main.page > .faded-line + section',
      '.hero__left',
      '.hero__right',
      '.about__inner > *',
      '.card',
      '.svc-card',
      '.art-head',
      '.art-filters',
      '.art-row',
      '.art-single__head',
      '.art-hero',
      '.art-body',
      '.art-related',
      '.contact__left',
      '.contact__right',
      '.tools-section',
      '.tools-card',
      '.metal-svc',
    ].join(',')
  ).forEach(mark);

  const nodes = document.querySelectorAll('[data-reveal]');
  if (!nodes.length) return;

  if (reduced) {
    nodes.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
        if (delay > 0) {
          setTimeout(() => el.classList.add('is-revealed'), delay);
        } else {
          el.classList.add('is-revealed');
        }
        io.unobserve(el);
      });
    },
    { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );

  nodes.forEach((el, i) => {
    /* Soft stagger for siblings without explicit delay */
    if (!el.hasAttribute('data-reveal-delay') && el.parentElement) {
      const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
      const idx = siblings.indexOf(el);
      if (idx > 0 && idx < 12) el.style.transitionDelay = `${Math.min(idx * 45, 280)}ms`;
    }
    io.observe(el);
  });
})();
