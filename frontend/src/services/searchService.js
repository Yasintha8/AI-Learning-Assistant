import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const globalSearch = async (query) => {
    try {
        const response = await axiosInstance.get(API_PATHS.SEARCH.GLOBAL, {
            params: { q: query },
        });
        return response.data?.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to search' };
    }
};

const searchService = {
    globalSearch,
};

export default searchService;