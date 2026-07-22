import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

if (!process.env.ANTHROPIC_API_KEY) {
    console.error('FATAL ERROR: ANTHROPIC_API_KEY is not set in the environment variables.');
    process.exit(1);
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-5';

const VALID_STUDY_ACTIONS = ['reread-summary', 'redo-flashcards', 'retake-quiz', 'ask-ai-explain'];
const VALID_RESOURCE_TYPES = ['article', 'video', 'course', 'paper', 'website'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

const normalizeDifficulty = (d) => {
    const diff = (d || '').toString().trim().toLowerCase();
    return VALID_DIFFICULTIES.includes(diff) ? diff : 'medium';
};

// First plain-text block in a response - used for free-form (non-structured) replies
const getText = (response) => {
    const block = response.content.find(b => b.type === 'text');
    return block ? block.text : '';
};

// Structured-output responses (output_config.format) guarantee the first text block
// is valid JSON matching the requested schema - see Anthropic docs on structured outputs.
const getStructuredJson = (response) => {
    const block = response.content.find(b => b.type === 'text');
    if (!block) throw new Error('Claude did not return a text response');
    return JSON.parse(block.text);
};

const rethrowFriendly = (error, action) => {
    console.error('Claude API error:', error);
    if (error.status === 429 || error.status === 529) {
        throw new Error(`Failed to ${action}. Claude API is busy right now. Please try again later.`);
    }
    throw error;
};

const FLASHCARD_SCHEMA = {
    type: 'object',
    properties: {
        flashcards: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    question: { type: 'string' },
                    answer: { type: 'string' },
                    difficulty: { type: 'string', enum: VALID_DIFFICULTIES },
                    // Empty string means "no matching topic" - keeps the schema simple (no nullable types)
                    topicTitle: { type: 'string' }
                },
                required: ['question', 'answer', 'difficulty', 'topicTitle'],
                additionalProperties: false
            }
        }
    },
    required: ['flashcards'],
    additionalProperties: false
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
        const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 4096,
            output_config: { format: { type: 'json_schema', schema: FLASHCARD_SCHEMA } },
            messages: [{ role: 'user', content: prompt }],
        });

        const { flashcards } = getStructuredJson(response);

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
    type: 'object',
    properties: {
        questions: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    question: { type: 'string' },
                    options: { type: 'array', items: { type: 'string' } },
                    correctOption: { type: 'integer' },
                    explanation: { type: 'string' },
                    difficulty: { type: 'string', enum: VALID_DIFFICULTIES },
                    topicTitle: { type: 'string' }
                },
                required: ['question', 'options', 'correctOption', 'explanation', 'difficulty', 'topicTitle'],
                additionalProperties: false
            }
        }
    },
    required: ['questions'],
    additionalProperties: false
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

Each question needs exactly 4 options, a correctOption (the 1-based index of the correct option: 1, 2, 3, or 4), a brief explanation, and a difficulty level (easy, medium, or hard).${shouldTagTopics ? `
Also tag each question with the single best matching topic, copied exactly from this list: ${topicTitles.join(' | ')}
If none of them are relevant, set topicTitle to an empty string.` : `
Set topicTitle to an empty string for every question - there is no topic list to match against.`}

Text:
${text.substring(0, 15000)}`;

    try {
        const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 4096,
            output_config: { format: { type: 'json_schema', schema: QUIZ_SCHEMA } },
            messages: [{ role: 'user', content: prompt }],
        });

        const { questions } = getStructuredJson(response);

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
        const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        });

        return getText(response);
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
        const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        });

        return getText(response);
    } catch (error) {
        console.error('Claude API error:', error);
        throw new Error('Failed to process chat request');
    }
};

const TOPICS_SCHEMA = {
    type: 'object',
    properties: {
        topics: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    difficulty: { type: 'string', enum: VALID_DIFFICULTIES },
                    subtopics: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                difficulty: { type: 'string', enum: VALID_DIFFICULTIES }
                            },
                            required: ['title', 'difficulty'],
                            additionalProperties: false
                        }
                    }
                },
                required: ['title', 'difficulty', 'subtopics'],
                additionalProperties: false
            }
        }
    },
    required: ['topics'],
    additionalProperties: false
};

/**
 * Extract topics and subtopics from document text
 * @param {string} text - Document text
 * @returns {Promise<Array<{title: string, difficulty: string, subtopics: Array<{title: string, difficulty: string}>}>>}
 */
export const generateTopics = async (text) => {
    const prompt = `Analyze the following text and break it down into the main topics and subtopics a student would need to learn.

