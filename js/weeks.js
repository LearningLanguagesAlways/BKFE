/* ═══════════════════════════════════════════════════════════════
   weeks.js — BKFES shared week functionality
   Handles: section navigation, progress bar, pill activation,
            library modal wiring, autosave restore
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Helpers ──────────────────────────────────────────────── */
  const week  = document.body.dataset.week || 'week00';
  const store = window.BKStorage || {};   // from storage.js
  const panels = () => document.querySelectorAll('.w-panel');
  const pills  = () => document.querySelectorAll('.pill[data-target]');

  /* ── Section navigation ───────────────────────────────────── */
  function gotoSection(targetId) {
    panels().forEach(p => p.classList.remove('is-active'));
    pills().forEach(p => p.classList.remove('active'));

    const panel = document.getElementById(targetId);
    if (panel) {
      panel.classList.add('is-active');
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const pill = document.querySelector(`.pill[data-target="${targetId}"]`);
    if (pill) pill.classList.add('active');

    updateProgress();
  }

  // expose globally for inline onclick handlers
  window.gotoSection = gotoSection;

  /* ── Nav pills: click handler ─────────────────────────────── */
  pills().forEach(pill => {
    pill.addEventListener('click', () => gotoSection(pill.dataset.target));
  });

  /* ── btn-next / btn-back with data-to ────────────────────── */
  function wireNavBtns() {
    document.querySelectorAll('.btn-next[data-to], .btn-back[data-to]').forEach(btn => {
      if (!btn.dataset.wired) {
        btn.dataset.wired = '1';
        btn.addEventListener('click', () => gotoSection(btn.dataset.to));
      }
    });
  }
  wireNavBtns();

  /* ── Progress bar ─────────────────────────────────────────── */
  function updateProgress() {
    const total  = panels().length;
    const active = document.querySelector('.w-panel.is-active');
    const idx    = active
      ? Array.from(panels()).indexOf(active)
      : 0;
    const pct = total > 1 ? Math.round((idx / (total - 1)) * 100) : 0;

    const bar   = document.getElementById('progressBar');
    const label = document.getElementById('progressLabel');
    if (bar)   bar.style.width = pct + '%';
    if (label) label.textContent = `${idx} / ${total - 1} 완료 · sections done`;
  }
  updateProgress();

  /* ── Autosave: text inputs & textareas ────────────────────── */
  function restoreAnswers() {
    document.querySelectorAll('[data-save]').forEach(el => {
      const key = `${week}::${el.dataset.save}`;
      const val = localStorage.getItem(key);
      if (val === null) return;
      if (el.type === 'checkbox') {
        el.checked = val === 'true';
      } else {
        el.value = val;
      }
    });
  }

  function wireAutosave() {
    document.querySelectorAll('[data-save]').forEach(el => {
      const key = `${week}::${el.dataset.save}`;
      const evts = el.type === 'checkbox' ? ['change'] : ['input', 'change'];
      evts.forEach(ev => {
        el.addEventListener(ev, () => {
          const val = el.type === 'checkbox' ? el.checked : el.value;
          localStorage.setItem(key, val);
        });
      });
    });
  }

  restoreAnswers();
  wireAutosave();

  // expose for inline scripts
  window.saveAnswer = function (key, value) {
    localStorage.setItem(`${week}::${key}`, value);
  };

  /* ── Library modal ────────────────────────────────────────── */
  function openLib() {
    const overlay = document.getElementById('libOverlay');
    if (!overlay) return;
    const body = document.getElementById('libBody');
    if (body) body.innerHTML = buildLibHTML();
    overlay.hidden = false;
  }

  function closeLib() {
    const overlay = document.getElementById('libOverlay');
    if (overlay) overlay.hidden = true;
  }

  function buildLibHTML() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(week + '::'));
    if (!keys.length) return '<p style="opacity:.6;padding:1rem">아직 저장된 답안이 없어요. · No saved answers yet.</p>';
    return '<table style="width:100%;border-collapse:collapse;font-size:.85rem">' +
      '<thead><tr><th style="text-align:left;padding:.4rem .6rem;border-bottom:1.5px solid var(--gold)">Key</th>' +
      '<th style="text-align:left;padding:.4rem .6rem;border-bottom:1.5px solid var(--gold)">Answer</th></tr></thead><tbody>' +
      keys.map(k => {
        const label = k.replace(week + '::', '');
        const val   = localStorage.getItem(k);
        return `<tr><td style="padding:.4rem .6rem;border-bottom:1px solid rgba(0,0,0,.07);opacity:.65">${label}</td>` +
               `<td style="padding:.4rem .6rem;border-bottom:1px solid rgba(0,0,0,.07)">${val}</td></tr>`;
      }).join('') + '</tbody></table>';
  }

  document.querySelectorAll('#libOpen, #libOpen2, .lib-btn-inline').forEach(btn => {
    btn && btn.addEventListener('click', openLib);
  });
  const closeBtn = document.getElementById('libClose');
  if (closeBtn) closeBtn.addEventListener('click', closeLib);
  const overlay = document.getElementById('libOverlay');
  if (overlay) {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeLib(); });
  }

  /* ── Export CSV ───────────────────────────────────────────── */
  window.exportCSV = function () {
    const keys  = Object.keys(localStorage).filter(k => k.startsWith(week + '::'));
    if (!keys.length) { alert('저장된 답안이 없어요 · No saved answers.'); return; }
    const rows  = [['key', 'value'], ...keys.map(k => [k.replace(week + '::', ''), localStorage.getItem(k)])];
    const csv   = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    download(`${week}_answers.csv`, 'text/csv', csv);
  };

  /* ── Export JSON ──────────────────────────────────────────── */
  window.exportJSON = function () {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(week + '::'));
    const obj  = {};
    keys.forEach(k => obj[k.replace(week + '::', '')] = localStorage.getItem(k));
    download(`${week}_answers.json`, 'application/json', JSON.stringify(obj, null, 2));
  };

  /* ── Clear all ────────────────────────────────────────────── */
  window.clearAll = function () {
    if (!confirm('정말 삭제할까요? · Really clear all saved answers?')) return;
    Object.keys(localStorage).filter(k => k.startsWith(week + '::')).forEach(k => localStorage.removeItem(k));
    closeLib();
  };

  /* ── Download helper ──────────────────────────────────────── */
  function download(filename, mime, content) {
    const a    = document.createElement('a');
    const blob = new Blob([content], { type: mime });
    a.href     = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ── Flashcard flip CSS dependency ───────────────────────── */
  // ensures .flipped works even if main.css is cached differently
  const style = document.createElement('style');
  style.textContent = `
    .flashcard { perspective: 700px; cursor: pointer; }
    .flashcard-inner, .flashcard { position: relative; }
    .fc-front, .fc-back {
      backface-visibility: hidden; -webkit-backface-visibility: hidden;
      transition: transform .45s;
    }
    .fc-back { position: absolute; top:0; left:0; right:0; bottom:0;
               transform: rotateY(180deg); display:flex; align-items:center; justify-content:center; }
    .flashcard.flipped .fc-front { transform: rotateY(180deg); }
    .flashcard.flipped .fc-back  { transform: rotateY(0deg); }
  `;
  document.head.appendChild(style);

})();
