/**
 * Validation and Repair Layer for AI-Generated Quizzes
 * 
 * WHY THIS IS ESSENTIAL:
 * LLMs can occasionally return slightly malformed responses despite strict prompting:
 * 1. Letter answers ("A", "B", "C", "D") instead of integer indices (0, 1, 2, 3)
 * 2. Numeric strings ("2") instead of numbers
 * 3. Prefixed options (e.g., "A) Option text" or "1. Option text")
 * 4. Extraneous options (> 4) or missing difficulty tags
 * 
 * This layer inspects each question, repairs common minor defects, and rejects
 * unrecoverable or invalid questions before anything is written to the database.
 */

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

const LETTER_TO_INDEX_MAP = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  a: 0,
  b: 1,
  c: 2,
  d: 3,
};

/**
 * Strips leading enumerations from option text like "A) ", "1. ", or "B - ".
 */
function cleanOptionText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/^[A-Da-d0-9][\).\:\-]\s*/, '').trim();
}

/**
 * Repairs and normalizes the correct answer index from various potential LLM formats:
 * - Number: 0, 1, 2, 3
 * - Numeric string: "0", "1", "2", "3"
 * - Letter string: "A", "B", "C", "D"
 * - Text matching one of the options exactly
 */
function resolveCorrectAnswerIndex(rawIndex, rawAnswerText, options) {
  // Case 1: Already a valid number
  if (typeof rawIndex === 'number' && Number.isInteger(rawIndex) && rawIndex >= 0 && rawIndex < options.length) {
    return rawIndex;
  }

  // Case 2: Numeric string e.g. "2"
  if (typeof rawIndex === 'string') {
    const trimmed = rawIndex.trim();

    // Check letter mapping (A -> 0, B -> 1, etc.)
    if (LETTER_TO_INDEX_MAP[trimmed] !== undefined) {
      const mapped = LETTER_TO_INDEX_MAP[trimmed];
      if (mapped < options.length) return mapped;
    }

    const parsedNum = parseInt(trimmed, 10);
    if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum < options.length) {
      return parsedNum;
    }
  }

  // Case 3: Answer text provided instead of index (e.g. "push()")
  const answerStringToMatch = cleanOptionText(rawAnswerText || rawIndex);
  if (answerStringToMatch) {
    const matchedIndex = options.findIndex(
      opt => opt.toLowerCase() === answerStringToMatch.toLowerCase()
    );
    if (matchedIndex !== -1) {
      return matchedIndex;
    }
  }

  return null; // Could not resolve safely
}

/**
 * Validates and repairs a single question object.
 * Returns the cleaned question or null if unrepairable.
 */
function validateAndRepairQuestion(q, fallbackDifficulty) {
  if (!q || typeof q !== 'object') return null;

  // 1. Validate Question Text
  const rawText = q.questionText || q.question || q.text;
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return null; // A question without text is invalid
  }
  const questionText = rawText.trim();

  // 2. Validate and Clean Options
  const rawOptions = q.options || q.choices;
  if (!Array.isArray(rawOptions)) {
    return null;
  }

  const cleanedOptions = rawOptions
    .map(opt => (typeof opt === 'string' ? cleanOptionText(opt) : String(opt || '').trim()))
    .filter(opt => opt.length > 0);

  // If there are more than 4 options, take the first 4; if fewer than 4, reject
  if (cleanedOptions.length < 4) {
    return null; // Cannot reliably construct a 4-choice question
  }
  const options = cleanedOptions.slice(0, 4);

  // 3. Validate and Repair Correct Answer Index
  const rawIndex = q.correctAnswerIndex ?? q.correctAnswer ?? q.answerIndex ?? q.answer;
  const correctAnswerIndex = resolveCorrectAnswerIndex(rawIndex, q.correctAnswer || q.answer, options);
  if (correctAnswerIndex === null) {
    return null; // Without a reliable correct answer, reject question
  }

  // 4. Validate and Normalize Difficulty
  let difficulty = fallbackDifficulty;
  if (q.difficulty && typeof q.difficulty === 'string') {
    const lower = q.difficulty.toLowerCase().trim();
    if (VALID_DIFFICULTIES.includes(lower)) {
      difficulty = lower;
    }
  }

  // 5. Optional Explanation
  const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : '';

  return {
    questionText,
    options,
    correctAnswerIndex,
    difficulty,
    explanation,
  };
}

/**
 * Validates and repairs the entire quiz payload from the AI.
 * 
 * @param {Object} rawData - The raw parsed JSON from LLM
 * @param {string} fallbackTopic - Topic requested by client
 * @param {string} fallbackDifficulty - Difficulty requested by client
 * @returns {Object} Cleaned quiz object with validated questions
 * @throws {Error} If payload is unrecoverable or has 0 valid questions
 */
function validateAndRepairQuiz(rawData, fallbackTopic, fallbackDifficulty = 'medium') {
  if (!rawData || typeof rawData !== 'object') {
    throw new Error('AI output is not a valid JSON object.');
  }

  // Topic validation
  const topic = (typeof rawData.topic === 'string' && rawData.topic.trim().length > 0)
    ? rawData.topic.trim()
    : fallbackTopic;

  // Difficulty validation
  let difficulty = fallbackDifficulty.toLowerCase().trim();
  if (typeof rawData.difficulty === 'string') {
    const lower = rawData.difficulty.toLowerCase().trim();
    if (VALID_DIFFICULTIES.includes(lower)) {
      difficulty = lower;
    }
  }

  // Questions array validation
  const rawQuestions = Array.isArray(rawData.questions)
    ? rawData.questions
    : (Array.isArray(rawData) ? rawData : []);

  if (rawQuestions.length === 0) {
    throw new Error('AI output did not contain any questions.');
  }

  const repairedQuestions = [];
  const rejectedReasons = [];

  rawQuestions.forEach((q, idx) => {
    const repaired = validateAndRepairQuestion(q, difficulty);
    if (repaired) {
      repairedQuestions.push(repaired);
    } else {
      rejectedReasons.push(`Question #${idx + 1} was malformed and could not be repaired.`);
    }
  });

  if (repairedQuestions.length === 0) {
    throw new Error(
      `All generated questions were malformed and rejected. Reasons: ${rejectedReasons.join('; ')}`
    );
  }

  return {
    title: topic,
    topic,
    difficulty,
    questions: repairedQuestions,
    repairedCount: rawQuestions.length - repairedQuestions.length,
  };
}

module.exports = {
  validateAndRepairQuiz,
  validateAndRepairQuestion,
  cleanOptionText,
  resolveCorrectAnswerIndex,
};
