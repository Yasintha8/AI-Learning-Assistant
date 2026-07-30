// Local file cache for AI provider responses. Purpose: during active development the same
// document/prompt gets re-run over and over (re-testing a feature, refreshing a page), which
// burns through a free/rate-limited API quota fast even though the answer never changes.
// Caching by (function name + exact args) sidesteps that without touching provider code.
//
// Disabled by default in production - features like "regenerate quiz" or "ask AI to explain
// again" are expected to return fresh output there, not a replay of the first call.
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CACHE_DIR = path.join(__dirname, '../../.cache/ai');
const cacheDir = process.env.AI_CACHE_DIR || DEFAULT_CACHE_DIR;

const isEnabled = () => {
    if (process.env.AI_CACHE_ENABLED === 'true') return true;
    if (process.env.AI_CACHE_ENABLED === 'false') return false;
    return process.env.NODE_ENV !== 'production';
};

const hashKey = (namespace, args) => {
    const raw = JSON.stringify({ namespace, args });
    return createHash('sha256').update(raw).digest('hex');
};

const readCache = (key) => {
    const file = path.join(cacheDir, `${key}.json`);
    if (!existsSync(file)) return undefined;

    try {
        const { value } = JSON.parse(readFileSync(file, 'utf-8'));
        return { value };
    } catch {
        return undefined;
    }
};

const writeCache = (key, value) => {
    try {
        if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
        writeFileSync(
            path.join(cacheDir, `${key}.json`),
            JSON.stringify({ cachedAt: new Date().toISOString(), value })
        );
    } catch (error) {
        console.warn('[ai-cache] write failed, continuing without cache:', error.message);
    }
};

/**
 * Runs fn() unless a prior call with the same (namespace, args) was already cached, in which
 * case the cached value is returned instead. Only successful results are cached - a thrown/
 * rejected fn() is never persisted.
 */
export const withCache = async (namespace, args, fn) => {
    if (!isEnabled()) return fn();

    const key = hashKey(namespace, args);
    const cached = readCache(key);
    if (cached !== undefined) {
        console.log(`[ai-cache] hit: ${namespace}`);
        return cached.value;
    }

    const result = await fn();
    writeCache(key, result);
    return result;
};
