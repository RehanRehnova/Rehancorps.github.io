/* Tools hub — search + category filter */
(function () {
  const root = document.querySelector('.tools-page');
  if (!root) return;

  const search = document.getElementById('tools-search');
  const clearBtn = document.getElementById('tools-search-clear');
  const status = document.getElementById('tools-status');
  const empty = document.getElementById('tools-empty');
  const filters = root.querySelectorAll('.tools-filter');
  const cards = root.querySelectorAll('[data-tools-card]');
  const sections = root.querySelectorAll('[data-tools-section]');

  if (!search || !cards.length) return;

  let activeCat = 'all';

  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function apply() {
    const q = normalize(search.value);
    let visible = 0;

    cards.forEach((card) => {
      const cat = card.getAttribute('data-cat') || '';
      const hay = normalize(
        [
          card.getAttribute('data-title'),
          card.getAttribute('data-slug'),
          card.getAttribute('data-excerpt'),
          cat,
        ].join(' ')
      );

      const catOk = activeCat === 'all' || cat === activeCat;
      const qOk = !q || hay.indexOf(q) !== -1 || q.split(/\s+/).every((w) => hay.indexOf(w) !== -1);
      const show = catOk && qOk;

      card.hidden = !show;
      card.classList.toggle('is-hidden', !show);
      if (show) visible += 1;
    });

    sections.forEach((sec) => {
      const cat = sec.getAttribute('data-cat') || '';
      const catOk = activeCat === 'all' || cat === activeCat;
      const anyCard = sec.querySelector('[data-tools-card]:not([hidden])');
      const show = catOk && !!anyCard;
      sec.hidden = !show;
      sec.classList.toggle('is-hidden', !show);
    });

    if (empty) empty.hidden = visible > 0;

    if (status) {
      if (!q && activeCat === 'all') {
        status.textContent = visible + ' tools';
      } else if (q && activeCat !== 'all') {
        status.textContent = visible + ' in ' + activeCat + ' matching “' + search.value.trim() + '”';
      } else if (q) {
        status.textContent = visible + ' match' + (visible === 1 ? '' : 'es') + ' for “' + search.value.trim() + '”';
      } else {
        status.textContent = visible + ' in ' + activeCat;
      }
    }

    if (clearBtn) clearBtn.hidden = !search.value;
  }

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCat = btn.getAttribute('data-cat') || 'all';
      filters.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      apply();
    });
  });

  search.addEventListener('input', apply);
  search.addEventListener('search', apply); // clear on some browsers

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      search.value = '';
      search.focus();
      apply();
    });
  }

  // Keyboard: / focuses search when not in an input
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      search.focus();
    }
  });

  apply();
})();
