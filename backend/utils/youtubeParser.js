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
 * (Never rate-limited or blocked on datacenter IPs)
 * @param {string} url
 * @returns {Promise<{title?: string, author_name?: string}|null>}
 */
export const fetchVideoOEmbed = async (url) => {
    try {
        const res = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
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
    {
        name: "mweb",
        clientName: "MWEB",
        clientVersion: "2.20251209.01.00",
        clientNameHeader: "2",
        userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
        context: {
            platform: "MOBILE",
            osName: "iOS",
            osVersion: "17.5.1",
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
    // 1. Try json3 format
    try {
        let jsonUrl = track.baseUrl.replace(/&fmt=[^&]+/, "");
        jsonUrl += "&fmt=json3";
        const res = await fetch(jsonUrl, {
            headers: {
                "User-Agent": userAgent,
                Accept: "application/json, text/plain, */*",
            },
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

    // 2. Try raw XML timedtext format
    try {
        const res = await fetch(track.baseUrl, {
            headers: {
                "User-Agent": userAgent,
                Accept: "text/xml, application/xml, text/plain, */*",
            },
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

/**
 * Extract transcript text from a YouTube video URL
 * Multi-layer pipeline:
 * 1. InnerTube API across multiple endpoints (including authenticated Google API gateway)
 * 2. youtube-transcript package fallback
 * 3. Tavily AI transcript search fallback (if TAVILY_API_KEY is available)
 * 4. Graceful oEmbed metadata synthesis (ensures document creation never fails with 400)
 *
 * @param {string} url - YouTube video URL
 * @returns {Promise<{text: string, title: string, isFallback?: boolean}>}
 */
export const extractTextFromYouTube = async (url) => {
    const videoId = extractVideoId(url);
    if (!videoId) {
        throw new Error("Please provide a valid YouTube video URL");
    }

    // Step 0: Fetch official oEmbed metadata first (always succeeds, even on cloud hosts)
    const oembed = await fetchVideoOEmbed(url);
    const initialTitle = oembed?.title || "YouTube Video";
    const initialAuthor = oembed?.author_name || "YouTube Creator";

    let videoDetails = null;

    // Build endpoints to try (authenticated with GEMINI_API_KEY if present, then standard endpoints)
    const googleApiKey = process.env.GEMINI_API_KEY || "";
    const playerEndpoints = [];
    if (googleApiKey) {
        playerEndpoints.push(`https://youtubei.googleapis.com/youtubei/v1/player?key=${googleApiKey}`);
    }
    playerEndpoints.push("https://www.youtube.com/youtubei/v1/player?prettyPrint=false");
    playerEndpoints.push("https://youtubei.googleapis.com/youtubei/v1/player?prettyPrint=false");

    // Strategy 1: Multi-profile InnerTube API
    for (const endpoint of playerEndpoints) {
        for (const client of CLIENT_PROFILES) {
            try {
                const response = await fetch(endpoint, {
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
            } catch (err) {
                // Try next client/endpoint
            }
        }
    }

    // Strategy 2: Fallback to youtube-transcript package
    try {
        const transcript = await fetchTranscript(videoId);
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

    // Strategy 3: Search Tavily for cached transcripts (if TAVILY_API_KEY is available)
    if (process.env.TAVILY_API_KEY) {
        try {
            const tavilyRes = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    api_key: process.env.TAVILY_API_KEY,
                    query: `YouTube video ${videoId} ${initialTitle} transcript captions`,
                    max_results: 5,
                }),
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

    // Strategy 4: If subtitles/captions are unavailable or blocked on cloud hosting,
    // construct comprehensive study content from video metadata and description so document creation NEVER fails!
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