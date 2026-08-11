import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    console.error('FATAL ERROR: GEMINI_API_KEY is not set in the environment variables.');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// gemini-flash-latest is Google's rolling alias for the current recommended free-tier flash
// model, which avoids hardcoding a dated model name that later gets retired - override with
// GEMINI_MODEL to pin a specific version instead.
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
// The cognitive skill a quiz question primarily exercises - lets Weak Areas surface *what kind*
// of thinking a student struggles with, not just *which topic*
const VALID_SKILL_CATEGORIES = ['logical', 'analytical', 'conceptual', 'memory', 'application'];

const normalizeDifficulty = (d) => {
    const diff = (d || '').toString().trim().toLowerCase();
    return VALID_DIFFICULTIES.includes(diff) ? diff : 'medium';
};

const normalizeSkillCategory = (c) => {
    const cat = (c || '').toString().trim().toLowerCase();
    return VALID_SKILL_CATEGORIES.includes(cat) ? cat : null;
};

const rethrowFriendly = (error, action) => {
    console.error('Gemini API error:', error);
    if (error.status === 429) {
        throw new Error(`Failed to ${action}. Gemini's free-tier rate limit was hit. Please try again shortly.`);
    }
    throw error;
};

// Structured-output calls (responseSchema) guarantee response.text is valid JSON matching the schema
const generateJson = async (prompt, schema, maxOutputTokens) => {
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            maxOutputTokens,
        },
    });

    return JSON.parse(response.text);
};

const generateText = async (prompt, maxOutputTokens) => {
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { maxOutputTokens },
    });

    return response.text;
};

const FLASHCARD_SCHEMA = {
    type: 'OBJECT',
    properties: {
        flashcards: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    question: { type: 'STRING' },
                    answer: { type: 'STRING' },
                    difficulty: { type: 'STRING', enum: VALID_DIFFICULTIES },
                    // Empty string means "no matching topic" - keeps the schema simple (no nullable types)
                    topicTitle: { type: 'STRING' },
                },
                required: ['question', 'answer', 'difficulty', 'topicTitle'],
            },
        },
    },
    required: ['flashcards'],
};

/**
 * Generate flashcards from text
 * @param {string} text - Document text
 * @param {number} count - Number of flashcards to generate
 * @param {string[]} topicTitles - Optional list of existing learning-path topic titles to tag each card with
 * @returns {Promise<Array<{question: string, answer: string, difficulty: string, topicTitle: string|null}>>}
 */
export const generateFlashcards = async (text, count = 10, topicTitles = []) => {
    const shouldTagTopics = topicTitles.length > 0;

    const prompt = `Generate exactly ${count} educational flashcards from the following text.

Each flashcard needs a clear, specific question, a concise and accurate answer, and a difficulty level (easy, medium, or hard).${shouldTagTopics ? `
Also tag each flashcard with the single best matching topic, copied exactly from this list: ${topicTitles.join(' | ')}
If none of them are relevant, set topicTitle to an empty string.` : `
Set topicTitle to an empty string for every flashcard - there is no topic list to match against.`}

Text:
${text.substring(0, 15000)}`;

    try {
        const { flashcards } = await generateJson(prompt, FLASHCARD_SCHEMA, 4096);

        return (flashcards || [])
            .filter(card => card && card.question && card.answer)
            .slice(0, count)
            .map(card => ({
                question: card.question,
                answer: card.answer,
                difficulty: normalizeDifficulty(card.difficulty),
                topicTitle: card.topicTitle || null,
            }));
    } catch (error) {
        rethrowFriendly(error, 'generate flashcards');
    }
};

const QUIZ_SCHEMA = {
    type: 'OBJECT',
    properties: {
        questions: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    question: { type: 'STRING' },
                    options: { type: 'ARRAY', items: { type: 'STRING' } },
                    correctOption: { type: 'INTEGER' },
                    explanation: { type: 'STRING' },
                    difficulty: { type: 'STRING', enum: VALID_DIFFICULTIES },
                    topicTitle: { type: 'STRING' },
                    skillCategory: { type: 'STRING', enum: VALID_SKILL_CATEGORIES },
                },
                required: ['question', 'options', 'correctOption', 'explanation', 'difficulty', 'topicTitle', 'skillCategory'],
            },
        },
    },
    required: ['questions'],
};