Rules:
- Produce between 3 and 10 top-level topics.
- Each topic may have 0 to 5 subtopics.

Text:
${text.substring(0, 15000)}`;

    try {
        const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 4096,
            output_config: { format: { type: 'json_schema', schema: TOPICS_SCHEMA } },
            messages: [{ role: 'user', content: prompt }],
        });

        const { topics } = getStructuredJson(response);

        return (topics || [])
            .filter(topic => topic && topic.title)
            .map(topic => ({
                title: String(topic.title).trim(),
                difficulty: normalizeDifficulty(topic.difficulty),
                subtopics: Array.isArray(topic.subtopics)
                    ? topic.subtopics
                        .filter(sub => sub && sub.title)
                        .map(sub => ({
                            title: String(sub.title).trim(),
                            difficulty: normalizeDifficulty(sub.difficulty),
                        }))
                    : [],
            }));
    } catch (error) {
        rethrowFriendly(error, 'generate topics from document');
    }
};

const CLASSIFY_SCHEMA = {
    type: 'object',
    properties: {
        classifications: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    knowledgeLevel: { type: 'string', enum: ['beginner', 'intermediate', 'proficient'] },
                    levelReason: { type: 'string' },
                    action: { type: 'string', enum: VALID_STUDY_ACTIONS },
                    actionReason: { type: 'string' }
                },
                required: ['title', 'knowledgeLevel', 'levelReason', 'action', 'actionReason'],
                additionalProperties: false
            }
        }
    },
    required: ['classifications'],
    additionalProperties: false
};

/**
 * Classify each topic's knowledge level and recommend a next study action, based on the
 * user's actual quiz/flashcard performance. Grounded on masteryScore bands (<40 beginner,
 * 40-74 intermediate, >=75 proficient) so Claude's labels stay consistent with the numeric
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

The "title" in your response must exactly match one of the titles given below.

Topics:
${topicsList}`;

    try {
        const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 8192,
            output_config: { format: { type: 'json_schema', schema: CLASSIFY_SCHEMA } },
            messages: [{ role: 'user', content: prompt }],
        });

        const { classifications } = getStructuredJson(response);

        return (classifications || [])
            .filter(item => item && item.title)
            .map(item => ({
                title: String(item.title).trim(),
                knowledgeLevel: item.knowledgeLevel || null,
                levelReason: typeof item.levelReason === 'string' ? item.levelReason.trim().slice(0, 300) : '',
                action: VALID_STUDY_ACTIONS.includes(item.action) ? item.action : null,
                actionReason: typeof item.actionReason === 'string' ? item.actionReason.trim().slice(0, 300) : '',
            }));
    } catch (error) {
        rethrowFriendly(error, 'classify topic knowledge');
    }
};

