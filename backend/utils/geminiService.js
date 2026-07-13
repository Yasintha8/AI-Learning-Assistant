import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!process.env.GEMINI_API_KEY) {
    console.error('FATAL ERROR: GEMINI_API_KEY is not set in the environment variables.');
    process.exit(1);
}


/**
 * Generate flashcards from text
 * @param {string} text - Document text
 * @param {number} count - Number of flashcards to generate
 * @returns {Promise<Array<{question: string, answer: string, difficulty: string}>>}
 */
export const generateFlashcards = async (text, count = 10) => {
    const prompt = `Generate exactly ${count} educational flashcards from the following text.
Format each flashcard as:
Q: [Clear, specific question]
A: [Concise, accurate answer]
D: [Difficulty level: easy, medium, or hard]

Separate each flashcard with "---"

Text:
${text.substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        const generatedText = response.text;

        // Parse the response
        const flashcards = [];
        const cards = generatedText.split('---').filter(c => c.trim());

        for (const card of cards) {
            const lines = card.trim().split('\n');
            let question = '', answer = '', difficulty = 'medium';

            for (const line of lines) {
                if (line.startsWith('Q:')) {
                    question = line.substring(2).trim();
                } else if (line.startsWith('A:')) {
                    answer = line.substring(2).trim();
                } else if (line.startsWith('D:')) {
                    const diff = line.substring(2).trim().toLowerCase();
                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }

            if (question && answer) {
                flashcards.push({ question, answer, difficulty });
            }
        }

        return flashcards.slice(0, count);
    } catch (error) {
        console.error('Gemini API error:', error);

        if (error.status === 429) {
            throw new Error(
                'Failed to generate flashcards. Gemini API quota exceeded. Please try again later.'
            );
        }

        throw error;
    }
};

/**
 * Generate quiz questions
 * @param {string} text - Document text
 * @param {number} numQuestions - Number of questions
 * @returns {Promise<Array<{question: string, options: Array, correctOption: string, explanation: string, difficulty: string}>>}
 */
export const generateQuiz = async (text, numQuestions = 5) => {
    const prompt = `Generate exactly ${numQuestions} multiple choice questions from the following text.
Format each question as:
Q: [Question]
O1: [Option 1]
O2: [Option 2]
O3: [Option 3]
O4: [Option 4]
C: [1, 2, 3, or 4 ONLY]
E: [Brief explanation]
D: [Difficulty: easy, medium, or hard]

IMPORTANT:
- C MUST contain ONLY the option number (1, 2, 3, or 4).
- Do NOT write the answer text.
- Do NOT abbreviate the answer.
- Do NOT add any extra words.

Separate questions with "---"

Text:
${text.substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        const generatedText = response.text;

        const questions = [];
        const questionBlocks = generatedText.split('---').filter(q => q.trim());

        for (const block of questionBlocks) {
            const lines = block.trim().split('\n');

            let question = '';
            let options = [];
            let correctOption = null;
            let explanation = '';
            let difficulty = 'medium';

            for (const line of lines) {
                const trimmed = line.trim();

                if (trimmed.startsWith('Q:')) {
                    question = trimmed.substring(2).trim();

                } else if (/^O\d:/.test(trimmed)) {
                    options.push(trimmed.substring(3).trim());

                } else if (trimmed.startsWith('C:')) {
                    correctOption = parseInt(trimmed.substring(2).trim(), 10);

                } else if (trimmed.startsWith('E:')) {
                    explanation = trimmed.substring(2).trim();

                } else if (trimmed.startsWith('D:')) {
                    const diff = trimmed.substring(2).trim().toLowerCase();

                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }

            if (
                question &&
                options.length === 4 &&
                correctOption >= 1 &&
                correctOption <= 4
            ) {
                questions.push({
                    question,
                    options,
                    correctOption,
                    explanation,
                    difficulty
                });
            }
        }
        console.log("Generated Questions:");
        console.log(JSON.stringify(questions, null, 2));
        return questions;
    } catch (error) {
        console.error('Gemini API error:', error);

        if (error.status === 429) {
            throw new Error(
                'Failed to generate quizes. Gemini API quota exceeded. Please try again later.'
            );
        }

        throw error;
    }
};

/**
 * Generate document summary
 * @param {string} text - Document text
 * @returns {Promise<string>}
 */
export const generateSummary = async (text) => {
    const prompt = `Provide a concise summary of the following text, highlighting the key concepts, main ideas, and important points.
    keep the summary clear and structured.

Text:
${text.substring(0, 20000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        const generatedText = response.text;
        return generatedText;
    } catch (error) {
        console.error('Gemini API error:', error);

        if (error.status === 429) {
            throw new Error(
                'Failed to generate summary. Gemini API quota exceeded. Please try again later.'
            );
        }

        throw error;
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

    const prompt = `Based on the following context from a document, Analyse the context and answer the user's question.
If the answer is not in the context, say so.

Context:
${context}

Question: ${question}

Answer:`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });
        const generatedText = response.text;
        return generatedText;
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to process chat request');
    }
};

/**
 * Extract topics and subtopics from document text
 * @param {string} text - Document text
 * @returns {Promise<Array<{title: string, difficulty: string, subtopics: Array<{title: string, difficulty: string}>}>>}
 */
export const generateTopics = async (text) => {
    const prompt = `Analyze the following text and break it down into the main topics and subtopics a student would need to learn.
Return ONLY a JSON array (no markdown, no code fences, no extra commentary) in exactly this shape:
[
  {
    "title": "Topic title",
    "difficulty": "easy" | "medium" | "hard",
    "subtopics": [
      { "title": "Subtopic title", "difficulty": "easy" | "medium" | "hard" }
    ]
  }
]

Rules:
- Produce between 3 and 10 top-level topics.
- Each topic may have 0 to 5 subtopics.
- difficulty must be exactly one of: easy, medium, hard.

Text:
${text.substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        const generatedText = response.text;
        const jsonText = generatedText
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();

        const parsed = JSON.parse(jsonText);

        if (!Array.isArray(parsed)) {
            throw new Error('Gemini did not return a JSON array');
        }

        const validDifficulties = ['easy', 'medium', 'hard'];
        const normalizeDifficulty = (d) => {
            const diff = (d || '').toString().trim().toLowerCase();
            return validDifficulties.includes(diff) ? diff : 'medium';
        };

        return parsed
            .filter(topic => topic && topic.title)
            .map(topic => ({
                title: String(topic.title).trim(),
                difficulty: normalizeDifficulty(topic.difficulty),
                subtopics: Array.isArray(topic.subtopics)
                    ? topic.subtopics
                        .filter(sub => sub && sub.title)
                        .map(sub => ({
                            title: String(sub.title).trim(),
                            difficulty: normalizeDifficulty(sub.difficulty)
                        }))
                    : []
            }));
    } catch (error) {
        console.error('Gemini API error:', error);

        if (error.status === 429) {
            throw new Error(
                'Failed to generate topics. Gemini API quota exceeded. Please try again later.'
            );
        }

        throw new Error('Failed to generate topics from document');
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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        const generatedText = response.text;
        return generatedText;
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to explain concept');
    }
};



