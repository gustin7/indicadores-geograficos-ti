/* ==========================================================================
   app.js — rotas, transições entre telas, iframe do ArcGIS, status e fullscreen
   Script clássico (sem módulos) para funcionar também ao abrir o index.html
   diretamente no sistema de arquivos.
   ========================================================================== */
(function () {
  'use strict';

  var docEl = document.documentElement;
  docEl.classList.add('js');

  var APP_URL =
    'https://www.arcgis.com/apps/instant/compare/index.html?appid=ebee2d228dc24e50ac4e30506d478b24';

  var TITLES = {
    home: 'Indicadores Geográficos de Empresas de TI · GEO·TI',
    map: 'Exploração Geográfica · GEO·TI',
    panel: 'Painel Analítico · GEO·TI'
  };

  var CHIP_TEXT = {
    idle: 'ArcGIS · pronto',
    loading: 'Carregando',
    ready: 'ArcGIS · integrado',
    error: 'ArcGIS · externo'
  };

  var CARD_TEXT = {
    idle: 'Aguardando o mapa',
    loading: 'Carregando aplicativo',
    ready: 'Aplicativo integrado',
    error: 'Incorporação bloqueada'
  };

  /* ----- elementos ------------------------------------------------------- */
  var views = {
    home: document.querySelector('[data-view="home"]'),
    map: document.querySelector('[data-view="map"]'),
    panel: document.querySelector('[data-view="panel"]')
  };
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('[data-state-chip]'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-state-card]'));
  var frame = document.querySelector('[data-frame]');
  var screenEl = document.querySelector('[data-screen]');
  var fallback = document.querySelector('[data-fallback]');
  var retryBtn = document.querySelector('[data-retry]');
  var boot = document.querySelector('[data-boot]');

  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  var current = 'home';
  var busy = false;
  var mapMounted = false;
  var mapState = 'idle';
  var loadTimer = 0;

  function prefersReduced() {
    return reduceQuery.matches;
  }

  /* ----- status ---------------------------------------------------------- */
  function setState(state) {
    mapState = state;

    chips.forEach(function (chip) {
      chip.setAttribute('data-state', state);
      var label = chip.querySelector('[data-state-text]');
      if (label) label.textContent = CHIP_TEXT[state] || CHIP_TEXT.idle;
    });

    cards.forEach(function (card) {
      card.setAttribute('data-state', state);
      var label = card.querySelector('[data-state-text]');
      if (label) {
        label.textContent = CARD_TEXT[state] || CARD_TEXT.idle;
        if (!label.hasAttribute('aria-live')) {
          label.setAttribute('aria-live', 'polite');
          label.setAttribute('role', 'status');
        }
      }
    });

    if (frame) frame.setAttribute('data-state', state);
  }

  /* ----- navegação entre telas ------------------------------------------- */
  function updateNav() {
    navLinks.forEach(function (link) {
      if (link.getAttribute('data-nav') === current) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function swapView(from, to, initial) {
    if (from !== to) {
      from.classList.remove('is-active', 'is-leaving');
      from.hidden = true;
      from.setAttribute('aria-hidden', 'true');
      from.inert = true;
    }

    to.hidden = false;
    to.removeAttribute('aria-hidden');
    to.inert = false;

    // força o navegador a reconhecer o novo display antes de animar
    void to.offsetWidth;
    to.classList.add('is-active');

    current = to.getAttribute('data-view') || 'home';
    updateNav();
    document.title = TITLES[current];

    if (current === 'map') mountMap();

    window.scrollTo(0, 0);

    if (!initial) {
      var heading = to.querySelector('h1');
      if (heading) heading.focus({ preventScroll: true });
    }

    busy = false;
  }

  function go(name, options) {
    options = options || {};
    var to = views[name];
    if (!to) return;

    if (name === current && !options.initial) {
      updateNav();
      return;
    }
    if (busy) return;

    var from = views[current] || views.home;
    var animate = !options.initial && !prefersReduced();

    if (!animate) {
      swapView(from, to, options.initial);
      return;
    }

    busy = true;
    from.classList.add('is-leaving');
    window.setTimeout(function () {
      swapView(from, to, false);
    }, 270);
  }

  function route(options) {
    var hash = window.location.hash;
    var target = null;

    if (hash === '#mapa') target = 'map';
    else if (hash === '#painel') target = 'panel';
    else if (hash === '' || hash === '#' || hash === '#apresentacao') target = 'home';

    // Qualquer outro hash (ex.: #conteudo, do skip link) não troca de tela.
    if (!target) {
      if (options && options.initial) go('home', options);
      return;
    }

    go(target, options || {});
  }

  /* ----- iframe do ArcGIS ------------------------------------------------ */
  function mountMap() {
    if (mapMounted || !screenEl) return;
    mapMounted = true;

    setState('loading');
    if (fallback) fallback.hidden = true;

    var iframe = document.createElement('iframe');
    iframe.src = APP_URL;
    iframe.title = 'Mapa interativo das empresas de TI — aplicativo ArcGIS';
    iframe.setAttribute('allow', 'fullscreen; geolocation; clipboard-write');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.setAttribute('aria-label', 'Aplicativo ArcGIS com o mapa comparativo de empresas de TI');

    iframe.addEventListener('load', onMapLoad);
    iframe.addEventListener('error', onMapError);

    screenEl.appendChild(iframe);

    window.clearTimeout(loadTimer);
    loadTimer = window.setTimeout(function () {
      if (mapState !== 'ready') onMapError();
    }, 14000);
  }

  function onMapLoad() {
    window.clearTimeout(loadTimer);
    setState('ready');
    if (fallback) fallback.hidden = true;
  }

  function onMapError() {
    if (mapState === 'ready') return;
    window.clearTimeout(loadTimer);
    setState('error');
    if (fallback) fallback.hidden = false;
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      if (!screenEl) return;
      var old = screenEl.querySelector('iframe');
      if (old) old.parentNode.removeChild(old);
      mapMounted = false;
      if (fallback) fallback.hidden = true;
      setState('loading');
      mountMap();
    });
  }

  /* ----- tela cheia ------------------------------------------------------ */
  var fsButtons = Array.prototype.slice.call(document.querySelectorAll('[data-fullscreen]'));

  function fullscreenOn() {
    return document.fullscreenElement === frame;
  }

  function toggleFullscreen() {
    if (!frame) return;
    if (!document.fullscreenElement) {
      var request = frame.requestFullscreen || frame.webkitRequestFullscreen;
      if (!request) return;
      try {
        var result = request.call(frame);
        if (result && result.catch) result.catch(function () {});
      } catch (err) {
        /* navegador recusou; o mapa continua utilizável na página */
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
  }

  if (frame && (document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
    fsButtons.forEach(function (btn) {
      btn.hidden = false;
      btn.addEventListener('click', toggleFullscreen);
    });
  } else {
    fsButtons.forEach(function (btn) {
      btn.hidden = true;
    });
  }

  document.addEventListener('fullscreenchange', function () {
    var on = fullscreenOn();
    fsButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      var label = btn.querySelector('[data-fullscreen-label]');
      if (label) label.textContent = on ? 'Sair da tela cheia' : 'Tela cheia';
    });
  });

  /* ----- reveals --------------------------------------------------------- */
  function revealHero() {
    var hero = views.home && views.home.querySelector('.hero');
    if (!hero) return;
    Array.prototype.forEach.call(
      hero.querySelectorAll('.reveal, .title-reveal'),
      function (el) {
        el.classList.add('is-in');
      }
    );
  }

  var observer = null;

  function startObserver() {
    var targets = document.querySelectorAll('.reveal, .title-reveal');

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, function (el) {
        el.classList.add('is-in');
      });
      return;
    }

    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.05 }
    );

    Array.prototype.forEach.call(targets, function (el) {
      if (!el.classList.contains('is-in')) observer.observe(el);
    });
  }

  /* ----- abertura -------------------------------------------------------- */
  var booted = false;

  function afterBoot(skip) {
    if (booted) return;
    booted = true;

    if (boot) {
      if (skip) {
        if (boot.parentNode) boot.parentNode.removeChild(boot);
      } else {
        boot.classList.add('is-done');
        window.setTimeout(function () {
          if (boot.parentNode) boot.parentNode.removeChild(boot);
        }, 1100);
      }
    }

    revealHero();
    startObserver();
  }

  function tryStoreBoot() {
    try {
      window.sessionStorage.setItem('geoti:boot', '1');
    } catch (err) {
      /* modo privado pode bloquear o armazenamento */
    }
  }

  /* ----- eventos --------------------------------------------------------- */
  var ROUTES = { '#apresentacao': 'home', '#mapa': 'map', '#painel': 'panel' };

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!link || link.target === '_blank') return;

    var hash = link.getAttribute('href');
    if (!ROUTES[hash]) return;

    event.preventDefault();

    try {
      if (window.location.hash !== hash) {
        window.history.pushState(null, '', hash);
      }
    } catch (err) {
      window.location.hash = hash;
    }

    route();
  });

  window.addEventListener('popstate', function () {
    route();
  });

  window.addEventListener('hashchange', function () {
    route();
  });

  reduceQuery.addEventListener
    ? reduceQuery.addEventListener('change', function () {
        if (!prefersReduced()) return;
        Array.prototype.forEach.call(
          document.querySelectorAll('.reveal, .title-reveal'),
          function (el) {
            el.classList.add('is-in');
          }
        );
      })
    : null;

  /* ----- início ---------------------------------------------------------- */
  function init() {
    setState('idle');
    updateNav();
    document.title = TITLES.home;
    route({ initial: true });

    var skip = false;
    try {
      skip = window.sessionStorage.getItem('geoti:boot') === '1';
    } catch (err) {
      skip = false;
    }
    if (docEl.classList.contains('boot-seen')) skip = true;

    if (prefersReduced() || skip) {
      afterBoot(true);
      return;
    }

    tryStoreBoot();
    window.setTimeout(function () {
      afterBoot(false);
    }, 780);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
