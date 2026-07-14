import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const generateLearningPath = async (documentId) => {
    try {
        const response = await axiosInstance.post(API_PATHS.LEARNING_PATH.GENERATE, { documentId });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to generate learning path' };
    }
};

const updateLearningPath = async (documentId) => {
    try {
        const response = await axiosInstance.post(API_PATHS.LEARNING_PATH.UPDATE, { documentId });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to update learning path' };
    }
};

const getLearningPathForDocument = async (userId, documentId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.LEARNING_PATH.GET_FOR_USER(userId), {
            params: { documentId },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch learning path' };
    }
};

const getStudyPlan = async (documentId, force = false) => {
    try {
        const response = await axiosInstance.post(API_PATHS.LEARNING_PATH.STUDY_PLAN, { documentId, force });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch study plan' };
    }
};

const getAllLearningPaths = async (userId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.LEARNING_PATH.GET_FOR_USER(userId));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch learning paths' };
    }
};

const learningPathService = {
    generateLearningPath,
    updateLearningPath,
    getStudyPlan,
    getLearningPathForDocument,
    getAllLearningPaths,
};

export default learningPathService;