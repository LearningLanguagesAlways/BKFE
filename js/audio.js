/* =====================================================================
   BKFES — Korean Audio (Text-to-Speech)
   ---------------------------------------------------------------------
   Uses the browser's built-in Web Speech API (SpeechSynthesis) to read
   Korean aloud. No audio files, no server — perfect for GitHub Pages.

   It AUTO-ENHANCES Korean content on every weekly worksheet:
     • vocabulary tables  (.v-ko)
     • dialogue lines     (.turn__ko)
     • letter/number cards(.glyph__char)
     • flashcards         (.flashcard__front .big)  ← speaks current card
     • syllable builder   (.builder__syllable)
     • highlighted sample sentences (.hl-sentence, .formality-ex)

   A small speaker button (🔊) is added next to each. Tapping it reads
   the Korean. There is also a floating audio settings control to set the
   speaking speed and pick a Korean voice if several are installed.

   Load this AFTER worksheet.js:
     <script src="../js/audio.js"></script>
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Feature detection ---------- */
  var synth = window.speechSynthesis;
  if (!synth) {
    console.warn("BKFES audio: SpeechSynthesis not supported in this browser.");
    return;
  }

  var KO = "ko-KR";
  var state = {
    rate: 1.0,         // 0.5 slow … 1.2 fast (1.0 = natural pace)
    pitch: 1.05,       // slightly higher = warmer, less flat
    voice: null,       // chosen Korean SpeechSynthesisVoice
    voices: [],
    ready: false
  };

  /* ---------- Voice loading (async on some browsers) ---------- */
  function loadVoices() {
    var all = synth.getVoices() || [];
    var koVoices = all.filter(function (v) {
      return (v.lang || "").toLowerCase().indexOf("ko") === 0;
    });
    // Rank voices so the most natural-sounding one is picked first.
    // Higher score = more natural (neural / cloud / named voices beat the
    // flat built-in "compact" robotic ones).
    function score(v) {
      var n = (v.name || "").toLowerCase();
      var s = 0;
      if (/neural|natural|premium|enhanced|wavenet/.test(n)) s += 100;
      if (/google/.test(n)) s += 60;            // Google Korean is very natural
      if (/yuna|sora|heami|seoyeon|nuri|jiyoung/.test(n)) s += 40; // known good named voices
      if (/microsoft|siri/.test(n)) s += 30;
      if (!v.localService) s += 25;             // cloud voices usually sound better
      if (/compact|eloquence|espeak/.test(n)) s -= 50; // the robotic ones
      return s;
    }
    koVoices.sort(function (a, b) { return score(b) - score(a); });
    state.voices = koVoices;

    // Remember user's saved choice if any; otherwise take the top-ranked voice
    var saved = null;
    try { saved = localStorage.getItem("bkfes:voiceURI"); } catch (e) {}
    if (saved) {
      state.voice = state.voices.filter(function (v) { return v.voiceURI === saved; })[0] || null;
    }
    if (!state.voice && state.voices.length) state.voice = state.voices[0];
    state.ready = true;
    refreshVoicePicker();
  }
  loadVoices();
  if (typeof synth.onvoiceschanged !== "undefined") {
    synth.onvoiceschanged = loadVoices;
  }
  // Restore saved rate
  try {
    var r = parseFloat(localStorage.getItem("bkfes:rate"));
    if (!isNaN(r)) state.rate = r;
  } catch (e) {}

  /* ---------- Core speak function ---------- */
  var lastBtn = null;
  function speak(text, btn) {
    if (!text) return;
    text = text.replace(/\s+/g, " ").trim();
    if (!text) return;

    synth.cancel(); // stop anything currently playing

    var u = new SpeechSynthesisUtterance(text);
    u.lang = KO;
    u.rate = state.rate;
    u.pitch = state.pitch;
    if (state.voice) u.voice = state.voice;

    if (btn) {
      if (lastBtn) lastBtn.classList.remove("is-speaking");
      btn.classList.add("is-speaking");
      lastBtn = btn;
      u.onend = u.onerror = function () { btn.classList.remove("is-speaking"); };
    }
    synth.speak(u);
  }

  /* ---------- Build a speaker button ---------- */
  function makeBtn(getText) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tts-btn";
    b.setAttribute("aria-label", "한국어 듣기 · Play Korean audio");
    b.title = "듣기 · Play audio";
    b.innerHTML = "&#128266;"; // 🔊
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();
      speak(typeof getText === "function" ? getText() : getText, b);
    });
    return b;
  }

  /* ---------- Enhance static Korean elements ---------- */
  function enhanceStatic() {
    // Vocabulary table Korean cells
    document.querySelectorAll("td.v-ko").forEach(function (el) {
      if (el.dataset.tts) return;
      el.dataset.tts = "1";
      el.appendChild(document.createTextNode(" "));
      el.appendChild(makeBtn(function () { return ttsText(el); }));
    });

    // Dialogue Korean lines
    document.querySelectorAll(".turn__ko").forEach(function (el) {
      if (el.dataset.tts) return;
      el.dataset.tts = "1";
      el.appendChild(document.createTextNode(" "));
      el.appendChild(makeBtn(function () { return ttsText(el); }));
    });

    // Letter / number cards
    document.querySelectorAll(".glyph__char").forEach(function (el) {
      if (el.dataset.tts || el.closest(".glyph") === null) return;
      el.dataset.tts = "1";
      var host = el.closest(".glyph");
      host.appendChild(makeBtn(function () { return ttsText(el); }));
    });

    // Highlighted example sentences
    document.querySelectorAll(".hl-sentence").forEach(function (el) {
      if (el.dataset.tts) return;
      el.dataset.tts = "1";
      el.appendChild(document.createTextNode(" "));
      el.appendChild(makeBtn(function () { return ttsText(el); }));
    });

    // Formality-ladder examples (read only the Korean, skip the .rom)
    document.querySelectorAll(".formality-ex").forEach(function (el) {
      if (el.dataset.tts) return;
      el.dataset.tts = "1";
      el.appendChild(document.createTextNode(" "));
      el.appendChild(makeBtn(function () {
        // clone and drop romanization span
        var clone = el.cloneNode(true);
        clone.querySelectorAll(".rom, .tts-btn").forEach(function (n) { n.remove(); });
        return clone.textContent;
      }));
    });
  }

  /* Extract clean Korean text from an element, ignoring the button & rom */
  function ttsText(el) {
    var clone = el.cloneNode(true);
    clone.querySelectorAll(".tts-btn, .rom, .turn__rom, .turn__en").forEach(function (n) { n.remove(); });
    return clone.textContent;
  }

  /* ---------- Enhance dynamic widgets (flashcards, builders) ---------- */
  function enhanceDynamic() {
    // Flashcards: add ONE button per card stage that speaks the visible front
    document.querySelectorAll(".flashcard").forEach(function (card) {
      var stage = card.closest(".flash-stage") || card.parentElement;
      if (!stage || stage.dataset.tts) return;
      stage.dataset.tts = "1";
      var btn = makeBtn(function () {
        var front = card.querySelector(".flashcard__front .big");
        return front ? front.textContent : "";
      });
      btn.classList.add("tts-btn--lg");
      stage.appendChild(btn);
    });

    // Syllable builder output
    document.querySelectorAll(".builder__syllable").forEach(function (el) {
      var host = el.closest(".builder__out") || el.parentElement;
      if (!host || host.dataset.tts) return;
      host.dataset.tts = "1";
      var btn = makeBtn(function () { return el.textContent; });
      btn.classList.add("tts-btn--lg");
      host.appendChild(btn);
    });

    // Number builders (week02): .num-out
    document.querySelectorAll(".num-out").forEach(function (el) {
      if (el.dataset.tts) return;
      el.dataset.tts = "1";
      var wrap = el.parentElement;
      var btn = makeBtn(function () { return el.textContent; });
      wrap.appendChild(btn);
    });

    // Clock output (week02): speak the Korean .ko line
    document.querySelectorAll(".clock-output").forEach(function (el) {
      if (el.dataset.tts) return;
      el.dataset.tts = "1";
      var btn = makeBtn(function () {
        var ko = el.querySelector(".ko");
        return ko ? ko.textContent : "";
      });
      el.appendChild(btn);
    });
  }

  /* ---------- Floating audio settings control ---------- */
  function buildControl() {
    var bar = document.createElement("div");
    bar.className = "tts-control";
    bar.innerHTML =
      '<button type="button" class="tts-control__toggle" aria-label="오디오 설정 · Audio settings" title="오디오 설정 · Audio settings">&#128266;</button>' +
      '<div class="tts-control__panel" hidden>' +
        '<div class="tts-control__row"><strong>🔊 한국어 오디오 · Korean Audio</strong></div>' +
        '<label class="tts-control__row">속도 · Speed' +
          '<input type="range" min="0.6" max="1.3" step="0.1" value="' + state.rate + '" class="tts-rate">' +
          '<span class="tts-rate-val">' + state.rate.toFixed(1) + '×</span>' +
        '</label>' +
        '<label class="tts-control__row tts-voice-row">목소리 · Voice' +
          '<select class="tts-voice"></select>' +
        '</label>' +
        '<div class="tts-control__row tts-note"></div>' +
      '</div>';
    document.body.appendChild(bar);

    var toggle = bar.querySelector(".tts-control__toggle");
    var panel  = bar.querySelector(".tts-control__panel");
    toggle.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
    });
    document.addEventListener("click", function (e) {
      if (!bar.contains(e.target)) panel.hidden = true;
    });

    var rate = bar.querySelector(".tts-rate");
    var rateVal = bar.querySelector(".tts-rate-val");
    rate.addEventListener("input", function () {
      state.rate = parseFloat(rate.value);
      rateVal.textContent = state.rate.toFixed(1) + "×";
      try { localStorage.setItem("bkfes:rate", state.rate); } catch (e) {}
    });

    refreshVoicePicker();
  }

  function refreshVoicePicker() {
    var sel = document.querySelector(".tts-voice");
    var note = document.querySelector(".tts-note");
    var row = document.querySelector(".tts-voice-row");
    if (!sel) return;

    if (!state.voices.length) {
      if (row) row.style.display = "none";
      if (note) note.innerHTML = "⚠️ 이 기기에 한국어 음성이 없어요. 시스템 설정에서 한국어 음성을 추가하면 더 잘 들려요.<br>No Korean voice found on this device — the browser will still try, but installing a Korean voice in your system settings sounds best.";
      return;
    }
    if (row) row.style.display = "";
    if (note) note.textContent = "";
    sel.innerHTML = state.voices.map(function (v) {
      var selected = (state.voice && v.voiceURI === state.voice.voiceURI) ? " selected" : "";
      return '<option value="' + v.voiceURI + '"' + selected + '>' + v.name + '</option>';
    }).join("");
    sel.onchange = function () {
      state.voice = state.voices.filter(function (v) { return v.voiceURI === sel.value; })[0] || null;
      try { if (state.voice) localStorage.setItem("bkfes:voiceURI", state.voice.voiceURI); } catch (e) {}
    };
  }

  /* ---------- Styles (injected so no main.css edit is needed) ---------- */
  function injectStyles() {
    var css =
    ".tts-btn{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;" +
      "width:1.7em;height:1.7em;margin-left:.35em;padding:0;border-radius:50%;border:1.5px solid var(--line-strong,#C9BCA0);" +
      "background:var(--hanji-2,#FBF7EE);font-size:.8em;line-height:1;cursor:pointer;transition:all .15s;flex:none;}" +
    ".tts-btn:hover{border-color:var(--cheong,#1C3F66);background:var(--cheong-tint,#E5ECF3);transform:scale(1.08);}" +
    ".tts-btn.is-speaking{background:var(--cheong,#1C3F66);border-color:var(--cheong,#1C3F66);animation:ttsPulse 1s infinite;}" +
    ".tts-btn--lg{width:2.2em;height:2.2em;font-size:1em;margin-top:.6rem;}" +
    "@keyframes ttsPulse{0%,100%{box-shadow:0 0 0 0 rgba(28,63,102,.4);}50%{box-shadow:0 0 0 6px rgba(28,63,102,0);}}" +
    ".v-ko .tts-btn,.turn__ko .tts-btn{font-size:.7em;}" +
    /* Floating control */
    ".tts-control{position:fixed;right:16px;bottom:16px;z-index:90;font-family:var(--sans,sans-serif);}" +
    ".tts-control__toggle{width:48px;height:48px;border-radius:50%;background:var(--cheong,#1C3F66);color:#fff;" +
      "font-size:1.3rem;box-shadow:0 4px 14px rgba(0,0,0,.2);border:none;cursor:pointer;transition:transform .15s;}" +
    ".tts-control__toggle:hover{transform:scale(1.06);}" +
    ".tts-control__panel{position:absolute;right:0;bottom:58px;width:min(86vw,300px);background:var(--hanji,#F7F1E4);" +
      "border:1px solid var(--line,#DDD2BC);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:1rem;}" +
    ".tts-control__row{display:flex;align-items:center;gap:.5rem;margin-bottom:.7rem;font-size:.85rem;flex-wrap:wrap;}" +
    ".tts-control__row:last-child{margin-bottom:0;}" +
    ".tts-control__panel .tts-rate{flex:1;accent-color:var(--cheong,#1C3F66);}" +
    ".tts-control__panel .tts-voice{flex:1 1 100%;padding:.4rem;border-radius:8px;border:1.5px solid var(--line-strong,#C9BCA0);background:#fff;font-size:.82rem;}" +
    ".tts-note{font-size:.74rem;color:var(--ink-soft,#4F4A40);line-height:1.4;}" +
    "@media print{.tts-btn,.tts-control{display:none !important;}}";
    var s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ---------- Observe DOM for late-built widgets ---------- */
  function watchDynamic() {
    // Re-scan a few times as games/builders initialise after their own scripts
    var tries = 0;
    var iv = setInterval(function () {
      enhanceDynamic();
      if (++tries >= 6) clearInterval(iv);
    }, 400);
  }

  /* ---------- Init ---------- */
  function init() {
    injectStyles();
    enhanceStatic();
    enhanceDynamic();
    buildControl();
    watchDynamic();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose for manual use if needed
  window.BKFESAudio = { speak: speak };
})();
