import api from './api';
import { LoginCredentials, RegisterCredentials, User } from '@/types/user';

export const authApi = {
    login: async (credentials: LoginCredentials) => {
        const response = await api.post<{ access_token: string; user: User }>('/auth/login', credentials);
        return response.data;
    },
    register: async (credentials: RegisterCredentials) => {
        const response = await api.post<{ access_token: string; user: User }>('/auth/register', credentials);
        return response.data;
    },
    getProfile: async () => {
        const response = await api.get<User>('/auth/profile');
        return response.data;
    },
};
