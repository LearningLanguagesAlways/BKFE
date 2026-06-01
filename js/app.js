/* ============================================================
   BKFE — Basic Korean for English Speakers
   Core Application · Data & Progress Layer
   ============================================================ */

const BKFE = (() => {

  /* ── Keys ──────────────────────────────────────────────── */
  const KEY = {
    name:     'bkfe_name',
    started:  'bkfe_start_date',
    progress: 'bkfe_progress',
    prefix:   'bkfe_',
  };

  /* ── Week Metadata ─────────────────────────────────────── */
  const WEEKS = [
    { num: 1,  date: '2025-06-01', kr: '한글 자모와 소개',          en: 'Hangul Alphabet & Introductions',      path: 'weeks/week1.html' },
    { num: 2,  date: '2025-06-08', kr: '숫자, 시간, 날짜',           en: 'Numbers, Times & Dates',               path: 'weeks/week2.html' },
    { num: 3,  date: '2025-06-15', kr: '인사말과 문장 구조',         en: 'Greetings & Sentence Structure',        path: 'weeks/week3.html' },
    { num: 4,  date: '2025-06-22', kr: '조사 — 은/는, 이/가, 을/를', en: 'Particles — Topic, Subject & Object',  path: 'weeks/week4.html' },
    { num: 5,  date: '2025-06-29', kr: '현재 시제 (-아요/-어요)',    en: 'Present Tense Polite Form',             path: 'weeks/week5.html' },
    { num: 6,  date: '2025-07-06', kr: '질문하기',                   en: 'Asking Questions',                     path: 'weeks/week6.html' },
    { num: 7,  date: '2025-07-13', kr: '과거 시제 (-았어요/-었어요)','en': 'Past Tense',                          path: 'weeks/week7.html' },
    { num: 8,  date: '2025-07-20', kr: '위치와 전치사',              en: 'Location & Prepositions',               path: 'weeks/week8.html' },
    { num: 9,  date: '2025-07-27', kr: '전체 내용 복습',             en: 'Full Content Review',                  path: 'weeks/week9.html' },
    { num: 10, date: '2025-08-03', kr: '회화의 날!',                 en: 'Conversation Day!',                    path: 'weeks/week10.html' },
  ];

  /* ── Storage API ───────────────────────────────────────── */
  const store = {
    get(key, fallback = null) {
      try {
        const val = localStorage.getItem(KEY.prefix + key);
        return val ? JSON.parse(val) : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(KEY.prefix + key, JSON.stringify(value)); return true; }
      catch { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(KEY.prefix + key); } catch {}
    },
  };

  /* ── Student API ───────────────────────────────────────── */
  const student = {
    getName()       { return localStorage.getItem(KEY.name) || ''; },
    setName(name)   { localStorage.setItem(KEY.name, name.trim()); },
    hasName()       { return !!localStorage.getItem(KEY.name); },
    getStartDate()  { return localStorage.getItem(KEY.started); },
    initIfNew() {
      if (!localStorage.getItem(KEY.started)) {
        localStorage.setItem(KEY.started, new Date().toISOString());
      }
    },
    reset() {
      Object.keys(localStorage)
        .filter(k => k.startsWith(KEY.prefix) || k === KEY.name || k === KEY.started)
        .forEach(k => localStorage.removeItem(k));
    },
  };

  /* ── Progress API ──────────────────────────────────────── */
  const progress = {
    _key: 'progress',

    _default() {
      const p = {};
      WEEKS.forEach(w => {
        p[`week${w.num}`] = { completed: false, score: 0, exercises: {} };
      });
      return p;
    },

    all() {
      return store.get(this._key, this._default());
    },

    week(num) {
      return this.all()[`week${num}`] || { completed: false, score: 0, exercises: {} };
    },

    setExercise(weekNum, exId, data) {
      const all = this.all();
      const wk  = all[`week${weekNum}`] || { completed: false, score: 0, exercises: {} };
      wk.exercises[exId] = { ...data, savedAt: new Date().toISOString() };
      all[`week${weekNum}`] = wk;
      store.set(this._key, all);
    },

    getExercise(weekNum, exId) {
      return this.week(weekNum).exercises[exId] || null;
    },

    completeWeek(weekNum, finalScore) {
      const all = this.all();
      all[`week${weekNum}`].completed = true;
      all[`week${weekNum}`].score     = finalScore;
      all[`week${weekNum}`].completedAt = new Date().toISOString();
      store.set(this._key, all);
    },

    totalComplete() {
      return Object.values(this.all()).filter(w => w.completed).length;
    },

    pct() {
      return Math.round((this.totalComplete() / WEEKS.length) * 100);
    },
  };

  /* ── Week Status ───────────────────────────────────────── */
  // Week 1 always unlocked; each subsequent week unlocks after previous is complete
  function weekStatus(num) {
    if (num === 1) return 'unlocked';
    const prev = progress.week(num - 1);
    if (prev.completed) return 'unlocked';
    return 'locked';
  }

  /* ── UI Helpers ────────────────────────────────────────── */
  function toast(msg, type = '', duration = 3000) {
    let el = document.getElementById('bkfe-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bkfe-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = `toast ${type ? `toast--${type}` : ''} visible`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('visible'), duration);
  }

  function greetStudent() {
    const name = student.getName();
    const hour = new Date().getHours();
    const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '안녕하세요' : '좋은 저녁이에요';
    return name ? `${greeting}, ${name}! 👋` : '';
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /* ── Render Helpers (index page) ───────────────────────── */
  function renderSchedule(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const prog = progress.all();
    el.innerHTML = '';
    WEEKS.forEach(w => {
      const status   = weekStatus(w.num);
      const wkProg   = prog[`week${w.num}`];
      const isLocked = status === 'locked';
      const isDone   = wkProg.completed;

      const card = document.createElement('div');
      card.className = `week-card ${isDone ? 'week-card--completed' : isLocked ? 'week-card--locked' : 'week-card--active'}`;

      const statusIcon = isDone ? '<span class="icon-check"></span>'
                       : isLocked ? '<span class="icon-lock"></span>'
                       : '<span class="icon-play"></span>';

      card.innerHTML = `
        <div class="week-card__num">
          ${statusIcon}
          Week ${w.num}
        </div>
        <div class="week-card__title-kr">${w.kr}</div>
        <div class="week-card__title-en">${w.en}</div>
        <div class="week-card__date">📅 ${formatDate(w.date)}</div>
        ${isDone ? `<div class="badge badge--gold mt-4">✓ Completed · ${wkProg.score}%</div>` : ''}
      `;

      if (!isLocked) {
        card.addEventListener('click', () => {
          window.location.href = w.path;
        });
      }

      el.appendChild(card);
    });
  }

  function renderProgress() {
    const pct = progress.pct();
    const fill = document.getElementById('overall-progress-fill');
    const label = document.getElementById('overall-progress-label');
    const complete = document.getElementById('weeks-complete');
    if (fill)    fill.style.width = pct + '%';
    if (label)   label.textContent = pct + '% Complete · 완료';
    if (complete) complete.textContent = progress.totalComplete() + '/10';
  }

  function renderStudentName(elId) {
    const el = document.getElementById(elId);
    if (el && student.hasName()) el.textContent = student.getName();
  }

  /* ── Name Modal ────────────────────────────────────────── */
  function initNameModal() {
    const modal = document.getElementById('name-modal');
    if (!modal) return;

    if (student.hasName()) {
      modal.style.display = 'none';
      student.initIfNew();
      return;
    }

    const btn   = document.getElementById('name-submit');
    const input = document.getElementById('name-input');

    function submit() {
      const n = input ? input.value.trim() : '';
      if (!n) { toast('Please enter your name! 이름을 입력해 주세요 😊', '', 2500); return; }
      student.setName(n);
      student.initIfNew();
      modal.style.display = 'none';
      renderStudentName('student-name-display');
      toast(`환영합니다, ${n}! · Welcome! 🎉`, 'success', 3000);
    }

    if (btn)   btn.addEventListener('click', submit);
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  }

  /* ── Auto-init nav student name ─────────────────────────── */
  function initNav() {
    const el = document.getElementById('nav-student-name');
    if (el && student.hasName()) {
      el.textContent = student.getName();
      el.closest('.nav-name-pill') && el.closest('.nav-name-pill').classList.remove('hidden');
    }
  }

  /* ── Module Init ───────────────────────────────────────── */
  function init() {
    initNameModal();
    initNav();
    renderStudentName('student-name-display');
    renderSchedule('schedule-grid');
    renderProgress();
  }

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Public API ────────────────────────────────────────── */
  return { student, progress, weekStatus, WEEKS, toast, greetStudent, formatDate, store };

})();
