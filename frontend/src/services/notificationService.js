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

const markAsRead = async (id) => {
    try {
        const response = await axiosInstance.patch(API_PATHS.NOTIFICATIONS.MARK_READ(id));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to mark notification as read' };
    }
};

const markAllAsRead = async () => {
    try {
        const response = await axiosInstance.patch(API_PATHS.NOTIFICATIONS.MARK_ALL_READ);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to mark notifications as read' };
    }
};

const notificationService = {
    getNotifications,
    markAsRead,
    markAllAsRead,
};

export default notificationService;