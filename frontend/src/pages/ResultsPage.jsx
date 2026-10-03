import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Check, X, RotateCcw, Plus, Info, AlertCircle, History } from 'lucide-react';

const LABELS = ['A', 'B', 'C', 'D'];

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result;

  if (!result) {
    return (
      <main className="page">
        <div className="container container--narrow">
          <div className="alert alert--error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>
              No result data found.{' '}
              <Link to="/generate" style={{ fontWeight: 600 }}>Generate a new quiz.</Link>
            </span>
          </div>
        </div>
      </main>
    );
  }

  const { score, totalQuestions, percentage, breakdown } = result;
  const wrong = totalQuestions - score;

  return (
    <main className="page">
      <div className="container container--narrow">
        <header className="page__header" style={{ marginBottom: '1.5rem' }}>
          <span className="page__eyebrow">Quiz Complete</span>
          <h1 className="page__title">Your Results</h1>
          <p className="page__subtitle">
            Review your score, correct answers, and detailed explanations below.
          </p>
        </header>

        {/* Score Card */}
        <div className="score-card">
          <div className="score-card__hero">
            <span className="score-card__number">{score}/{totalQuestions}</span>
            <span className="score-card__percent">{percentage}% SCORE</span>
            <div className="score-bar" style={{ width: '100%' }}>
              <div className="score-bar__segment--correct" style={{ width: `${percentage}%` }} />
              <div className="score-bar__segment--wrong" style={{ width: `${100 - percentage}%` }} />
            </div>
          </div>

          <div className="score-metrics">
            <div className="metric-box metric-box--correct">
              <div className="metric-box__label">Correct</div>
              <div className="metric-box__value">{score}</div>
            </div>

            <div className="metric-box metric-box--wrong">
              <div className="metric-box__label">Incorrect</div>
              <div className="metric-box__value">{wrong}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn--secondary"
            onClick={() => navigate(-1)}
          >
            <RotateCcw size={14} />
            <span>Retake quiz</span>
          </button>
          <Link to="/generate" className="btn btn--primary">
            <Plus size={14} />
            <span>Try another topic</span>
          </Link>
          <Link to="/history" className="btn btn--secondary">
            <History size={14} />
            <span>Quiz history</span>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2>Question Review</h2>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {totalQuestions} questions
          </span>
        </div>

        {/* Review Cards */}
        {breakdown && breakdown.map((item, i) => {
          const correct = item.isCorrect;
          const userIndex = item.selectedOptionIndex;
          const correctIndex = item.correctAnswerIndex;
          const skipped = userIndex === -1 || userIndex === null || userIndex === undefined;

          return (
            <div
              key={i}
              className={`review-card review-card--${correct ? 'correct' : 'wrong'}`}
            >
              <div className="review-card__header">
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                  Question {i + 1}
                </span>
                <span className={`badge badge--${correct ? 'correct' : 'wrong'}`}>
                  {correct ? (
                    <>
                      <Check size={12} strokeWidth={2.5} />
                      <span>Correct</span>
                    </>
                  ) : (
                    <>
                      <X size={12} strokeWidth={2.5} />
                      <span>{skipped ? 'Skipped' : 'Incorrect'}</span>
                    </>
                  )}
                </span>
              </div>

              <div className="review-card__body">
                <div className="review-card__question">{item.questionText}</div>

                {/* All Options Review */}
                {item.options && (
                  <div className="review-options" role="list" aria-label="Question options review">
                    {item.options.map((optText, optIdx) => {
                      const isOptionCorrect = optIdx === correctIndex;
                      const isOptionUser = optIdx === userIndex;

                      let optModifier = 'review-option--neutral';
                      if (isOptionCorrect) {
                        optModifier = 'review-option--correct';
                      } else if (isOptionUser) {
                        optModifier = 'review-option--wrong';
                      }

                      return (
                        <div key={optIdx} className={`review-option ${optModifier}`} role="listitem">
                          <span
                            className="option-label"
                            style={{
                              width: '24px',
                              height: '24px',
                              fontSize: '0.75rem',
                              borderColor: isOptionCorrect
                                ? 'var(--color-correct)'
                                : isOptionUser
                                ? 'var(--color-wrong)'
                                : 'var(--color-border)',
                              background: isOptionCorrect
                                ? 'var(--color-correct)'
                                : isOptionUser
                                ? 'var(--color-wrong)'
                                : 'var(--color-bg-subtle)',
                              color: isOptionCorrect || isOptionUser ? '#ffffff' : 'var(--color-text-muted)',
                            }}
                          >
                            {LABELS[optIdx]}
                          </span>
                          <span style={{ flex: 1 }}>{optText}</span>

                          {isOptionCorrect && isOptionUser && (
                            <span className="review-option__badge review-option__badge--correct">
                              Your Answer (Correct)
                            </span>
                          )}

                          {isOptionCorrect && !isOptionUser && (
                            <span className="review-option__badge review-option__badge--correct">
                              Correct Answer
                            </span>
                          )}

                          {isOptionUser && !isOptionCorrect && (
                            <span className="review-option__badge review-option__badge--wrong">
                              Your Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {skipped && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    You did not select an answer for this question.
                  </p>
                )}

                {/* Explanation */}
                {item.explanation && (
                  <div className="review-card__explanation">
                    <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-primary)' }} />
                    <div>
                      <strong style={{ display: 'block', marginBottom: '2px', color: 'var(--color-text)' }}>
                        Explanation:
                      </strong>
                      <span>{item.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
