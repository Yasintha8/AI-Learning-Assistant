// Thin wrapper around Tavily's search API (https://tavily.com) - used as a stand-in for
// Claude's built-in web_search tool when running the Ollama provider, which has no web
// access of its own. Tavily has a free tier (1,000 searches/month) and returns clean
// title/url/content results that are easy to feed back into a model.
const API_URL = 'https://api.tavily.com/search';

export const webSearch = async (query, { maxResults = 3 } = {}) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        throw new Error(
            'TAVILY_API_KEY is not set. Get a free key at https://app.tavily.com and add it to your .env ' +
            'to enable the related-resources feature under AI_PROVIDER=ollama.'
        );
    }

    let response;
    try {
        response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: apiKey,
                query,
                max_results: maxResults,
                search_depth: 'basic',
                include_answer: false,
            }),
        });
    } catch (error) {
        throw new Error(`Could not reach Tavily search API: ${error.message}`);
    }

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Tavily search failed (${response.status}): ${body || response.statusText}`);
    }

    const data = await response.json();
    return (data.results || []).map(r => ({
        title: r.title || '',
        url: r.url,
        content: r.content || '',
    }));
};
