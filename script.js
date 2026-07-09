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
        var color;
        if (cfg.op === "classic") {
          color = RAINBOW[(i * 5 + j * 3 + cfg.seed) % RAINBOW.length];
        } else {
          var h = (i * 31 + j * 17 + cfg.seed) % 13;
          color = h < 2
            ? RAINBOW[(i + 1 + h * 2) % RAINBOW.length]
            : RAINBOW[i % RAINBOW.length];
        }
        ctx.globalAlpha = 0.55 + 0.45 * fade;
        if (len < 1) {
          // Resting classic dash: a zero-length round-cap line doesn't
          // render, so paint the dot (or tiny square) directly.
          ctx.fillStyle = color;
          if (cfg.edges === "square") {
            ctx.fillRect(px - w / 2, py - w / 2, w, w);
          } else {
            ctx.beginPath();
            ctx.arc(px, py, w / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.lineWidth = w;
          ctx.strokeStyle = color;
          var hx = Math.cos(ang) * (len / 2);
          var hy = Math.sin(ang) * (len / 2);
          ctx.beginPath();
          ctx.moveTo(px - hx, py - hy);
          ctx.lineTo(px + hx, py + hy);
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
    opBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        cfg.op = b.getAttribute("data-op");
        saveCfg(); syncPanel(); buildRainbow();
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
    pad.addEventListener("pointerup", function () { padDragging = false; });
    pad.addEventListener("pointercancel", function () { padDragging = false; });
    pad.addEventListener("keydown", function (e) {
      var step = 0.05;
      if (e.key === "ArrowLeft") cfg.segX = Math.max(0, cfg.segX - step);
      else if (e.key === "ArrowRight") cfg.segX = Math.min(1, cfg.segX + step);
      else if (e.key === "ArrowDown") cfg.segY = Math.max(0, cfg.segY - step);
      else if (e.key === "ArrowUp") cfg.segY = Math.min(1, cfg.segY + step);
      else return;
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
    });
    document.getElementById("cfg-reset").addEventListener("click", function () {
      cfg = {
        v: CFG_DEFAULTS.v, density: CFG_DEFAULTS.density, rows: CFG_DEFAULTS.rows,
        edges: CFG_DEFAULTS.edges, op: CFG_DEFAULTS.op,
        segX: CFG_DEFAULTS.segX, segY: CFG_DEFAULTS.segY, seed: CFG_DEFAULTS.seed
      };
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
