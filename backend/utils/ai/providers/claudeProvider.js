import Anthropic from '@anthropic-ai/sdk';
import * as shared from '../shared.js';

const MODEL = 'claude-sonnet-5';

// Lazily constructed so importing this module doesn't require ANTHROPIC_API_KEY to be set -
// only actually calling one of these functions while AI_PROVIDER=claude does.
let client = null;
const getClient = () => {
    if (client) return client;

    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not set. Set it in your .env, or set AI_PROVIDER=ollama to use a local model instead.');
    }

    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return client;
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

export const generateFlashcards = async (text, count = 10, topicTitles = []) => {
    const prompt = shared.buildFlashcardsPrompt(text, count, topicTitles);

    try {
        const response = await getClient().messages.create({
            model: MODEL,
            max_tokens: 4096,
            output_config: { format: { type: 'json_schema', schema: shared.FLASHCARD_SCHEMA } },
            messages: [{ role: 'user', content: prompt }],
        });

        const { flashcards } = getStructuredJson(response);
        return shared.processFlashcards(flashcards, count);
    } catch (error) {
        rethrowFriendly(error, 'generate flashcards');
    }
};

export const generateQuiz = async (text, numQuestions = 5, topicTitles = []) => {
    const prompt = shared.buildQuizPrompt(text, numQuestions, topicTitles);

    try {
        const response = await getClient().messages.create({
            model: MODEL,
            max_tokens: 4096,
            output_config: { format: { type: 'json_schema', schema: shared.QUIZ_SCHEMA } },
            messages: [{ role: 'user', content: prompt }],
        });

        const { questions } = getStructuredJson(response);
        return shared.processQuiz(questions, numQuestions);
    } catch (error) {
        rethrowFriendly(error, 'generate quiz');
    }
};

export const generateSummary = async (text) => {
    const prompt = shared.buildSummaryPrompt(text);

    try {
        const response = await getClient().messages.create({
            model: MODEL,
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        });

        return getText(response);
    } catch (error) {
        rethrowFriendly(error, 'generate summary');
    }
};

export const chatWithContext = async (question, chunks) => {
    const prompt = shared.buildChatPrompt(question, chunks);

    try {
        const response = await getClient().messages.create({
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

export const generateTopics = async (text) => {
    const prompt = shared.buildTopicsPrompt(text);

    try {
        const response = await getClient().messages.create({
            model: MODEL,
            max_tokens: 4096,
            output_config: { format: { type: 'json_schema', schema: shared.TOPICS_SCHEMA } },
            messages: [{ role: 'user', content: prompt }],
        });

        const { topics } = getStructuredJson(response);
        return shared.processTopics(topics);
    } catch (error) {
        rethrowFriendly(error, 'generate topics from document');
    }
};

/**
 * Classify each topic's knowledge level and recommend a next study action, based on the
 * user's actual quiz/flashcard performance. Grounded on masteryScore bands (<40 beginner,
 * 40-74 intermediate, >=75 proficient) so Claude's labels stay consistent with the numeric
 * mastery system - it may only nudge one band based on other signals (recency, engagement).
 */
export const classifyTopicKnowledge = async (topicStats) => {
    const prompt = shared.buildClassifyPrompt(topicStats);

    try {
        const response = await getClient().messages.create({
            model: MODEL,
            max_tokens: 8192,
            output_config: { format: { type: 'json_schema', schema: shared.CLASSIFY_SCHEMA } },
            messages: [{ role: 'user', content: prompt }],
        });

        const { classifications } = getStructuredJson(response);
        return shared.processClassifications(classifications);
    } catch (error) {
        rethrowFriendly(error, 'classify topic knowledge');
    }
};

/**
 * Cluster a user's incorrect quiz answers into a small number of named weak concepts, each
 * with a recommended next study action.
 */
export const identifyWeakConcepts = async (wrongAnswers) => {
    if (!Array.isArray(wrongAnswers) || wrongAnswers.length === 0) {
        return [];
    }

    const prompt = shared.buildWeakConceptsPrompt(wrongAnswers);

    try {
        const response = await getClient().messages.create({
            model: MODEL,
            max_tokens: 4096,
            output_config: { format: { type: 'json_schema', schema: shared.WEAK_CONCEPTS_SCHEMA } },
            messages: [{ role: 'user', content: prompt }],
        });

        const { concepts } = getStructuredJson(response);
        return shared.processWeakConcepts(concepts);
    } catch (error) {
        rethrowFriendly(error, 'identify weak concepts');
    }
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
 */
export const generateRelatedResources = async (text) => {
    const researchPrompt = shared.buildResourceResearchPrompt(text);

    try {
        const researchResponse = await getClient().messages.create({
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

        const formatPrompt = shared.buildResourceFormatPrompt(researchNotes, realResultsList);

        const formatResponse = await getClient().messages.create({
            model: MODEL,
            max_tokens: 4096,
            output_config: { format: { type: 'json_schema', schema: shared.RESOURCE_GRAPH_SCHEMA } },
            messages: [{ role: 'user', content: formatPrompt }],
        });

        const { concepts: rawConcepts } = getStructuredJson(formatResponse);
        return shared.processResourceGraph(rawConcepts, realResults);
    } catch (error) {
        rethrowFriendly(error, 'generate related resources');
    }
};

export const explainConcept = async (concept, context) => {
    const prompt = shared.buildExplainPrompt(concept, context);

    try {
        const response = await getClient().messages.create({
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
