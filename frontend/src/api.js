// In development the Vite proxy forwards /api to http://localhost:5000/api.
// In production, set VITE_API_URL to your deployed API base (e.g. https://api.yourdomain.com/api).
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getHeaders(),
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (body) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (body) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    me: () => request('/auth/me'),
  },

  // ── Quiz ──────────────────────────────────────────────────────
  quiz: {
    generate: (body) =>
      request('/quiz/generate', { method: 'POST', body: JSON.stringify(body) }),

    get: (id) => request(`/quiz/${id}`),

    submit: (id, answers) =>
      request(`/quiz/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }),

    history: () => request('/quiz/history'),
  },
};
