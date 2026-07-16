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
 * @param {string[]} topicTitles - Optional list of existing learning-path topic titles to tag each card with
 * @returns {Promise<Array<{question: string, answer: string, difficulty: string, topicTitle: string|null}>>}
 */
export const generateFlashcards = async (text, count = 10, topicTitles = []) => {
    const shouldTagTopics = topicTitles.length > 0;

    const prompt = `Generate exactly ${count} educational flashcards from the following text.
Format each flashcard as:
Q: [Clear, specific question]
A: [Concise, accurate answer]
D: [Difficulty level: easy, medium, or hard]${shouldTagTopics ? `
T: [The single best matching topic from this exact list: ${topicTitles.join(' | ')}]` : ''}

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
            let question = '', answer = '', difficulty = 'medium', topicTitle = null;

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
                } else if (line.startsWith('T:')) {
                    topicTitle = line.substring(2).trim() || null;
                }
            }

            if (question && answer) {
                flashcards.push({ question, answer, difficulty, topicTitle });
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
 * @param {string[]} topicTitles - Optional list of existing learning-path topic titles to tag each question with
 * @returns {Promise<Array<{question: string, options: Array, correctOption: string, explanation: string, difficulty: string, topicTitle: string|null}>>}
 */
export const generateQuiz = async (text, numQuestions = 5, topicTitles = []) => {
    const shouldTagTopics = topicTitles.length > 0;

    const prompt = `Generate exactly ${numQuestions} multiple choice questions from the following text.
Format each question as:
Q: [Question]
O1: [Option 1]
O2: [Option 2]
O3: [Option 3]
O4: [Option 4]
C: [1, 2, 3, or 4 ONLY]
E: [Brief explanation]
D: [Difficulty: easy, medium, or hard]${shouldTagTopics ? `
T: [The single best matching topic from this exact list: ${topicTitles.join(' | ')}]` : ''}

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
            let topicTitle = null;

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
                } else if (trimmed.startsWith('T:')) {
                    topicTitle = trimmed.substring(2).trim() || null;
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
                    difficulty,
                    topicTitle
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

const VALID_KNOWLEDGE_LEVELS = ['beginner', 'intermediate', 'proficient'];
const VALID_STUDY_ACTIONS = ['reread-summary', 'redo-flashcards', 'retake-quiz', 'ask-ai-explain'];

/**
 * Classify each topic's knowledge level and recommend a next study action, based on the
 * user's actual quiz/flashcard performance. Grounded on masteryScore bands (<40 beginner,
 * 40-74 intermediate, >=75 proficient) so Gemini's labels stay consistent with the numeric
 * mastery system - it may only nudge one band based on other signals (recency, engagement).
 * @param {Array<{title: string, masteryScore: number, status: string, difficulty: string, source: string|null, daysSinceReviewed: number|null}>} topicStats
 * @returns {Promise<Array<{title: string, knowledgeLevel: string|null, levelReason: string, action: string|null, actionReason: string}>>}
 */
export const classifyTopicKnowledge = async (topicStats) => {
    const topicsList = topicStats.map(t => `- Title: "${t.title}"
  masteryScore: ${t.masteryScore}/100
  difficulty: ${t.difficulty}
  performanceSource: ${t.source || 'none yet'}
  lastReviewed: ${t.daysSinceReviewed === null ? 'never' : `${t.daysSinceReviewed} day(s) ago`}`).join('\n\n');

    const prompt = `You are analyzing a student's mastery of topics from a learning document, based on their real quiz and flashcard performance.

For each topic below, decide:
1. A "knowledgeLevel": one of "beginner", "intermediate", "proficient".
   - Use masteryScore as the primary anchor: below 40 is normally beginner, 40-74 is normally intermediate, 75+ is normally proficient.
   - You may shift a topic by at most one band if other signals justify it (e.g. never reviewed, or long time since last review).
2. A "levelReason": one short sentence (plain language) explaining why, referencing the actual numbers.
3. An "action": the single best next study step, chosen from EXACTLY these 4 values:
   - "reread-summary": re-read the AI-generated document summary. Best when the student has little/no engagement with this topic yet.
   - "redo-flashcards": review this topic's flashcards again. Best when flashcard practice is missing or light relative to quiz activity.
   - "retake-quiz": take another quiz on this topic. Best when the student has some grasp but needs more testing/reinforcement.
   - "ask-ai-explain": ask the AI to explain the concept again. Best when quiz accuracy is low, suggesting a conceptual gap rather than a practice gap.
4. An "actionReason": one short sentence explaining why that specific action was chosen.

Return ONLY a JSON array (no markdown, no code fences, no extra commentary) in exactly this shape:
[
  {
    "title": "Topic title (must exactly match one given below)",
    "knowledgeLevel": "beginner" | "intermediate" | "proficient",
    "levelReason": "...",
    "action": "reread-summary" | "redo-flashcards" | "retake-quiz" | "ask-ai-explain",
    "actionReason": "..."
  }
]

Topics:
${topicsList}`;

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

        return parsed
            .filter(item => item && item.title)
            .map(item => ({
                title: String(item.title).trim(),
                knowledgeLevel: VALID_KNOWLEDGE_LEVELS.includes(item.knowledgeLevel) ? item.knowledgeLevel : null,
                levelReason: typeof item.levelReason === 'string' ? item.levelReason.trim().slice(0, 300) : '',
                action: VALID_STUDY_ACTIONS.includes(item.action) ? item.action : null,
                actionReason: typeof item.actionReason === 'string' ? item.actionReason.trim().slice(0, 300) : ''
            }));
    } catch (error) {
        console.error('Gemini API error:', error);

        if (error.status === 429) {
            throw new Error(
                'Failed to classify topic knowledge. Gemini API quota exceeded. Please try again later.'
            );
        }

        throw new Error('Failed to classify topic knowledge');
    }
};

