# BKFES — Beginning Korean for English Speakers

A warm, 10-week beginner Korean course **website** for adult English speakers, built as static HTML/CSS/JS so it can be deployed directly on **GitHub Pages**. This repository currently contains the full site shell plus **Week 1 · Introductions + Hangul**. (Weeks 2–10 are stubbed as "coming soon" cards and will be added one at a time.)

The design draws on Korean aesthetics — a warm *hanji* (paper) surface, deep ink, and the traditional *obangsaek* five-color accents, with a *saekdong* stripe motif.

---

## 📂 File structure

```
bkfes/
├── index.html              ← Course home (sign-in, 10-week grid, "how we learn")
├── weeks/
│   └── week01.html         ← Week 1 worksheet (10 clickable sections)
├── css/
│   └── main.css            ← Design system + all components
├── js/
│   ├── weeks.js            ← Week-title labels (shared)
│   ├── storage.js          ← Library & data-retrieval system (localStorage + export)
│   └── worksheet.js        ← Tabs, autosave, games, quizzes, syllable builder
└── README.md
```

All asset links are **relative**, so the site works whether it's served from a domain root or a `username.github.io/repo-name/` sub-path.

---

## 🚀 Deploy on GitHub Pages

1. Create a new GitHub repository (e.g. `bkfes`).
2. Add these files to the repository root and push:
   ```bash
   git init
   git add .
   git commit -m "BKFES site + Week 1"
   git branch -M main
   git remote add origin https://github.com/<you>/bkfes.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**, choose **`main`** branch and **`/ (root)`** folder, then **Save**.
4. After a minute, your site is live at `https://<you>.github.io/bkfes/`.

### Preview locally
Just open `index.html` in a browser, or run a tiny server (better, so relative paths and JSON load cleanly):
```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## 💾 How student responses are stored (the "library / data-retrieval system")

GitHub Pages is **static hosting** — there is no server or database. So student answers are saved in the **browser's `localStorage`** on the device they're using:

- Every input, text box, checkbox, quiz score, and game result **auto-saves** as the student works.
- The student's **name** (entered on the home page) tags their work.
- The **📓 My Library** button (top-right on every page) shows everything saved and lets anyone **export**:
  - **CSV** — opens in Excel / Google Sheets (one row per answer: student, week, question, answer, timestamp).
  - **JSON** — full structured backup.

**What this means in practice**
- Answers persist on the same device + browser between visits.
- They are **not** automatically shared between devices or sent anywhere. To collect a class's work, have each student **Export CSV** and send/upload the file, or export from the classroom device.

### Optional upgrade (later) — centralized collection
The site is built so the storage layer can be swapped without touching the worksheets. To collect responses to one place, replace the bodies of `saveField()` / `loadAll()` in `js/storage.js` with calls to one of:
- **Google Sheets** (via a Google Apps Script web-app endpoint or a Google Form),
- **Firebase Firestore**, or
- **Supabase**.

Everything else (the worksheets, games, library UI, exports) keeps working as-is.

---

## 🧩 Adding the next week (template pattern)

1. Copy `weeks/week01.html` → `weeks/week02.html`.
2. Change `<body data-week="week01">` → `data-week="week02"` (this namespaces its saved answers).
3. Update the hero title/date, the section pills, and the panel content.
4. Reuse the same components — `.glyph-grid`, `.vocab` tables, `.exercise`, `[data-quiz]`, `[data-match]`, `[data-flashcards]`, `[data-builder]`, `.dialogue` — and the same JSON `<script>` data blocks for games.
5. In `index.html`, change that week's card from a locked `<div class="week-card is-locked">` to an `<a class="week-card" href="weeks/week02.html">` and swap the `tag--soon` badge for `tag--ready`.

The week labels shown in the Library come from `js/weeks.js` — already filled in for all 10 weeks.

---

## ♿ Notes
- **Legible everywhere:** fluid `clamp()` type scales from phone → iPad → TV; high-contrast colors.
- **Fonts:** Noto Serif KR (display) + Noto Sans KR (body), loaded from Google Fonts.
- **Accessibility:** keyboard focus styles, reduced-motion support, semantic headings.
- **Printable:** each worksheet has a print stylesheet (sections expand, nav/buttons hidden) for paper classroom copies.

---

*Curriculum: Wk1 Introductions+Hangul · Wk2 Numbers/Time/Dates · Wk3 Greetings+Sentence Structure · Wk4 Particles 은/는·이/가·을/를 · Wk5 Present Polite -아요/-어요 · Wk6 Questions · Wk7 Past Tense · Wk8 Location & Prepositions · Wk9 Full Review · Wk10 Conversation Day.*
