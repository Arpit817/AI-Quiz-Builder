# AI Quiz Builder

A full-stack platform that turns any topic into a personalized quiz using LLMs.

## Tech Stack
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT Authentication
- **AI Integration**: Google Gemini / OpenAI APIs with structured JSON output
- **Frontend**: React (coming in Item 5)

## Project Structure
```text
AI-quiz-builder/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection (graceful fallback if offline)
│   ├── controllers/
│   │   └── quizController.js  # generateQuiz, getQuizById, submitQuiz
│   ├── models/
│   │   ├── User.js            # User schema (ready for Item 4 Auth)
│   │   ├── Quiz.js            # Quiz schema (embeds questionSchema)
│   │   ├── Question.js        # Question schema (correctAnswerIndex stored server-side)
│   │   └── Attempt.js         # Quiz attempt history schema
│   ├── routes/
│   │   └── quizRoutes.js      # /api/quiz routes
│   ├── services/
│   │   └── aiService.js       # LLM prompt and generation logic (Gemini + OpenAI)
│   ├── utils/
│   │   └── quizValidator.js   # AI output validation & repair layer
│   ├── tests/
│   │   └── quizTaking.test.js # 8 integration tests for Items 3 endpoints
│   ├── .env.example
│   ├── package.json
│   └── server.js              # Express app entry (wrapped in require.main guard)
├── public/
│   └── index.html
├── .gitignore
└── README.md
```

## Getting Started

### 1. Start MongoDB (Windows)
```powershell
# Create data dir once
New-Item -ItemType Directory -Force -Path "backend\data\db"

# Start MongoDB daemon
& "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath ".\backend\data\db" --port 27017
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set MONGODB_URI, GEMINI_API_KEY (or OPENAI_API_KEY)
npm run dev
```

### 3. Run Tests
```bash
cd backend
npm test   # requires mongod running on port 27017
```

---

## MVP Roadmap

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Project setup, Express server, MongoDB models, `.env` config | ✅ Done | All 4 models created (User, Quiz, Question, Attempt) |
| 2 | AI Quiz Generation — `POST /api/quiz/generate` with Gemini/OpenAI + validation/repair layer | ✅ Done | `aiService.js` + `quizValidator.js` |
| 3 | Quiz-taking API — `GET /api/quiz/:id` (no `correctAnswerIndex`) + `POST /api/quiz/:id/submit` (server-side grading) | ✅ Done | 8 tests passing |
| 4 | JWT Authentication — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `authMiddleware.js` | ✅ Done | 15 tests passing; bcrypt salt rounds=12; 7d token expiry; `optionalProtect` on quiz routes |
| 5 | React Frontend — quiz generator UI, quiz-taking UI, results screen | ⏳ Next | Full API now available |
| 6 | User dashboard — attempt history, scores, leaderboard | ⏳ Pending | `Attempt` model already stores `userId`, `score`, `totalQuestions` |

---

## Available Endpoints

### Health
- `GET /api/health` — Server health check

### Quiz
- `POST /api/quiz/generate` — Generate quiz via LLM
  - Body: `{ topic: string, difficulty?: "easy"|"medium"|"hard", count?: number (1-15) }`
- `GET /api/quiz/:id` — Fetch quiz for taking (**never exposes `correctAnswerIndex`**)
- `POST /api/quiz/:id/submit` — Submit answers for server-side grading
  - Body: `{ answers: [ { questionIndex, selectedOptionIndex } ] }` or `[ selectedOptionIndex, ... ]`
  - Returns: `{ score, totalQuestions, percentage, breakdown, attemptId }`

### Auth (Item 4 — not yet built)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

---

## Key Design Decisions

1. **`correctAnswerIndex` is never exposed on `GET /api/quiz/:id`** — excluded via object destructuring, not post-hoc filtering. Verified by both per-field assertion and raw `JSON.stringify` scan in tests.
2. **Grading is server-side only** — clients submit answer indices; the server computes score by comparing against stored `correctAnswerIndex`.
3. **AI output goes through a validation/repair layer** (`quizValidator.js`) before being saved — handles LLM quirks like letter answers ("A","B"), numeric strings, prefixed options.
4. **MongoDB connection is graceful** — server starts and quiz generation works even if MongoDB is offline (data just won't persist).
5. **`server.js` uses `require.main === module` guard** — so the Express app can be imported by tests without starting the HTTP listener.
6. **`req.user?._id || null` placeholders** exist in `generateQuiz` and `submitQuiz` — they will automatically work once `authMiddleware` is added in Item 4.


