/* =====================================================================
   CCLab@KNU — 디자인 전환 메뉴 (방문자용)
   - 좌하단 접이식 메뉴에서 원본/A/C/D/E/F 선택 → 전 페이지 즉시 반영
   - 선택은 localStorage(cclab-skin)에 저장, 페이지 이동/새로고침에도 유지
   - A·F 스킨에서는 히어로에 분자 네트워크 캔버스 애니메이션
   깜빡임 방지용 선로드 스크립트는 각 페이지 <head> 안에 인라인으로 들어갑니다.
   ===================================================================== */
(function () {
  "use strict";
  var SKINS = [
    ["",  "원본",   "s0"],
    ["a", "Aurora", "sa"],
    ["c", "Vivid",  "sc"],
    ["d", "Grid",   "sd"],
    ["e", "Soft",   "se"],
    ["f", "Mono",   "sf"]
  ];
  var KEY = "cclab-skin";
  var root = document.documentElement;

  function current() {
    var s = root.getAttribute("data-skin") || "";
    return s;
  }
  function save(v) { try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) {} }

  function apply(v) {
    if (v) root.setAttribute("data-skin", v); else root.removeAttribute("data-skin");
    save(v);
    markChecked();
    syncCanvas();
  }

  /* ---- 전환 메뉴 UI ---- */
  var box = document.createElement("div");
  box.id = "skin-switch";
  var label = SKINS.reduce(function (a, s) { return s[0] === current() ? s[1] : a; }, "원본");
  box.innerHTML =
    '<button class="ss-toggle" aria-expanded="false" aria-controls="ss-panel" title="디자인 선택">' +
      '<span class="dot"></span><span class="ss-cur">' + label + '</span></button>' +
    '<div class="ss-panel" id="ss-panel" role="radiogroup" aria-label="사이트 디자인">' +
      '<div class="ss-title">디자인 선택</div>' +
      SKINS.map(function (s) {
        return '<button class="ss-opt" role="radio" data-skin="' + s[0] + '" aria-checked="false">' +
          '<span class="sw ' + s[2] + '"></span><span>' + s[1] + '</span></button>';
      }).join("") +
    '</div>';
  var ready = function () {
    document.body.appendChild(box);
    var toggle = box.querySelector(".ss-toggle");
    var cur = box.querySelector(".ss-cur");
    toggle.addEventListener("click", function () {
      var open = box.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    box.querySelectorAll(".ss-opt").forEach(function (b) {
      b.addEventListener("click", function () {
        apply(b.getAttribute("data-skin"));
        cur.textContent = b.textContent.trim();
        box.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("click", function (e) {
      if (!box.contains(e.target)) { box.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") box.classList.remove("open"); });
    markChecked();
    syncCanvas();
  };

  function markChecked() {
    var c = current();
    box.querySelectorAll(".ss-opt").forEach(function (b) {
      b.setAttribute("aria-checked", b.getAttribute("data-skin") === c ? "true" : "false");
    });
    var cur = box.querySelector(".ss-cur");
    if (cur) cur.textContent = SKINS.reduce(function (a, s) { return s[0] === c ? s[1] : a; }, "원본");
  }

  /* ---- 히어로 분자 네트워크 (A·F) ---- */
  var raf = null, cv = null, ctx = null, pts = [], W = 0, H = 0;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PALETTE = {
    a: { line: "120,220,230", dot: "175,232,236", hot: "255,106,77" },
    f: { line: "47,243,224",  dot: "120,230,220", hot: "182,255,58" }
  };

  function ensureCanvas() {
    var hero = document.querySelector(".hero");
    if (!hero) return null;
    cv = hero.querySelector("canvas.skin-net");
    if (!cv) {
      cv = document.createElement("canvas");
      cv.className = "skin-net";
      cv.setAttribute("aria-hidden", "true");
      hero.insertBefore(cv, hero.firstChild);
    }
    return cv;
  }
  function resize() {
    if (!cv) return;
    var r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.max(22, Math.min(Math.round(Math.min(W, 900) / 16), 56));
    pts = [];
    for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5), vy: (Math.random() - .5) });
  }
  function frame() {
    var sk = current(), pal = PALETTE[sk];
    if (!pal || !cv) { raf = null; return; }
    ctx.clearRect(0, 0, W, H);
    var link = 130, sp = 0.3, i, j;
    for (i = 0; i < pts.length; i++) { var p = pts[i]; p.x += p.vx * sp; p.y += p.vy * sp; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
    for (i = 0; i < pts.length; i++) for (j = i + 1; j < pts.length; j++) {
      var a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < link) { ctx.strokeStyle = "rgba(" + pal.line + "," + (0.14 * (1 - d / link)) + ")"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    for (i = 0; i < pts.length; i++) { var q = pts[i]; var hot = i % 7 === 0; ctx.fillStyle = "rgba(" + (hot ? pal.hot : pal.dot) + "," + (hot ? .95 : .75) + ")"; ctx.beginPath(); ctx.arc(q.x, q.y, hot ? 2.6 : 1.7, 0, 6.3); ctx.fill(); }
    raf = requestAnimationFrame(frame);
  }
  function syncCanvas() {
    var sk = current(), uses = (sk === "a" || sk === "f");
    if (!uses) { if (raf) { cancelAnimationFrame(raf); raf = null; } return; }
    if (!ensureCanvas()) return;
    if (!ctx) ctx = cv.getContext("2d");
    resize();
    if (reduce) { frame(); if (raf) { cancelAnimationFrame(raf); raf = null; } return; } // 한 프레임만
    if (!raf) frame();
  }
  window.addEventListener("resize", function () { if (cv && (current() === "a" || current() === "f")) resize(); });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();

/* =====================================================================
   폰트 선택 메뉴 (방문자) — 디자인 선택과 별개. 기본값 = '디자인 기본'
   ===================================================================== */
(function () {
  "use strict";
  var FONTS = [
    ["",         "디자인 기본", ""],
    ["noto",     "Noto Sans KR", "'Noto Sans KR',sans-serif"],
    ["gothica1", "Gothic A1",    "'Gothic A1','Noto Sans KR',sans-serif"],
    ["jua",      "Jua",          "'Jua','Noto Sans KR',sans-serif"],
    ["plex",     "IBM Plex Sans KR", "'IBM Plex Sans KR',sans-serif"],
    ["gowun",    "Gowun Dodum",  "'Gowun Dodum','Noto Sans KR',sans-serif"],
    ["coding",   "Nanum Gothic Coding", "'Nanum Gothic Coding',monospace"],
    ["myeongjo", "Nanum Myeongjo", "'Nanum Myeongjo',serif"]
  ];
  var KEY = "cclab-font";
  var root = document.documentElement;
  function current() { return root.getAttribute("data-font") || ""; }
  function save(v) { try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) {} }
  function apply(v) { if (v) root.setAttribute("data-font", v); else root.removeAttribute("data-font"); save(v); mark(); }

  var box = document.createElement("div");
  box.id = "font-switch";
  box.innerHTML =
    '<button class="ss-toggle" aria-expanded="false" aria-controls="font-panel" title="글꼴 선택">' +
      '<span class="fi">Aa</span><span class="ss-cur">글꼴</span></button>' +
    '<div class="ss-panel" id="font-panel" role="radiogroup" aria-label="글꼴">' +
      '<div class="ss-title">글꼴 선택</div>' +
      FONTS.map(function (f) {
        var style = f[2] ? ' style="font-family:' + f[2] + '"' : '';
        return '<button class="ss-opt" role="radio" data-font="' + f[0] + '" aria-checked="false"' + style + '>' +
          '<span>' + f[1] + '</span>' + (f[0] ? '' : '<span class="ko">자동</span>') + '</button>';
      }).join("") +
    '</div>';

  function mark() {
    var c = current();
    box.querySelectorAll(".ss-opt").forEach(function (b) {
      b.setAttribute("aria-checked", b.getAttribute("data-font") === c ? "true" : "false");
    });
    var cur = box.querySelector(".ss-cur");
    if (cur) cur.textContent = FONTS.reduce(function (a, f) { return f[0] === c ? f[1] : a; }, "글꼴");
  }

  function ready() {
    document.body.appendChild(box);
    var toggle = box.querySelector(".ss-toggle");
    toggle.addEventListener("click", function () {
      var open = box.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    box.querySelectorAll(".ss-opt").forEach(function (b) {
      b.addEventListener("click", function () {
        apply(b.getAttribute("data-font"));
        box.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("click", function (e) {
      if (!box.contains(e.target)) { box.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") box.classList.remove("open"); });
    mark();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
