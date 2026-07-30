import * as shared from '../shared.js';

const BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
const MODEL = process.env.OLLAMA_MODEL || 'llama3.1';

// Calls Ollama's /api/chat. Pass `schema` (a plain JSON Schema, same shape used for Claude's
// structured outputs) to get grammar-constrained JSON back; omit it for free-form text.
const chat = async ({ prompt, schema, maxTokens }) => {
    let response;
    try {
        response = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                ...(schema ? { format: schema } : {}),
                options: { num_predict: maxTokens },
            }),
        });
    } catch (error) {
        throw new Error(
            `Could not reach Ollama at ${BASE_URL}. Is it running? Start it with "ollama serve" ` +
            `and make sure the model is pulled ("ollama pull ${MODEL}"). (${error.message})`
        );
    }

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        if (response.status === 404 && /not found/i.test(body)) {
            throw new Error(`Ollama model "${MODEL}" is not pulled yet. Run: ollama pull ${MODEL}`);
        }
        throw new Error(`Ollama request failed (${response.status}): ${body || response.statusText}`);
    }

    const data = await response.json();
    const content = data?.message?.content ?? '';
    if (!content) throw new Error('Ollama returned an empty response');
    return content;
};

const chatJson = async (args) => {
    const content = await chat(args);
    try {
        return JSON.parse(content);
    } catch (error) {
        throw new Error(`Ollama returned invalid JSON for a structured request: ${error.message}`);
    }
};

export const generateFlashcards = async (text, count = 10, topicTitles = []) => {
    const { flashcards } = await chatJson({
        prompt: shared.buildFlashcardsPrompt(text, count, topicTitles),
        schema: shared.FLASHCARD_SCHEMA,
        maxTokens: 4096,
    });
    return shared.processFlashcards(flashcards, count);
};

export const generateQuiz = async (text, numQuestions = 5, topicTitles = []) => {
    const { questions } = await chatJson({
        prompt: shared.buildQuizPrompt(text, numQuestions, topicTitles),
        schema: shared.QUIZ_SCHEMA,
        maxTokens: 4096,
    });
    return shared.processQuiz(questions, numQuestions);
};

export const generateSummary = async (text) => {
    return chat({ prompt: shared.buildSummaryPrompt(text), maxTokens: 2048 });
};

export const chatWithContext = async (question, chunks) => {
    return chat({ prompt: shared.buildChatPrompt(question, chunks), maxTokens: 2048 });
};

export const generateTopics = async (text) => {
    const { topics } = await chatJson({
        prompt: shared.buildTopicsPrompt(text),
        schema: shared.TOPICS_SCHEMA,
        maxTokens: 4096,
    });
    return shared.processTopics(topics);
};

export const classifyTopicKnowledge = async (topicStats) => {
    const { classifications } = await chatJson({
        prompt: shared.buildClassifyPrompt(topicStats),
        schema: shared.CLASSIFY_SCHEMA,
        maxTokens: 8192,
    });
    return shared.processClassifications(classifications);
};

export const identifyWeakConcepts = async (wrongAnswers) => {
    if (!Array.isArray(wrongAnswers) || wrongAnswers.length === 0) {
        return [];
    }

    const { concepts } = await chatJson({
        prompt: shared.buildWeakConceptsPrompt(wrongAnswers),
        schema: shared.WEAK_CONCEPTS_SCHEMA,
        maxTokens: 4096,
    });
    return shared.processWeakConcepts(concepts);
};

export const explainConcept = async (concept, context) => {
    return chat({ prompt: shared.buildExplainPrompt(concept, context), maxTokens: 2048 });
};

/**
 * Generate a mesh of AI-suggested related resources, same output shape as the Claude
 * provider. Ollama has no built-in web-search tool, so this replaces Claude's single
 * "research with web_search" call with: (1) ask the local model to turn the document into
 * a handful of concept + search-query pairs, (2) run each query through an external search
 * API (utils/ai/search/tavily.js) to get real URLs, (3) ask the local model to organize the
 * real results into the same RESOURCE_GRAPH_SCHEMA shape, copying URLs verbatim.
 */
export const generateRelatedResources = async (text) => {
    const { webSearch } = await import('../search/tavily.js');

    const { queries } = await chatJson({
        prompt: shared.buildConceptQueriesPrompt(text),
        schema: shared.CONCEPT_QUERIES_SCHEMA,
        maxTokens: 1024,
    });

    if (!Array.isArray(queries) || queries.length === 0) {
        throw new Error('Could not identify any concepts to search for in this document');
    }

    const realResults = [];
    const notesParts = [];

    for (const q of queries) {
        if (!q?.searchQuery) continue;

        let results;
        try {
            results = await webSearch(q.searchQuery, { maxResults: 3 });
        } catch (error) {
            console.error(`Web search failed for "${q.searchQuery}":`, error.message);
            continue;
        }

        if (!results.length) continue;

        results.forEach(r => { if (r.url) realResults.push({ url: r.url, title: r.title || '' }); });
        notesParts.push(
            `Concept: ${q.concept}\n` +
            results.map(r => `- ${r.title || '(untitled)'} (${r.url}): ${r.content || ''}`).join('\n')
        );
    }

    if (realResults.length === 0) {
        throw new Error('Failed to generate related resources. Web search returned no results.');
    }

    const researchNotes = notesParts.join('\n\n');
    const realResultsList = realResults
        .map((r, i) => `${i + 1}. ${r.title || '(untitled)'} - ${r.url}`)
        .join('\n');

    const { concepts: rawConcepts } = await chatJson({
        prompt: shared.buildResourceFormatPrompt(researchNotes, realResultsList),
        schema: shared.RESOURCE_GRAPH_SCHEMA,
        maxTokens: 4096,
    });

    return shared.processResourceGraph(rawConcepts, realResults);
};
