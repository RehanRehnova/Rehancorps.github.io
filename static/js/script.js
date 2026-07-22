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

    whoami: `anonymous
Offensive security operator behind REHNOVA.
No public identity. Ops only.`,

    about: `Anonymous operator. Breaks paths that matter — AD, Entra ID, cloud, infra — then automate the manual grind.

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

/* Article share / copy / save */
(function () {
  const bars = document.querySelectorAll('[data-share-bar]');
  if (!bars.length) return;

  const toast = document.getElementById('c-copied');
  const SAVE_KEY = 'rehnova_saved_articles';

  function showToast(msg) {
    if (!toast) return;
    const prev = toast.textContent;
    toast.textContent = msg || 'copied';
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.textContent = prev || 'copied';
    }, 1400);
  }

  function getSaved() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function setSaved(list) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(list));
  }

  function articleUrl(slug) {
    try {
      return new URL('/articles/' + slug, window.location.origin).href;
    } catch (e) {
      return window.location.href.split('#')[0];
    }
  }

  function flash(btn) {
    btn.classList.add('is-flash');
    setTimeout(() => btn.classList.remove('is-flash'), 900);
  }

  function syncSaveUI(bar, slug) {
    const saved = getSaved().some((x) => x.slug === slug);
    bar.querySelectorAll('[data-share="save"]').forEach((btn) => {
      btn.classList.toggle('is-saved', saved);
      const icon = btn.querySelector('[data-save-icon]');
      const label = btn.querySelector('[data-save-label]');
      if (icon) {
        icon.classList.toggle('fa-solid', saved);
        icon.classList.toggle('fa-regular', !saved);
      }
      if (label) label.textContent = saved ? 'Saved' : 'Save';
      btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
      btn.title = saved ? 'Remove from saved' : 'Save for later';
    });
  }

  bars.forEach((bar) => {
    const title = bar.getAttribute('data-share-title') || document.title;
    const text = bar.getAttribute('data-share-text') || title;
    const slug = bar.getAttribute('data-share-slug') || '';
    const url = articleUrl(slug);

    // Wire social hrefs
    bar.querySelectorAll('[data-share="x"]').forEach((a) => {
      a.href =
        'https://twitter.com/intent/tweet?url=' +
        encodeURIComponent(url) +
        '&text=' +
        encodeURIComponent(title);
    });
    bar.querySelectorAll('[data-share="linkedin"]').forEach((a) => {
      a.href =
        'https://www.linkedin.com/sharing/share-offsite/?url=' +
        encodeURIComponent(url);
    });
    bar.querySelectorAll('[data-share="reddit"]').forEach((a) => {
      a.href =
        'https://www.reddit.com/submit?url=' +
        encodeURIComponent(url) +
        '&title=' +
        encodeURIComponent(title);
    });

    // Native share (mobile / supported browsers)
    if (navigator.share) {
      bar.querySelectorAll('[data-share="native"]').forEach((btn) => {
        btn.hidden = false;
      });
    }

    syncSaveUI(bar, slug);

    bar.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-share]');
      if (!btn || !bar.contains(btn)) return;
      const action = btn.getAttribute('data-share');

      if (action === 'copy') {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(url);
        } catch (err) {
          const ta = document.createElement('textarea');
          ta.value = url;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        flash(btn);
        showToast('link copied');
        return;
      }

      if (action === 'save') {
        e.preventDefault();
        let list = getSaved();
        const exists = list.some((x) => x.slug === slug);
        if (exists) {
          list = list.filter((x) => x.slug !== slug);
          showToast('removed');
        } else {
          list.unshift({
            slug: slug,
            title: title,
            url: url,
            savedAt: new Date().toISOString(),
          });
          list = list.slice(0, 50);
          showToast('saved');
        }
        setSaved(list);
        // Sync all bars on page
        document.querySelectorAll('[data-share-bar]').forEach((b) => {
          syncSaveUI(b, b.getAttribute('data-share-slug') || slug);
        });
        return;
      }

      if (action === 'native') {
        e.preventDefault();
        try {
          await navigator.share({ title: title, text: text, url: url });
        } catch (err) {
          /* user cancelled */
        }
        return;
      }

      // social links open normally
    });
  });
})();

/* Subtle scroll reveal — professional, minimal, site-wide */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Tools hub: never hide with reveal — mobile Safari was vanishing the page
     (parent section got data-reveal → opacity 0 and never re-showed). */
  document.querySelectorAll('.tools-page, .tools-page *').forEach((el) => {
    el.removeAttribute('data-reveal');
    el.removeAttribute('data-reveal-delay');
    el.classList.remove('is-revealed');
    if (el.style) {
      el.style.opacity = '';
      el.style.transform = '';
      el.style.transitionDelay = '';
    }
  });

  function mark(el) {
    if (!el || el.hasAttribute('data-reveal')) return;
    /* Never hide tools hub or anything inside it */
    if (el.classList && el.classList.contains('tools-page')) return;
    if (el.closest && el.closest('.tools-page')) return;
    el.setAttribute('data-reveal', '');
  }

  /* Auto-tag major blocks so every page gets motion without hand-wiring everything */
  document.querySelectorAll(
    [
      'main.page > section:not(.tools-page)',
      'main.page > .faded-line + section:not(.tools-page)',
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
      '.art-share',
      '.art-body',
      '.art-related',
      '.contact__left',
      '.contact__right',
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

  nodes.forEach((el) => {
    /* Soft stagger for siblings without explicit delay */
    if (!el.hasAttribute('data-reveal-delay') && el.parentElement) {
      const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
      const idx = siblings.indexOf(el);
      if (idx > 0 && idx < 12) el.style.transitionDelay = `${Math.min(idx * 45, 280)}ms`;
    }
    io.observe(el);
  });
})();
