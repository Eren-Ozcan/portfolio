(function () {
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var stored = localStorage.getItem("theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  var initial = stored || (prefersDark ? "dark" : "light");
  root.setAttribute("data-theme", initial);

  toggle.addEventListener("click", function () {
    var current = root.getAttribute("data-theme");
    var next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
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
  var CFG_DEFAULTS = { v: 2, density: 26, rows: 6, edges: "round", seed: 7 };
  var cfg;
  try {
    cfg = JSON.parse(localStorage.getItem("sky-config")) || {};
  } catch (e) { cfg = {}; }
  // v2: the rainbow was rebuilt (wide flat arc, per-dash colors) — configs
  // saved before that use ranges that no longer look right, so drop them.
  if (cfg.v !== CFG_DEFAULTS.v) cfg = {};
  cfg = {
    v: CFG_DEFAULTS.v,
    density: cfg.density || CFG_DEFAULTS.density,
    rows: cfg.rows || CFG_DEFAULTS.rows,
    edges: cfg.edges || CFG_DEFAULTS.edges,
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

  var canvas = document.getElementById("rainbow-canvas");
  var sky = document.querySelector(".hero-sky");
  var sticker = document.querySelector(".hero-sticker");
  var ctx = canvas ? canvas.getContext("2d") : null;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var geo = null;

  function layoutRainbow() {
    if (!ctx) return;
    var rect = sky.getBoundingClientRect();
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

  function drawRainbow(now) {
    if (!ctx || !geo) return;
    ctx.setTransform(geo.dpr, 0, 0, geo.dpr, 0, 0);
    ctx.clearRect(0, 0, geo.w, geo.h);

    var lw = Math.max(6, geo.innerR * 0.028);
    var rowGap = lw * 1.4;
    var cut = 0.14; // arc ends reach almost down to the avatar's base, so the
                    // tips sink behind the foreground cloud crests
    var stretch = 1.3; // not a true circle: the arch is an ellipse, wider
                       // than it is tall, so the tips land further out on
                       // the cloud crests on both sides
    var a0 = Math.PI + cut;
    var span = Math.PI - cut * 2;
    ctx.lineCap = cfg.edges === "square" ? "butt" : "round";
    ctx.lineWidth = lw;

    for (var i = 0; i < cfg.rows; i++) {
      var r = geo.innerR + i * (lw + rowGap);
      var arcLen = r * ((1 + stretch) / 2) * span;
      var unit = arcLen / cfg.density;
      var dash = unit * (cfg.edges === "square" ? 0.5 : 0.38);
      var phase = ((now / 2400) * unit + cfg.seed * 3.7) % arcLen;

      // Each dash is its own arc segment so it can carry its own color;
      // dashes march along the arc and wrap around at the far end. Toward
      // both tips the dashes shrink and thin out so the rainbow melts into
      // the clouds instead of being cut off.
      for (var j = 0; j < cfg.density; j++) {
        var startLen = (j * unit + phase) % arcLen;
        var mid = startLen + dash / 2;
        var fade = Math.min(mid, arcLen - mid) / (arcLen * 0.16);
        fade = Math.max(0, Math.min(1, fade));
        if (fade < 0.05) continue;
        var len = dash * (0.3 + 0.7 * fade);
        var endLen = Math.min(startLen + len, arcLen);
        var rAvg = r * ((1 + stretch) / 2);
        ctx.lineWidth = lw * (0.5 + 0.5 * fade);
        ctx.globalAlpha = 0.55 + 0.45 * fade;
        ctx.strokeStyle = RAINBOW[(i + j) % RAINBOW.length];
        ctx.beginPath();
        ctx.ellipse(geo.cx, geo.cy, r * stretch, r, 0, a0 + startLen / rAvg, a0 + endLen / rAvg);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function buildRainbow() {
    layoutRainbow();
    drawRainbow(0);
  }

  if (ctx) {
    buildRainbow();
    window.addEventListener("resize", buildRainbow);
    window.addEventListener("load", buildRainbow);
    if (!reduceMotion) {
      (function tick(now) {
        drawRainbow(now || 0);
        requestAnimationFrame(tick);
      })(0);
    }
  }

  // Rainbow Configurator panel
  var cfgBtn = document.getElementById("sky-config-btn");
  var cfgPanel = document.getElementById("sky-config");
  if (cfgBtn && cfgPanel) {
    var densityInput = document.getElementById("cfg-density");
    var rowsInput = document.getElementById("cfg-rows");
    var edgeBtns = cfgPanel.querySelectorAll("[data-edge]");

    function syncPanel() {
      densityInput.value = cfg.density;
      rowsInput.value = cfg.rows;
      edgeBtns.forEach(function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-edge") === cfg.edges);
      });
    }
    syncPanel();

    cfgBtn.addEventListener("click", function () {
      cfgPanel.classList.toggle("open");
    });
    document.getElementById("sky-config-close").addEventListener("click", function () {
      cfgPanel.classList.remove("open");
    });

    densityInput.addEventListener("input", function () {
      cfg.density = parseInt(densityInput.value, 10);
      saveCfg(); buildRainbow();
    });
    rowsInput.addEventListener("input", function () {
      cfg.rows = parseInt(rowsInput.value, 10);
      saveCfg(); buildRainbow();
    });
    edgeBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        cfg.edges = b.getAttribute("data-edge");
        saveCfg(); syncPanel(); buildRainbow();
      });
    });
    document.getElementById("cfg-random").addEventListener("click", function () {
      cfg.density = 12 + Math.floor(Math.random() * 29);
      cfg.rows = 2 + Math.floor(Math.random() * 7);
      cfg.edges = Math.random() < 0.5 ? "round" : "square";
      cfg.seed = Math.floor(Math.random() * 100000);
      saveCfg(); syncPanel(); buildRainbow();
    });
    document.getElementById("cfg-reset").addEventListener("click", function () {
      cfg = { v: CFG_DEFAULTS.v, density: CFG_DEFAULTS.density, rows: CFG_DEFAULTS.rows, edges: CFG_DEFAULTS.edges, seed: CFG_DEFAULTS.seed };
      saveCfg(); syncPanel(); buildRainbow();
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
})();
