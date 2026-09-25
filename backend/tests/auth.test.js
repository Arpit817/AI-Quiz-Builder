const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const connectDB = require('../config/db');
const app = require('../server');
const User = require('../models/User');

let server;
let baseUrl;

test.before(async () => {
  await connectDB();
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  try {
    await User.deleteMany({ email: /@quiztest\.dev$/ });
    await mongoose.connection.close();
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
  await new Promise((resolve) => server.close(resolve));
});

async function req(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json();
  return { status: res.status, data };
}

test.describe('Auth API (Item 4)', () => {
  const testEmail = `user_${Date.now()}@quiztest.dev`;
  const testPassword = 'SecurePass123';
  let authToken;
  let userId;

  test.describe('POST /api/auth/register', () => {
    test('returns 400 if username is missing or too short', async () => {
      const { status, data } = await req('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'ab', email: testEmail, password: testPassword }),
      });
      assert.strictEqual(status, 400);
      assert.strictEqual(data.success, false);
      assert.match(data.error, /username/i);
    });

    test('returns 400 if email is invalid', async () => {
      const { status, data } = await req('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'TestUser', email: 'not-an-email', password: testPassword }),
      });
      assert.strictEqual(status, 400);
      assert.strictEqual(data.success, false);
      assert.match(data.error, /email/i);
    });

    test('returns 400 if password is too short', async () => {
      const { status, data } = await req('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'TestUser', email: testEmail, password: '123' }),
      });
      assert.strictEqual(status, 400);
      assert.strictEqual(data.success, false);
      assert.match(data.error, /password/i);
    });

    test('returns 201 and a JWT token on successful registration', async () => {
      const { status, data } = await req('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'TestUser', email: testEmail, password: testPassword }),
      });
      assert.strictEqual(status, 201);
      assert.strictEqual(data.success, true);
      assert.ok(data.token, 'Should return a JWT token');
      assert.ok(data.data._id);
      assert.strictEqual(data.data.email, testEmail);
      // Password must never be in response
      assert.strictEqual(data.data.password, undefined);
      assert.strictEqual(JSON.stringify(data).includes(testPassword), false);

      authToken = data.token;
      userId = data.data._id;
    });

    test('returns 409 if email is already registered', async () => {
      const { status, data } = await req('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'AnotherUser', email: testEmail, password: testPassword }),
      });
      assert.strictEqual(status, 409);
      assert.strictEqual(data.success, false);
      assert.match(data.error, /already exists/i);
    });

    test('stores hashed password in DB (never plain text)', async () => {
      const userInDb = await User.findOne({ email: testEmail }).select('+password');
      assert.ok(userInDb, 'User should exist in DB');
      assert.notStrictEqual(userInDb.password, testPassword, 'Password must not be stored in plain text');
      const isHashed = await bcrypt.compare(testPassword, userInDb.password);
      assert.strictEqual(isHashed, true, 'Stored value must be a valid bcrypt hash of the password');
    });
  });

  test.describe('POST /api/auth/login', () => {
    test('returns 400 if email or password is missing', async () => {
      const { status, data } = await req('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail }),
      });
      assert.strictEqual(status, 400);
      assert.strictEqual(data.success, false);
    });

    test('returns 401 for wrong password', async () => {
      const { status, data } = await req('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail, password: 'wrongpassword' }),
      });
      assert.strictEqual(status, 401);
      assert.strictEqual(data.success, false);
      assert.match(data.error, /invalid email or password/i);
    });

    test('returns 401 for non-existent email', async () => {
      const { status, data } = await req('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'ghost@quiztest.dev', password: testPassword }),
      });
      assert.strictEqual(status, 401);
      assert.strictEqual(data.success, false);
    });

    test('returns 200 and a valid JWT on correct credentials', async () => {
      const { status, data } = await req('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.token);
      // Password must never be in response
      assert.strictEqual(data.data.password, undefined);

      // Update token for next tests
      authToken = data.token;

      // Verify token payload
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
      assert.strictEqual(decoded.id, userId);
    });
  });

  test.describe('GET /api/auth/me', () => {
    test('returns 401 if no token is provided', async () => {
      const { status, data } = await req('/api/auth/me');
      assert.strictEqual(status, 401);
      assert.strictEqual(data.success, false);
      assert.match(data.error, /no token/i);
    });

    test('returns 401 for a malformed or invalid token', async () => {
      const { status, data } = await req('/api/auth/me', {
        headers: { Authorization: 'Bearer this.is.not.a.real.token' },
      });
      assert.strictEqual(status, 401);
      assert.strictEqual(data.success, false);
    });

    test('returns 200 and user profile for a valid token', async () => {
      const { status, data } = await req('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert.strictEqual(status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data._id, userId);
      assert.strictEqual(data.data.email, testEmail);
      assert.strictEqual(data.data.password, undefined);
    });
  });

  test.describe('optionalProtect on quiz routes', () => {
    test('GET /api/quiz/invalid-id works without token (guest access)', async () => {
      // optionalProtect should not block guests — quiz route still returns 400 (ID format error)
      const { status, data } = await req('/api/quiz/invalid-id-format');
      assert.strictEqual(status, 400);
      assert.strictEqual(data.error, 'Invalid quiz ID format.');
    });

    test('GET /api/quiz/invalid-id with valid token attaches user (no block)', async () => {
      const { status, data } = await req('/api/quiz/invalid-id-format', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      // Should still return 400 (ID invalid) — NOT 401 (auth never blocks this route)
      assert.strictEqual(status, 400);
      assert.strictEqual(data.error, 'Invalid quiz ID format.');
    });
  });
});
