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

// Client profiles for InnerTube API that bypass datacenter IP restrictions
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
 * Handles cloud/datacenter IP restrictions using multi-profile InnerTube API
 * with fallbacks to youtube-transcript and video metadata.
 * @param {string} url - YouTube video URL
 * @returns {Promise<{text: string, title: string}>}
 */
export const extractTextFromYouTube = async (url) => {
    const videoId = extractVideoId(url);
    if (!videoId) {
        throw new Error("Please provide a valid YouTube video URL");
    }

    let videoDetails = null;

    // Strategy 1: Multi-profile InnerTube API (works on cloud hosts like Render & AWS)
    for (const client of CLIENT_PROFILES) {
        try {
            const response = await fetch(
                "https://youtubei.googleapis.com/youtubei/v1/player?prettyPrint=false",
                {
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
                }
            );

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
                            title: videoDetails?.title || "YouTube Video",
                        };
                    }
                }
            }
        } catch (err) {
            console.warn(`InnerTube client ${client.name} error:`, err.message);
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
                    title: videoDetails?.title || "YouTube Video",
                };
            }
        }
    } catch (err) {
        console.warn("youtube-transcript fallback error:", err.message);
    }

    // Strategy 3: If no captions are available, check if video has a detailed description
    if (
        videoDetails &&
        videoDetails.shortDescription &&
        videoDetails.shortDescription.trim().length > 60
    ) {
        const text = `Video Title: ${videoDetails.title || "YouTube Video"}\nChannel: ${
            videoDetails.author || "Unknown"
        }\n\nVideo Overview & Description:\n${videoDetails.shortDescription.trim()}`;
        return {
            text,
            title: videoDetails.title || "YouTube Video",
            isDescriptionOnly: true,
        };
    }

    throw new Error(
        "No captions or subtitles are available for this YouTube video. Please choose a video with subtitles/captions enabled."
    );
};