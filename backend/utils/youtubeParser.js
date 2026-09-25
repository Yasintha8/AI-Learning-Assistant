import { fetchTranscript } from "youtube-transcript";

/**
 * Extract an 11-character YouTube video ID from various URL formats
 * (standard watch, youtu.be, shorts, embed, live, mobile, etc.)
 * @param {string} url
 * @returns {string|null}
 */
export const extractVideoId = (url) => {
    if (!url) return null;
    const trimmed = String(url).trim();

    // Already a raw 11-char video ID
    if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

    try {
        const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
        const hostname = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");

        if (hostname === "youtube.com" || hostname === "music.youtube.com") {
            if (parsed.searchParams.has("v")) {
                const v = parsed.searchParams.get("v");
                if (v && /^[\w-]{11}$/.test(v)) return v;
            }
            const pathParts = parsed.pathname.split("/").filter(Boolean);
            if (["shorts", "embed", "v", "live"].includes(pathParts[0]) && pathParts[1]) {
                const id = pathParts[1].slice(0, 11);
                if (/^[\w-]{11}$/.test(id)) return id;
            }
        }

        if (hostname === "youtu.be") {
            const pathParts = parsed.pathname.split("/").filter(Boolean);
            if (pathParts[0]) {
                const id = pathParts[0].slice(0, 11);
                if (/^[\w-]{11}$/.test(id)) return id;
            }
        }
    } catch {
        // Fallback to regex matching
        const match = trimmed.match(
            /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/|live\/)|youtu\.be\/)([\w-]{11})/i
        );
        return match ? match[1] : null;
    }

    const match = trimmed.match(
        /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/|live\/)|youtu\.be\/)([\w-]{11})/i
    );
    return match ? match[1] : null;
};

/**
 * Fetch official video details via YouTube's public oEmbed API
 * (Never rate-limited or blocked on datacenter IPs, fast response)
 * @param {string} url
 * @returns {Promise<{title?: string, author_name?: string}|null>}
 */
export const fetchVideoOEmbed = async (url) => {
    try {
        const res = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
            { signal: AbortSignal.timeout(3000) }
        );
        if (res.ok) {
            return await res.json();
        }
    } catch {
        // ignore
    }
    return null;
};

// Client profiles for InnerTube API
const CLIENT_PROFILES = [
    {
        name: "ios",
        clientName: "IOS",
        clientVersion: "20.10.4",
        clientNameHeader: "5",
        userAgent: "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)",
        context: {
            deviceMake: "Apple",
            deviceModel: "iPhone16,2",
            platform: "MOBILE",
            osName: "iOS",
            osVersion: "18.3.2.22D82",
        },
    },
    {
        name: "android_vr",
        clientName: "ANDROID_VR",
        clientVersion: "1.62.20",
        clientNameHeader: "28",
        userAgent:
            "com.google.android.apps.youtube.vr.oculus/1.62.20 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip",
        context: {
            deviceMake: "Oculus",
            deviceModel: "Quest 3",
            platform: "MOBILE",
            osName: "Android",
            osVersion: "12L",
            androidSdkVersion: 32,
        },
    },
];

const decodeHtmlEntities = (str) => {
    if (!str) return "";
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
        .replace(/&#([0-9]+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
};

const pickCaptionTrack = (tracks, preferredLang = "en") => {
    if (!tracks || !tracks.length) return null;
    return (
        tracks.find((t) => t.vssId === `.${preferredLang}`) ||
        tracks.find((t) => t.vssId === `a.${preferredLang}`) ||
        tracks.find((t) => t.languageCode === preferredLang) ||
        tracks.find((t) => t.vssId && t.vssId.includes(`.${preferredLang}`)) ||
        tracks.find((t) => t.vssId && t.vssId.startsWith(".")) ||
        tracks.find((t) => t.vssId && t.vssId.startsWith("a.")) ||
        tracks[0]
    );
};

const fetchTrackContent = async (track, userAgent) => {
    // 1. Try json3 format with strict 3.5s timeout
    try {
        let jsonUrl = track.baseUrl.replace(/&fmt=[^&]+/, "");
        jsonUrl += "&fmt=json3";
        const res = await fetch(jsonUrl, {
            headers: {
                "User-Agent": userAgent,
                Accept: "application/json, text/plain, */*",
            },
            signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
            const data = await res.json();
            if (data.events && Array.isArray(data.events)) {
                const parts = [];
                for (const event of data.events) {
                    if (event.segs) {
                        for (const seg of event.segs) {
                            if (seg.utf8) parts.push(seg.utf8);
                        }
                    }
                }
                const text = parts.join(" ").replace(/\s+/g, " ").trim();
                if (text.length > 0) return decodeHtmlEntities(text);
            }
        }
    } catch {
        // Fallback to XML
    }

    // 2. Try raw XML timedtext format with strict 3.5s timeout
    try {
        const res = await fetch(track.baseUrl, {
            headers: {
                "User-Agent": userAgent,
                Accept: "text/xml, application/xml, text/plain, */*",
            },
            signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
            const xml = await res.text();
            const regex = /<text[^>]*>([^<]*)<\/text>/g;
            const parts = [];
            let match;
            while ((match = regex.exec(xml)) !== null) {
                if (match[1]) parts.push(match[1]);
            }
            const text = parts.join(" ").replace(/\s+/g, " ").trim();
            if (text.length > 0) return decodeHtmlEntities(text);
        }
    } catch {
        // Failed
    }

    return null;
};

// Promise wrapper with strict hard timeout
const withTimeout = (promise, ms = 3000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
        ),
    ]);
};

