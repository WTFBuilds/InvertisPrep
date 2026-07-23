# 1v1 Quizzo — Implementation Plan (Updated)

## UI Stack
All pages built with **shadcn/ui** components (Card, Button, Badge, Progress, Dialog, Tabs, etc.) + **Aceternity-style** custom components (Spotlight, GlowCard, TextGenerateEffect, BackgroundGradient) + **framer-motion** animations + **Tailwind** responsive design. Dark hero sections, gradient accents, smooth transitions — consistent with the support/contact page style.

## Architecture
**Separate quiz server** (`quiz-server/` on port 5001) alongside main server (`server/` on port 5000). Both share same MongoDB + JWT_SECRET.

```
Next.js :3000 ──REST──► Main Server :5000 ──► MongoDB
              ──Socket──► Quiz Server :5001 ──► MongoDB (same DB)
```

---

## Backend — Quiz Server

### Dependencies
`express`, `socket.io`, `mongoose`, `jsonwebtoken`, `cors`, `dotenv`, `helmet`, `morgan`

### Models
1. **Question.js** — `{ subject, question, options[4], correctIndex, difficulty, explanation }`
2. **QuizMatch.js** — `{ players[{user, score, correctCount, answers[]}], subject, mode, roomCode, status, questions[], winner }`

### Seed — 200 MCQs (50 per subject × 4 subjects: CS, Java, Frontend, DSA)

### Socket.io Engine
- JWT auth from handshake
- Auto-queue matchmaking by subject + private room system (6-char codes)
- Quiz flow: 10 random questions → one at a time → 10s timer → wait both answers → reveal (3s) → next
- Scoring: Correct = 100 base + up to 50 speed bonus. Wrong/timeout = 0
- Disconnect: 20s rejoin timer

### REST API
`GET /api/quiz/leaderboard`, `GET /api/quiz/history`, `GET /api/quiz/stats`, `POST/DELETE /api/quiz/questions`

---

## Frontend — Pages & Components

### Pages (all use shadcn + Aceternity + framer-motion)

| Page | UI Design |
|------|-----------|
| `/quizz0` | **Dark hero** with Spotlight + TextGenerateEffect headline. 4 **GlowCard** subject cards with gradient icons. Two mode buttons (Quick Match / Play with Friend) with hover animations |
| `/quizz0/play` | Subject badge, **animated searching pulse** with framer-motion, cancel button. Match-found → 3-2-1 **countdown overlay** |
| `/quizz0/room/create` | **Card** with generated code + copy button, share link, waiting state with **skeleton loaders** |
| `/quizz0/room/[code]` | Auto-join, opponent **Avatar** cards, ready-up **Button** with gradient |
| `/quizz0/match/[id]` | **Progress bar**, circular **Timer** (green→yellow→red), **QuestionCard** with 4 option buttons (hover/select/correct/wrong states), live **ScoreBoard**, explanation card |
| `/quizz0/results/[id]` | **GlowCard** winner banner, side-by-side score comparison, per-question **ResultBreakdown** grid, stat cards, gradient action buttons |
| `/quizz0/history` | **Table** with filters, subject badges, result indicators |
| `/quizz0/leaderboard` | **Tabs** (Overall/subject), ranked table with avatar, **Badge** for rank, highlight current user |

### Components
`SubjectCard` (GlowCard + gradient icon), `Timer` (animated countdown), `QuestionCard` (option buttons), `ScoreBoard` (live comparison), `ResultBreakdown` (per-Q grid), `WaitingSpinner` (animated dots)

### Socket Context
`QuizSocketContext.tsx` — Socket.io connection to quiz server, exposes match state + actions.

---

## Implementation Order

| # | Task |
|---|------|
| 1 | Install deps (socket.io + socket.io-client) |
| 2 | Quiz server skeleton (Express + Socket.io + DB) |
| 3 | Models (Question, QuizMatch) |
| 4 | Seed 200 questions |
| 5 | Socket.io auth middleware |
| 6 | Matchmaking (auto queue + rooms) |
| 7 | Quiz engine (question flow, timer, scoring) |
| 8 | Reconnection logic |
| 9 | REST API (history, leaderboard, stats) |
| 10 | Client Socket context |
| 11 | Quiz landing page (Spotlight + GlowCards) |
| 12 | Matchmaking + room pages |
| 13 | Active quiz page (core gameplay) |
| 14 | Results page |
| 15 | History + Leaderboard pages |