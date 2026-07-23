/* Passfill community — review form + sliding testimonial wall */
(function () {
  var slideTimer = null;
  var slideIndex = 0;
  var lastList = [];

  function $(id) {
    return document.getElementById(id);
  }

  function setStat(id, n) {
    var el = $(id);
    if (!el) return;
    if (typeof n === 'number' && !isNaN(n)) el.textContent = String(n);
  }

  /* ── Form stars ── */
  var stars = $('pf-stars');
  var ratingInput = $('pf-rating');

  function paintStars(n) {
    if (!stars || !ratingInput) return;
    n = Math.max(1, Math.min(5, parseInt(n, 10) || 5));
    stars.querySelectorAll('.vault-stars__btn').forEach(function (btn) {
      var v = parseInt(btn.getAttribute('data-n'), 10);
      btn.classList.toggle('is-on', v <= n);
      btn.setAttribute('aria-checked', v === n ? 'true' : 'false');
    });
    ratingInput.value = String(n);
  }

  if (stars && ratingInput) {
    stars.querySelectorAll('.vault-stars__btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        paintStars(btn.getAttribute('data-n'));
      });
    });
    paintStars(ratingInput.value || 5);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function starsText(n, dim) {
    n = Math.round(n) || 0;
    var s = '';
    for (var i = 1; i <= 5; i++) {
      if (i <= n) s += '★';
      else s += dim ? '☆' : '☆';
    }
    return s;
  }

  function starsPartial(avg) {
    // filled + half via CSS width — text fallback full/empty
    var full = Math.floor(avg + 0.01);
    var half = avg - full >= 0.4 && avg - full < 0.9;
    var s = '';
    for (var i = 1; i <= 5; i++) {
      if (i <= full) s += '★';
      else if (i === full + 1 && half) s += '★';
      else s += '☆';
    }
    return s;
  }

  function updateAverage(list) {
    var pill = $('vault-rating-pill');
    var avgEl = $('stat-avg');
    var starsEl = $('stat-avg-stars');
    var n = (list || []).length;
    setStat('stat-reviews', n);
    if (!n) {
      if (pill) pill.hidden = true;
      return;
    }
    var sum = 0;
    list.forEach(function (r) {
      sum += parseInt(r.rating, 10) || 0;
    });
    var avg = sum / n;
    var avgStr = avg.toFixed(1);
    if (avgEl) avgEl.textContent = avgStr;
    if (starsEl) {
      starsEl.textContent = starsPartial(avg);
      starsEl.setAttribute('aria-label', avgStr + ' out of 5');
    }
    if (pill) pill.hidden = false;
  }

  function stopSlider() {
    if (slideTimer) {
      clearInterval(slideTimer);
      slideTimer = null;
    }
  }

  function goSlide(i) {
    var track = document.querySelector('#pf-reviews .vault-slider__track');
    var dots = document.querySelectorAll('#pf-reviews .vault-slider__dot');
    var slides = document.querySelectorAll('#pf-reviews .vault-slide');
    if (!slides.length) return;
    slideIndex = ((i % slides.length) + slides.length) % slides.length;
    slides.forEach(function (s, idx) {
      s.classList.toggle('is-active', idx === slideIndex);
      s.setAttribute('aria-hidden', idx === slideIndex ? 'false' : 'true');
    });
    dots.forEach(function (d, idx) {
      d.classList.toggle('is-on', idx === slideIndex);
    });
    if (track) {
      track.style.transform = 'translate3d(-' + slideIndex * 100 + '%, 0, 0)';
    }
  }

  function startSlider() {
    stopSlider();
    var slides = document.querySelectorAll('#pf-reviews .vault-slide');
    if (slides.length < 2) return;
    slideTimer = setInterval(function () {
      goSlide(slideIndex + 1);
    }, 4800);
  }

  function renderReviews(list) {
    var box = $('pf-reviews');
    if (!box) return;
    list = list || [];
    lastList = list;
    updateAverage(list);
    stopSlider();

    if (!list.length) {
      box.className = 'vault-slider';
      box.innerHTML =
        '<p class="vault-reviews__empty">No public reviews yet — be the first below.</p>';
      return;
    }

    box.className = 'vault-slider';
    var slidesHtml = list
      .map(function (r, idx) {
        var initial = escapeHtml((r.name || 'A').charAt(0).toUpperCase());
        return (
          '<article class="vault-slide' +
          (idx === 0 ? ' is-active' : '') +
          '" aria-hidden="' +
          (idx === 0 ? 'false' : 'true') +
          '">' +
          '<div class="vault-slide__glow" aria-hidden="true"></div>' +
          '<div class="vault-slide__quote" aria-hidden="true">“</div>' +
          '<div class="vault-slide__stars">' +
          starsText(r.rating || 0) +
          '</div>' +
          '<p class="vault-slide__body">' +
          escapeHtml(r.body || '') +
          '</p>' +
          '<div class="vault-slide__foot">' +
          '<span class="vault-slide__avatar">' +
          initial +
          '</span>' +
          '<div class="vault-slide__meta">' +
          '<strong class="vault-slide__name">' +
          escapeHtml(r.name || 'Anon') +
          '</strong>' +
          (r.date
            ? '<span class="vault-slide__date">' + escapeHtml(r.date) + '</span>'
            : '') +
          '</div>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');

    var dots =
      list.length > 1
        ? '<div class="vault-slider__dots" role="tablist">' +
          list
            .map(function (_, i) {
              return (
                '<button type="button" class="vault-slider__dot' +
                (i === 0 ? ' is-on' : '') +
                '" data-i="' +
                i +
                '" aria-label="Review ' +
                (i + 1) +
                '"></button>'
              );
            })
            .join('') +
          '</div>'
        : '';

    var nav =
      list.length > 1
        ? '<button type="button" class="vault-slider__nav vault-slider__nav--prev" aria-label="Previous">‹</button>' +
          '<button type="button" class="vault-slider__nav vault-slider__nav--next" aria-label="Next">›</button>'
        : '';

    box.innerHTML =
      '<div class="vault-slider__viewport">' +
      '<div class="vault-slider__track">' +
      slidesHtml +
      '</div>' +
      nav +
      '</div>' +
      dots;

    slideIndex = 0;
    goSlide(0);

    var prev = box.querySelector('.vault-slider__nav--prev');
    var next = box.querySelector('.vault-slider__nav--next');
    if (prev) prev.addEventListener('click', function () { goSlide(slideIndex - 1); startSlider(); });
    if (next) next.addEventListener('click', function () { goSlide(slideIndex + 1); startSlider(); });
    box.querySelectorAll('.vault-slider__dot').forEach(function (d) {
      d.addEventListener('click', function () {
        goSlide(parseInt(d.getAttribute('data-i'), 10));
        startSlider();
      });
    });

    box.addEventListener('mouseenter', stopSlider);
    box.addEventListener('mouseleave', startSlider);
    startSlider();
  }

  function loadReviews() {
    return fetch('/api/passfill/reviews')
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        if (j && j.ok && Array.isArray(j.reviews)) renderReviews(j.reviews);
        else if (j && !j.ok) {
          var box = $('pf-reviews');
          if (box && !lastList.length) {
            box.innerHTML =
              '<p class="vault-reviews__empty">Reviews unavailable right now.</p>';
          }
        }
      })
      .catch(function () {});
  }

  var form = $('pf-review-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = $('pf-msg');
      var btn = $('pf-submit');
      var name = (($('pf-name') && $('pf-name').value) || 'Anon').trim().slice(0, 40) || 'Anon';
      var rating = parseInt(($('pf-rating') && $('pf-rating').value) || '5', 10);
      var body = (($('pf-body') && $('pf-body').value) || '').trim().slice(0, 800);

      if (body.length < 4) {
        if (msg) msg.textContent = 'Write a bit of feedback.';
        return;
      }
      if (btn) btn.disabled = true;
      if (msg) msg.textContent = 'Saving…';

      fetch('/api/passfill/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, rating: rating, body: body }),
      })
        .then(function (r) {
          return r.json().then(function (j) {
            return { ok: r.ok, j: j };
          });
        })
        .then(function (res) {
          if (btn) btn.disabled = false;
          if (!res.ok) {
            if (msg) msg.textContent = (res.j && res.j.error) || 'Save failed.';
            return;
          }
          if (msg) msg.textContent = 'Posted. Thanks.';
          if ($('pf-body')) $('pf-body').value = '';
          paintStars(5);
          if (res.j && Array.isArray(res.j.reviews)) renderReviews(res.j.reviews);
          else loadReviews();
        })
        .catch(function () {
          if (btn) btn.disabled = false;
          if (msg) msg.textContent = 'Network error — try again.';
        });
    });
  }

  loadReviews();
})();
