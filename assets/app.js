/* ============================================================
   DOCTOR FADE — motor de animación (vanilla JS, sin librerías)
   ============================================================ */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, mi, ma) { return Math.max(mi, Math.min(ma, v)); };

  /* ---------------------------------------------------------
     1) INTRO SPRAY — la lata "pinta" el logo con aerosol
     --------------------------------------------------------- */
  var intro = document.getElementById('intro');

  function killIntro(immediate) {
    if (!intro || intro.classList.contains('leave')) return;
    if (immediate) { intro.classList.add('gone'); startPage(); return; }
    intro.classList.add('leave');
    startPage();
    setTimeout(function () { intro.classList.add('gone'); }, 1100);
  }

  function sprayIntro() {
    if (!intro) { startPage(); return; }
    if (reduceMotion) { killIntro(true); return; }
    var isMobile = window.matchMedia('(max-width:820px)').matches;

    // tocar/click para saltar la intro
    intro.addEventListener('pointerdown', function () {
      killIntro(false);
    }, { once: true });

    var canvas = document.getElementById('introCanvas');
    var can = document.getElementById('sprayCan');
    var failsafe = setTimeout(function () { killIntro(false); }, isMobile ? 4200 : 6000);
    if (!canvas || !canvas.getContext) { return; } // el failsafe hará el resto

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    var box = canvas.getBoundingClientRect();
    var W = Math.round(box.width * dpr), H = Math.round(box.height * dpr);
    canvas.width = W; canvas.height = H;

    var PALETTE = ['#ff2e88', '#29c8ff', '#69e95c', '#8b5cf6', '#ffc93c', '#ff7ab5'];
    var RATTLE = isMobile ? 320 : 550, PAINT = isMobile ? 1350 : 2150, ENDHOLD = isMobile ? 320 : 600;

    // --- ARTE FINAL (texto graffiti) ---
    var art = document.createElement('canvas'); art.width = W; art.height = H;
    var actx = art.getContext('2d');
    var mask = document.createElement('canvas'); mask.width = W; mask.height = H;
    var mctx = mask.getContext('2d');

    var letters = [];   // {points:[{x,y}...], brush, color, box}
    var pathPts = [];   // ruta completa con arco-longitud
    var totalLen = 0;

    function fitSize(text, targetW, weight) {
      var s = 100;
      actx.font = weight + ' ' + s + 'px Unbounded, sans-serif';
      var w = actx.measureText(text).width || 1;
      return s * targetW / w;
    }

    function buildArt() {
      actx.clearRect(0, 0, W, H);
      actx.textBaseline = 'alphabetic';
      var pad = W * 0.06;
      var lines = [
        { txt: 'DOCTOR', size: fitSize('DOCTOR', W - pad * 2, '900'), base: H * 0.355 },
        { txt: 'FADE',   size: fitSize('FADE',   W - pad * 2, '900'), base: H * 0.775 }
      ];
      var ci = 0;
      lines.forEach(function (ln) {
        actx.font = '900 ' + ln.size + 'px Unbounded, sans-serif';
        var tw = actx.measureText(ln.txt).width;
        var x = (W - tw) / 2;
        for (var i = 0; i < ln.txt.length; i++) {
          var ch = ln.txt[i];
          var aw = actx.measureText(ch).width;
          var color = PALETTE[ci++ % PALETTE.length];
          var cx = x + aw / 2, cy = ln.base - ln.size * 0.36;
          var rot = (Math.random() - 0.5) * 0.10; // leve baile de pegatina
          actx.save();
          actx.translate(cx, cy); actx.rotate(rot); actx.translate(-cx, -cy);
          actx.lineJoin = 'round';
          actx.strokeStyle = '#08070f'; actx.lineWidth = ln.size * 0.20;
          actx.strokeText(ch, x, ln.base);
          actx.strokeStyle = '#ffffff'; actx.lineWidth = ln.size * 0.085;
          actx.strokeText(ch, x, ln.base);
          actx.fillStyle = color;
          actx.fillText(ch, x, ln.base);
          actx.restore();
          // caja para la ruta de pintado y goteos
          var bx = { x: x - aw * 0.06, y: ln.base - ln.size * 0.80, w: aw * 1.12, h: ln.size * 0.98 };
          var pts = [];
          var passes = 4;
          for (var k = 0; k <= passes; k++) {
            pts.push({
              x: bx.x + bx.w * (k / passes),
              y: bx.y + (k % 2 === 0 ? bx.h * 0.16 : bx.h * 0.86) + (Math.random() - 0.5) * bx.h * 0.08
            });
          }
          letters.push({ points: pts, brush: ln.size * 0.42, color: color, box: bx, base: ln.base, size: ln.size });
          x += aw + ln.size * 0.015;
        }
      });
      // subrayado spray (barrido final)
      var uy = H * 0.915, ux0 = W * 0.18, ux1 = W * 0.82;
      var grad = actx.createLinearGradient(ux0, 0, ux1, 0);
      grad.addColorStop(0, '#ff2e88'); grad.addColorStop(0.5, '#8b5cf6'); grad.addColorStop(1, '#29c8ff');
      actx.strokeStyle = grad; actx.lineCap = 'round'; actx.lineWidth = H * 0.035;
      actx.beginPath(); actx.moveTo(ux0, uy);
      actx.quadraticCurveTo(W / 2, uy - H * 0.03, ux1, uy); actx.stroke();
      letters.push({
        points: [{ x: ux0, y: uy }, { x: W / 2, y: uy - H * 0.02 }, { x: ux1, y: uy }],
        brush: H * 0.06, color: '#8b5cf6', box: null
      });
      // ruta completa con longitudes acumuladas
      letters.forEach(function (L, li) {
        L.points.forEach(function (p, i) {
          if (pathPts.length) {
            var prev = pathPts[pathPts.length - 1];
            totalLen += Math.hypot(p.x - prev.x, p.y - prev.y);
          }
          pathPts.push({ x: p.x, y: p.y, d: totalLen, letter: li, end: i === L.points.length - 1 });
        });
      });
    }

    function sample(dist) {
      dist = clamp(dist, 0, totalLen);
      for (var i = 1; i < pathPts.length; i++) {
        if (pathPts[i].d >= dist) {
          var a = pathPts[i - 1], b = pathPts[i];
          var t = (dist - a.d) / Math.max(1, b.d - a.d);
          return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), letter: b.letter };
        }
      }
      var last = pathPts[pathPts.length - 1];
      return { x: last.x, y: last.y, letter: last.letter };
    }

    // --- capas vivas ---
    var particles = [], overspray = [], drips = [];
    var painted = -1; // última letra completada

    var STAMP_N = isMobile ? 5 : 10;
    function stampAt(x, y, brush) {
      for (var i = 0; i < STAMP_N; i++) {
        var a = Math.random() * Math.PI * 2;
        var r = Math.pow(Math.random(), 0.6) * brush;
        var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        var rad = brush * (0.10 + Math.random() * 0.22);
        var g = mctx.createRadialGradient(px, py, 0, px, py, rad);
        g.addColorStop(0, 'rgba(255,255,255,.95)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        mctx.fillStyle = g;
        mctx.beginPath(); mctx.arc(px, py, rad, 0, 7); mctx.fill();
      }
    }
    function spawnFx(x, y, color, brush) {
      for (var i = 0; i < 2; i++) {
        particles.push({
          x: x, y: y,
          vx: (Math.random() - 0.5) * 3 * dpr, vy: (Math.random() - 0.35) * 3 * dpr,
          life: 1, r: (0.8 + Math.random() * 2) * dpr, c: color
        });
      }
      if (Math.random() < 0.5) {
        var a = Math.random() * Math.PI * 2, rr = brush * (1.4 + Math.random());
        overspray.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr, r: (0.6 + Math.random() * 1.6) * dpr, life: 1, c: color });
      }
    }
    function spawnDrips(L) {
      if (!L.box) return;
      var n = 1 + (Math.random() < 0.5 ? 1 : 0);
      for (var i = 0; i < n; i++) {
        drips.push({
          x: L.box.x + L.box.w * (0.2 + Math.random() * 0.6),
          y: L.base - L.size * (0.05 + Math.random() * 0.25),
          len: 0, max: (L.size * (0.18 + Math.random() * 0.35)),
          v: (0.6 + Math.random() * 0.9) * dpr, w: Math.max(2 * dpr, L.size * 0.045), c: L.color
        });
      }
    }

    var prevHead = null, start = null, done = false;
    var cw = 0, ch2 = 0; // tamaño CSS de la lata

    function placeCan(cssX, cssY, rot, scale) {
      if (!can) return;
      can.style.transform = 'translate(' + (cssX - cw * 0.2) + 'px,' + (cssY + 10) + 'px) rotate(' + rot + 'deg) scale(' + (scale || 1) + ')';
    }

    function frame(ts) {
      if (start === null) {
        start = ts;
        var cb = can ? can.getBoundingClientRect() : { width: 56, height: 90 };
        cw = cb.width; ch2 = cb.height;
      }
      var t = ts - start;
      ctx.clearRect(0, 0, W, H);

      if (t < RATTLE) {
        // sacudida de la lata en el centro (clack-clack)
        var k = t / RATTLE;
        var jx = Math.sin(t * 0.09) * 7 * (1 - k) + (Math.random() - 0.5) * 2;
        var jy = Math.cos(t * 0.11) * 5 * (1 - k);
        placeCan(box.width / 2 + jx, box.height * 0.42 + jy, Math.sin(t * 0.05) * 14 * (1 - k), 1.06 - 0.06 * k);
      } else if (!done) {
        var p = clamp((t - RATTLE) / PAINT, 0, 1);
        var head = sample(p * totalLen);
        var L = letters[head.letter];
        // sellos interpolados para no dejar huecos
        if (prevHead) {
          var dist = Math.hypot(head.x - prevHead.x, head.y - prevHead.y);
          var n = Math.min(isMobile ? 4 : 8, Math.max(1, Math.ceil(dist / (L.brush * (isMobile ? 0.5 : 0.3)))));
          for (var i = 1; i <= n; i++) {
            var ix = lerp(prevHead.x, head.x, i / n), iy = lerp(prevHead.y, head.y, i / n);
            stampAt(ix, iy, L.brush);
          }
        } else {
          stampAt(head.x, head.y, L.brush);
        }
        spawnFx(head.x, head.y, L.color, L.brush);
        // goteos al completar cada letra
        while (painted < head.letter - 1) { painted++; spawnDrips(letters[painted]); }
        if (p >= 1) {
          while (painted < letters.length - 1) { painted++; spawnDrips(letters[painted]); }
          mctx.fillStyle = '#fff'; mctx.fillRect(0, 0, W, H);
          done = true;
          if (can) {
            can.style.transition = 'transform .55s cubic-bezier(.23,1,.32,1), opacity .45s';
            can.style.opacity = '0';
            placeCan(box.width * 0.85, box.height * 1.1, 30, 0.9);
          }
          clearTimeout(failsafe);
          setTimeout(function () { killIntro(false); }, ENDHOLD);
        }
        // lata siguiendo el cabezal, inclinada según la dirección
        var cssX = head.x / dpr, cssY = head.y / dpr;
        var ang = prevHead ? Math.atan2(head.y - prevHead.y, head.x - prevHead.x) : 0;
        placeCan(cssX, cssY, clamp(ang * 22, -26, 26) - 8, 1);
        prevHead = head;
      }

      // ---- composición ----
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(art, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      // halo de pintura fresca en el cabezal
      if (prevHead && !done) {
        var Lg = letters[prevHead.letter];
        ctx.globalAlpha = 0.22;
        var gg = ctx.createRadialGradient(prevHead.x, prevHead.y, 0, prevHead.x, prevHead.y, Lg.brush * 1.6);
        gg.addColorStop(0, Lg.color); gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(prevHead.x, prevHead.y, Lg.brush * 1.6, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      }

      // goteos de pintura (crecen hacia abajo)
      drips.forEach(function (d) {
        if (d.len < d.max) { d.len += d.v; d.v *= 0.985; }
        ctx.strokeStyle = d.c; ctx.lineCap = 'round'; ctx.lineWidth = d.w;
        ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y + d.len); ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // overspray (polvillo alrededor)
      for (var o = overspray.length - 1; o >= 0; o--) {
        var ov = overspray[o]; ov.life -= 0.02;
        if (ov.life <= 0) { overspray.splice(o, 1); continue; }
        ctx.globalAlpha = ov.life * 0.35; ctx.fillStyle = ov.c;
        ctx.beginPath(); ctx.arc(ov.x, ov.y, ov.r, 0, 7); ctx.fill();
      }
      // partículas del aerosol
      for (var q = particles.length - 1; q >= 0; q--) {
        var pt = particles[q];
        pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.045 * dpr; pt.life -= 0.028;
        if (pt.life <= 0) { particles.splice(q, 1); continue; }
        ctx.globalAlpha = pt.life * 0.8; ctx.fillStyle = pt.c;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * pt.life, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!intro.classList.contains('gone')) requestAnimationFrame(frame);
    }

    // arrancar cuando la fuente display esté disponible (con red de seguridad)
    var kicked = false;
    function kick() {
      if (kicked) return; kicked = true;
      buildArt();
      requestAnimationFrame(frame);
    }
    if (document.fonts && document.fonts.load) {
      document.fonts.load('900 100px Unbounded').then(kick, kick);
      setTimeout(kick, 1500); // red de seguridad amplia: solo pinta sin la fuente si tarda >1,5s
    } else { kick(); }
  }

  /* ---------------------------------------------------------
     2) ARRANQUE DE PÁGINA — reveals de entrada
     --------------------------------------------------------- */
  var pageStarted = false;
  function startPage() {
    if (pageStarted) return; pageStarted = true;
    document.body.classList.add('page-in');
    document.querySelectorAll('.kinetic[data-onload]').forEach(function (el) {
      el.classList.add('play');
    });
    document.querySelectorAll('[data-rv][data-onload]').forEach(function (el) {
      el.classList.add('rv-in');
    });
  }

  /* ---------------------------------------------------------
     3) Tipografía cinética — trocear en palabras
     --------------------------------------------------------- */
  document.querySelectorAll('.kinetic').forEach(function (el) {
    var delay = 0, step = 0.055;
    function wrapWords(node) {
      var kids = Array.prototype.slice.call(node.childNodes);
      kids.forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (tk) {
            if (!tk) return;
            if (/^\s+$/.test(tk)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var inner = document.createElement('span');
            inner.textContent = tk;
            inner.style.setProperty('--kd', (delay).toFixed(3) + 's');
            delay += step;
            w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains('w')) {
          if (child.classList.contains('grad-text')) {
            // background-clip:text se rompe con descendientes transformados:
            // sustituimos el elemento por palabras que llevan el degradado ellas mismas
            var frag2 = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(function (tk) {
              if (!tk) return;
              if (/^\s+$/.test(tk)) { frag2.appendChild(document.createTextNode(' ')); return; }
              var w2 = document.createElement('span'); w2.className = 'w';
              var inner2 = document.createElement('span');
              inner2.className = 'grad-text';
              inner2.textContent = tk;
              inner2.style.setProperty('--kd', (delay).toFixed(3) + 's');
              delay += step;
              w2.appendChild(inner2); frag2.appendChild(w2);
            });
            node.replaceChild(frag2, child);
          } else {
            wrapWords(child);
          }
        }
      });
    }
    wrapWords(el);
  });

  /* ---------------------------------------------------------
     4) IntersectionObserver — reveals, kinetic, counters
     --------------------------------------------------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      if (el.hasAttribute('data-rv')) el.classList.add('rv-in');
      if (el.classList.contains('kinetic')) el.classList.add('play');
      if (el.classList.contains('stat')) runCounter(el);
      if (el.classList.contains('section')) el.classList.add('in-view');
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('[data-rv]:not([data-onload]), .kinetic:not([data-onload]), .stat, .section').forEach(function (el) {
    io.observe(el);
  });

  // stagger automático dentro de grupos
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    var step = parseFloat(group.getAttribute('data-stagger')) || 70;
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty('--rv-d', (i * step / 1000).toFixed(3) + 's');
    });
  });

  /* ---------------------------------------------------------
     5) Contadores animados
     --------------------------------------------------------- */
  function runCounter(stat) {
    if (stat.classList.contains('count-done')) return;
    stat.classList.add('count-done');
    var numEl = stat.querySelector('[data-count]');
    if (!numEl) return;
    var target = parseFloat(numEl.getAttribute('data-count'));
    var decimals = (numEl.getAttribute('data-count').split(',')[1] || '').length ? 1 : 0;
    if (numEl.getAttribute('data-count').indexOf(',') > -1) {
      target = parseFloat(numEl.getAttribute('data-count').replace(',', '.'));
      decimals = 1;
    }
    if (reduceMotion) { numEl.textContent = numEl.getAttribute('data-count'); return; }
    var t0 = null, dur = 1500;
    function tick(ts) {
      if (t0 === null) t0 = ts;
      var p = clamp((ts - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - p, 3);
      var val = target * e;
      numEl.textContent = decimals ? val.toFixed(1).replace('.', ',') : Math.round(val);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     6) Header: ocultar al bajar, mostrar al subir
     --------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  var lastY = window.scrollY;
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('scrolled', y > 24);
      if (!document.body.classList.contains('menu-open')) {
        if (y > lastY + 6 && y > 140) header.classList.add('hidden');
        else if (y < lastY - 4) header.classList.remove('hidden');
      }
    }
    lastY = y;
    updateParallax();
    updateShowcase();
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---------------------------------------------------------
     7) Menú móvil
     --------------------------------------------------------- */
  var burger = document.querySelector('.burger');
  var menuBackdrop = document.querySelector('.menu-backdrop');
  function closeMenu() {
    document.body.classList.remove('menu-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    if (menuBackdrop) menuBackdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ---------------------------------------------------------
     8) Parallax por capas (data-plx="factor")
     --------------------------------------------------------- */
  var plxEls = Array.prototype.slice.call(document.querySelectorAll('[data-plx]'));
  function updateParallax() {
    if (reduceMotion) return;
    var vh = window.innerHeight;
    plxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      var f = parseFloat(el.getAttribute('data-plx')) || 0.1;
      var center = r.top + r.height / 2 - vh / 2;
      el.style.transform = 'translate3d(0,' + (-center * f).toFixed(1) + 'px,0)';
    });
  }

  /* ---------------------------------------------------------
     9) Cursor propio con física (spring/lerp)
     --------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    document.body.classList.add('has-cursor');
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    var ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.appendChild(dot); document.body.appendChild(ring);
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function cursorLoop() {
      rx = lerp(rx, mx, 0.16); ry = lerp(ry, my, 0.16);
      dot.style.transform = 'translate(' + (mx - 3.5) + 'px,' + (my - 3.5) + 'px)';
      ring.style.transform = 'translate(' + (rx - ring.offsetWidth / 2) + 'px,' + (ry - ring.offsetHeight / 2) + 'px)';
      requestAnimationFrame(cursorLoop);
    })();
    document.addEventListener('pointerover', function (e) {
      if (e.target.closest('a,button,.g-item,.car-track')) ring.classList.add('is-hover');
    });
    document.addEventListener('pointerout', function (e) {
      if (e.target.closest('a,button,.g-item,.car-track')) ring.classList.remove('is-hover');
    });
  }

  /* ---------------------------------------------------------
     10) Botones magnéticos
     --------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.btn, .car-btn').forEach(function (btn) {
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null, inside = false;
      function loop() {
        cx = lerp(cx, tx, 0.18); cy = lerp(cy, ty, 0.18);
        btn.style.transform = 'translate(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px)';
        if (Math.abs(cx - tx) > 0.2 || Math.abs(cy - ty) > 0.2 || inside) raf = requestAnimationFrame(loop);
        else { btn.style.transform = ''; raf = null; }
      }
      btn.addEventListener('pointerenter', function () { inside = true; if (!raf) raf = requestAnimationFrame(loop); });
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * 0.22;
        ty = (e.clientY - r.top - r.height / 2) * 0.28;
      });
      btn.addEventListener('pointerleave', function () { inside = false; tx = 0; ty = 0; });
    });
  }

  /* ---------------------------------------------------------
     11) Tarjetas tilt 3D + glare
     --------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.tcard').forEach(function (card) {
      var rx = 0, ry = 0, trx = 0, try_ = 0, raf = null, inside = false;
      function loop() {
        rx = lerp(rx, trx, 0.14); ry = lerp(ry, try_, 0.14);
        card.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
        if (inside || Math.abs(rx - trx) > 0.05) raf = requestAnimationFrame(loop);
        else { card.style.transform = ''; raf = null; }
      }
      card.addEventListener('pointerenter', function () { inside = true; if (!raf) raf = requestAnimationFrame(loop); });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        try_ = (px - 0.5) * 10; trx = (0.5 - py) * 8;
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () { inside = false; trx = 0; try_ = 0; });
    });
  }

  /* ---------------------------------------------------------
     12) Carruseles: flechas + arrastre + snap
     --------------------------------------------------------- */
  document.querySelectorAll('.carousel').forEach(function (car) {
    var track = car.querySelector('.car-track');
    var prev = car.querySelector('.car-prev');
    var next = car.querySelector('.car-next');
    if (!track) return;

    function step() {
      var first = track.children[0];
      return first ? first.getBoundingClientRect().width + 18 : 300;
    }
    function updateBtns() {
      var max = track.scrollWidth - track.clientWidth - 8;
      if (prev) prev.disabled = track.scrollLeft <= 8;
      if (next) next.disabled = track.scrollLeft >= max;
    }
    // desplazamiento animado a mano (easing propio, fiable en todos los motores)
    var animId = null;
    function glideTo(to) {
      var max = track.scrollWidth - track.clientWidth;
      to = clamp(to, 0, max);
      var from = track.scrollLeft;
      if (reduceMotion) { track.scrollLeft = to; track.style.scrollSnapType = ''; updateBtns(); return; }
      if (animId) cancelAnimationFrame(animId);
      track.style.scrollSnapType = 'none';
      var t0 = null, dur = 420;
      function tick(ts) {
        if (t0 === null) t0 = ts;
        var p = clamp((ts - t0) / dur, 0, 1);
        var e = 1 - Math.pow(1 - p, 3); // ease-out
        track.scrollLeft = from + (to - from) * e;
        if (p < 1) animId = requestAnimationFrame(tick);
        else { animId = null; track.style.scrollSnapType = ''; updateBtns(); }
      }
      animId = requestAnimationFrame(tick);
    }
    function glide(delta) { glideTo(track.scrollLeft + delta); }
    function nearestSnap(pos) {
      var s = step();
      return clamp(Math.round(pos / s) * s, 0, track.scrollWidth - track.clientWidth);
    }
    if (prev) prev.addEventListener('click', function () { glide(-step()); });
    if (next) next.addEventListener('click', function () { glide(step()); });
    track.addEventListener('scroll', updateBtns, { passive: true });
    window.addEventListener('resize', updateBtns);
    updateBtns();

    // arrastre con puntero (desktop) — solo inicia captura tras un movimiento real,
    // así los clics en botones/enlaces dentro del carrusel no se ven interceptados
    var isDown = false, startX = 0, startL = 0, moved = false, pid = null;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return; // touch usa scroll nativo
      if (e.target.closest('button,a,input,textarea,select')) return; // deja pasar el clic
      isDown = true; moved = false; startX = e.clientX; startL = track.scrollLeft; pid = e.pointerId;
      if (animId) { cancelAnimationFrame(animId); animId = null; }
    });
    track.addEventListener('pointermove', function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        track.classList.add('dragging');
        track.style.scrollSnapType = 'none'; // el snap se resuelve a mano al soltar, evita el salto errático del navegador
        try { track.setPointerCapture(pid); } catch (err) {}
      }
      if (moved) track.scrollLeft = startL - dx;
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      track.addEventListener(ev, function () {
        isDown = false;
        track.classList.remove('dragging');
        if (moved) glideTo(nearestSnap(track.scrollLeft)); // aterriza suave en la tarjeta más cercana
      });
    });
    track.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
  });

  /* ---------------------------------------------------------
     13) Showcase fijado por scroll
     --------------------------------------------------------- */
  var showWrap = document.querySelector('.showcase-wrap');
  var showImgs = [], showItems = [], showBar = null, showIdx = -1;
  if (showWrap) {
    showImgs = Array.prototype.slice.call(showWrap.querySelectorAll('.show-stage img'));
    showItems = Array.prototype.slice.call(showWrap.querySelectorAll('.show-item'));
    showBar = showWrap.querySelector('.show-progress i');
  }
  function updateShowcase() {
    if (!showWrap || reduceMotion) return;
    var r = showWrap.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    var p = clamp(-r.top / total, 0, 1);
    if (showBar) showBar.style.width = (p * 100).toFixed(1) + '%';
    var idx = clamp(Math.floor(p * showImgs.length), 0, showImgs.length - 1);
    if (idx !== showIdx) {
      showIdx = idx;
      showImgs.forEach(function (im, i) { im.classList.toggle('on', i === idx); });
      showItems.forEach(function (it, i) { it.classList.toggle('active', i === idx); });
    }
  }

  /* ---------------------------------------------------------
     14) Horario: resaltar el día de hoy
     --------------------------------------------------------- */
  var todayIdx = new Date().getDay(); // 0=domingo
  document.querySelectorAll('.hours .row').forEach(function (row) {
    if (parseInt(row.getAttribute('data-day'), 10) === todayIdx) row.classList.add('today');
  });

  /* ---------------------------------------------------------
     15) Lightbox galería
     --------------------------------------------------------- */
  var lb = document.querySelector('.lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    document.querySelectorAll('.g-item').forEach(function (item) {
      item.addEventListener('click', function () {
        lbImg.src = item.querySelector('img').src;
        lbImg.alt = item.querySelector('img').alt;
        lb.classList.add('open');
      });
    });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.closest('.lb-close')) lb.classList.remove('open');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { lb.classList.remove('open'); document.body.classList.remove('menu-open'); }
    });
  }

  /* ---------------------------------------------------------
     GO
     --------------------------------------------------------- */
  updateParallax(); updateShowcase();
  if (document.readyState === 'complete') sprayIntro();
  else window.addEventListener('load', sprayIntro);
  // failsafe global: si algo falla, la página arranca igual
  setTimeout(startPage, 2200);
})();
