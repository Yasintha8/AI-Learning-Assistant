export const BASE_URL =
    import.meta.env.DEV
        ? (import.meta.env.VITE_DEV_API_URL || (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes("onrender.com") ? import.meta.env.VITE_API_URL : "http://localhost:8000"))
        : (import.meta.env.VITE_API_URL || "https://ai-learning-assistant-zwr9.onrender.com");

export const API_PATHS = {
    AUTH: {
        REGISTER: "/api/auth/register",
        LOGIN: "/api/auth/login",
        GOOGLE: "/api/auth/google",
        GET_PROFILE: "/api/auth/profile",
        UPDATE_PROFILE: "/api/auth/profile",
        UPLOAD_AVATAR: "/api/auth/avatar",
        CHANGE_PASSWORD: "/api/auth/change-password",
    },

    DOCUMENTS: {
        UPLOAD: "/api/documents/upload",
        UPLOAD_URL: "/api/documents/upload-url",
        GET_DOCUMENTS: "/api/documents",
        GET_DOCUMENT_BY_ID: (id) => `/api/documents/${id}`,
        UPDATE_DOCUMENT: (id) => `/api/documents/${id}`,
        DELETE_DOCUMENT: (id) => `/api/documents/${id}`,
    },

    AI: {
        GENERATE_FLASHCARDS: "/api/ai/generate-flashcards",
        GENERATE_QUIZ: "/api/ai/generate-quiz",
        GENERATE_SUMMARY: "/api/ai/generate-summary",
        CHAT: "/api/ai/chat",
        EXPLAIN_CONCEPT: "/api/ai/explain-concept",
        GET_CHAT_HISTORY: (documentId) => `/api/ai/chat-history/${documentId}`,
    },

    FLASHCARDS: {
        GET_ALL_FLASHCARD_SETS: "/api/flashcards",
        GET_FLASHCARDS_FOR_DOC: (documentId) => `/api/flashcards/${documentId}`,
        REVIEW_FLASHCARD: (cardId) => `/api/flashcards/${cardId}/review`,
        TOGGLE_STAR: (cardId) => `/api/flashcards/${cardId}/star`,
        DELETE_FLASHCARD_SET: (id) => `/api/flashcards/${id}`,
    },

    QUIZZES: {
        GET_QUIZZES_FOR_DOC: (documentId) => `/api/quizzes/${documentId}`,
        GET_QUIZ_BY_ID: (id) => `/api/quizzes/quiz/${id}`,
        SUBMIT_QUIZ: (id) => `/api/quizzes/${id}/submit`,
        GET_QUIZ_RESULTS: (id) => `/api/quizzes/${id}/results`,
        DELETE_QUIZ: (id) => `/api/quizzes/${id}`,
    },

    PROGRESS: {
        GET_DASHBOARD: "/api/progress/dashboard",
    },

    LEARNING_PATH: {
        GENERATE: "/api/learning-path/generate",
        UPDATE: "/api/learning-path/update",
        STUDY_PLAN: "/api/learning-path/study-plan",
        GET_FOR_USER: (userId) => `/api/learning-path/${userId}`,
        WEAK_AREAS_STATUS: (documentId) => `/api/learning-path/weak-areas-status/${documentId}`,
    },

    SEARCH: {
        GLOBAL: "/api/search",
    },

    RESOURCES: {
        GENERATE: "/api/resources/generate",
        GET_FOR_DOC: (documentId) => `/api/resources/${documentId}`,
    },

    NOTIFICATIONS: {
        GET_ALL: "/api/notifications",
    },

    CAREER: {
        SAVE_PROFILE: "/api/career/profile",
        GET_DATA: "/api/career/data",
        UPDATE_MILESTONE: "/api/career/milestone",
        CHAT: "/api/career/chat",
    },
};