/**
 * Generate quiz questions
 * @param {string} text - Document text
 * @param {number} numQuestions - Number of questions
 * @param {string[]} topicTitles - Optional list of existing learning-path topic titles to tag each question with
 * @returns {Promise<Array<{question: string, options: Array, correctOption: string, explanation: string, difficulty: string, topicTitle: string|null, skillCategory: string|null}>>}
 */
export const generateQuiz = async (text, numQuestions = 5, topicTitles = []) => {
    const shouldTagTopics = topicTitles.length > 0;

    const prompt = `Generate exactly ${numQuestions} multiple choice questions from the following text.

Each question needs exactly 4 options, a correctOption (the 1-based index of the correct option: 1, 2, 3, or 4), a brief explanation, and a difficulty level (easy, medium, or hard).${shouldTagTopics ? `
Also tag each question with the single best matching topic, copied exactly from this list: ${topicTitles.join(' | ')}
If none of them are relevant, set topicTitle to an empty string.` : `
Set topicTitle to an empty string for every question - there is no topic list to match against.`}

Also tag each question with the single cognitive skill it primarily tests, chosen from EXACTLY these 5 values:
- "logical": requires step-by-step reasoning, deduction, or working through cause-and-effect/if-then relationships.
- "analytical": requires breaking something down into parts, comparing/contrasting, or interpreting data/relationships.
- "conceptual": tests understanding of what a concept means or why it matters, rather than reasoning through it.
- "memory": tests recall of a specific fact, term, definition, or detail stated directly in the text.
- "application": requires applying a concept/rule to a new example or scenario not explicitly given in the text.

Text:
${text.substring(0, 15000)}`;

    try {
        const { questions } = await generateJson(prompt, QUIZ_SCHEMA, 4096);

        return (questions || [])
            .filter(q => q && q.question && Array.isArray(q.options) && q.options.length === 4
                && q.correctOption >= 1 && q.correctOption <= 4)
            .slice(0, numQuestions)
            .map(q => ({
                question: q.question,
                options: q.options,
                correctOption: q.correctOption,
                explanation: q.explanation || '',
                difficulty: normalizeDifficulty(q.difficulty),
                topicTitle: q.topicTitle || null,
                skillCategory: normalizeSkillCategory(q.skillCategory),
            }));
    } catch (error) {
        rethrowFriendly(error, 'generate quiz');
    }
};

/**
 * Generate document summary
 * @param {string} text - Document text
 * @returns {Promise<string>}
 */
export const generateSummary = async (text) => {
    const prompt = `Provide a concise summary of the following text, highlighting the key concepts, main ideas, and important points.
Keep the summary clear and structured.

Text:
${text.substring(0, 20000)}`;

    try {
        return await generateText(prompt, 2048);
    } catch (error) {
        rethrowFriendly(error, 'generate summary');
    }
};

/**
 * Chat with document context
 * @param {string} question - User question
 * @param {Array<Object>} chunks - Relevant document chunks
 * @returns {Promise<string>}
 */
export const chatWithContext = async (question, chunks) => {
    const context = chunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content}`).join('\n\n');

    const prompt = `Based on the following context from a document, analyze the context and answer the user's question.
If the answer is not in the context, say so.

Context:
${context}

Question: ${question}

Answer:`;

    try {
        return await generateText(prompt, 2048);
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to process chat request');
    }
};

/**
 * Explain a specific concept
 * @param {string} concept - Concept to explain
 * @param {string} context - Relevant context
 * @returns {Promise<string>}
 */
export const explainConcept = async (concept, context) => {
    const prompt = `Explain the concept of "${concept}" based on the following context.
Provide a clear, educational explanation that's easy to understand.
Include examples if relevant.

Context:
${context.substring(0, 10000)}`;

    try {
        return await generateText(prompt, 2048);
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to explain concept');
    }
};
