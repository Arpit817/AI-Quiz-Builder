import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  Globe,
  Dna,
  Landmark,
  TrendingUp,
  Code2,
  ChevronDown,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Varied practice questions spanning science, history, and general knowledge
const PLAYGROUND_QUESTIONS = [
  {
    topic: 'Science & Biology',
    category: 'Science',
    difficulty: 'Beginner',
    question: 'Which cellular organelle is responsible for generating most of the cell’s chemical energy in the form of ATP?',
    options: [
      'Ribosome',
      'Mitochondria',
      'Endoplasmic Reticulum',
      'Golgi Apparatus',
    ],
    correctIndex: 1,
    explanation: 'Mitochondria are often called the powerhouses of the cell because they produce adenosine triphosphate (ATP) through cellular respiration.',
  },
  {
    topic: 'World History',
    category: 'History',
    difficulty: 'Intermediate',
    question: 'In which year did the Apollo 11 mission successfully land the first humans on the Moon?',
    options: [
      '1965',
      '1967',
      '1969',
      '1972',
    ],
    correctIndex: 2,
    explanation: 'Apollo 11 landed on the lunar surface on July 20, 1969, with astronauts Neil Armstrong and Buzz Aldrin.',
  },
  {
    topic: 'World Geography',
    category: 'Geography',
    difficulty: 'Beginner',
    question: 'Which river is traditionally considered the longest in the world by total length?',
    options: [
      'Amazon River',
      'Nile River',
      'Yangtze River',
      'Mississippi River',
    ],
    correctIndex: 1,
    explanation: 'The Nile River in northeastern Africa is traditionally measured as the longest river in the world, spanning approximately 6,650 kilometers (4,132 miles).',
  },
];

// Broad, multi-discipline categories
const CATEGORIES = [
  {
    title: 'Science & Medicine',
    icon: Dna,
    topicQuery: 'Human Biology and Cellular Genetics',
    desc: 'Anatomy, genetics, cellular biology, organic chemistry, and astrophysics.',
    tags: ['Human Biology', 'Astronomy', 'Chemistry', 'Genetics'],
  },
  {
    title: 'World History & Civilizations',
    icon: Landmark,
    topicQuery: 'World War II and 20th Century History',
    desc: 'Ancient civilizations, the Roman Empire, World Wars, and the Renaissance.',
    tags: ['Ancient Rome', 'World War II', 'The Renaissance', 'Cold War'],
  },
  {
    title: 'Geography & World Cultures',
    icon: Globe,
    topicQuery: 'World Capitals and Physical Geography',
    desc: 'World capitals, mountain ranges, oceans, climate zones, and global cultures.',
    tags: ['World Capitals', 'Oceans', 'Continents', 'Climates'],
  },
  {
    title: 'Business & Economics',
    icon: TrendingUp,
    topicQuery: 'Macroeconomics and Personal Finance',
    desc: 'Supply and demand, monetary policy, financial accounting, and investing.',
    tags: ['Economics', 'Finance', 'Investing', 'Marketing'],
  },
  {
    title: 'Literature & Philosophy',
    icon: BookOpen,
    topicQuery: 'Classical Literature and Greek Mythology',
    desc: 'World classics, Shakespearean plays, philosophical ethics, and mythology.',
    tags: ['Shakespeare', 'Mythology', 'Philosophy', 'Literary Classics'],
  },
  {
    title: 'Computer Science & Tech',
    icon: Code2,
    topicQuery: 'Web Development and Python Basics',
    desc: 'Programming fundamentals, algorithms, web development, and cloud computing.',
    tags: ['Python', 'Web Development', 'Algorithms', 'Databases'],
  },
];

