// Provider-agnostic pieces shared between AI providers (Claude, Ollama, ...):
// constants, prompt text, JSON schemas, and response post-processing. Keeping
// this provider-agnostic means the same prompt/schema/validation logic is used
// no matter which model actually answers it.

export const VALID_STUDY_ACTIONS = ['reread-summary', 'redo-flashcards', 'retake-quiz', 'ask-ai-explain'];
export const VALID_RESOURCE_TYPES = ['article', 'video', 'course', 'paper', 'website'];
export const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

export const normalizeDifficulty = (d) => {
    const diff = (d || '').toString().trim().toLowerCase();
    return VALID_DIFFICULTIES.includes(diff) ? diff : 'medium';
};

// Convert a title into a URL/DB-safe slug, e.g. "Cell Structure" -> "cell-structure"
export const slugify = (title) => {
    return title
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'item';
};

// ---------------------------------------------------------------------------
// JSON Schemas (same shape works for Claude's output_config.format and
// Ollama's structured-output `format` field - both are plain JSON Schema)
// ---------------------------------------------------------------------------

export const FLASHCARD_SCHEMA = {
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

export const QUIZ_SCHEMA = {
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

export const TOPICS_SCHEMA = {
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

export const CLASSIFY_SCHEMA = {
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

export const WEAK_CONCEPTS_SCHEMA = {
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

export const RESOURCE_GRAPH_SCHEMA = {
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

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

export const buildFlashcardsPrompt = (text, count, topicTitles = []) => {
    const shouldTagTopics = topicTitles.length > 0;

    return `Generate exactly ${count} educational flashcards from the following text.

Each flashcard needs a clear, specific question, a concise and accurate answer, and a difficulty level (easy, medium, or hard).${shouldTagTopics ? `
Also tag each flashcard with the single best matching topic, copied exactly from this list: ${topicTitles.join(' | ')}
If none of them are relevant, set topicTitle to an empty string.` : `
Set topicTitle to an empty string for every flashcard - there is no topic list to match against.`}

Text:
${text.substring(0, 15000)}`;
};

export const buildQuizPrompt = (text, numQuestions, topicTitles = []) => {
    const shouldTagTopics = topicTitles.length > 0;

    return `Generate exactly ${numQuestions} multiple choice questions from the following text.

Each question needs exactly 4 options, a correctOption (the 1-based index of the correct option: 1, 2, 3, or 4), a brief explanation, and a difficulty level (easy, medium, or hard).${shouldTagTopics ? `
Also tag each question with the single best matching topic, copied exactly from this list: ${topicTitles.join(' | ')}
If none of them are relevant, set topicTitle to an empty string.` : `
Set topicTitle to an empty string for every question - there is no topic list to match against.`}

Text:
${text.substring(0, 15000)}`;
};

export const buildSummaryPrompt = (text) => `Provide a concise summary of the following text, highlighting the key concepts, main ideas, and important points.
Keep the summary clear and structured.

Text:
${text.substring(0, 20000)}`;

export const buildChatPrompt = (question, chunks) => {
    const context = chunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content}`).join('\n\n');

    return `Based on the following context from a document, analyze the context and answer the user's question.
If the answer is not in the context, say so.

Context:
${context}

Question: ${question}

Answer:`;
};

export const buildTopicsPrompt = (text) => `Analyze the following text and break it down into the main topics and subtopics a student would need to learn.

Rules:
- Produce between 3 and 10 top-level topics.
- Each topic may have 0 to 5 subtopics.

Text:
${text.substring(0, 15000)}`;

export const buildClassifyPrompt = (topicStats) => {
    const topicsList = topicStats.map(t => `- Title: "${t.title}"
  masteryScore: ${t.masteryScore}/100
  difficulty: ${t.difficulty}
  performanceSource: ${t.source || 'none yet'}
  lastReviewed: ${t.daysSinceReviewed === null ? 'never' : `${t.daysSinceReviewed} day(s) ago`}`).join('\n\n');

    return `You are analyzing a student's mastery of topics from a learning document, based on their real quiz and flashcard performance.

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
};

export const buildWeakConceptsPrompt = (wrongAnswers) => {
    const answersList = wrongAnswers.map((a, i) => `${i + 1}. Question: "${a.question}"
   Section: ${a.topicTitle || 'unknown'}
   Student answered: "${a.selectedAnswer}"
   Correct answer: "${a.correctAnswer}"
   Explanation: ${a.explanation || 'none provided'}`).join('\n\n');

    return `You are analyzing a student's incorrect quiz answers on a learning document to find their underlying weak areas.

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
};

export const buildExplainPrompt = (concept, context) => `Explain the concept of "${concept}" based on the following context.
Provide a clear, educational explanation that's easy to understand.
Include examples if relevant.

Context:
${context.substring(0, 10000)}`;

// Second-pass prompt for the resource mesh: takes research notes plus a list of real,
// already-verified URLs and asks the model to organize them into the RESOURCE_GRAPH_SCHEMA
// shape, copying URLs verbatim rather than inventing new ones.
export const buildResourceFormatPrompt = (researchNotes, realResultsList) => `Below are research notes about a topic, followed by a numbered list of real URLs found via web search.

Organize the material into 4 to 8 distinct key concepts, each with 2 to 3 learning resources. For every resource you include, copy its URL exactly, character-for-character, from the numbered list below - never invent or modify a URL. Only use resources that appear in the numbered list.

Research notes:
${researchNotes.substring(0, 12000)}

Real URLs found:
${realResultsList}`;

export const buildResourceResearchPrompt = (text) => `I am studying the topic below and want to find real, currently available external learning resources (articles, videos, courses, papers) about its key concepts. Search the web for real resources - cover 4 to 8 distinct key concepts from the text, with 2 to 3 resources per concept. For each resource, note its title, the resource type (article, video, course, paper, or website), and a one-sentence description.

Topic text:
${text.substring(0, 8000)}`;

// Used by providers with no built-in web-search tool (e.g. Ollama): asks the model to name
// the key concepts and turn each into a short, effective search-engine query, so an external
// search API can be called per concept instead.
export const CONCEPT_QUERIES_SCHEMA = {
    type: 'object',
    properties: {
        queries: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    concept: { type: 'string' },
                    searchQuery: { type: 'string' }
                },
                required: ['concept', 'searchQuery'],
                additionalProperties: false
            }
        }
    },
    required: ['queries'],
    additionalProperties: false
};

export const buildConceptQueriesPrompt = (text) => `Identify 4 to 8 distinct key concepts a student should find more learning resources for, based on the text below. For each concept, write a short, effective web search query (as you'd type into a search engine) to find real articles, videos, or courses about it.

Text:
${text.substring(0, 8000)}`;

// ---------------------------------------------------------------------------
// Response post-processing (validates/normalizes whatever JSON the model returned)
// ---------------------------------------------------------------------------

export const processFlashcards = (flashcards, count) => {
    return (flashcards || [])
        .filter(card => card && card.question && card.answer)
        .slice(0, count)
        .map(card => ({
            question: card.question,
            answer: card.answer,
            difficulty: normalizeDifficulty(card.difficulty),
            topicTitle: card.topicTitle || null,
        }));
};

export const processQuiz = (questions, numQuestions) => {
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
};

export const processTopics = (topics) => {
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
};

export const processClassifications = (classifications) => {
    return (classifications || [])
        .filter(item => item && item.title)
        .map(item => ({
            title: String(item.title).trim(),
            knowledgeLevel: item.knowledgeLevel || null,
            levelReason: typeof item.levelReason === 'string' ? item.levelReason.trim().slice(0, 300) : '',
            action: VALID_STUDY_ACTIONS.includes(item.action) ? item.action : null,
            actionReason: typeof item.actionReason === 'string' ? item.actionReason.trim().slice(0, 300) : '',
        }));
};

export const processWeakConcepts = (concepts) => {
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
};

// Builds the final { concepts, resources } graph from the model's raw concept list, keeping
// only resources whose URL was actually harvested by a real search (realResults) - never
// trust a URL the model didn't copy verbatim from the search results.
export const processResourceGraph = (rawConcepts, realResults) => {
    const realUrlSet = new Set(realResults.map(r => r.url));

    const concepts = [];
    const resources = [];
    const seenConceptSlugs = new Map();
    const seenResourceSlugs = new Map();

    for (const concept of rawConcepts || []) {
        if (!concept?.title || !Array.isArray(concept.resources)) continue;

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
};