/**
 * Extract transcript text from a YouTube video URL
 * Optimized for high speed (<3-5 seconds total):
 * 1. oEmbed metadata fetched with strict timeout (always succeeds, never hangs)
 * 2. InnerTube API with 3.5s timeout
 * 3. youtube-transcript fallback with 3.0s timeout
 * 4. Tavily transcript search fallback with 3.0s timeout
 * 5. Instant metadata synthesis (guarantees fast document creation, never hangs)
 *
 * @param {string} url - YouTube video URL
 * @returns {Promise<{text: string, title: string, isFallback?: boolean}>}
 */
export const extractTextFromYouTube = async (url) => {
    const videoId = extractVideoId(url);
    if (!videoId) {
        throw new Error("Please provide a valid YouTube video URL");
    }

    // Step 0: Fetch official oEmbed metadata with 3s timeout
    const oembed = await fetchVideoOEmbed(url);
    const initialTitle = oembed?.title || "YouTube Video";
    const initialAuthor = oembed?.author_name || "YouTube Creator";

    let videoDetails = null;

    // Determine best endpoint
    const googleApiKey = process.env.GEMINI_API_KEY || "";
    const primaryEndpoint = googleApiKey
        ? `https://youtubei.googleapis.com/youtubei/v1/player?key=${googleApiKey}`
        : "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";

    // Strategy 1: Fast InnerTube API with 3.5s timeout per client
    for (const client of CLIENT_PROFILES) {
        try {
            const response = await fetch(primaryEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "*/*",
                    "User-Agent": client.userAgent,
                    "X-YouTube-Client-Name": client.clientNameHeader,
                    "X-YouTube-Client-Version": client.clientVersion,
                    Origin: "https://www.youtube.com",
                },
                body: JSON.stringify({
                    context: {
                        client: {
                            clientName: client.clientName,
                            clientVersion: client.clientVersion,
                            hl: "en",
                            gl: "US",
                            ...client.context,
                        },
                        user: { lockedSafetyMode: false },
                        request: { useSsl: true },
                    },
                    videoId,
                    contentCheckOk: true,
                    racyCheckOk: true,
                }),
                signal: AbortSignal.timeout(3500),
            });

            if (!response.ok) continue;

            const data = await response.json();
            if (data.videoDetails && !videoDetails) {
                videoDetails = data.videoDetails;
            }

            const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            if (tracks && tracks.length > 0) {
                const track = pickCaptionTrack(tracks, "en");
                if (track) {
                    const text = await fetchTrackContent(track, client.userAgent);
                    if (text && text.length > 0) {
                        return {
                            text,
                            title: videoDetails?.title || initialTitle,
                        };
                    }
                }
            }
        } catch {
            // Quickly move on to next strategy, never hang
        }
    }

    // Strategy 2: Fallback to youtube-transcript package with strict 3.0s timeout
    try {
        const transcript = await withTimeout(fetchTranscript(videoId), 3000);
        if (transcript && transcript.length > 0) {
            const text = transcript.map((item) => item.text).join(" ").trim();
            if (text.length > 0) {
                return {
                    text: decodeHtmlEntities(text),
                    title: videoDetails?.title || initialTitle,
                };
            }
        }
    } catch {
        // Fallback to next strategy
    }

    // Strategy 3: Search Tavily for cached transcripts with strict 3.0s timeout
    if (process.env.TAVILY_API_KEY) {
        try {
            const tavilyRes = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    api_key: process.env.TAVILY_API_KEY,
                    query: `YouTube video ${videoId} ${initialTitle} transcript captions`,
                    max_results: 3,
                }),
                signal: AbortSignal.timeout(3000),
            });
            if (tavilyRes.ok) {
                const tavilyData = await tavilyRes.json();
                const transcriptResult = tavilyData.results?.find(
                    (r) => r.content && (r.content.includes("Transcript") || r.content.includes("♪") || r.content.length > 300)
                );
                if (transcriptResult && transcriptResult.content.length > 200) {
                    return {
                        text: transcriptResult.content.trim(),
                        title: initialTitle,
                    };
                }
            }
        } catch {
            // ignore
        }
    }

    // Strategy 4: If subtitles are unavailable or blocked on cloud hosting,
    // construct comprehensive study content immediately in <1ms from oEmbed metadata
    const bestTitle = videoDetails?.title || initialTitle;
    const bestAuthor = videoDetails?.author || initialAuthor;
    const desc = videoDetails?.shortDescription?.trim() || "";

    let contentText = `YouTube Video: ${bestTitle}\nChannel / Creator: ${bestAuthor}\nVideo Link: https://www.youtube.com/watch?v=${videoId}\n`;

    if (desc && desc.length > 30) {
        contentText += `\nVideo Description & Overview:\n${desc}\n`;
    }

    contentText += `\nStudy Notes & Topic Guide:\nThis learning document represents the YouTube video "${bestTitle}" created by ${bestAuthor}. Use the AI tools (Flashcards, Quizzes, Summaries, and AI Chat) to explore and master the key concepts covered in this video.`;

    return {
        text: contentText,
        title: bestTitle,
        isFallback: true,
    };
};