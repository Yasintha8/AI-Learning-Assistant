import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const getNotifications = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.NOTIFICATIONS.GET_ALL);
        return response.data.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch notifications' };
    }
};

const notificationService = {
    getNotifications,
};

export default notificationService;