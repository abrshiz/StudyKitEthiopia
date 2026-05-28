# StudyKit API (MongoDB)

Express + Mongoose backend for **StudyKit Ethiopia** — a Thea-style AI study tool for `.edu.et` students (flashcards, quizzes, summaries, Chapa billing, Gemini, Microsoft OAuth).

## Setup

```bash
cp server/.env.example server/.env
# Fill JWT_SECRET, GEMINI_API_KEY, optional RESEND / CHAPA / Microsoft

npm install --prefix server
npm run seed --prefix server
npm run dev:api
```

**Frontend:** `VITE_API_URL=http://localhost:4000/api` in project `.env`.

**Demo logins** (password `StudyKit123!`):

| Email | Role |
|-------|------|
| `student@aau.edu.et` | Student |
| `prof.cs@aau.edu.et` | Professor (publishes public kits) |

## Core concepts

- **StudyKit** — user's study workspace (PDF, pasted text, YouTube, or AI topic).
- **AiContext** — 500-char RAG chunks indexed per kit.
- **Flashcards** — SM-2 spaced repetition.
- **QuizQuestion / QuizAttempt** — Smart Study + timed practice tests.
- **Summary / StudyGuide** — Gemini-generated markdown.

## Auth

JWT cookie `sk_at` · `.edu.et` email required · **no admin approval queue**.

## Main endpoints

### Study kits

```
POST   /api/study-kits              create (JSON or multipart PDF)
GET    /api/study-kits              mine, or ?public=true
GET    /api/study-kits/:id
PATCH  /api/study-kits/:id
DELETE /api/study-kits/:id
POST   /api/study-kits/:id/fork

POST   /api/study-kits/:id/flashcards/generate
GET    /api/study-kits/:id/flashcards
GET    /api/study-kits/:id/flashcards/due
POST   /api/study-kits/:id/flashcards/:cardId/review   { grade: 0..5 }

POST   /api/study-kits/:id/quizzes/generate
GET    /api/study-kits/:id/quizzes
GET    /api/study-kits/:id/quizzes/next
POST   /api/study-kits/:id/quizzes/attempt
POST   /api/study-kits/:id/test/generate

POST   /api/study-kits/:id/summary/generate
GET    /api/study-kits/:id/summary
POST   /api/study-kits/:id/guide/generate
GET    /api/study-kits/:id/guide
GET    /api/study-kits/:id/guide/export    → PDF download
```

### Other

```
GET  /api/health
POST /api/auth/register | login | logout
GET  /api/auth/me
GET  /api/auth/microsoft (+ callback)
POST /api/chat/ask          Gemini SSE
GET  /api/streak/calendar
POST /api/streak/check
POST /api/chapa/initialize | webhook | confirm
GET  /api/billing/plans
POST /api/youtube/transcript
```

## Plans (monthly kit quota)

| Plan | Kits/mo | PDF pages | YouTube | Practice test |
|------|---------|-----------|---------|---------------|
| Free | 3 | 20 | No | No |
| Student (99 Br) | 30 | 200 | Yes | Yes |
| Premium (299 Br) | Unlimited | 500 | Yes | Yes |