const WEAK_CONCEPTS_SCHEMA = {
    type: 'object',
    properties: {
        concepts: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    concept: { type: 'string' },
                    description: { type: 'string' },
                    // Empty string means "no clear related topic" - keeps the schema simple (no nullable types)
                    relatedTopicTitle: { type: 'string' },
                    missedCount: { type: 'integer' },
                    action: { type: 'string', enum: VALID_STUDY_ACTIONS },
                    actionReason: { type: 'string' }
                },
                required: ['concept', 'description', 'relatedTopicTitle', 'missedCount', 'action', 'actionReason'],
                additionalProperties: false
            }
        }
    },
    required: ['concepts'],
    additionalProperties: false
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
3. "relatedTopicTitle": the section title (from the questions above) that best matches this concept, or an empty string if unclear.
4. "missedCount": how many of the numbered questions above relate to this concept.
5. "action": the single best next study step, chosen from EXACTLY these 4 values:
   - "reread-summary": re-read the AI-generated document summary. Best for broad unfamiliarity.
   - "redo-flashcards": review flashcards again. Best when more repetition/practice would help.
   - "retake-quiz": take another quiz. Best when the student has some grasp but needs more testing/reinforcement.
   - "ask-ai-explain": ask the AI to explain the concept again. Best when the mistakes suggest a genuine conceptual misunderstanding.
6. "actionReason": one short sentence explaining why that specific action was chosen.

Incorrect answers:
${answersList}`;

    try {
        const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 4096,
            output_config: { format: { type: 'json_schema', schema: WEAK_CONCEPTS_SCHEMA } },
            messages: [{ role: 'user', content: prompt }],
        });

        const { concepts } = getStructuredJson(response);

        return (concepts || [])
            .filter(item => item && item.concept)
            .map(item => ({
                concept: String(item.concept).trim().slice(0, 120),
                description: typeof item.description === 'string' ? item.description.trim().slice(0, 300) : '',
                relatedTopicTitle: item.relatedTopicTitle ? String(item.relatedTopicTitle).trim() : null,
                missedCount: Number.isFinite(item.missedCount) ? Math.max(0, Math.round(item.missedCount)) : 0,
                action: VALID_STUDY_ACTIONS.includes(item.action) ? item.action : null,
                actionReason: typeof item.actionReason === 'string' ? item.actionReason.trim().slice(0, 300) : '',
            }));
    } catch (error) {
        rethrowFriendly(error, 'identify weak concepts');
    }
};

// Convert a title into a URL/DB-safe slug, e.g. "Cell Structure" -> "cell-structure"
const slugify = (title) => {
    return title
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'item';
};

const RESOURCE_GRAPH_SCHEMA = {
    type: 'object',
    properties: {
        concepts: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    resources: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                url: { type: 'string' },
                                type: { type: 'string', enum: VALID_RESOURCE_TYPES },
                                description: { type: 'string' }
                            },
                            required: ['title', 'url', 'type', 'description'],
                            additionalProperties: false
                        }
                    }
                },
                required: ['title', 'resources'],
                additionalProperties: false
            }
        }
    },
    required: ['concepts'],
    additionalProperties: false
};

/**
 * Generate a mesh of AI-suggested related resources (articles, videos, courses, papers)
 * for a document, grounded in Claude's live web search tool so URLs are real citations
 * rather than model guesses. Groups resources under a handful of key concepts.
 *
 * Runs as two Claude calls: the first does free-form research using the web_search tool
 * (server-executed, real results come back as web_search_tool_result blocks); the second
 * takes those research notes plus the exact list of real URLs found and asks Claude to
 * organize them into structured JSON, copying URLs verbatim rather than inventing new ones.
 * Every URL in the final output is cross-checked against the harvested real-URL set before
 * being trusted - this replaces Gemini's fuzzy domain-name matching with exact comparison.
 * @param {string} text - Document text
 * @returns {Promise<{concepts: Array<{conceptId: string, title: string}>, resources: Array<{resourceId: string, title: string, url: string, type: string, description: string, conceptIds: string[]}>}>}
 */
export const generateRelatedResources = async (text) => {
    const researchPrompt = `I am studying the topic below and want to find real, currently available external learning resources (articles, videos, courses, papers) about its key concepts. Search the web for real resources - cover 4 to 8 distinct key concepts from the text, with 2 to 3 resources per concept. For each resource, note its title, the resource type (article, video, course, paper, or website), and a one-sentence description.

