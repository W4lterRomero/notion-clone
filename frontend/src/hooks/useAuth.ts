import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { authApi } from '@/lib/auth';

export function useAuth() {
    const { user, isAuthenticated, setAuth, logout } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        // Check auth status on mount if not authenticated but token exists check logic handled by api interceptor mostly
        // or we can verify token validity here
    }, []);

    return {
        user,
        isAuthenticated,
        Login: async (creds: any) => {
            const res = await authApi.login(creds);
            localStorage.setItem('access_token', res.access_token);
            setAuth(res.user);
            router.push('/workspaces/select'); // Or first workspace
        },
        Logout: () => {
            localStorage.removeItem('access_token');
            logout();
            router.push('/login');
        }
    };
}
