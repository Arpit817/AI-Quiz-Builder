const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

/**
 * Builds the LLM prompt for generating structured quiz questions.
 * 
 * PROMPT ENGINEERING STRATEGY:
 * 1. Persona Framing: Assigns the role of an expert quiz creator to ensure pedagogical quality.
 * 2. Strict Schema Contract: Provides the exact target JSON schema to constrain the output format.
 * 3. Difficulty Anchoring: Explicitly specifies the cognitive depth expected for easy, medium, or hard.
 * 4. Anti-Bias Instruction: Instructs the model to distribute correct answers evenly across indices (0-3)
 *    to avoid the common LLM bias of favoring option A (0) or B (1).
 * 5. Format Quarantine: Forbids any preamble, explanations, or wrapping markdown to maximize parse reliability.
 */
function buildQuizPrompt(topic, difficulty = 'medium', count = 5) {
  return `You are an expert educator and quiz architect.
Generate a high-quality quiz about "${topic}" tailored to "${difficulty}" difficulty.
Produce exactly ${count} multiple-choice questions.

DIFFICULTY GUIDELINES:
- easy: Tests foundational terms, basic concepts, and direct recall.
- medium: Tests practical application, understanding of mechanics, and common scenarios.
- hard: Tests edge cases, subtle distinctions, deep architectural nuances, and debugging.

STRICT REQUIREMENTS:
1. Each question must have EXACTLY 4 distinct, plausible options.
2. Only ONE option must be unambiguously correct.
3. "correctAnswerIndex" MUST be an integer between 0 and 3 matching the correct option in the "options" array.
4. Distribute the correct answer index across 0, 1, 2, and 3 across the questions to avoid positional bias.
5. "difficulty" on each question must be "${difficulty.toLowerCase()}".
6. Return ONLY a single raw JSON object adhering to this exact schema, with NO markdown backticks, no comments, and no explanation text:

{
  "topic": "${topic}",
  "difficulty": "${difficulty.toLowerCase()}",
  "questions": [
    {
      "questionText": "Question description here?",
      "options": [
        "Option 0",
        "Option 1",
        "Option 2",
        "Option 3"
      ],
      "correctAnswerIndex": 0,
      "difficulty": "${difficulty.toLowerCase()}"
    }
  ]
}`;
}

/**
 * Utility to extract and parse JSON safely from an LLM response string,
 * removing markdown code blocks (```json ... ```) if present.
 */
function parseLlmJsonResponse(rawResponseText) {
  let cleaned = rawResponseText.trim();

  // Strip markdown code fences if the model included them
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  return JSON.parse(cleaned);
}

/**
 * Calls the Google Gemini API to generate quiz JSON.
 */
async function generateWithGemini(prompt) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }

  const preferredModel = (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim();
  // Fallback models in case preferred model experiences temporary 503 or deprecation
  const modelsToTry = Array.from(new Set([preferredModel, 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest']));

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      // Configure responseMimeType to application/json for guaranteed JSON output mode
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      return parseLlmJsonResponse(responseText);
    } catch (error) {
      lastError = error;
      console.warn(`Gemini generation attempt with model "${modelName}" failed: ${error.message}. Trying next candidate...`);
    }
  }

  throw lastError || new Error('All Gemini model generation attempts failed.');
}

/**
 * Calls the OpenAI API (or OpenAI-compatible provider) to generate quiz JSON.
 */
async function generateWithOpenAI(prompt) {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not defined in environment variables.');
  }

  const modelName = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
  const openai = new OpenAI({ apiKey });

  // Use json_object response format to enforce strict valid JSON from OpenAI
  const completion = await openai.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: 'system',
        content: 'You are an AI quiz generator that outputs strictly structured JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response received from OpenAI API.');
  }

  return parseLlmJsonResponse(content);
}

/**
 * Main quiz generation service.
 * Automatically chooses the provider based on AI_PROVIDER or available API keys.
 * 
 * @param {string} topic - The quiz topic
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @param {number} count - Number of questions (default: 5)
 * @returns {Promise<Object>} The generated quiz JSON
 */
async function generateQuizQuestions(topic, difficulty = 'medium', count = 5) {
  const prompt = buildQuizPrompt(topic, difficulty, count);

  // Determine provider: configured AI_PROVIDER, or fallback to whichever API key is set
  const configured = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  const hasGemini = Boolean((process.env.GEMINI_API_KEY || '').trim());
  const hasOpenAI = Boolean((process.env.OPENAI_API_KEY || '').trim());

  let provider = configured;
  if (!provider) {
    provider = hasGemini ? 'gemini' : (hasOpenAI ? 'openai' : 'gemini');
  }

  if (provider === 'gemini') {
    return await generateWithGemini(prompt);
  } else if (provider === 'openai') {
    return await generateWithOpenAI(prompt);
  } else {
    throw new Error(`Unsupported AI provider "${provider}". Use "gemini" or "openai".`);
  }
}

module.exports = {
  buildQuizPrompt,
  parseLlmJsonResponse,
  generateQuizQuestions,
};
