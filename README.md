# AI Quiz Builder

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-0f7173?style=for-the-badge&logo=vercel)](https://ai-quiz-builder-two.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Cloud-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash_Lite-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

A full-stack, AI-powered quiz platform that turns any topic into an assessment in seconds. Built with a decoupled Node/Express API, MongoDB Atlas, Google Gemini / OpenAI LLM integration, and a responsive React frontend.

**Live Application:** [https://ai-quiz-builder-two.vercel.app](https://ai-quiz-builder-two.vercel.app)

---

## Key Features

- **AI Question Generation**: Enter any subject or select suggested topics to generate 5, 10, or 15 four-option questions with customized difficulty (Easy, Medium, Hard).
- **Pedagogical Answer Explanations**: Every question includes a clear 1–2 sentence pedagogical explanation clarifying why the correct choice is right and reinforcing learning.
- **Server-Side Grading & Anti-Cheat**: Correct answer keys are strictly withheld from client responses (`GET /api/quiz/:id`). Submissions are graded server-side.
- **AI Validation & Repair Layer**: Robust validation pipeline (`quizValidator.js`) intercepts, sanitizes, repairs, or rejects malformed LLM responses before database persistence.
- **Attempt History & Analytics**: Logged-in users can track all quiz attempts, view average and best scores, review detailed question breakdowns, and retake quizzes.
- **User Authentication**: Secure JWT-based authentication with bcrypt-hashed passwords (12 salt rounds) and automatic session revalidation.
- **Keyboard Navigation**: Speed through quizzes using keyboard hotkeys (`A`-`D` or `1`-`4` to select options, `Left`/`Right` arrows to switch questions, and `Enter` to advance or submit).
- **Theme Support**: Built-in Light and Dark modes using an accessible CSS token system centered around `#0f7173` deep teal.
- **Vercel Serverless Ready**: Configured with a serverless API bridge (`api/index.js`) and extended 60-second timeouts for AI generation.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router 6, Lucide React, Vanilla CSS tokens |
| **Backend API** | Node.js, Express.js, Mongoose, JSON Web Tokens (JWT), Bcrypt.js |
| **Database** | MongoDB Atlas (Cloud Database) |
| **AI Integration** | Google Generative AI SDK (`gemini-3.5-flash-lite`), OpenAI SDK (`gpt-4o-mini`) |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert`) |
| **Deployment** | Vercel Serverless Functions + Static Client Build |

---

## Project Structure

```text
AI-quiz-builder/
├── api/
│   └── index.js                   # Vercel serverless function entry (bridges to backend/server.js)
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection with retry and state caching
│   ├── controllers/
│   │   ├── authController.js      # User registration, login, and /auth/me
│   │   └── quizController.js      # generateQuiz, getQuizById, submitQuiz, getQuizHistory
│   ├── middleware/
│   │   └── authMiddleware.js      # protect and optionalProtect JWT verification
│   ├── models/
│   │   ├── User.js                # User accounts with email uniqueness & password hashing
│   │   ├── Quiz.js                # Quiz document embedding question schemas
│   │   ├── Question.js            # 4-option question schema with explanation field
│   │   └── Attempt.js             # User attempts, scores, and answer indices
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth routes
│   │   └── quizRoutes.js          # /api/quiz routes
│   ├── services/
│   │   └── aiService.js           # Multi-provider LLM prompts (Gemini + OpenAI)
│   ├── utils/
│   │   └── quizValidator.js       # AI schema validation & repair layer
│   ├── tests/
│   │   ├── auth.test.js           # Auth integration test suite
│   │   └── quizTaking.test.js     # Quiz taking, grading, and history test suite
│   ├── .env.example
│   ├── package.json
│   └── server.js                  # Express app configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Navigation header with theme toggle & user drawer
│   │   │   ├── Footer.jsx         # Accessible site footer
│   │   │   └── ProtectedRoute.jsx # Route guard redirecting guests to /login
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Session state, login, register, and logout
│   │   │   └── ThemeContext.jsx   # Light / Dark theme persistence
│   │   ├── pages/
│   │   │   ├── HomePage.jsx       # Landing page with interactive sample playground
│   │   │   ├── LoginPage.jsx      # User login form
│   │   │   ├── RegisterPage.jsx   # User registration form
│   │   │   ├── GeneratePage.jsx   # Topic, difficulty, and count quiz creator
│   │   │   ├── QuizPage.jsx       # Interactive assessment view with keyboard shortcuts
│   │   │   ├── ResultsPage.jsx    # Score analysis, review cards, and explanations
│   │   │   ├── HistoryPage.jsx    # Saved attempts list, aggregate stats, and retake actions
│   │   │   ├── PrivacyPage.jsx    # Privacy policy
│   │   │   └── TermsPage.jsx      # Terms of service
│   │   ├── api.js                 # Unified fetch API client
│   │   ├── App.jsx                # Application routing configuration
│   │   ├── index.css              # Design tokens and component styles
│   │   └── main.jsx               # React DOM entry point
│   ├── package.json
│   └── vite.config.js
├── vercel.json                    # Vercel deployment rewrites and function timeouts
├── package.json                   # Root package configuration
└── README.md
```

---

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create account (`username`, `email`, `password`)
- `POST /api/auth/login` — Sign in and obtain JWT
- `GET /api/auth/me` — Retrieve profile for active session (Requires Bearer token)

### Quiz Engine (`/api/quiz`)
- `POST /api/quiz/generate` — Generate quiz via LLM
  - Body: `{ topic: string, difficulty?: "easy" | "medium" | "hard", count?: number (1-15) }`
- `GET /api/quiz/:id` — Retrieve quiz for taking (never returns `correctAnswerIndex`)
- `POST /api/quiz/:id/submit` — Submit answers for server-side grading
  - Body: `{ answers: [ { questionIndex: number, selectedOptionIndex: number } ] }`
  - Returns: `{ score, totalQuestions, percentage, breakdown, attemptId }`
- `GET /api/quiz/history` — Get list of past quiz attempts for logged-in user (Requires Bearer token)

### System
- `GET /api/health` — Health check endpoint

---

## Local Development Setup

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or MongoDB Atlas connection string)
- **Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/)) or **OpenAI API Key**

### 2. Clone the Repository
```bash
git clone https://github.com/Arpit817/AI-quiz-builder.git
cd AI-quiz-builder
```

### 3. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_here

# AI Provider Configuration ("gemini" or "openai")
AI_PROVIDER=gemini

# Google Gemini Settings
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite

# Optional OpenAI Settings
# OPENAI_API_KEY=your_openai_api_key_here
# OPENAI_MODEL=gpt-4o-mini
```

Start the backend development server:
```bash
npm run dev
```

### 4. Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
The application will be accessible at `http://localhost:5173`. In development mode, Vite automatically proxies `/api` calls to `http://localhost:5000`.

---

## Running Automated Tests

The backend includes 26 integration tests covering authentication, route protection, LLM schema sanitization, quiz delivery security, grading calculations, and attempt history persistence.

```bash
cd backend
npm test
```

---

## Deployment on Vercel

1. Push the repository to GitHub.
2. Import the project into your [Vercel Dashboard](https://vercel.com).
3. Set the Root Directory to `./`.
4. Configure the following Environment Variables in Vercel Project Settings:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI.
   - `JWT_SECRET`: A secure random string for signing JSON Web Tokens.
   - `AI_PROVIDER`: `gemini`
   - `GEMINI_API_KEY`: Your Google AI Studio API key.
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
5. Deploy. The project automatically handles building the frontend and routing `/api/*` traffic through the serverless bridge in `api/index.js`.

---

## License

This project is licensed under the MIT License.
