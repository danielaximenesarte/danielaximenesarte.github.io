/* danielaximenes.arte — tiny enhancements. The site works fine without this. */

// --- Mobile nav toggle ---
(function () {
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // close the menu after tapping a link
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();

// --- Gentle scroll-reveal ---
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !items.length) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(function (el) { io.observe(el); });
})();

// --- Footer year ---
function setFooterYear() {
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

// --- Language toggle (PT / EN) ---
// English text lives in the HTML; the Portuguese version is in a data-pt
// attribute on the same element. We cache the English as data-en on load,
// then swap innerHTML between the two. Choice is saved in localStorage.
(function () {
  var KEY = 'lang';
  var SUPPORTED = ['pt', 'en'];
  var nodes = document.querySelectorAll('[data-pt]');

  // cache the English markup already in the page
  nodes.forEach(function (el) {
    el.setAttribute('data-en', el.innerHTML);
  });

  function apply(lang) {
    nodes.forEach(function (el) {
      var html = el.getAttribute('data-' + lang);
      if (html != null) el.innerHTML = html;
    });
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-lang-opt]').forEach(function (s) {
      s.classList.toggle('is-active', s.getAttribute('data-lang-opt') === lang);
    });
    setFooterYear(); // year span gets recreated when innerHTML is swapped
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  function current() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    return SUPPORTED.indexOf(saved) > -1 ? saved : 'pt'; // default: Portuguese
  }

  apply(current());

  var toggle = document.getElementById('langToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('lang') === 'pt' ? 'en' : 'pt';
      try { localStorage.setItem(KEY, next); } catch (e) {}
      apply(next);
    });
  }
})();

// --- Artwork lightbox (click a painting → window with photos + info) ---
// Each .art-card opens a modal showing its title, meta and description (in the
// active language) plus its images. Images come from the card's own <img> (if
// any) followed by extra photos listed in a data-images="a.jpg, b.jpg" attribute
// on the <article>. Arrows / ← → keys move between paintings; Esc closes.
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.art-card'));
  if (!cards.length) return;

  var lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('hidden', '');
  lb.innerHTML =
    '<div class="lightbox__overlay" data-close></div>' +
    '<div class="lightbox__dialog" role="dialog" aria-modal="true" aria-labelledby="lbTitle">' +
      '<button class="lightbox__close" type="button" data-close aria-label="Fechar / Close">&times;</button>' +
      '<button class="lightbox__nav lightbox__prev" type="button" aria-label="Anterior / Previous">&#8249;</button>' +
      '<button class="lightbox__nav lightbox__next" type="button" aria-label="Próxima / Next">&#8250;</button>' +
      '<div class="lightbox__media">' +
        '<div class="lightbox__stage"></div>' +
        '<div class="lightbox__thumbs"></div>' +
      '</div>' +
      '<div class="lightbox__info">' +
        '<h3 id="lbTitle" class="lightbox__title"></h3>' +
        '<p class="lightbox__meta"></p>' +
        '<div class="lightbox__desc"></div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(lb);

  var stage  = lb.querySelector('.lightbox__stage');
  var thumbs = lb.querySelector('.lightbox__thumbs');
  var elTitle = lb.querySelector('.lightbox__title');
  var elMeta  = lb.querySelector('.lightbox__meta');
  var elDesc  = lb.querySelector('.lightbox__desc');

  var current = -1;     // index of the card currently open (-1 = closed)
  var lastFocus = null;

  var PLACEHOLDER =
    '<div class="lightbox__placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">' +
    '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/></svg></div>';

  function imagesFor(card) {
    var imgs = [];
    var main = card.querySelector('img');
    if (main && main.getAttribute('src')) imgs.push(main.getAttribute('src'));
    var data = card.getAttribute('data-images');
    if (data) data.split(',').forEach(function (s) { s = s.trim(); if (s) imgs.push(s); });
    return imgs.filter(function (v, i) { return imgs.indexOf(v) === i; }); // de-dupe
  }

  function showImage(src) {
    stage.innerHTML = src ? '<img src="' + src + '" alt="">' : PLACEHOLDER;
  }

  function syncText(card) {
    var h = card.querySelector('h3'), m = card.querySelector('.art-meta'), d = card.querySelector('.art-desc');
    elTitle.textContent = h ? h.textContent.trim() : '';
    elMeta.textContent  = m ? m.textContent.trim() : '';
    elDesc.innerHTML    = d ? d.innerHTML : '';
  }

  function render(i) {
    var card = cards[i];
    if (!card) return;
    current = i;
    syncText(card);
    var imgs = imagesFor(card);
    showImage(imgs[0] || null);
    if (imgs.length > 1) {
      thumbs.innerHTML = imgs.map(function (src, idx) {
        return '<button class="lightbox__thumb' + (idx === 0 ? ' is-active' : '') +
               '" type="button" data-src="' + src + '"><img src="' + src + '" alt=""></button>';
      }).join('');
    } else {
      thumbs.innerHTML = '';
    }
  }

  function open(i)  { lastFocus = document.activeElement; render(i); lb.removeAttribute('hidden'); document.body.classList.add('no-scroll'); lb.querySelector('.lightbox__close').focus(); }
  function close()  { lb.setAttribute('hidden', ''); document.body.classList.remove('no-scroll'); current = -1; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function step(d)  { if (current > -1) render((current + d + cards.length) % cards.length); }

  cards.forEach(function (card, i) {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('click', function () { open(i); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  thumbs.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.lightbox__thumb');
    if (!t) return;
    showImage(t.getAttribute('data-src'));
    thumbs.querySelectorAll('.lightbox__thumb').forEach(function (b) { b.classList.remove('is-active'); });
    t.classList.add('is-active');
  });

  lb.querySelector('.lightbox__prev').addEventListener('click', function () { step(-1); });
  lb.querySelector('.lightbox__next').addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) close(); });

  document.addEventListener('keydown', function (e) {
    if (lb.hasAttribute('hidden')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  // keep the open window's text correct if the language is switched
  document.addEventListener('langchange', function () { if (current > -1) syncText(cards[current]); });
})();
