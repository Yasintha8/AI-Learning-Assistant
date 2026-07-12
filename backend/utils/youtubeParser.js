import { fetchTranscript } from "youtube-transcript";

/**
 * Extract transcript text from a YouTube video URL
 * @param {string} url - YouTube video URL
 * @returns {Promise<{text: string}>}
 */
export const extractTextFromYouTube = async (url) => {
    let transcript;
    try {
        transcript = await fetchTranscript(url);
    } catch (error) {
        console.error("YouTube transcript error:", error);
        throw new Error("No transcript available for this video");
    }

    if (!transcript || transcript.length === 0) {
        throw new Error("No transcript available for this video");
    }

    const text = transcript.map((item) => item.text).join(" ");
    return { text };
};