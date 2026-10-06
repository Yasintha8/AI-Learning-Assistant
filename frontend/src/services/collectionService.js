import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const getCollections = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.COLLECTIONS.GET_ALL);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch collections' };
    }
};

const createCollection = async ({ name, description, color, icon }) => {
    try {
        const response = await axiosInstance.post(API_PATHS.COLLECTIONS.CREATE, {
            name,
            description,
            color,
            icon,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to create collection' };
    }
};

const updateCollection = async (id, { name, description, color, icon }) => {
    try {
        const response = await axiosInstance.put(API_PATHS.COLLECTIONS.UPDATE(id), {
            name,
            description,
            color,
            icon,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to update collection' };
    }
};

const deleteCollection = async (id) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.COLLECTIONS.DELETE(id));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to delete collection' };
    }
};

const collectionService = {
    getCollections,
    createCollection,
    updateCollection,
    deleteCollection,
};

export default collectionService;
