(function () {
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var stored = localStorage.getItem("theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  var initial = stored || (prefersDark ? "dark" : "light");
  root.setAttribute("data-theme", initial);

  // UI sound effects: small procedural blips synthesized with the Web Audio
  // API (no sound files, no licensing to worry about). On by default; every
  // sound only ever fires from inside a click handler, so the browser's
  // autoplay restriction (audio needs a user gesture) is never an issue.
  var SOUND_KEY = "sound-on";
  var storedSound = localStorage.getItem(SOUND_KEY);
  var soundOn = storedSound === null ? true : storedSound === "true";
  var audioCtx = null;
  function getAudioCtx() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }
  // A short tone sweep with a soft attack/decay envelope so it reads as a
  // gentle blip instead of a click/pop.
  function playTone(from, to, opts) {
    var ctx = getAudioCtx();
    if (!ctx) return;
    opts = opts || {};
    var dur = opts.duration || 0.1;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), now + dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(opts.gain || 0.08, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }
  var SOUNDS = {
    soundOn: function () { playTone(520, 780, { duration: 0.12, type: "sine", gain: 0.09 }); },
    soundOff: function () { playTone(520, 280, { duration: 0.12, type: "sine", gain: 0.08 }); },
    themeLight: function () { playTone(420, 900, { duration: 0.15, type: "triangle", gain: 0.07 }); },
    themeDark: function () { playTone(900, 340, { duration: 0.16, type: "triangle", gain: 0.07 }); },
    click: function () { playTone(600, 520, { duration: 0.05, type: "square", gain: 0.05 }); }
  };

  var soundToggle = document.getElementById("sound-toggle");
  function syncSoundIcon() {
    if (soundToggle) soundToggle.classList.toggle("is-muted", !soundOn);
  }
  syncSoundIcon();
  if (soundToggle) {
    soundToggle.addEventListener("click", function () {
      soundOn = !soundOn;
      localStorage.setItem(SOUND_KEY, soundOn);
      syncSoundIcon();
      // Plays regardless of the resulting state: this click is the explicit
      // on/off gesture, so it always gets its own confirmation blip.
      if (soundOn) SOUNDS.soundOn(); else SOUNDS.soundOff();
    });
  }

  toggle.addEventListener("click", function () {
    var current = root.getAttribute("data-theme");
    var next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    if (soundOn) { if (next === "dark") SOUNDS.themeDark(); else SOUNDS.themeLight(); }
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  // Topbar: transparent while the night-sky scene is behind it
  var topbar = document.querySelector(".topbar");
  function setTopbarHeight() {
    root.style.setProperty("--topbar-h", topbar.offsetHeight + "px");
  }
  setTopbarHeight();
  window.addEventListener("resize", setTopbarHeight);

  function onScroll() {
    topbar.classList.toggle("at-top", window.scrollY < 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Rainbow: concentric dashed arcs on a canvas, centered on the avatar and
  // rising from behind the clouds (the cloud SVGs paint over the canvas).
  // Configurable via the "Rainbow Configurator" panel (gear button in the scene).
  // op: "modern" gives each dash its own color (diagonal stripes), "classic"
  // paints each row a single color like a real rainbow. segX/segY (0..1) come
  // from the XY pad: X = dash length, Y = dash thickness.
  // Defaults mirror the reference site's panel: density slider a bit past
  // halfway, rows maxed out, modern + round, pad dot right of center and
  // slightly high (longer, slightly thicker dashes).
  var CFG_DEFAULTS = {
    v: 5, density: 27, rows: 8, edges: "round",
    op: "modern", segX: 0.65, segY: 0.58, seed: 7
  };
  var cfg;
  try {
    cfg = JSON.parse(localStorage.getItem("sky-config")) || {};
  } catch (e) { cfg = {}; }
  // v4: defaults were retuned to match the reference panel — older configs
  // lack the new fields or used ranges that no longer look right, so drop.
  if (cfg.v !== CFG_DEFAULTS.v) cfg = {};
  cfg = {
    v: CFG_DEFAULTS.v,
    density: cfg.density || CFG_DEFAULTS.density,
    rows: cfg.rows || CFG_DEFAULTS.rows,
    edges: cfg.edges || CFG_DEFAULTS.edges,
    op: cfg.op || CFG_DEFAULTS.op,
    segX: typeof cfg.segX === "number" ? cfg.segX : CFG_DEFAULTS.segX,
    segY: typeof cfg.segY === "number" ? cfg.segY : CFG_DEFAULTS.segY,
    seed: cfg.seed || CFG_DEFAULTS.seed
  };

  function saveCfg() {
    localStorage.setItem("sky-config", JSON.stringify(cfg));
  }

  // Dash colors cycle through this palette (joshwcomeau.com's rainbow set),
  // offset one step per row so the colors form diagonal stripes across rows.
  var RAINBOW = [
    "hsl(0deg 90% 55%)",
    "hsl(30deg 95% 65%)",
    "hsl(55deg 90% 65%)",
    "hsl(100deg 65% 45%)",
    "hsl(220deg 80% 55%)",
    "hsl(265deg 80% 50%)"
  ];
  // Per-color radius multiplier for classic-mode resting dots, matched
  // index-for-index to RAINBOW. Same pixel radius, but the indigo/purple
  // dot reads visually smaller against the sky, so it gets a small boost.
  var RAINBOW_DOT_BOOST = [1, 1, 1, 1, 1, 1.2];

  var canvas = document.getElementById("rainbow-canvas");
  var sky = document.querySelector(".hero-sky");
  var sticker = document.querySelector(".hero-sticker");
  var ctx = canvas ? canvas.getContext("2d") : null;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var geo = null;
  // Cursor position in canvas coordinates. mouseX/Y chases mouseTX/TY with a
  // lerp each frame; parked far off-canvas until the cursor first enters.
  // grip is the overall influence strength: it eases toward 1 while the
  // cursor is over the scene and back to 0 after it leaves, so the dashes
  // fade smoothly into and out of the interaction instead of snapping.
  var mouseX = -9999, mouseY = -9999, mouseTX = -9999, mouseTY = -9999;
  var grip = 0, inScene = false;

  // Entrance animation: on first load the whole arch unfurls like an opening
  // fan — every dash starts collapsed at the arc's pivot point (geo.cx/cy,
  // below the avatar's feet) and flies out to its resting slot. Staggered by
  // row (inner rows open first) and by distance from the arc's midpoint
  // (center dashes lead, tips trail), so it reads as a sweep outward rather
  // than everything popping in at once.
  var introStart = (typeof performance !== "undefined" ? performance.now() : Date.now());
  var INTRO_DURATION = 620;
  var INTRO_ROW_STAGGER = 55;
  var INTRO_SPAN_STAGGER = 260;

  function layoutRainbow() {
    if (!ctx) return;
    var rect = canvas.getBoundingClientRect();
    var s = sticker.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    geo = {
      w: rect.width,
      h: rect.height,
      dpr: dpr,
      // A wide, flat arch like the reference: centered on the avatar, the
      // circle's center sits below its feet so only the shallow top of the
      // circle shows, and both ends sink into the cloud bank.
      cx: s.left + s.width / 2 - rect.left,
      cy: s.bottom - rect.top + s.height * 0.2,
      innerR: Math.max(s.height * 1.15, 170)
    };
  }

  // Every dash is a short straight segment pinned to a fixed slot on its
  // arc — dashes never leave their spot, only their orientation reacts to
  // the cursor (like the reference site's art):
  //   modern:  bars lie along the arc; near the cursor they pivot to aim
  //            at it, so the arch bursts into a little starburst.
  //   classic: at rest the bars face the viewer (+z) and read as dots;
  //            turning toward the cursor "unforeshortens" them into bars.
  function drawRainbow() {
    if (!ctx || !geo) return;
    ctx.setTransform(geo.dpr, 0, 0, geo.dpr, 0, 0);
    ctx.clearRect(0, 0, geo.w, geo.h);

    // Reduced motion: skip straight to the fully-opened arch.
    var introElapsed = reduceMotion ? Infinity : (performance.now() - introStart);
    var centerJ = (cfg.density - 1) / 2;

    var lw = Math.max(6, geo.innerR * 0.028) * (0.5 + 1.3 * cfg.segY);
    var rowGap = lw * 0.9;
    var cut = 0.14; // arc ends reach almost down to the avatar's base, so the
                    // tips sink behind the foreground cloud crests
    var stretch = 1.3; // not a true circle: the arch is an ellipse, wider
                       // than it is tall, so the tips land further out on
                       // the cloud crests on both sides
    var a0 = Math.PI + cut;
    var span = Math.PI - cut * 2;
    // Cursor influence spans the whole scene: every dash reacts wherever
    // the cursor is over the hero — near ones swivel fully, far ones still
    // turn noticeably. (The parked off-canvas position stays outside it.)
    var reachR = Math.max(geo.w, geo.h) * 1.1;
    ctx.lineCap = cfg.edges === "square" ? "butt" : "round";

    for (var i = 0; i < cfg.rows; i++) {
      var r = geo.innerR + i * (lw + rowGap);
      var rx = r * stretch;
      var rAvg = r * ((1 + stretch) / 2);
      var arcLen = rAvg * span;
      var unit = arcLen / cfg.density;
      var dash = unit * (0.15 + 0.7 * cfg.segX);

      for (var j = 0; j < cfg.density; j++) {
        // Fixed slot per dash, staggered a bit per row and by the seed.
        // Toward both arc tips the dashes shrink and thin out so the
        // rainbow melts into the clouds instead of being cut off.
        var centerLen = ((j + 0.5) * unit + i * unit * 0.37 + cfg.seed * 3.7) % arcLen;
        var fade = Math.min(centerLen, arcLen - centerLen) / (arcLen * 0.16);
        fade = Math.max(0, Math.min(1, fade));
        if (fade < 0.05) continue;

        var theta = a0 + centerLen / rAvg;
        var px = geo.cx + rx * Math.cos(theta);
        var py = geo.cy + r * Math.sin(theta);

        // Entrance progress for this dash: 0 = still collapsed at the pivot,
        // 1 = fully flown out to its resting slot (px, py).
        var spanFrac = cfg.density > 1 ? Math.abs(j - centerJ) / centerJ : 0;
        var introDelay = i * INTRO_ROW_STAGGER + spanFrac * INTRO_SPAN_STAGGER;
        var introT = Math.max(0, Math.min(1, (introElapsed - introDelay) / INTRO_DURATION));
        var reveal = 1 - Math.pow(1 - introT, 3);

        // How strongly the cursor has grabbed this dash (0..1, smoothstep)
        var mdx = mouseX - px;
        var mdy = mouseY - py;
        var dist = Math.sqrt(mdx * mdx + mdy * mdy);
        var t = Math.max(0, Math.min(1, 1 - dist / reachR));
        t = t * t * (3 - 2 * t) * grip;
        var toCursor = Math.atan2(mdy, mdx);

        var len = dash * (0.3 + 0.7 * fade);
        var ang;
        if (cfg.op === "modern") {
          var tangent = Math.atan2(r * Math.cos(theta), -rx * Math.sin(theta));
          var delta = toCursor - tangent;
          delta = Math.atan2(Math.sin(delta), Math.cos(delta));
          ang = tangent + delta * t;
        } else {
          ang = toCursor;
          len = len * t;
        }

        var w = lw * (0.5 + 0.5 * fade);
        // modern: each row keeps one base color, with seeded random dashes
        // swapped to another color (like the reference art); classic:
        // colors scatter freely across all dots.
        var color, colorIdx;
        if (cfg.op === "classic") {
          colorIdx = (i * 5 + j * 3 + cfg.seed) % RAINBOW.length;
          color = RAINBOW[colorIdx];
        } else {
          var h = (i * 31 + j * 17 + cfg.seed) % 13;
          colorIdx = h < 2 ? (i + 1 + h * 2) % RAINBOW.length : i % RAINBOW.length;
          color = RAINBOW[colorIdx];
        }
        if (reveal <= 0) continue;
        // Rendered position flies out from the arc's pivot to its resting
        // slot; size ramps in alongside it so dashes pop rather than smear.
        var rpx = geo.cx + (px - geo.cx) * reveal;
        var rpy = geo.cy + (py - geo.cy) * reveal;
        var sizeMul = 0.3 + 0.7 * reveal;

        ctx.globalAlpha = (0.55 + 0.45 * fade) * reveal;
        if (len < 1) {
          // Resting classic dash: a zero-length round-cap line doesn't
          // render, so paint the dot (or tiny square) directly. The indigo
          // swatch reads visually smaller than the others at equal radius
          // (low lightness contrast against the sky), so its dots get a
          // small radius boost to look the same size as the rest.
          var dotW = w * RAINBOW_DOT_BOOST[colorIdx] * sizeMul;
          ctx.fillStyle = color;
          if (cfg.edges === "square") {
            ctx.fillRect(rpx - dotW / 2, rpy - dotW / 2, dotW, dotW);
          } else {
            ctx.beginPath();
            ctx.arc(rpx, rpy, dotW / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.lineWidth = w * sizeMul;
          ctx.strokeStyle = color;
          var hx = Math.cos(ang) * (len * sizeMul / 2);
          var hy = Math.sin(ang) * (len * sizeMul / 2);
          ctx.beginPath();
          ctx.moveTo(rpx - hx, rpy - hy);
          ctx.lineTo(rpx + hx, rpy + hy);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function buildRainbow() {
    layoutRainbow();
    drawRainbow();
  }

  if (ctx) {
    buildRainbow();
    window.addEventListener("resize", buildRainbow);
    window.addEventListener("load", buildRainbow);
    if (!reduceMotion) {
      (function tick() {
        // The cursor chase: the effective mouse position eases toward the
        // real one, so the dashes swivel smoothly instead of snapping; grip
        // ramps slower than the chase, giving a gentle fade-in when the
        // cursor enters the scene and a slow settle back after it leaves.
        mouseX += (mouseTX - mouseX) * 0.16;
        mouseY += (mouseTY - mouseY) * 0.16;
        grip += ((inScene ? 1 : 0) - grip) * 0.045;
        drawRainbow();
        requestAnimationFrame(tick);
      })();
    }
  }

  // Mouse interaction: only the rainbow dashes react. The cursor's position
  // is tracked in canvas coordinates (with a lerp so the reaction feels
  // springy), and drawRainbow pushes nearby dashes radially away from it.
  if (sky && ctx && !reduceMotion) {
    sky.addEventListener(
      "mousemove",
      function (e) {
        var rect = canvas.getBoundingClientRect();
        mouseTX = e.clientX - rect.left;
        mouseTY = e.clientY - rect.top;
        inScene = true;
        // First entry after being parked off-canvas: snap the position (the
        // ramp-in is handled by grip, so nothing visibly jumps).
        if (mouseX < -5000) { mouseX = mouseTX; mouseY = mouseTY; }
      },
      { passive: true }
    );
    // On leave the position stays where it was; only grip eases back to 0,
    // so the art settles gently into its resting state.
    sky.addEventListener("mouseleave", function () {
      inScene = false;
    });
  }

  // Rainbow Configurator panel
  var cfgBtn = document.getElementById("sky-config-btn");
  var cfgPanel = document.getElementById("sky-config");
  if (cfgBtn && cfgPanel) {
    var densityInput = document.getElementById("cfg-density");
    var rowsInput = document.getElementById("cfg-rows");
    var edgeBtns = cfgPanel.querySelectorAll("[data-edge]");
    var opBtns = cfgPanel.querySelectorAll("[data-op]");
    var pad = document.getElementById("cfg-pad");

    // Slides each toggle's active-option pill under the pressed button by
    // writing its offset into --x (translateX(var(--x)) does the move).
    function placeToggleIndicators() {
      cfgPanel.querySelectorAll(".cfg-toggle").forEach(function (wrap) {
        var active = wrap.querySelector("button.is-active");
        if (!active) return;
        wrap.style.setProperty("--x", active.offsetLeft + "px");
        wrap.style.setProperty("--w", active.offsetWidth + "px");
      });
    }

    function syncPad() {
      pad.style.setProperty("--px", cfg.segX * 100 + "%");
      pad.style.setProperty("--py", (1 - cfg.segY) * 100 + "%");
    }

    function syncPanel() {
      densityInput.value = cfg.density;
      rowsInput.value = cfg.rows;
      edgeBtns.forEach(function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-edge") === cfg.edges);
      });
      opBtns.forEach(function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-op") === cfg.op);
      });
      syncPad();
      placeToggleIndicators();
    }
    syncPanel();
    window.addEventListener("load", placeToggleIndicators);
    window.addEventListener("resize", placeToggleIndicators);

    cfgBtn.addEventListener("click", function () {
      cfgPanel.classList.toggle("open");
      placeToggleIndicators();
    });
    document.getElementById("sky-config-close").addEventListener("click", function () {
      cfgPanel.classList.remove("open");
    });

    densityInput.addEventListener("input", function () {
      cfg.density = parseInt(densityInput.value, 10);
      saveCfg(); buildRainbow();
    });
    densityInput.addEventListener("change", function () {
      if (soundOn) SOUNDS.click();
    });
    rowsInput.addEventListener("input", function () {
      cfg.rows = parseInt(rowsInput.value, 10);
      saveCfg(); buildRainbow();
    });
    rowsInput.addEventListener("change", function () {
      if (soundOn) SOUNDS.click();
    });
    edgeBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        cfg.edges = b.getAttribute("data-edge");
        saveCfg(); syncPanel(); buildRainbow();
        if (soundOn) SOUNDS.click();
      });
    });
    opBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        cfg.op = b.getAttribute("data-op");
        saveCfg(); syncPanel(); buildRainbow();
        if (soundOn) SOUNDS.click();
      });
    });

    // XY pad: drag (pointer capture) or arrow keys. X = dash length,
    // Y = dash thickness; the white dot mirrors cfg.segX/segY.
    var padDragging = false;
    function padSet(clientX, clientY) {
      var r = pad.getBoundingClientRect();
      cfg.segX = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      cfg.segY = Math.max(0, Math.min(1, 1 - (clientY - r.top) / r.height));
      saveCfg(); syncPad(); buildRainbow();
    }
    pad.addEventListener("pointerdown", function (e) {
      padDragging = true;
      pad.setPointerCapture(e.pointerId);
      padSet(e.clientX, e.clientY);
    });
    pad.addEventListener("pointermove", function (e) {
      if (padDragging) padSet(e.clientX, e.clientY);
    });
    pad.addEventListener("pointerup", function () {
      padDragging = false;
      if (soundOn) SOUNDS.click();
    });
    pad.addEventListener("pointercancel", function () { padDragging = false; });
    pad.addEventListener("keydown", function (e) {
      var step = 0.05;
      if (e.key === "ArrowLeft") cfg.segX = Math.max(0, cfg.segX - step);
      else if (e.key === "ArrowRight") cfg.segX = Math.min(1, cfg.segX + step);
      else if (e.key === "ArrowDown") cfg.segY = Math.max(0, cfg.segY - step);
      else if (e.key === "ArrowUp") cfg.segY = Math.min(1, cfg.segY + step);
      else return;
      if (soundOn) SOUNDS.click();
      e.preventDefault();
      saveCfg(); syncPad(); buildRainbow();
    });

    document.getElementById("cfg-random").addEventListener("click", function () {
      cfg.density = 12 + Math.floor(Math.random() * 29);
      cfg.rows = 2 + Math.floor(Math.random() * 7);
      cfg.edges = Math.random() < 0.5 ? "round" : "square";
      cfg.op = Math.random() < 0.5 ? "modern" : "classic";
      cfg.segX = Math.random();
      cfg.segY = Math.random();
      cfg.seed = Math.floor(Math.random() * 100000);
      saveCfg(); syncPanel(); buildRainbow();
      if (soundOn) SOUNDS.click();
    });
    document.getElementById("cfg-reset").addEventListener("click", function () {
      cfg = {
        v: CFG_DEFAULTS.v, density: CFG_DEFAULTS.density, rows: CFG_DEFAULTS.rows,
        edges: CFG_DEFAULTS.edges, op: CFG_DEFAULTS.op,
        segX: CFG_DEFAULTS.segX, segY: CFG_DEFAULTS.segY, seed: CFG_DEFAULTS.seed
      };
      saveCfg(); syncPanel(); buildRainbow();
      if (soundOn) SOUNDS.click();
    });
  }

  // Writing section: simple category filter (all / game-dev / ai-security).
  // Guarded so pages without the timeline (article pages) skip it silently.
  var filterBtns = document.querySelectorAll(".filter-btn");
  var writingItems = document.querySelectorAll("#writing-timeline li");
  if (filterBtns.length && writingItems.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var filter = btn.getAttribute("data-filter");
        filterBtns.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        writingItems.forEach(function (li) {
          var show = filter === "all" || li.getAttribute("data-cat") === filter;
          li.classList.toggle("is-filtered-out", !show);
        });
        if (soundOn) SOUNDS.click();
      });
    });
  }

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Language: TR/EN toggle. Elements tagged data-i18n / data-i18n-html /
  // data-i18n-aria-label / data-i18n-title get swapped from this dictionary;
  // everything else (names, tech terms already in English, links) is left alone.
  var LANG_KEY = "site-lang";
  var TRANSLATIONS = {
    tr: {
      "nav.experience": "Deneyim",
      "nav.projects": "Projeler",
      "nav.writing": "Yazılar",
      "nav.education": "Eğitim",
      "nav.contact": "İletişim",
      "a11y.sound": "Sesi aç/kapat",
      "a11y.theme": "Tema değiştir",
      "a11y.skyConfig": "Gökyüzü ayarları",
      "a11y.close": "Kapat",
      "cfg.title": "Gökkuşağı Yapılandırıcısı",
      "cfg.density": "YOĞUNLUK",
      "cfg.rows": "SIRA SAYISI",
      "cfg.operation": "OPERASYON",
      "cfg.modern": "modern",
      "cfg.classic": "klasik",
      "cfg.edges": "KENARLAR",
      "cfg.round": "yuvarlak",
      "cfg.square": "kare",
      "cfg.segments": "SEGMENT DEĞERLERİ",
      "cfg.padAria": "Segment değerleri: yatay eksen parça uzunluğu, dikey eksen kalınlık. Ok tuşlarıyla ayarlanır.",
      "cfg.note": "Bu panel gökyüzündeki sanatı özelleştirir. <strong>Değişiklikler bu tarayıcıda saklanır.</strong>",
      "cfg.random": "RASTGELE",
      "cfg.randomAria": "Rastgele ayarla",
      "cfg.reset": "SIFIRLA",
      "cfg.resetAria": "Sıfırla",
      "hero.eyebrow": "📍 Kocaeli, Türkiye",
      "hero.title": "Merhaba, ben<br><span class=\"gradient-text\">Eren Özcan</span>",
      "hero.bio": "2+ yıllık Unity ve Unreal Engine deneyimiyle gameplay programlama, fizik simülasyonu ve sistem tasarımı üzerine çalışıyorum. Custom yerçekimi mekanikleri, yıkılabilir ortamlar ve modüler yetenek mimarisine sahip tam bir 2D turn-based oyun geliştirdim.",
      "hero.sayHello": "Merhaba de",
      "hero.downloadCv": "CV'yi indir",
      "exp.heading": "Profesyonel deneyim",
      "exp.sub": "Oyun geliştirme, VR ve yazılım alanlarında edindiğim tecrübeler.",
      "exp.date1": "Nisan 2023 – Nisan 2025",
      "exp.desc1": "Meta Quest 2 için Unreal Engine ile immersif VR uygulamaları geliştirdim; el takibi, controller etkileşimi ve performans optimizasyonu üzerine çalıştım.",
      "exp.date2": "Şubat 2025 – Haziran 2025",
      "exp.desc2": "ERP sistem geliştirme ve iş süreci otomasyonunda SAP ABAP ile destek verdim; kurumsal uygulamalarda hata ayıklama ve teknik dokümantasyon yaptım.",
      "exp.date3": "Ağustos 2023 – Eylül 2023",
      "exp.desc3": "AWS ve Google Cloud üzerinde ölçeklenebilir dağıtımlar için bulut altyapısı yönettim; Docker/Kubernetes ile CI/CD pipeline'ları kurdum.",
      "exp.date4": "Ağustos 2022 – Eylül 2022",
      "exp.desc4": "C# ve .NET Framework ile iç yazılım sistemleri geliştirdim; sistem analizi, hata ayıklama ve veritabanı entegrasyonu üzerine çalıştım.",
      "proj.heading": "Öne çıkan işler",
      "proj.sub": "Üzerinde çalıştığım / tamamladığım projelerden bir seçki.",
      "proj.desc1": "Gezegen bazlı custom yerçekimi sistemi ve yıkılabilir ortamlara sahip tam bir 2D turn-based shooter. Rüzgâr direnci ve yerçekimi etkili fizik simülasyonu, OOP tabanlı modüler yetenek mimarisi, aksiyon kuyruğu ve state management içeren combat sistemi; object pooling ile performans optimizasyonu.",
      "proj.repo": "Repo →",
      "proj.desc2": "Kurduğum bağımsız oyun stüdyosu; farklı platform ve motorlarda (Unity, Godot, web) özgün oyunlar geliştiriyoruz — aralarında Cosmic Rumble de var.",
      "proj.visit": "Siteyi ziyaret et →",
      "proj.moreTitle": "Daha fazlası GitHub'da",
      "proj.moreDesc": "Diğer küçük projelerimi, denemelerimi ve okul projelerimi GitHub profilimde bulabilirsin.",
      "proj.profile": "Profil →",
      "writing.heading": "Notlar & öğrendiklerim",
      "writing.sub": "Ara sıra öğrendiklerimi buraya not düşüyorum.",
      "writing.status": "2026 — hazırlanıyor",
      "writing.date1": "28 Temmuz 2026",
      "writing.title1": "Unity'de gezegen bazlı yerçekimi sistemi tasarımı",
      "writing.title2": "Meta Quest 2 için VR etkileşim sistemleri geliştirmek",
      "writing.title3": "Turn-based combat mimarisi: action queue ve state management",
      "writing.title4": "LLM tabanlı sistemlerde prompt injection savunmaları",
      "writing.filterAll": "Tümü",
      "writing.filterGameDev": "Game Dev Notes",
      "writing.filterAiSecurity": "AI Security",
      "writing.catGameDev": "Game Dev Notes",
      "writing.catAiSecurity": "AI Security",
      "post.gravity.back": "← Yazılara dön",
      "post.gravity.pIntro": "Cosmic Rumble'da her seviye küçük, yuvarlak bir gezegenin üzerinde geçiyor. Unity'nin varsayılan Rigidbody2D yerçekimi tek bir global aşağı vektörü varsayıyor; oyuncular, mermiler ve efektler gezegenin yüzeyine yapışıp merkeze doğru çekilmesi gerektiğinde bu yaklaşım işe yaramıyor. Bu yüzden her gezegenin kendi merkezine göre çalışan custom bir radyal yerçekimi sistemi kurduk.",
      "post.gravity.h2Design": "Sistem tasarımı",
      "post.gravity.pDesign": "Her gezegen nesnesi bir merkez nokta ve bir yerçekimi kuvveti (gezegenin \"kütlesine\" bağlı) tanımlıyor. Sahnedeki her Rigidbody2D için Unity'nin gravityScale değeri sıfırlanıyor ve yerçekimi elle, her FixedUpdate'te uygulanıyor. Böylece aynı sahnede birden fazla gezegen olsa bile her biri kendi çekim alanını koruyor.",
      "post.gravity.h2Calc": "Yerçekimi hesaplama",
      "post.gravity.pCalc": "Hesaplama basit: yön vektörü nesnenin pozisyonundan gezegenin merkezine doğru normalize ediliyor, kuvvet bu yönde gezegenin çekim gücüyle çarpılıp <code>Rigidbody2D.AddForce</code> ile uygulanıyor. Ayrıca nesnenin \"yukarısı\" gezegenin yüzey normaline hizalanacak şekilde yumuşak bir rotasyon uygulanıyor, böylece karakterler ve mermiler gezegenin eğriliğine göre doğru yönde duruyor.",
      "post.gravity.h2Wind": "Rüzgar direnci",
      "post.gravity.pWind": "Salt yerçekimi yeterli değildi — Worms tarzı topçu atışlarının inandırıcı hissettirmesi için her gezegene rüzgar yönü ve şiddeti eklendi. Mermi hızına ters yönde çalışan bir sürtünme kuvveti ve gezegene özel rüzgar vektörü, atış yörüngesinin hem yerçekimi eğriliğine hem rüzgara göre hesaplanmasını zorunlu kılıyor — oyuncunun nişan alırken iki değişkeni birden dikkate alması gerekiyor.",
      "post.gravity.h2Perf": "Performans: object pooling",
      "post.gravity.pPerf": "Sahnede aynı anda onlarca mermi ve parçacık, her FixedUpdate'te kendi yerçekimi hesaplarını yapıyor. Bunu ucuz tutmak için iki şey yapıldı: her nesne sadece en yakın/ilgili gezegenin çekimini hesaplıyor (sahnedeki tüm gezegenlerin toplamını almak yerine), ve mermi/parçacık nesneleri instantiate/destroy yerine object pooling ile yeniden kullanılıyor — bu da GC spike'larını ortadan kaldırdı.",
      "post.gravity.h2Conclusion": "Sonuç",
      "post.gravity.pConclusion": "Bu radyal yerçekimi sistemi Cosmic Rumble'ın en ayırt edici mekaniklerinden biri oldu. Combat tarafında action queue ve state management üzerine kurulu turn-based savaş mimarisini ayrı bir yazıda ele alacağım.",
      "edu.date": "Eylül 2020 – Haziran 2025",
      "edu.degree": "Bilgi Sistemleri Mühendisliği lisans derecesi.",
      "contact.heading": "Birlikte bir şey<br>üretelim mi?",
      "contact.sub": "Bir proje konuşmak, iş birliği yapmak ya da sadece merhaba demek için ulaşabilirsin.",
      "footer.sections": "Bölümler",
      "footer.links": "Bağlantılar",
      "footer.email": "E-posta",
      "footer.location": "Kocaeli, Türkiye",
      "meta.description": "Eren Özcan | Junior Game Developer & Gameplay Programmer — Unity, Unreal Engine, VR — Kocaeli, Türkiye"
    },
    en: {
      "nav.experience": "Experience",
      "nav.projects": "Projects",
      "nav.writing": "Writing",
      "nav.education": "Education",
      "nav.contact": "Contact",
      "a11y.sound": "Toggle sound",
      "a11y.theme": "Toggle theme",
      "a11y.skyConfig": "Sky settings",
      "a11y.close": "Close",
      "cfg.title": "Rainbow Configurator",
      "cfg.density": "DENSITY",
      "cfg.rows": "ROW COUNT",
      "cfg.operation": "OPERATION",
      "cfg.modern": "modern",
      "cfg.classic": "classic",
      "cfg.edges": "EDGES",
      "cfg.round": "round",
      "cfg.square": "square",
      "cfg.segments": "SEGMENT VALUES",
      "cfg.padAria": "Segment values: horizontal axis is dash length, vertical axis is thickness. Adjust with arrow keys.",
      "cfg.note": "This panel customizes the sky art. <strong>Changes are saved in this browser.</strong>",
      "cfg.random": "RANDOM",
      "cfg.randomAria": "Randomize",
      "cfg.reset": "RESET",
      "cfg.resetAria": "Reset",
      "hero.eyebrow": "📍 Kocaeli, Turkey",
      "hero.title": "Hi, I'm<br><span class=\"gradient-text\">Eren Özcan</span>",
      "hero.bio": "I work on gameplay programming, physics simulation, and system design with 2+ years of Unity and Unreal Engine experience. I built a complete 2D turn-based game with custom gravity mechanics, destructible environments, and a modular ability architecture.",
      "hero.sayHello": "Say hello",
      "hero.downloadCv": "Download CV",
      "exp.heading": "Professional experience",
      "exp.sub": "Experience I've gained in game development, VR, and software.",
      "exp.date1": "April 2023 – April 2025",
      "exp.desc1": "I developed immersive VR applications for Meta Quest 2 using Unreal Engine; I worked on hand tracking, controller interaction, and performance optimization.",
      "exp.date2": "February 2025 – June 2025",
      "exp.desc2": "I supported ERP system development and business process automation with SAP ABAP; I handled debugging and technical documentation for enterprise applications.",
      "exp.date3": "August 2023 – September 2023",
      "exp.desc3": "I managed cloud infrastructure for scalable deployments on AWS and Google Cloud; I set up CI/CD pipelines with Docker/Kubernetes.",
      "exp.date4": "August 2022 – September 2022",
      "exp.desc4": "I developed internal software systems with C# and .NET Framework; I worked on system analysis, debugging, and database integration.",
      "proj.heading": "Featured work",
      "proj.sub": "A selection of projects I've worked on or completed.",
      "proj.desc1": "A complete 2D turn-based shooter with a planet-based custom gravity system and destructible environments. Physics simulation driven by wind resistance and gravity, an OOP-based modular ability architecture, a combat system with an action queue and state management, and performance optimization via object pooling.",
      "proj.repo": "Repo →",
      "proj.desc2": "An independent game studio I founded, building original games across different platforms and engines (Unity, Godot, web) — including Cosmic Rumble.",
      "proj.visit": "Visit site →",
      "proj.moreTitle": "More on GitHub",
      "proj.moreDesc": "You can find my other small projects, experiments, and school projects on my GitHub profile.",
      "proj.profile": "Profile →",
      "writing.heading": "Notes & things I've learned",
      "writing.sub": "I occasionally jot down what I'm learning here.",
      "writing.status": "2026 — in progress",
      "writing.date1": "July 28, 2026",
      "writing.title1": "Designing a planet-based gravity system in Unity",
      "writing.title2": "Building VR interaction systems for Meta Quest 2",
      "writing.title3": "Turn-based combat architecture: action queue and state management",
      "writing.title4": "Prompt injection defenses in LLM-based systems",
      "writing.filterAll": "All",
      "writing.filterGameDev": "Game Dev Notes",
      "writing.filterAiSecurity": "AI Security",
      "writing.catGameDev": "Game Dev Notes",
      "writing.catAiSecurity": "AI Security",
      "post.gravity.back": "← Back to writing",
      "post.gravity.pIntro": "In Cosmic Rumble, every level takes place on a small, round planet. Unity's default Rigidbody2D gravity assumes a single global down vector, which breaks down the moment players, projectiles, and effects need to stick to a curved surface and get pulled toward its center. So I built a custom radial gravity system that works per planet.",
      "post.gravity.h2Design": "System design",
      "post.gravity.pDesign": "Each planet object defines a center point and a gravity strength (tied to the planet's \"mass\"). Every Rigidbody2D in the scene has its gravityScale zeroed out, and gravity is applied manually every FixedUpdate instead — so multiple planets can coexist in the same scene, each keeping its own gravity field.",
      "post.gravity.h2Calc": "Calculating gravity",
      "post.gravity.pCalc": "The math is simple: a direction vector from the object's position to the planet's center gets normalized, and the force is that direction times the planet's gravity strength, applied via <code>Rigidbody2D.AddForce</code>. On top of that, a soft rotation aligns the object's \"up\" with the planet's surface normal, so characters and projectiles orient correctly as the surface curves under them.",
      "post.gravity.h2Wind": "Wind resistance",
      "post.gravity.pWind": "Gravity alone wasn't enough — to make Worms-style artillery shots feel convincing, each planet also got a wind direction and strength. A drag force opposing projectile velocity plus a per-planet wind vector means aiming a shot requires accounting for both the gravity curve and the wind push at the same time.",
      "post.gravity.h2Perf": "Performance: object pooling",
      "post.gravity.pPerf": "With dozens of projectiles and particles running their own gravity calculation every FixedUpdate, two things kept it cheap: each object only computes gravity from the nearest relevant planet instead of summing every planet in the scene, and projectiles/particles are reused via object pooling instead of being instantiated and destroyed — which got rid of GC spikes.",
      "post.gravity.h2Conclusion": "Wrapping up",
      "post.gravity.pConclusion": "This radial gravity system ended up being one of Cosmic Rumble's most distinctive mechanics. I'll cover the turn-based combat architecture — the action queue and state management behind it — in a separate post.",
      "edu.date": "September 2020 – June 2025",
      "edu.degree": "Bachelor's degree in Information Systems Engineering.",
      "contact.heading": "Shall we build<br>something together?",
      "contact.sub": "Feel free to reach out to talk about a project, collaborate, or just say hello.",
      "footer.sections": "Sections",
      "footer.links": "Links",
      "footer.email": "Email",
      "footer.location": "Kocaeli, Turkey",
      "meta.description": "Eren Özcan | Junior Game Developer & Gameplay Programmer — Unity, Unreal Engine, VR — Kocaeli, Turkey"
    }
  };

  var langToggle = document.getElementById("lang-toggle");
  var metaDescEl = document.querySelector('meta[name="description"]');
  var storedLang = localStorage.getItem(LANG_KEY);
  var lang = (storedLang === "tr" || storedLang === "en") ? storedLang : "en";

  function applyLang(l) {
    lang = l;
    root.setAttribute("lang", l);
    var dict = TRANSLATIONS[l];
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var val = dict[el.getAttribute("data-i18n")];
      if (val != null) el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var val = dict[el.getAttribute("data-i18n-html")];
      if (val != null) el.innerHTML = val;
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      var val = dict[el.getAttribute("data-i18n-aria-label")];
      if (val != null) el.setAttribute("aria-label", val);
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var val = dict[el.getAttribute("data-i18n-title")];
      if (val != null) el.setAttribute("title", val);
    });
    if (metaDescEl) metaDescEl.setAttribute("content", dict["meta.description"]);
    if (langToggle) langToggle.setAttribute("data-active", l);
    if (typeof placeToggleIndicators === "function") placeToggleIndicators();
  }

  if (langToggle) {
    langToggle.addEventListener("click", function () {
      var next = lang === "en" ? "tr" : "en";
      localStorage.setItem(LANG_KEY, next);
      applyLang(next);
      if (soundOn) SOUNDS.click();
    });
  }
  applyLang(lang);
})();
