import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

export const saveCareerProfile = async (profileData) => {
    const response = await axiosInstance.post(API_PATHS.CAREER.SAVE_PROFILE, profileData);
    return response.data;
};

export const getCareerData = async () => {
    const response = await axiosInstance.get(API_PATHS.CAREER.GET_DATA);
    return response.data;
};

export const updateMilestoneProgress = async (progressData) => {
    const response = await axiosInstance.put(API_PATHS.CAREER.UPDATE_MILESTONE, progressData);
    return response.data;
};

export const sendCounselorMessage = async (message) => {
    const response = await axiosInstance.post(API_PATHS.CAREER.CHAT, { message });
    return response.data;
};
