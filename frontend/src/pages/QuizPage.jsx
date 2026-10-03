import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api';

const LABELS = ['A', 'B', 'C', 'D'];

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]); // array of { questionIndex, selectedOptionIndex }
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.quiz.get(id)
      .then((res) => {
        if (!isMounted) return;
        setQuiz(res.data);
        setAnswers([]);
        setCurrent(0);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadError(err.message || 'Failed to load quiz.');
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const questions = quiz?.questions || [];
  const total = questions.length;
  const q = questions[current];
  const currentAnswer = answers.find((a) => a.questionIndex === current);
  const selectedIndex = currentAnswer?.selectedOptionIndex ?? null;

  const selectOption = useCallback((optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionIndex !== current);
      return [...filtered, { questionIndex: current, selectedOptionIndex: optionIndex }];
    });
  }, [submitted, current]);

  const goTo = useCallback((index) => {
    if (index >= 0 && index < total) setCurrent(index);
  }, [total]);

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await api.quiz.submit(id, answers);
      navigate(`/quiz/${id}/results`, { state: { result: res.data } });
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [id, answers, submitted, submitting, navigate]);

  // Keyboard navigation shortcuts - must be called unconditionally before any early returns
  useEffect(() => {
    if (!quiz || !q) return;

    function handleKeyDown(e) {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;

      const key = e.key.toUpperCase();
      if ((key === 'A' || key === '1') && q?.options?.[0]) {
        e.preventDefault();
        selectOption(0);
      } else if ((key === 'B' || key === '2') && q?.options?.[1]) {
        e.preventDefault();
        selectOption(1);
      } else if ((key === 'C' || key === '3') && q?.options?.[2]) {
        e.preventDefault();
        selectOption(2);
      } else if ((key === 'D' || key === '4') && q?.options?.[3]) {
        e.preventDefault();
        selectOption(3);
      } else if (e.key === 'ArrowRight' && current < total - 1) {
        goTo(current + 1);
      } else if (e.key === 'ArrowLeft' && current > 0) {
        goTo(current - 1);
      } else if (e.key === 'Enter' && e.target?.tagName !== 'BUTTON') {
        if (current < total - 1) goTo(current + 1);
        else if (answers.length > 0 && !submitting) handleSubmit();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quiz, q, current, total, answers, submitting, selectOption, goTo, handleSubmit]);

  if (loadError) {
    return (
      <main className="page">
        <div className="container container--narrow">
          <div className="alert alert--error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{loadError}</span>
          </div>
        </div>
      </main>
    );
  }

  if (!quiz) {
    return (
      <main className="page">
        <div className="container container--narrow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4rem', gap: '1rem' }}>
          <div className="spinner spinner--lg" role="status" aria-label="Loading quiz" />
          <span className="font-mono text-muted" style={{ fontSize: '0.8125rem' }}>Loading assessment...</span>
        </div>
      </main>
    );
  }

  if (total === 0 || !q) {
    return (
      <main className="page">
        <div className="container container--narrow">
          <div className="alert alert--error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>
              This quiz has no questions available.{' '}
              <Link to="/generate" style={{ fontWeight: 600 }}>Generate a new quiz.</Link>
            </span>
          </div>
        </div>
      </main>
    );
  }

  const answeredCount = answers.length;
  const progressPercent = Math.round(((current + 1) / total) * 100);

  return (
    <main className="page">
      <div className="container">
        {/* Progress & Header Bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="quiz-header-bar">
            <div className="quiz-header-bar__meta">
              <span className="badge badge--primary">{quiz.topic}</span>
              <span className="badge badge--muted">{quiz.difficulty}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="font-mono" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Question {current + 1} of {total}
              </span>
              <span className="badge badge--muted">
                {answeredCount}/{total} answered
              </span>
            </div>
          </div>
          <div className="progress-bar" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Quiz progress">
            <div className="progress-bar__fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="quiz-layout">
          {/* Question Section */}
          <section>
            <div className="card">
              <div className="card__body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span className="font-mono text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    QUESTION {String(current + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                    Single Choice
                  </span>
                </div>

                <h2 style={{ fontSize: '1.1875rem', lineHeight: '1.4', marginBottom: '1.5rem', fontWeight: 600 }}>
                  {q?.questionText || 'Question'}
                </h2>

                <div role="group" aria-label="Answer options">
                  {(q?.options || []).map((opt, i) => (
                    <button
                      key={i}
                      className={`option-btn${selectedIndex === i ? ' selected' : ''}`}
                      onClick={() => selectOption(i)}
                      disabled={submitted}
                      aria-pressed={selectedIndex === i}
                      id={`option-${current}-${i}`}
                    >
                      <span className="option-label">{LABELS[i]}</span>
                      <span className="option-btn__text">{opt}</span>
                      <span className="kbd" style={{ marginLeft: 'auto', marginRight: selectedIndex === i ? '0.5rem' : 0 }}>
                        {LABELS[i]}
                      </span>
                      {selectedIndex === i && (
                        <CheckCircle2 size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </div>

                {submitError && (
                  <div className="alert alert--error mt-4">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{submitError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => goTo(current - 1)}
                    disabled={current === 0}
                  >
                    <ArrowLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                      Press <span className="kbd">Enter</span> or keys <span className="kbd">A-D</span>
                    </span>

                    {current < total - 1 ? (
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => goTo(current + 1)}
                      >
                        <span>Next</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={handleSubmit}
                        disabled={submitting || answeredCount === 0}
                        id="submit-quiz-btn"
                      >
                        {submitting ? (
                          <>
                            <span className="spinner" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Submit quiz</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Navigator Sidebar */}
          <aside>
            <div className="card">
              <div className="card__body" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    Overview
                  </span>
                  <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                    {total} Total
                  </span>
                </div>

                <div className="nav-grid">
                  {questions.map((_, i) => {
                    const answered = answers.some((a) => a.questionIndex === i);
                    const isCurrent = i === current;
                    let stateClass = '';
                    if (isCurrent) stateClass = ' current';
                    else if (answered) stateClass = ' answered';

                    return (
                      <button
                        key={i}
                        className={`nav-grid__btn${stateClass}`}
                        onClick={() => goTo(i)}
                        aria-label={`Go to question ${i + 1}${answered ? ', answered' : ''}`}
                        aria-current={isCurrent ? 'true' : undefined}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--color-primary)' }} />
                    <span>Current item</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--color-correct-border)' }} />
                    <span>Answered ({answeredCount})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--color-border)' }} />
                    <span>Remaining ({total - answeredCount})</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
