import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const generateResourceGraph = async (documentId, force = false) => {
    try {
        const response = await axiosInstance.post(
            API_PATHS.RESOURCES.GENERATE,
            { documentId, force },
            { timeout: 180000 }
        );
        return response.data;
    } catch (error) {
        const errorData = error.response?.data;
        const message = errorData?.error || errorData?.message || error.message || 'Failed to generate related resources';
        throw { message, ...errorData };
    }
};

const getResourceGraph = async (documentId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.RESOURCES.GET_FOR_DOC(documentId));
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error.response?.data || { message: 'Failed to fetch related resources' };
    }
};

const resourceService = {
    generateResourceGraph,
    getResourceGraph,
};

export default resourceService;