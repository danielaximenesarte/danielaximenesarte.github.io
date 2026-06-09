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

// --- Artwork lightbox (click a painting → window with its photos + details) ---
// Clicking a .art-card opens a window showing that painting's title, material,
// size and price (in the active language). The arrows, ← → keys and thumbnails
// move between THIS painting's photos (not between different paintings). Esc closes.
// Photos come from the card's own <img> (if any) plus a data-images="a.jpg, b.jpg"
// attribute on the <article>.
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
      '<button class="lightbox__nav lightbox__prev" type="button" aria-label="Foto anterior / Previous photo">&#8249;</button>' +
      '<button class="lightbox__nav lightbox__next" type="button" aria-label="Próxima foto / Next photo">&#8250;</button>' +
      '<div class="lightbox__media">' +
        '<div class="lightbox__stage"></div>' +
        '<div class="lightbox__thumbs"></div>' +
      '</div>' +
      '<div class="lightbox__info">' +
        '<h3 id="lbTitle" class="lightbox__title"></h3>' +
        '<p class="lightbox__material"></p>' +
        '<p class="lightbox__size"></p>' +
        '<p class="lightbox__price"></p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(lb);

  var stage   = lb.querySelector('.lightbox__stage');
  var thumbs  = lb.querySelector('.lightbox__thumbs');
  var prevBtn = lb.querySelector('.lightbox__prev');
  var nextBtn = lb.querySelector('.lightbox__next');
  var fields  = {
    title:    lb.querySelector('.lightbox__title'),
    material: lb.querySelector('.lightbox__material'),
    size:     lb.querySelector('.lightbox__size'),
    price:    lb.querySelector('.lightbox__price')
  };

  var openCard = -1;   // which painting is open (-1 = closed)
  var imgs = [];       // the open painting's photos
  var imgIndex = 0;    // which photo is showing
  var lastFocus = null;

  var PLACEHOLDER =
    '<div class="lightbox__placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">' +
    '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/></svg></div>';

  function isVideo(src) { return /\.(mp4|webm|ogv|mov)$/i.test(src.split('#')[0].split('?')[0]); }

  // Returns the painting's media as {src, video} objects. A data-images entry
  // that points at a video file (.mp4, .webm…) becomes a playable video slide.
  function imagesFor(card) {
    var list = [];
    var main = card.querySelector('img');
    if (main && main.getAttribute('src')) list.push(main.getAttribute('src'));
    var data = card.getAttribute('data-images');
    if (data) data.split(',').forEach(function (s) { s = s.trim(); if (s) list.push(s); });
    list = list.filter(function (v, i) { return list.indexOf(v) === i; }); // de-dupe
    return list.map(function (src) { return { src: src, video: isVideo(src) }; });
  }

  function copy(el, src) { el.textContent = src ? src.textContent.trim() : ''; }
  function syncInfo(card) {
    copy(fields.title,    card.querySelector('h3'));
    copy(fields.material, card.querySelector('.art-material'));
    copy(fields.size,     card.querySelector('.art-size'));
    copy(fields.price,    card.querySelector('.art-price'));
  }

  function slideHTML(m) {
    return m.video
      ? '<video src="' + m.src + '" controls autoplay loop muted playsinline></video>'
      : '<img src="' + m.src + '" alt="">';
  }

  function showCurrent() {
    stage.innerHTML = imgs.length ? slideHTML(imgs[imgIndex]) : PLACEHOLDER;
    var ts = thumbs.querySelectorAll('.lightbox__thumb');
    for (var k = 0; k < ts.length; k++) ts[k].classList.toggle('is-active', k === imgIndex);
  }

  function open(i) {
    lastFocus = document.activeElement;
    openCard = i;
    var card = cards[i];
    syncInfo(card);
    imgs = imagesFor(card);
    imgIndex = 0;
    var many = imgs.length > 1;
    prevBtn.hidden = nextBtn.hidden = !many;
    thumbs.innerHTML = many ? imgs.map(function (m, idx) {
      var inner = m.video
        ? '<video src="' + m.src + '#t=0.1" muted playsinline preload="metadata"></video>'
        : '<img src="' + m.src + '" alt="">';
      return '<button class="lightbox__thumb' + (m.video ? ' is-video' : '') + '" type="button" data-index="' + idx +
        '" aria-label="' + (m.video ? 'Vídeo / Video' : 'Foto / Photo') + '">' + inner + '</button>';
    }).join('') : '';
    showCurrent();
    lb.removeAttribute('hidden');
    document.body.classList.add('no-scroll');
    lb.querySelector('.lightbox__close').focus();
  }
  function close() {
    lb.setAttribute('hidden', '');
    stage.innerHTML = ''; // removes any playing <video> so its audio stops
    document.body.classList.remove('no-scroll');
    openCard = -1;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function step(d) {
    if (imgs.length < 2) return;
    imgIndex = (imgIndex + d + imgs.length) % imgs.length;
    showCurrent();
  }

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
    imgIndex = parseInt(t.getAttribute('data-index'), 10) || 0;
    showCurrent();
  });

  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) close(); });

  document.addEventListener('keydown', function (e) {
    if (lb.hasAttribute('hidden')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  // keep the open window's details correct if the language is switched
  document.addEventListener('langchange', function () { if (openCard > -1) syncInfo(cards[openCard]); });
})();
