import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../api';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const COUNTS = [5, 10, 15];
const SUGGESTIONS = [
  'Human Biology',
  'World War II',
  'Solar System',
  'Macroeconomics',
  'Ancient Greece',
  'Python Basics',
];

export default function GeneratePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(10);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get('topic');
    if (q) setTopic(q);
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) {
      setError('Please enter a topic first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.quiz.generate({ topic: trimmed, difficulty, count });
      const quizId = res.data?._id;
      if (!quizId) throw new Error('Server did not return a quiz ID.');
      navigate(`/quiz/${quizId}`);
    } catch (err) {
      setError(err.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="container container--narrow">
        <header className="page__header">
          <span className="page__eyebrow">
            <Sparkles size={13} />
            Quiz Creator
          </span>
          <h1 className="page__title">Generate a quiz</h1>
          <p className="page__subtitle">
            Enter any subject you want to practice. Choose your difficulty and question count to get started.
          </p>
        </header>

        {error && (
          <div className="alert alert--error mb-6">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <div className="card">
          <div className="card__body">
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="topic" className="form-label">Topic or subject</label>
                <input
                  id="topic"
                  type="text"
                  className="form-input"
                  value={topic}
                  onChange={(e) => { setTopic(e.target.value); setError(''); }}
                  placeholder="e.g. React hooks, SQL joins, Docker containers"
                  required
                  disabled={loading}
                  maxLength={200}
                />
                <span className="form-hint">
                  Be specific. "JavaScript closures" produces better questions than just "coding".
                </span>

                <div className="suggestion-chips" aria-label="Suggested topics">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="chip-btn"
                      onClick={() => { setTopic(s); setError(''); }}
                      disabled={loading}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <span className="form-label" id="difficulty-label">Difficulty Level</span>
                <div
                  className="seg-control"
                  role="group"
                  aria-labelledby="difficulty-label"
                >
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`seg-control__btn${difficulty === d ? ' active' : ''}`}
                      onClick={() => setDifficulty(d)}
                      disabled={loading}
                      aria-pressed={difficulty === d}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <span className="form-label" id="count-label">Question Count</span>
                <div
                  className="seg-control"
                  role="group"
                  aria-labelledby="count-label"
                >
                  {COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`seg-control__btn${count === n ? ' active' : ''}`}
                      onClick={() => setCount(n)}
                      disabled={loading}
                      aria-pressed={count === n}
                    >
                      {n} Questions
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                id="generate-btn"
                className="btn btn--primary btn--full btn--lg mt-4"
                disabled={loading || !topic.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    <span>Generating questions...</span>
                  </>
                ) : (
                  <>
                    <span>Generate quiz</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
