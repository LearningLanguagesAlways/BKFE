/* =====================================================================
   BKFES — Worksheet interactivity (shared by all weeks)
   Requires storage.js (window.BKFESStore)
   ===================================================================== */
(function () {
  "use strict";
  var Store = window.BKFESStore;
  var body = document.body;
  var WEEK = body.getAttribute("data-week") || "home";

  document.addEventListener("DOMContentLoaded", function () {
    initToast();
    initProfileFields();
    initAutosave();
    initSectionNav();
    initLibraryModal();
    initQuizzes();
    initMatchGames();
    initFlashcards();
    initBuilders();
    initYear();
  });

  /* ---------------- Toast (save confirmation) ---------------- */
  var toastEl;
  function initToast() {
    toastEl = document.createElement("div");
    toastEl.style.cssText =
      "position:fixed;left:50%;bottom:22px;transform:translate(-50%,20px);z-index:200;" +
      "background:#2F6B5B;color:#FBF7EE;padding:.55rem 1rem;border-radius:999px;font-weight:700;" +
      "font-size:.85rem;box-shadow:0 8px 24px rgba(0,0,0,.18);opacity:0;transition:all .3s cubic-bezier(.22,.61,.36,1);" +
      "pointer-events:none";
    document.body.appendChild(toastEl);
  }
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.style.opacity = "1";
    toastEl.style.transform = "translate(-50%,0)";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.style.opacity = "0";
      toastEl.style.transform = "translate(-50%,20px)";
    }, 1400);
  }

  /* ---------------- Profile fields (name etc.) ---------------- */
  function initProfileFields() {
    var p = Store.getProfile();
    var fields = document.querySelectorAll("[data-profile]");
    fields.forEach(function (el) {
      var key = el.getAttribute("data-profile");
      if (p[key]) el.value = p[key];
      el.addEventListener("input", function () {
        defineProfile(key, el.value);
        reflectName();
      });
    });
    reflectName();
  }
  function defineProfile(key, val) { var o = {}; o[key] = val; Store.setProfile(o); return o; }
  function reflectName() {
    var n = Store.getProfile().name || "";
    document.querySelectorAll("[data-name-display]").forEach(function (el) {
      el.textContent = n ? n : "";
      var wrap = el.closest("[data-name-wrap]");
      if (wrap) wrap.style.display = n ? "" : "none";
    });
  }

  /* ---------------- Autosave (responses) ---------------- */
  function initAutosave() {
    var els = document.querySelectorAll("[data-save]");
    els.forEach(function (el) {
      var id = el.getAttribute("data-save");
      var label = el.getAttribute("data-label") || id;
      // restore
      var saved = Store.loadField(WEEK, id);
      if (saved !== null && saved !== undefined) {
        if (el.type === "checkbox") el.checked = (saved === true || saved === "true" || saved === "yes");
        else el.value = saved;
      }
      var evt = (el.tagName === "SELECT" || el.type === "checkbox") ? "change" : "input";
      var t;
      el.addEventListener(evt, function () {
        clearTimeout(t);
        t = setTimeout(function () {
          var val = (el.type === "checkbox") ? (el.checked ? "yes" : "") : el.value;
          Store.saveField(WEEK, id, val, label);
          toast("저장됨 · Saved ✓");
        }, el.type === "checkbox" ? 0 : 450);
      });
    });
  }

  /* ---------------- Section navigation (tabs) ---------------- */
  function initSectionNav() {
    var pills = Array.prototype.slice.call(document.querySelectorAll(".pill[data-target]"));
    var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
    if (!panels.length) return;

    var doneSet = Store.loadField(WEEK, "_done");
    doneSet = Array.isArray(doneSet) ? doneSet : [];

    function persistDone() { Store.saveField(WEEK, "_done", doneSet, "Sections completed"); updateProgress(); }
    function markDone(id) { if (id && doneSet.indexOf(id) === -1) { doneSet.push(id); persistDone(); refreshPills(); } }

    function show(id, scroll) {
      panels.forEach(function (p) { p.classList.toggle("is-active", p.id === id); });
      pills.forEach(function (pl) { pl.classList.toggle("is-active", pl.getAttribute("data-target") === id); });
      if (scroll !== false) {
        var nav = document.querySelector(".ws-nav");
        var top = (document.querySelector(".ws-hero") ? 0 : 0);
        var anchor = document.getElementById(id);
        if (anchor) {
          var y = anchor.getBoundingClientRect().top + window.scrollY - ((nav ? nav.offsetHeight : 0) + 70);
          window.scrollTo({ top: Math.max(y, 0), behavior: "smooth" });
        }
      }
      // ensure active pill visible in scroller
      var ap = document.querySelector(".pill.is-active");
      if (ap && ap.scrollIntoView) ap.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
    function refreshPills() {
      pills.forEach(function (pl) {
        pl.classList.toggle("is-done", doneSet.indexOf(pl.getAttribute("data-target")) !== -1);
      });
    }
    function updateProgress() {
      var fill = document.querySelector(".progressbar__fill");
      var lbl = document.querySelector(".progresslabel");
      var pct = Math.round((doneSet.length / panels.length) * 100);
      if (fill) fill.style.width = pct + "%";
      if (lbl) lbl.textContent = doneSet.length + " / " + panels.length + " 완료 · sections done";
    }

    pills.forEach(function (pl) {
      pl.addEventListener("click", function () { show(pl.getAttribute("data-target")); });
    });
    // next / prev / finish
    document.querySelectorAll(".js-next").forEach(function (b) {
      b.addEventListener("click", function () {
        var cur = document.querySelector(".panel.is-active");
        if (cur) markDone(cur.id);
        var idx = panels.indexOf(cur);
        if (idx > -1 && idx < panels.length - 1) show(panels[idx + 1].id);
      });
    });
    document.querySelectorAll(".js-prev").forEach(function (b) {
      b.addEventListener("click", function () {
        var cur = document.querySelector(".panel.is-active");
        var idx = panels.indexOf(cur);
        if (idx > 0) show(panels[idx - 1].id);
      });
    });
    document.querySelectorAll(".js-finish").forEach(function (b) {
      b.addEventListener("click", function () {
        var cur = document.querySelector(".panel.is-active");
        if (cur) markDone(cur.id);
        toast("훌륭해요! 1주차 완료 · Week complete 🎉");
      });
    });

    refreshPills(); updateProgress();
    // open first panel
    show(panels[0].id, false);
  }

  /* ---------------- Library modal (data retrieval) ---------------- */
  function initLibraryModal() {
    var overlay = document.getElementById("libraryModal");
    if (!overlay) return;
    var bodyEl = overlay.querySelector(".modal__body");

    function render() {
      var all = Store.loadAll();
      var p = Store.getProfile();
      var weeks = Object.keys(all).sort();
      var html = "";
      if (p.name) html += '<p class="muted" style="margin-bottom:1rem">학생 · Student: <strong>' + esc(p.name) + "</strong></p>";
      var hasAny = false;
      weeks.forEach(function (w) {
        var items = all[w].filter(function (it) { return it.field.charAt(0) !== "_"; });
        if (!items.length) return;
        hasAny = true;
        html += '<div class="lib-group"><h3>' + weekTitle(w) + "</h3>";
        items.forEach(function (it) {
          var val = it.value;
          if (val === "" || val == null) val = '<span class="faint">— (비어 있음 · empty)</span>';
          else val = esc(String(val));
          html += '<div class="lib-item"><div class="k">' + esc(it.label) + '</div><div class="v">' + val + "</div></div>";
        });
        html += "</div>";
      });
      if (!hasAny) html = '<div class="lib-empty">아직 저장된 답안이 없습니다.<br>No saved answers yet — start a worksheet!</div>';
      bodyEl.innerHTML = html;
    }
    function open() { render(); overlay.classList.add("open"); document.documentElement.style.overflow = "hidden"; }
    function close() { overlay.classList.remove("open"); document.documentElement.style.overflow = ""; }

    document.querySelectorAll(".js-open-library").forEach(function (b) { b.addEventListener("click", open); });
    overlay.querySelectorAll(".js-close-modal").forEach(function (b) { b.addEventListener("click", close); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    var ej = overlay.querySelector(".js-export-json");
    var ec = overlay.querySelector(".js-export-csv");
    var cl = overlay.querySelector(".js-clear-all");
    if (ej) ej.addEventListener("click", function () { Store.exportJSON(); toast("JSON 내보내기 · Exported"); });
    if (ec) ec.addEventListener("click", function () { Store.exportCSV(); toast("CSV 내보내기 · Exported"); });
    if (cl) cl.addEventListener("click", function () {
      if (confirm("모든 답안을 삭제할까요? 되돌릴 수 없습니다.\nDelete ALL saved answers? This cannot be undone.")) {
        Store.clearAll(); render(); toast("삭제됨 · Cleared");
      }
    });
  }
  function weekTitle(w) {
    var map = window.BKFES_WEEK_TITLES || {};
    return map[w] || (w === "home" ? "General" : w);
  }

  /* ---------------- Self-check quiz (MCQ) ---------------- */
  function initQuizzes() {
    document.querySelectorAll("[data-quiz]").forEach(function (quiz) {
      var qs = quiz.querySelectorAll(".quiz-q");
      var total = qs.length, score = 0, answered = 0;
      var scoreEl = quiz.querySelector(".game__score");
      function setScore() { if (scoreEl) scoreEl.textContent = "점수 · Score: " + score + " / " + total; }
      setScore();
      qs.forEach(function (q) {
        var choices = q.querySelectorAll(".choice");
        var fb = q.querySelector(".quiz-feedback");
        var locked = false;
        choices.forEach(function (c) {
          c.addEventListener("click", function () {
            if (locked) return;
            locked = true; answered++;
            var correct = c.getAttribute("data-correct") === "true";
            if (correct) { c.classList.add("correct"); score++; if (fb){ fb.textContent = "맞아요! · Correct ✓"; fb.style.color = "var(--jade)"; } }
            else {
              c.classList.add("wrong");
              choices.forEach(function (cc) { if (cc.getAttribute("data-correct") === "true") cc.classList.add("correct"); });
              if (fb){ fb.textContent = "다시 봐요 · Not quite — see the highlighted answer."; fb.style.color = "var(--jeok)"; }
            }
            var ex = q.getAttribute("data-explain");
            if (ex && fb) fb.textContent += "  " + ex;
            setScore();
            if (answered === total) {
              Store.saveField(WEEK, "quiz_" + (quiz.getAttribute("data-quiz")), score + "/" + total, "Self-check quiz score");
              toast("퀴즈 완료 · Quiz saved (" + score + "/" + total + ")");
            }
          });
        });
      });
    });
  }

  /* ---------------- Match game ---------------- */
  function initMatchGames() {
    document.querySelectorAll("[data-match]").forEach(function (game) {
      var cfg = readJSON(game.getAttribute("data-match-src"));
      if (!cfg) return;
      var leftWrap = game.querySelector(".match-col[data-side=left]");
      var rightWrap = game.querySelector(".match-col[data-side=right]");
      var scoreEl = game.querySelector(".game__score");
      var leftGlyph = game.getAttribute("data-left-glyph") === "true";
      var matched = 0, total = cfg.length, sel = null;

      function build() {
        matched = 0; sel = null;
        leftWrap.innerHTML = ""; rightWrap.innerHTML = "";
        shuffle(cfg.slice()).forEach(function (pair) { leftWrap.appendChild(item(pair.id, pair.left, leftGlyph)); });
        shuffle(cfg.slice()).forEach(function (pair) { rightWrap.appendChild(item(pair.id, pair.right, false)); });
        setScore();
      }
      function item(id, text, glyph) {
        var el = document.createElement("button");
        el.className = "match-item" + (glyph ? " is-glyph" : "");
        el.textContent = text; el.setAttribute("data-id", id);
        el.addEventListener("click", function () { pick(el); });
        return el;
      }
      function setScore() { if (scoreEl) scoreEl.textContent = "맞춤 · Matched: " + matched + " / " + total; }
      function pick(el) {
        if (el.classList.contains("done")) return;
        if (!sel) { sel = el; el.classList.add("sel"); return; }
        if (sel === el) { el.classList.remove("sel"); sel = null; return; }
        if (sel.getAttribute("data-id") === el.getAttribute("data-id")) {
          sel.classList.remove("sel"); sel.classList.add("done"); el.classList.add("done");
          sel = null; matched++; setScore();
          if (matched === total) { toast("완벽해요! · All matched 🎉"); Store.saveField(WEEK, "match_" + game.getAttribute("data-match"), "completed", "Matching game"); }
        } else {
          var a = sel, b = el; a.classList.add("miss"); b.classList.add("miss");
          setTimeout(function () { a.classList.remove("miss", "sel"); b.classList.remove("miss"); }, 480);
          sel = null;
        }
      }
      var reset = game.querySelector(".js-match-reset");
      if (reset) reset.addEventListener("click", build);
      build();
    });
  }

  /* ---------------- Flashcards ---------------- */
  function initFlashcards() {
    document.querySelectorAll("[data-flashcards]").forEach(function (fc) {
      var data = readJSON(fc.getAttribute("data-flashcards-src"));
      if (!data || !data.length) return;
      var order = data.map(function (_, i) { return i; });
      var pos = 0;
      var card = fc.querySelector(".flashcard");
      var front = card.querySelector(".flashcard__front .big");
      var romEl = card.querySelector(".flashcard__back .rom");
      var enEl = card.querySelector(".flashcard__back .en");
      var counter = fc.querySelector(".flash-counter");
      function paint() {
        var d = data[order[pos]];
        card.classList.remove("flipped");
        front.textContent = d.front;
        romEl.textContent = d.rom || "";
        enEl.textContent = d.en || "";
        if (counter) counter.textContent = (pos + 1) + " / " + data.length;
      }
      card.addEventListener("click", function () { card.classList.toggle("flipped"); });
      fc.querySelector(".js-flash-next").addEventListener("click", function () { pos = (pos + 1) % data.length; paint(); });
      fc.querySelector(".js-flash-prev").addEventListener("click", function () { pos = (pos - 1 + data.length) % data.length; paint(); });
      var sh = fc.querySelector(".js-flash-shuffle");
      if (sh) sh.addEventListener("click", function () { order = shuffle(order); pos = 0; paint(); });
      paint();
    });
  }

  /* ---------------- Syllable builder ---------------- */
  // Unicode Hangul composition
  var CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  var JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
  function compose(cho, jung) {
    var ci = CHO.indexOf(cho), ji = JUNG.indexOf(jung);
    if (ci < 0 || ji < 0) return cho + jung;
    return String.fromCharCode(0xAC00 + (ci * 21 + ji) * 28);
  }
  function initBuilders() {
    document.querySelectorAll("[data-builder]").forEach(function (b) {
      var selCons = null, selVow = null;
      var outChar = b.querySelector(".builder__syllable");
      var outRom = b.querySelector(".builder__rom");
      function update() {
        if (!selCons || !selVow) {
          outChar.textContent = selCons ? selCons.getAttribute("data-jamo") : (selVow ? selVow.getAttribute("data-jamo") : "?");
          outRom.textContent = "자음과 모음을 골라 보세요 · Pick a consonant + a vowel";
          return;
        }
        var cj = selCons.getAttribute("data-jamo"), vj = selVow.getAttribute("data-jamo");
        var cr = selCons.getAttribute("data-rom"), vr = selVow.getAttribute("data-rom");
        outChar.textContent = compose(cj, vj);
        var crom = (cj === "ㅇ") ? "" : cr;       // ㅇ is silent at the start
        outRom.textContent = "“" + crom + vr + "”  =  " + cj + " + " + vj;
      }
      b.querySelectorAll(".chip[data-role=consonant]").forEach(function (c) {
        c.addEventListener("click", function () {
          b.querySelectorAll(".chip[data-role=consonant]").forEach(function (x) { x.classList.remove("sel"); });
          c.classList.add("sel"); selCons = c; update();
        });
      });
      b.querySelectorAll(".chip[data-role=vowel]").forEach(function (v) {
        v.addEventListener("click", function () {
          b.querySelectorAll(".chip[data-role=vowel]").forEach(function (x) { x.classList.remove("sel"); });
          v.classList.add("sel"); selVow = v; update();
        });
      });
      update();
    });
  }

  /* ---------------- helpers ---------------- */
  function readJSON(id) {
    var s = document.getElementById(id);
    if (!s) return null;
    try { return JSON.parse(s.textContent); } catch (e) { return null; }
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function initYear() { document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); }); }
})();
