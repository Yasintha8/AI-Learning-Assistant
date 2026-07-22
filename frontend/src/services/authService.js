import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const login = async (email, password) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
            email,
            password,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An unknown error occurred' };
    }
};

const googleAuth = async (code) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.GOOGLE, { code });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An unknown error occurred' };
    }
};

const register = async (username, email, password) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
            username,
            email,
            password,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An unknown error occurred' };
    }
};

const getProfile = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An unknown error occurred' };
    }
};

const updateProfile = async (userData) => {
    try {
        const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An unknown error occurred' };
    }
};

const uploadAvatar = async (formData) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.UPLOAD_AVATAR, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to upload avatar' };
    }
};

const changePassword = async (passwords) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, passwords);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'An unknown error occurred' };
    }
};


const authService = {
    login,
    register,
    googleAuth,
    getProfile,
    updateProfile,
    uploadAvatar,
    changePassword,
};

export default authService;