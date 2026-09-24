import { BASE_URL } from './apiPaths';

/**
 * Resolves an avatar source into a fully qualified, secure URL or Base64 data string.
 * Handles:
 * - Data URLs (Base64)
 * - Blob URLs (local client-side previews)
 * - Absolute external URLs (e.g. Google OAuth avatars)
 * - Relative paths (prepends backend BASE_URL)
 * - Legacy localhost / 127.0.0.1 URLs previously saved in MongoDB
 * - Mixed content (upgrades http to https when on secure origins)
 *
 * @param {string|object} userOrUrl - User object or image string
 * @returns {string|null} Resolved avatar URL or null
 */
export const getAvatarUrl = (userOrUrl) => {
    if (!userOrUrl) return null;

    const img = typeof userOrUrl === 'string'
        ? userOrUrl
        : (userOrUrl.profileImage || userOrUrl.avatar);

    if (!img || typeof img !== 'string') return null;

    const trimmed = img.trim();
    if (!trimmed) return null;

    // Base64 data URL
    if (trimmed.startsWith('data:')) {
        return trimmed;
    }

    // Blob URL for local instant preview
    if (trimmed.startsWith('blob:')) {
        return trimmed;
    }

    // Fix legacy localhost / 127.0.0.1 stored in database from local dev
    if (
        trimmed.startsWith('http://localhost') ||
        trimmed.startsWith('https://localhost') ||
        trimmed.startsWith('http://127.0.0.1') ||
        trimmed.startsWith('https://127.0.0.1')
    ) {
        const cleanPath = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, '');
        if (BASE_URL && !BASE_URL.includes('localhost') && !BASE_URL.includes('127.0.0.1')) {
            return `${BASE_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
        }
        return trimmed;
    }

    // Absolute URLs (e.g. Google Auth avatar)
    if (trimmed.startsWith('https://')) {
        return trimmed;
    }

    if (trimmed.startsWith('http://')) {
        // Upgrade to https if the app is hosted on HTTPS to avoid Mixed Content errors
        if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
            return trimmed.replace(/^http:\/\//, 'https://');
        }
        return trimmed;
    }

    // Relative path (e.g., /uploads/avatars/...)
    return `${BASE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};
