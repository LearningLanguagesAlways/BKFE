/* =====================================================================
   BKFES — Storage Library & Data Retrieval System
   ---------------------------------------------------------------------
   GitHub Pages is static hosting (no server/database), so student
   responses are saved in the browser via localStorage. The teacher can
   EXPORT every saved answer to JSON or CSV to collect them.
   This module is shared by every weekly worksheet.
   Upgrade path (optional, later): swap saveField()/loadAll() to call a
   backend such as Google Sheets, Firebase, or Supabase — the rest of
   the site does not change.
   ===================================================================== */
(function (global) {
  "use strict";

  var NS = "bkfes";                 // top-level namespace
  var PROFILE_KEY = NS + ":profile"; // student profile

  function safeParse(str, fallback) {
    try { return JSON.parse(str); } catch (e) { return fallback; }
  }

  /* ---------- Student profile ---------- */
  function getProfile() {
    return safeParse(localStorage.getItem(PROFILE_KEY), { name: "", note: "" }) || { name: "", note: "" };
  }
  function setProfile(patch) {
    var p = getProfile();
    Object.assign(p, patch);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    return p;
  }

  /* ---------- Field-level responses ----------
     Key shape:  bkfes:resp:<week>:<fieldId>
     Value shape: { v: <value>, label: <human label>, week, ts }       */
  function keyFor(week, fieldId) { return NS + ":resp:" + week + ":" + fieldId; }

  function saveField(week, fieldId, value, label) {
    var rec = { v: value, label: label || fieldId, week: week, ts: Date.now() };
    localStorage.setItem(keyFor(week, fieldId), JSON.stringify(rec));
    return rec;
  }
  function loadField(week, fieldId) {
    var rec = safeParse(localStorage.getItem(keyFor(week, fieldId)), null);
    return rec ? rec.v : null;
  }

  /* ---------- Collect everything ---------- */
  function loadAll() {
    var out = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(NS + ":resp:") === 0) {
        var rec = safeParse(localStorage.getItem(k), null);
        if (rec) {
          var wk = rec.week || "unknown";
          (out[wk] = out[wk] || []).push({
            field: k.split(":").slice(3).join(":"),
            label: rec.label, value: rec.v, ts: rec.ts
          });
        }
      }
    }
    // sort fields by timestamp within each week
    Object.keys(out).forEach(function (w) {
      out[w].sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
    });
    return out;
  }

  function clearWeek(week) {
    var toDel = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(NS + ":resp:" + week + ":") === 0) toDel.push(k);
    }
    toDel.forEach(function (k) { localStorage.removeItem(k); });
    return toDel.length;
  }
  function clearAll() {
    var toDel = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(NS + ":resp:") === 0) toDel.push(k);
    }
    toDel.forEach(function (k) { localStorage.removeItem(k); });
    return toDel.length;
  }

  /* ---------- Export ---------- */
  function download(filename, text, type) {
    var blob = new Blob([text], { type: type || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 60);
  }

  function exportJSON() {
    var payload = { profile: getProfile(), exportedAt: new Date().toISOString(), responses: loadAll() };
    var stamp = new Date().toISOString().slice(0, 10);
    var who = (getProfile().name || "student").replace(/[^\w\-]+/g, "_");
    download("BKFES_" + who + "_" + stamp + ".json", JSON.stringify(payload, null, 2), "application/json");
  }

  function csvCell(s) {
    s = (s == null ? "" : String(s));
    if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function exportCSV() {
    var p = getProfile(), all = loadAll();
    var rows = [["Student", "Week", "Field", "Question / Label", "Answer", "Saved at"]];
    Object.keys(all).sort().forEach(function (w) {
      all[w].forEach(function (item) {
        rows.push([
          p.name || "", w, item.field, item.label,
          item.value, item.ts ? new Date(item.ts).toLocaleString() : ""
        ]);
      });
    });
    var csv = rows.map(function (r) { return r.map(csvCell).join(","); }).join("\n");
    var stamp = new Date().toISOString().slice(0, 10);
    var who = (p.name || "student").replace(/[^\w\-]+/g, "_");
    download("BKFES_" + who + "_" + stamp + ".csv", "\ufeff" + csv, "text/csv;charset=utf-8");
  }

  global.BKFESStore = {
    getProfile: getProfile, setProfile: setProfile,
    saveField: saveField, loadField: loadField,
    loadAll: loadAll, clearWeek: clearWeek, clearAll: clearAll,
    exportJSON: exportJSON, exportCSV: exportCSV
  };
})(window);