// Straightforward FAQ items
const FAQ_ITEMS = [
  {
    q: 'Can I use this without creating an account?',
    a: 'Yes. You can generate and take quizzes right away as a guest. Creating a free account allows you to save your quiz history, track your scores over time, and review past attempts.',
  },
  {
    q: 'What kinds of subjects can I generate quizzes for?',
    a: 'You can enter any subject you want to learn. Academic subjects like history, biology, and economics work great, as do technical topics like coding, languages, and general trivia.',
  },
  {
    q: 'Do you show explanations for the questions?',
    a: 'Yes. When you submit your quiz, you get a full question review showing all options, which one you selected, what the correct answer was, and a detailed explanation for each question.',
  },
  {
    q: 'How many questions can I generate at once?',
    a: 'You can choose between 5, 10, or 15 questions per quiz. You can also pick easy, medium, or hard difficulty levels.',
  },
  {
    q: 'Can I retake a quiz?',
    a: 'Yes. After reviewing your results, you can click "Retake quiz" to try the exact same questions again, or click "Try another topic" to create a fresh quiz.',
  },
];

export default function HomePage() {
  const { user } = useAuth();

  // Hero interactive demo state
  const [heroAnswer, setHeroAnswer] = useState(null);

  // Playground state
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(0);

  const sample = PLAYGROUND_QUESTIONS[activeIdx];
  const isCorrect = selectedOption === sample.correctIndex;

  function switchSample(idx) {
    setActiveIdx(idx);
    setSelectedOption(null);
    setSubmitted(false);
  }

  function handlePlaygroundSubmit() {
    if (selectedOption === null) return;
    setSubmitted(true);
  }

  function handleReset() {
    setSelectedOption(null);
    setSubmitted(false);
  }

  return (
    <main className="page" style={{ paddingTop: 0 }}>
      {/* 1. HERO SECTION */}
      <section className="home-hero">
        <div className="container">
          <div className="home-hero__grid">
            <div>
              <div className="home-hero__badge">
                <span className="home-hero__badge-indicator" />
                <span>Instant quiz generator</span>
              </div>
              <h1>Create and take quizzes on any subject in seconds.</h1>
              <p>
                Practice concepts, prepare for exams, or test your general knowledge.
                Get structured four-option questions with immediate scoring and clear explanations for every answer.
              </p>
              <div className="home-hero__actions">
                <Link
                  to={user ? '/generate' : '/register'}
                  className="btn btn--primary btn--lg"
                >
                  <span>{user ? 'Make a quiz' : 'Start a quiz free'}</span>
                  <ArrowRight size={16} />
                </Link>
                <a href="#playground" className="btn btn--secondary btn--lg">
                  Try a quick question
                </a>
              </div>
            </div>

            {/* Hero Quiz Demonstration */}
            <div>
              <div className="quiz-preview-mock">
                <div className="quiz-preview-mock__header">
                  <span className="quiz-preview-mock__tag">Practice Sample &middot; Human Biology</span>
                  <span className="quiz-preview-mock__status">
                    <Sparkles size={14} />
                    <span>Instant explanation</span>
                  </span>
                </div>
                <div className="quiz-preview-mock__question">
                  Which organ in the human body produces the hormone insulin to regulate blood glucose?
                </div>
                <div className="quiz-preview-mock__options">
                  {[
                    'Liver',
                    'Pancreas',
                    'Kidney',
                    'Thyroid',
                  ].map((opt, i) => (
                    <div
                      key={i}
                      className={`quiz-preview-mock__option${heroAnswer === i ? ' selected' : ''}`}
                      onClick={() => setHeroAnswer(i)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="option-label" style={{ width: '22px', height: '22px', fontSize: '0.75rem' }}>
                        {['A', 'B', 'C', 'D'][i]}
                      </span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  <span>{heroAnswer !== null ? 'Answer selected' : 'Click an option to test'}</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>Explanations included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE PLAYGROUND */}
      <section id="playground" className="home-section" style={{ background: 'var(--color-surface)' }}>
        <div className="container">
          <div className="section-header section-header--center">
            <span className="page__eyebrow">Quick Practice</span>
            <h2>Try a question right now</h2>
            <p>
              No account needed. Pick a subject below, select an answer, and see how the review feedback works.
            </p>
          </div>

          <div className="playground-card" style={{ maxWidth: '780px', margin: '0 auto' }}>
            <div className="playground-nav" role="tablist" aria-label="Practice questions">
              {PLAYGROUND_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  role="tab"
                  aria-selected={activeIdx === idx}
                  className={`playground-tab${activeIdx === idx ? ' active' : ''}`}
                  onClick={() => switchSample(idx)}
                >
                  {q.topic}
                </button>
              ))}
            </div>

            <div className="playground-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className="badge badge--muted">{sample.category}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {sample.difficulty}
                </span>
              </div>

              <h3 style={{ fontSize: '1.1875rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                {sample.question}
              </h3>

              <div role="group" aria-label="Question choices">
                {sample.options.map((opt, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  let optClass = 'option-btn';
                  if (submitted) {
                    if (optIdx === sample.correctIndex) optClass += ' correct';
                    else if (isSelected) optClass += ' wrong';
                  } else if (isSelected) {
                    optClass += ' selected';
                  }

                  return (
                    <button
                      key={optIdx}
                      className={optClass}
                      onClick={() => {
                        setSelectedOption(optIdx);
                        setSubmitted(false);
                      }}
                      aria-pressed={isSelected}
                    >
                      <span className="option-label">{['A', 'B', 'C', 'D'][optIdx]}</span>
                      <span className="option-btn__text">{opt}</span>
                      {submitted && optIdx === sample.correctIndex && (
                        <Check size={16} color="var(--color-correct)" style={{ flexShrink: 0 }} />
                      )}
                      {submitted && isSelected && !isCorrect && (
                        <X size={16} color="var(--color-wrong)" style={{ flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                {submitted ? (
                  <button className="btn btn--ghost btn--sm" onClick={handleReset}>
                    <RotateCcw size={14} />
                    <span>Try again</span>
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {selectedOption === null ? 'Pick an option above' : 'Ready to verify'}
                  </span>
                )}

                <button
                  className="btn btn--primary btn--sm"
                  onClick={handlePlaygroundSubmit}
                  disabled={selectedOption === null || submitted}
                >
                  <span>Check answer</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {submitted && (
                <div className={`playground-feedback playground-feedback--${isCorrect ? 'correct' : 'wrong'}`}>
                  {isCorrect ? (
                    <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  ) : (
                    <XCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  )}
                  <div>
                    <strong>{isCorrect ? 'Correct!' : 'Not quite.'}</strong>{' '}
                    <span>{sample.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. DIVERSE PRACTICE TOPICS */}
      <section id="categories" className="home-section">
        <div className="container">
          <div className="section-header">
            <span className="page__eyebrow">Explore Domains</span>
            <h2>Popular subjects to practice</h2>
            <p>
              Click any subject below to open the quiz creator with that topic pre-filled.
            </p>
          </div>

          <div className="topic-grid">
            {CATEGORIES.map((cat, idx) => {
              const IconComp = cat.icon;
              return (
                <Link
                  key={idx}
                  to={`/generate?topic=${encodeURIComponent(cat.topicQuery)}`}
                  className="topic-card"
                >
                  <div className="topic-card__icon">
                    <IconComp size={20} />
                  </div>
                  <h3>{cat.title}</h3>
                  <p>{cat.desc}</p>
                  <div className="topic-card__tags">
                    {cat.tags.map((t, tIdx) => (
                      <span key={tIdx} className="topic-tag">{t}</span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section id="workflow" className="home-section" style={{ background: 'var(--color-surface)' }}>
        <div className="container">
          <div className="section-header">
            <span className="page__eyebrow">How It Works</span>
            <h2>Simple and fast practice</h2>
            <p>
              From typing a topic to reviewing your score in four straightforward steps.
            </p>
          </div>

          <div className="workflow-grid">
            <div className="workflow-card">
              <span className="workflow-card__step">1</span>
              <h3>Choose your topic</h3>
              <p>
                Enter any subject, pick your difficulty from beginner to advanced, and select 5, 10, or 15 questions.
              </p>
            </div>

            <div className="workflow-card">
              <span className="workflow-card__step">2</span>
              <h3>Instant generation</h3>
              <p>
                Our AI model generates clean four-option questions with accurate answer keys and explanations.
              </p>
            </div>

            <div className="workflow-card">
              <span className="workflow-card__step">3</span>
              <h3>Answer questions</h3>
              <p>
                Go through questions at your own speed using your mouse or keyboard shortcuts (<kbd className="kbd">A</kbd>–<kbd className="kbd">D</kbd>).
              </p>
            </div>

            <div className="workflow-card">
              <span className="workflow-card__step">4</span>
              <h3>Full question review</h3>
              <p>
                See your final score, check every question with the correct answer highlighted, and read helpful explanations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY PRACTICE WITH US */}
      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <span className="page__eyebrow">Why AI Quiz Builder</span>
            <h2>Built for effective learning</h2>
            <p>
              Designed to help you practice subjects quickly without distractions, ads, or bloated interfaces.
            </p>
          </div>

          <div className="comparison-grid">
            <div className="comparison-card">
              <div className="badge badge--muted mb-2">Static Flashcards &amp; Old Quiz Sites</div>
              <h3>Repetitive &amp; Limited</h3>
              <p className="desc">Fixed question banks that become predictable over time.</p>
              <ul className="comparison-list">
                <li className="comparison-item">
                  <X size={16} color="var(--color-wrong)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Rigid question sets</strong>
                    <span>You see the exact same recycled questions every single time.</span>
                  </div>
                </li>
                <li className="comparison-item">
                  <X size={16} color="var(--color-wrong)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Little to no explanation</strong>
                    <span>Often tells you you were wrong without explaining why.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="comparison-card" style={{ borderColor: 'var(--color-primary)' }}>
              <div className="badge badge--primary mb-2">AI Quiz Builder</div>
              <h3>Dynamic &amp; Explanatory</h3>
              <p className="desc">Customized questions tailored to any topic you want to master.</p>
              <ul className="comparison-list">
                <li className="comparison-item">
                  <Check size={16} color="var(--color-correct)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Fresh questions on any topic</strong>
                    <span>Generate questions on specific niches, from high school history to advanced medicine.</span>
                  </div>
                </li>
                <li className="comparison-item">
                  <Check size={16} color="var(--color-correct)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Explanations for every question</strong>
                    <span>Learn from your mistakes with clear breakdowns of the correct concepts.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TECHNICAL FAQ */}
      <section id="faq" className="home-section" style={{ background: 'var(--color-surface)' }}>
        <div className="container">
          <div className="section-header section-header--center">
            <span className="page__eyebrow">Help &amp; Answers</span>
            <h2>Frequently Asked Questions</h2>
            <p>
              Common questions about generating quizzes, reviewing answers, and accounts.
            </p>
          </div>

          <div className="faq-list">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="faq-item">
                  <button
                    className="faq-trigger"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={18}
                      color="var(--color-text-muted)"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 180ms ease',
                        flexShrink: 0,
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div className="faq-body">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="home-section" style={{ borderBottom: 'none' }}>
        <div className="container">
          <div className="cta-banner">
            <span className="page__eyebrow mb-2">Ready to practice?</span>
            <h2>Generate your first quiz now</h2>
            <p>
              Pick any topic you want to learn or brush up on. Takes just a few seconds to generate.
            </p>
            <div className="cta-banner__actions">
              <Link to="/generate" className="btn btn--primary btn--lg">
                <span>Generate a quiz</span>
                <ArrowRight size={16} />
              </Link>
              {!user && (
                <Link to="/register" className="btn btn--secondary btn--lg">
                  Create a free account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