/**
 * Cluster a user's incorrect quiz answers into a small number of named weak concepts, each
 * with a recommended next study action. Reuses the same action taxonomy as
 * classifyTopicKnowledge so the frontend can render both lists identically.
 * @param {Array<{question: string, correctAnswer: string, selectedAnswer: string, explanation: string, topicTitle: string|null}>} wrongAnswers
 * @returns {Promise<Array<{concept: string, description: string, relatedTopicTitle: string|null, missedCount: number, action: string|null, actionReason: string}>>}
 */
export const identifyWeakConcepts = async (wrongAnswers) => {
    if (!Array.isArray(wrongAnswers) || wrongAnswers.length === 0) {
        return [];
    }

    const answersList = wrongAnswers.map((a, i) => `${i + 1}. Question: "${a.question}"
   Section: ${a.topicTitle || 'unknown'}
   Student answered: "${a.selectedAnswer}"
   Correct answer: "${a.correctAnswer}"
   Explanation: ${a.explanation || 'none provided'}`).join('\n\n');

    const prompt = `You are analyzing a student's incorrect quiz answers on a learning document to find their underlying weak areas.

Below is a list of specific questions the student got wrong, with what they answered, the correct answer, and the explanation.

Group these mistakes into 3 to 8 distinct "weak concepts" - specific skills or ideas the student seems to be struggling with (e.g. "confusing precedence of AND vs OR", not a vague restatement of an entire chapter). Multiple wrong answers can belong to the same concept. Do not create one concept per question - only create a new concept when the mistake pattern is genuinely different.

For each concept, decide:
1. "concept": a short, specific name for the weak area (3-8 words).
2. "description": one plain-language sentence describing the mistake pattern, referencing what the student seems to be getting confused about.
3. "relatedTopicTitle": the section title (from the questions above) that best matches this concept, or null if unclear.
4. "missedCount": how many of the numbered questions above relate to this concept.
5. "action": the single best next study step, chosen from EXACTLY these 4 values:
   - "reread-summary": re-read the AI-generated document summary. Best for broad unfamiliarity.
   - "redo-flashcards": review flashcards again. Best when more repetition/practice would help.
   - "retake-quiz": take another quiz. Best when the student has some grasp but needs more testing/reinforcement.
   - "ask-ai-explain": ask the AI to explain the concept again. Best when the mistakes suggest a genuine conceptual misunderstanding.
6. "actionReason": one short sentence explaining why that specific action was chosen.

Return ONLY a JSON array (no markdown, no code fences, no extra commentary) in exactly this shape:
[
  {
    "concept": "...",
    "description": "...",
    "relatedTopicTitle": "..." | null,
    "missedCount": 1,
    "action": "reread-summary" | "redo-flashcards" | "retake-quiz" | "ask-ai-explain",
    "actionReason": "..."
  }
]

Incorrect answers:
${answersList}`;

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

        return parsed
            .filter(item => item && item.concept)
            .map(item => ({
                concept: String(item.concept).trim().slice(0, 120),
                description: typeof item.description === 'string' ? item.description.trim().slice(0, 300) : '',
                relatedTopicTitle: typeof item.relatedTopicTitle === 'string' && item.relatedTopicTitle.trim()
                    ? item.relatedTopicTitle.trim()
                    : null,
                missedCount: Number.isFinite(item.missedCount) ? Math.max(0, Math.round(item.missedCount)) : 0,
                action: VALID_STUDY_ACTIONS.includes(item.action) ? item.action : null,
                actionReason: typeof item.actionReason === 'string' ? item.actionReason.trim().slice(0, 300) : ''
            }));
    } catch (error) {
        console.error('Gemini API error:', error);

        if (error.status === 429) {
            throw new Error(
                'Failed to identify weak concepts. Gemini API quota exceeded. Please try again later.'
            );
        }

        throw new Error('Failed to identify weak concepts');
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



