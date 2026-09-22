# AI Quiz Builder

A full-stack platform that turns any topic into a personalized quiz using LLMs.

## Tech Stack
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT Authentication
- **AI Integration**: Google Gemini / OpenAI APIs with structured JSON output
- **Frontend**: React (coming in Phase 5)

## Project Structure
```text
AI-quiz-builder/
├── backend/
│   ├── config/
│   │   └── db.js            # MongoDB connection
│   ├── controllers/
│   │   └── quizController.js # Quiz controller logic
│   ├── models/
│   │   ├── User.js          # User schema
│   │   ├── Quiz.js          # Quiz schema
│   │   ├── Question.js      # Question schema
│   │   └── Attempt.js       # Quiz attempt history schema
│   ├── routes/
│   │   └── quizRoutes.js    # /api/quiz routes
│   ├── services/
│   │   └── aiService.js     # LLM prompt and generation logic
│   ├── .env.example         # Sample environment variables
│   ├── package.json
│   └── server.js            # Express application entry
├── public/
│   └── index.html
├── .gitignore
└── README.md
```

## Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and configure your GEMINI_API_KEY or OPENAI_API_KEY
npm run dev
```

### 2. Available Endpoints
- `GET /api/health` - Health check
- `POST /api/quiz/generate` - AI Quiz Generation (takes `topic`, `difficulty`, optional `count`)
- `GET /api/quiz/:id` - Fetch quiz for taking (sanitized: never exposes `correctAnswerIndex`)
- `POST /api/quiz/:id/submit` - Server-side grading only (takes `answers` array, returns score, percentage, breakdown with explanations, and records attempt history)

