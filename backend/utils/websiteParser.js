import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

/**
 * Extract readable article text from a website URL
 * @param {string} url - Website URL
 * @returns {Promise<{text: string, title: string}>}
 */
export const extractTextFromWebsite = async (url) => {
    let response;
    try {
        response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; AI-Learning-Assistant/1.0)" },
            signal: AbortSignal.timeout(6000),
        });
    } catch (error) {
        console.error("Website fetch error:", error);
        throw new Error("Failed to fetch the website");
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch the website (status ${response.status})`);
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();

    if (!article || !article.textContent || !article.textContent.trim()) {
        throw new Error("Could not extract readable content from this page");
    }

    return { text: article.textContent.trim(), title: article.title || "" };
};