Topic text:
${text.substring(0, 8000)}`;

    try {
        const researchResponse = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 4096,
            tools: [{ type: 'web_search_20260209', name: 'web_search' }],
            messages: [{ role: 'user', content: researchPrompt }],
        });

        // Harvest every real URL the web_search tool actually returned - the only URLs
        // the final step is allowed to use (never let the model invent one)
        const realResults = [];
        for (const block of researchResponse.content) {
            if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
                for (const result of block.content) {
                    if (result.type === 'web_search_result' && result.url) {
                        realResults.push({ url: result.url, title: result.title || '' });
                    }
                }
            }
        }

        if (realResults.length === 0) {
            throw new Error('Failed to generate related resources. Web search returned no results.');
        }

        const researchNotes = getText(researchResponse);
        const realResultsList = realResults
            .map((r, i) => `${i + 1}. ${r.title || '(untitled)'} - ${r.url}`)
            .join('\n');

        const formatPrompt = `Below are research notes about a topic, followed by a numbered list of real URLs found via web search.

Organize the material into 4 to 8 distinct key concepts, each with 2 to 3 learning resources. For every resource you include, copy its URL exactly, character-for-character, from the numbered list below - never invent or modify a URL. Only use resources that appear in the numbered list.

Research notes:
${researchNotes.substring(0, 12000)}

Real URLs found:
${realResultsList}`;

        const formatResponse = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 4096,
            output_config: { format: { type: 'json_schema', schema: RESOURCE_GRAPH_SCHEMA } },
            messages: [{ role: 'user', content: formatPrompt }],
        });

        const { concepts: rawConcepts } = getStructuredJson(formatResponse);
        const realUrlSet = new Set(realResults.map(r => r.url));

        const concepts = [];
        const resources = [];
        const seenConceptSlugs = new Map();
        const seenResourceSlugs = new Map();

        for (const concept of rawConcepts || []) {
            if (!concept?.title || !Array.isArray(concept.resources)) continue;

            // Never trust a URL that isn't one we actually harvested from the search tool
            const validResources = concept.resources.filter(r => r?.url && realUrlSet.has(r.url));
            if (validResources.length === 0) continue;

            const baseConceptSlug = slugify(concept.title);
            const conceptCount = seenConceptSlugs.get(baseConceptSlug) || 0;
            seenConceptSlugs.set(baseConceptSlug, conceptCount + 1);
            const conceptId = conceptCount === 0 ? baseConceptSlug : `${baseConceptSlug}-${conceptCount + 1}`;

            concepts.push({ conceptId, title: concept.title });

            for (const resource of validResources) {
                const existing = resources.find(r => r.url === resource.url);

                if (existing) {
                    if (!existing.conceptIds.includes(conceptId)) existing.conceptIds.push(conceptId);
                } else {
                    const baseResourceSlug = slugify(resource.title || 'resource');
                    const resourceCount = seenResourceSlugs.get(baseResourceSlug) || 0;
                    seenResourceSlugs.set(baseResourceSlug, resourceCount + 1);
                    const resourceId = resourceCount === 0 ? baseResourceSlug : `${baseResourceSlug}-${resourceCount + 1}`;

                    resources.push({
                        resourceId,
                        title: resource.title,
                        url: resource.url,
                        type: VALID_RESOURCE_TYPES.includes(resource.type) ? resource.type : 'website',
                        description: resource.description || '',
                        conceptIds: [conceptId],
                    });
                }
            }
        }

        if (concepts.length === 0 || resources.length === 0) {
            throw new Error('Could not find any verifiable related resources for this document');
        }

        return { concepts, resources };
    } catch (error) {
        rethrowFriendly(error, 'generate related resources');
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
        const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        });

        return getText(response);
    } catch (error) {
        console.error('Claude API error:', error);
        throw new Error('Failed to explain concept');
    }
};