import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const getDashboardData = async () => {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await axiosInstance.get(API_PATHS.PROGRESS.GET_DASHBOARD, {
            params: { timeZone }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch dashboard data' };
    }
};

const progressService = {
    getDashboardData,
};

export default progressService;