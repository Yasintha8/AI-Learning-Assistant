// Provider-agnostic AI entry point. Every controller should import from here (never
// reach into utils/ai/providers/* directly) so switching providers is a single env var.
//
// AI_PROVIDER=claude (default) - Anthropic Claude, requires ANTHROPIC_API_KEY
// AI_PROVIDER=ollama           - local model via Ollama, no API key/rate limits

const providerName = (process.env.AI_PROVIDER || 'claude').toLowerCase();

const loadProvider = () => {
    if (providerName === 'ollama') return import('./providers/ollamaProvider.js');
    return import('./providers/claudeProvider.js');
};

// Resolved once at process start - restart the server after changing AI_PROVIDER.
const provider = await loadProvider();

export const generateFlashcards = (...args) => provider.generateFlashcards(...args);
export const generateQuiz = (...args) => provider.generateQuiz(...args);
export const generateSummary = (...args) => provider.generateSummary(...args);
export const chatWithContext = (...args) => provider.chatWithContext(...args);
export const generateTopics = (...args) => provider.generateTopics(...args);
export const classifyTopicKnowledge = (...args) => provider.classifyTopicKnowledge(...args);
export const identifyWeakConcepts = (...args) => provider.identifyWeakConcepts(...args);
export const generateRelatedResources = (...args) => provider.generateRelatedResources(...args);
export const explainConcept = (...args) => provider.explainConcept(...args);
