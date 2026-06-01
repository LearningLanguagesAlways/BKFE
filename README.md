# 기초 한국어 · BKFE
## Basic Korean for English Speakers

A 10-week Korean language course for adult English speakers — deployed as a static GitHub Pages site.

---

## 🚀 GitHub Pages Setup

1. Create a new repo on GitHub (e.g. `BKFE`)
2. Upload all files maintaining the folder structure below
3. Go to **Settings → Pages → Source → Deploy from branch → main / root**
4. Your site will be live at: `https://yourusername.github.io/BKFE/`

---

## 📁 File Structure

```
BKFE/
├── index.html          ← Landing page + course schedule
├── README.md
├── css/
│   └── style.css       ← Full Korean aesthetic design system
├── js/
│   └── app.js          ← Core: localStorage, progress, student data
└── weeks/
    ├── week1.html      ← Week 1: Hangul Alphabet & Introductions ✅
    ├── week2.html      ← Week 2: Numbers, Times & Dates
    ├── week3.html      ← Week 3: Greetings & Sentence Structure
    ├── week4.html      ← Week 4: Particles
    ├── week5.html      ← Week 5: Present Tense Polite Form
    ├── week6.html      ← Week 6: Asking Questions
    ├── week7.html      ← Week 7: Past Tense
    ├── week8.html      ← Week 8: Location & Prepositions
    ├── week9.html      ← Week 9: Full Content Review
    └── week10.html     ← Week 10: Conversation Day!
```

---

## 📅 Course Schedule

| Week | Date  | Korean Title               | English Topic                        |
|------|-------|----------------------------|--------------------------------------|
| 1    | 06/01 | 한글 자모와 소개            | Hangul Alphabet & Introductions      |
| 2    | 06/08 | 숫자, 시간, 날짜            | Numbers, Times & Dates               |
| 3    | 06/15 | 인사말과 문장 구조          | Greetings & Sentence Structure       |
| 4    | 06/22 | 조사 — 은/는, 이/가, 을/를 | Particles — Topic, Subject & Object  |
| 5    | 06/29 | 현재 시제 (-아요/-어요)     | Present Tense Polite Form            |
| 6    | 07/06 | 질문하기                    | Asking Questions                     |
| 7    | 07/13 | 과거 시제 (-았어요/-었어요) | Past Tense                           |
| 8    | 07/20 | 위치와 전치사               | Location & Prepositions              |
| 9    | 07/27 | 전체 내용 복습              | Full Content Review                  |
| 10   | 08/03 | 회화의 날!                  | Conversation Day!                    |

---

## 💾 Data Storage

All student data is stored in **localStorage** — no server required.

- Student name: `bkfe_name`
- Progress: `bkfe_progress` (JSON object per week)
- Exercise saves: `bkfe_w[N]_[exercise]`
- Students can reset progress from the home page

---

## 🎨 Design

Korean Hanji paper aesthetic — warm cream/ivory palette, traditional dancheong colours (teal, navy, red, gold), Nanum Myeongjo + Cormorant Garamond typography.

---

*Built with pure HTML · CSS · Vanilla JS — no frameworks, no build tools.*
