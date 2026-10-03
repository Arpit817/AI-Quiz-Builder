import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { History, Award, CheckCircle2, RotateCcw, ArrowRight, AlertCircle, Calendar } from 'lucide-react';
import { api } from '../api';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.quiz.history()
      .then((res) => {
        if (!isMounted) return;
        setHistory(res.data || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load quiz history.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleReview(attempt) {
    if (!attempt.breakdown) {
      if (attempt.quizId) navigate(`/quiz/${attempt.quizId}`);
      return;
    }
    navigate(`/quiz/${attempt.quizId}/results`, {
      state: {
        result: {
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
          percentage: attempt.percentage,
          breakdown: attempt.breakdown,
        },
      },
    });
  }

  function handleRetake(quizId) {
    if (quizId) {
      navigate(`/quiz/${quizId}`);
    } else {
      navigate('/generate');
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="container container--narrow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4rem', gap: '1rem' }}>
          <div className="spinner spinner--lg" role="status" aria-label="Loading history" />
          <span className="font-mono text-muted" style={{ fontSize: '0.8125rem' }}>Loading quiz history...</span>
        </div>
      </main>
    );
  }

  const totalAttempts = history.length;
  const avgScore = totalAttempts > 0
    ? Math.round(history.reduce((sum, h) => sum + (h.percentage || 0), 0) / totalAttempts)
    : 0;
  const bestScore = totalAttempts > 0
    ? Math.max(...history.map((h) => h.percentage || 0))
    : 0;

  return (
    <main className="page">
      <div className="container container--narrow">
        <header className="page__header" style={{ marginBottom: '2rem' }}>
          <span className="page__eyebrow">
            <History size={13} />
            Assessment Records
          </span>
          <h1 className="page__title">Quiz History</h1>
          <p className="page__subtitle">
            Track your performance, review past explanations, and retake quizzes to reinforce your knowledge.
          </p>
        </header>

        {error && (
          <div className="alert alert--error mb-6">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Aggregate Stats */}
        {totalAttempts > 0 && (
          <div className="score-metrics mb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="metric-box">
              <div className="metric-box__label">Total Attempts</div>
              <div className="metric-box__value" style={{ color: 'var(--color-primary)' }}>{totalAttempts}</div>
            </div>
            <div className="metric-box">
              <div className="metric-box__label">Average Score</div>
              <div className="metric-box__value" style={{ color: 'var(--color-primary)' }}>{avgScore}%</div>
            </div>
            <div className="metric-box">
              <div className="metric-box__label">Best Score</div>
              <div className="metric-box__value" style={{ color: 'var(--color-primary)' }}>{bestScore}%</div>
            </div>
          </div>
        )}

        {/* History List or Empty State */}
        {totalAttempts === 0 ? (
          <div className="card text-center" style={{ padding: '3.5rem 1.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'var(--color-bg-subtle)', marginBottom: '1.25rem', color: 'var(--color-primary)' }}>
              <Award size={36} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              No quiz attempts yet
            </h2>
            <p className="text-muted" style={{ maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.9375rem' }}>
              When you generate and complete quizzes, your scores, dates, and detailed answer explanations will be archived here.
            </p>
            <div>
              <Link to="/generate" className="btn btn--primary">
                <span>Generate your first quiz</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((att) => {
              const dateStr = att.createdAt
                ? new Date(att.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent';

              const isPerfect = att.percentage === 100;
              const isPassing = att.percentage >= 70;

              return (
                <div key={att._id} className="card" style={{ transition: 'border-color 0.15s ease' }}>
                  <div className="card__body" style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <span className="badge badge--primary">{att.topic}</span>
                          <span className="badge badge--muted">{att.difficulty}</span>
                          {isPerfect && (
                            <span className="badge" style={{ background: 'rgba(15, 113, 115, 0.12)', color: 'var(--color-primary)', borderColor: 'rgba(15, 113, 115, 0.3)' }}>
                              <CheckCircle2 size={11} style={{ marginRight: '3px' }} />
                              Perfect
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                          <Calendar size={13} />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: isPassing ? 'var(--color-primary)' : 'var(--color-text)' }}>
                          {att.score}/{att.totalQuestions}
                          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '0.35rem' }}>
                            ({att.percentage}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="progress-bar" style={{ height: '6px', marginBottom: '1rem' }}>
                      <div
                        className="progress-bar__fill"
                        style={{
                          width: `${att.percentage}%`,
                          background: isPassing ? 'var(--color-primary)' : '#c0392b',
                        }}
                      />
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem' }}>
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => handleRetake(att.quizId)}
                      >
                        <RotateCcw size={13} />
                        <span>Retake</span>
                      </button>
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => handleReview(att)}
                        disabled={!att.breakdown}
                      >
                        <span>Review analysis</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
