/* ═══════════════════════════════════════════════════════════════
   storage.js — BKFES localStorage wrapper
   Exposed as window.BKStorage for weeks.js to consume.
   All answer keys are namespaced: "weekNN::fieldName"
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const week = document.body.dataset.week || 'week00';

  window.BKStorage = {
    set: function (field, value) {
      try { localStorage.setItem(`${week}::${field}`, value); }
      catch (e) { console.warn('BKStorage.set failed:', e); }
    },
    get: function (field) {
      try { return localStorage.getItem(`${week}::${field}`); }
      catch (e) { return null; }
    },
    remove: function (field) {
      try { localStorage.removeItem(`${week}::${field}`); }
      catch (e) {}
    },
    allForWeek: function () {
      const result = {};
      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(week + '::')) {
            result[k.replace(week + '::', '')] = localStorage.getItem(k);
          }
        });
      } catch (e) {}
      return result;
    },
    allWeeks: function () {
      const result = {};
      try {
        Object.keys(localStorage).forEach(k => {
          if (/^week\d\d::/.test(k)) {
            result[k] = localStorage.getItem(k);
          }
        });
      } catch (e) {}
      return result;
    }
  };
})();
