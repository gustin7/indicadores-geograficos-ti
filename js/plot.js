/* ==========================================================================
   plot.js — painel cartográfico da capa
   Partículas em canvas (pausadas fora da tela), parallax leve e leitura de
   coordenadas em rotação.
   ========================================================================== */
(function () {
  'use strict';

  var panel = document.querySelector('[data-plot]');
  if (!panel) return;

  var stage = panel.querySelector('[data-plot-stage]');
  var canvas = panel.querySelector('[data-particles]');
  var inner = panel.querySelector('[data-plot-inner]');
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = mq.matches;

  var width = 0;
  var height = 0;
  var dots = [];
  var raf = 0;
  var running = false;
  var inView = false;

  /* ----- partículas ------------------------------------------------------ */
  function build() {
    var count = Math.round((width * height) / 5600);
    count = Math.max(16, Math.min(46, count));

    dots = [];
    for (var i = 0; i < count; i += 1) {
      dots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        r: Math.random() * 1.3 + 0.5,
        a: Math.random() * 0.45 + 0.15
      });
    }
  }

  function draw() {
    if (!ctx || !width) return;

    ctx.clearRect(0, 0, width, height);

    var linkDist = Math.max(62, Math.min(104, width * 0.18));
    var i;
    var j;
    var dx;
    var dy;
    var dist;
    var strength;

    for (i = 0; i < dots.length; i += 1) {
      for (j = i + 1; j < dots.length; j += 1) {
        dx = dots[i].x - dots[j].x;
        dy = dots[i].y - dots[j].y;
        dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < linkDist) {
          strength = (1 - dist / linkDist) * 0.18;
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(110,185,255,' + strength.toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.stroke();
        }
      }
    }

    for (i = 0; i < dots.length; i += 1) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(160,220,255,' + dots[i].a.toFixed(3) + ')';
      ctx.arc(dots[i].x, dots[i].y, dots[i].r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step() {
    for (var i = 0; i < dots.length; i += 1) {
      var dot = dots[i];
      dot.x += dot.vx;
      dot.y += dot.vy;

      if (dot.x < -6) dot.x = width + 6;
      if (dot.x > width + 6) dot.x = -6;
      if (dot.y < -6) dot.y = height + 6;
      if (dot.y > height + 6) dot.y = -6;
    }
    draw();
  }

  function loop() {
    raf = window.requestAnimationFrame(function () {
      step();
      loop();
    });
  }

  function start() {
    if (!ctx || reduce || running || !inView || document.hidden || !width) return;
    running = true;
    loop();
  }

  function stop() {
    running = false;
    window.cancelAnimationFrame(raf);
  }

  /* ----- medida ---------------------------------------------------------- */
  function measure() {
    if (!stage || !canvas || !ctx) return;

    var rect = stage.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    build();

    if (reduce) {
      draw();
    } else {
      start();
    }
  }

  if (ctx && stage) {
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function () {
        measure();
      });
      ro.observe(stage);
    } else {
      window.addEventListener('resize', measure);
    }

    measure();
  }

  /* pausa quando o painel sai da tela ou a aba fica oculta */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          inView = entry.isIntersecting;
          if (inView) {
            start();
          } else {
            stop();
          }
        });
      },
      { threshold: 0.01 }
    );
    io.observe(panel);
  } else {
    inView = true;
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  mq.addEventListener
    ? mq.addEventListener('change', function (event) {
        reduce = event.matches;
        if (reduce) {
          stop();
          draw();
        } else {
          start();
        }
      })
    : null;

  /* ----- parallax -------------------------------------------------------- */
  if (inner && window.matchMedia('(pointer: fine)').matches) {
    panel.addEventListener('pointermove', function (event) {
      if (reduce) return;

      var rect = panel.getBoundingClientRect();
      var x = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
      var y = ((event.clientY - rect.top) / rect.height - 0.5) * 16;

      inner.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
    });

    panel.addEventListener('pointerleave', function () {
      inner.style.transform = '';
    });
  }

  /* ----- coordenadas de referência --------------------------------------- */
  var coordEl = panel.querySelector('[data-coord]');
  var cityEl = panel.querySelector('[data-city]');
  var refEl = panel.querySelector('.plot__ref');

  var references = [
    { coord: '23°33′S 46°38′W', city: 'São Paulo' },
    { coord: '15°47′S 47°53′W', city: 'Brasília' },
    { coord: '3°43′S 38°32′W', city: 'Fortaleza' },
    { coord: '8°03′S 34°52′W', city: 'Recife' },
    { coord: '30°01′S 51°13′W', city: 'Porto Alegre' }
  ];

  if (coordEl && cityEl && refEl) {
    var index = 0;
    var swapping = false;

    window.setInterval(function () {
      if (document.hidden || swapping) return;

      index = (index + 1) % references.length;
      var next = references[index];

      if (reduce) {
        coordEl.textContent = next.coord;
        cityEl.textContent = next.city;
        return;
      }

      swapping = true;
      refEl.classList.add('is-swapping');

      window.setTimeout(function () {
        coordEl.textContent = next.coord;
        cityEl.textContent = next.city;
        refEl.classList.remove('is-swapping');
        swapping = false;
      }, 320);
    }, 4400);
  }
})();
