const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const app = require('../server');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');

let server;
let baseUrl;

test.before(async () => {
  // Connect to MongoDB
  await connectDB();

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  // Clean up test data and close connections
  try {
    await Quiz.deleteMany({ topic: 'Test Quiz Taking Subject' });
    await Attempt.deleteMany({});
    await mongoose.connection.close();
  } catch (err) {
    console.error('Cleanup error:', err);
  }

  await new Promise((resolve) => server.close(resolve));
});

// Helper for making fetch requests
async function makeRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json();
  return { status: res.status, data };
}

test.describe('Quiz-Taking API (Item 3)', () => {
  let createdQuiz;

  test.beforeEach(async () => {
    // Create a real test quiz in MongoDB
    createdQuiz = await Quiz.create({
      title: 'Test Quiz Taking Subject',
      topic: 'Test Quiz Taking Subject',
      difficulty: 'easy',
      questions: [
        {
          questionText: 'What is the capital of France?',
          options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
          correctAnswerIndex: 2,
          difficulty: 'easy',
          explanation: 'Paris is the capital of France.',
        },
        {
          questionText: 'Which planet is known as the Red Planet?',
          options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          correctAnswerIndex: 1,
          difficulty: 'easy',
          explanation: 'Mars appears red due to iron oxide on its surface.',
        },
        {
          questionText: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctAnswerIndex: 1,
          difficulty: 'easy',
          explanation: '2 plus 2 equals 4.',
        },
      ],
    });
  });

  test.afterEach(async () => {
    if (createdQuiz && createdQuiz._id) {
      await Quiz.findByIdAndDelete(createdQuiz._id);
    }
  });

  test.describe('GET /api/quiz/:id', () => {
    test('returns 400 Bad Request for an invalid ObjectId format', async () => {
      const { status, data } = await makeRequest('/api/quiz/not-a-valid-id-123');
      assert.strictEqual(status, 400);
      assert.strictEqual(data.success, false);
      assert.match(data.error, /invalid quiz id format/i);
    });

    test('returns 404 Not Found when quiz ID does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const { status, data } = await makeRequest(`/api/quiz/${nonExistentId}`);
      assert.strictEqual(status, 404);
      assert.strictEqual(data.success, false);
      assert.match(data.error, /quiz not found/i);
    });

    test('returns 200 and NEVER exposes correctAnswerIndex in questions', async () => {
      const { status, data } = await makeRequest(`/api/quiz/${createdQuiz._id}`);

      assert.strictEqual(status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data._id, createdQuiz._id.toString());
      assert.strictEqual(data.data.title, 'Test Quiz Taking Subject');
      assert.strictEqual(data.data.questions.length, 3);

      // CRITICAL SECURITY ASSERTIONS:
      // Verify correctAnswerIndex is never exposed in any question
      for (const q of data.data.questions) {
        assert.strictEqual(
          Object.prototype.hasOwnProperty.call(q, 'correctAnswerIndex'),
          false,
          'Question must NOT contain correctAnswerIndex property'
        );
        assert.strictEqual(q.correctAnswerIndex, undefined);
        assert.ok(q.questionText);
        assert.strictEqual(q.options.length, 4);
      }

      // Verify raw JSON response does not mention correctAnswerIndex anywhere
      const rawJson = JSON.stringify(data);
      assert.strictEqual(
        rawJson.includes('correctAnswerIndex'),
        false,
        'Raw response body must never leak "correctAnswerIndex"'
      );
    });
  });

  test.describe('POST /api/quiz/:id/submit', () => {
    test('returns 400 Bad Request for an invalid ObjectId format', async () => {
      const { status, data } = await makeRequest('/api/quiz/invalid-id/submit', {
        method: 'POST',
        body: JSON.stringify({ answers: [] }),
      });
      assert.strictEqual(status, 400);
      assert.strictEqual(data.success, false);
      assert.match(data.error, /invalid quiz id format/i);
    });

    test('returns 400 Bad Request if answers array is missing or invalid', async () => {
      const { status: status1, data: data1 } = await makeRequest(`/api/quiz/${createdQuiz._id}/submit`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      assert.strictEqual(status1, 400);
      assert.strictEqual(data1.success, false);
      assert.match(data1.error, /please provide an "answers" array/i);

      const { status: status2, data: data2 } = await makeRequest(`/api/quiz/${createdQuiz._id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: 'string-instead-of-array' }),
      });
      assert.strictEqual(status2, 400);
      assert.strictEqual(data2.success, false);
    });

    test('returns 404 Not Found if quiz does not exist in DB', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const { status, data } = await makeRequest(`/api/quiz/${nonExistentId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: [2, 1, 1] }),
      });
      assert.strictEqual(status, 404);
      assert.strictEqual(data.success, false);
      assert.match(data.error, /quiz not found/i);
    });

    test('performs accurate server-side grading and saves Attempt in database', async () => {
      // Q0 correct answer is 2, Q1 correct is 1, Q2 correct is 1
      // User answers: Q0 -> 2 (correct), Q1 -> 0 (wrong), Q2 -> 1 (correct)
      const userAnswers = [
        { questionIndex: 0, selectedOptionIndex: 2 },
        { questionIndex: 1, selectedOptionIndex: 0 },
        { questionIndex: 2, selectedOptionIndex: 1 },
      ];

      const { status, data } = await makeRequest(`/api/quiz/${createdQuiz._id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: userAnswers }),
      });

      assert.strictEqual(status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.quizId, createdQuiz._id.toString());
      assert.strictEqual(data.data.score, 2);
      assert.strictEqual(data.data.totalQuestions, 3);
      assert.strictEqual(data.data.percentage, 67); // Math.round((2/3)*100) = 67
      assert.ok(data.data.attemptId, 'Should return attemptId');

      // Verify breakdown details
      const breakdown = data.data.breakdown;
      assert.strictEqual(breakdown.length, 3);

      // Q0: correct
      assert.strictEqual(breakdown[0].questionIndex, 0);
      assert.strictEqual(breakdown[0].selectedOptionIndex, 2);
      assert.strictEqual(breakdown[0].correctAnswerIndex, 2);
      assert.strictEqual(breakdown[0].isCorrect, true);
      assert.strictEqual(breakdown[0].explanation, 'Paris is the capital of France.');

      // Q1: incorrect
      assert.strictEqual(breakdown[1].questionIndex, 1);
      assert.strictEqual(breakdown[1].selectedOptionIndex, 0);
      assert.strictEqual(breakdown[1].correctAnswerIndex, 1);
      assert.strictEqual(breakdown[1].isCorrect, false);

      // Q2: correct
      assert.strictEqual(breakdown[2].questionIndex, 2);
      assert.strictEqual(breakdown[2].selectedOptionIndex, 1);
      assert.strictEqual(breakdown[2].correctAnswerIndex, 1);
      assert.strictEqual(breakdown[2].isCorrect, true);

      // Verify Attempt record was actually persisted to MongoDB
      const savedAttempt = await Attempt.findById(data.data.attemptId);
      assert.ok(savedAttempt, 'Saved attempt must exist in MongoDB');
      assert.strictEqual(savedAttempt.score, 2);
      assert.strictEqual(savedAttempt.totalQuestions, 3);
      assert.strictEqual(savedAttempt.answers.length, 3);
      assert.strictEqual(savedAttempt.answers[0].isCorrect, true);
      assert.strictEqual(savedAttempt.answers[1].isCorrect, false);
      assert.strictEqual(savedAttempt.answers[2].isCorrect, true);
    });

    test('supports array of indices and handles unanswered questions safely', async () => {
      // Submitting array of indices: [2, 1] (only answered first 2 questions)
      const userAnswers = [2, 1];

      const { status, data } = await makeRequest(`/api/quiz/${createdQuiz._id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: userAnswers }),
      });

      assert.strictEqual(status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.score, 2);
      assert.strictEqual(data.data.totalQuestions, 3);

      const breakdown = data.data.breakdown;
      assert.strictEqual(breakdown[0].isCorrect, true);
      assert.strictEqual(breakdown[1].isCorrect, true);
      // Unanswered question 3
      assert.strictEqual(breakdown[2].selectedOptionIndex, -1);
      assert.strictEqual(breakdown[2].isCorrect, false);
    });
  });
});
