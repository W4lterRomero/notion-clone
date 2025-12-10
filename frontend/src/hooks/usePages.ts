import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Page } from '@/types/page';

export interface UpdatePageInput {
    title?: string;
    icon?: string;
    cover?: string;
    isPublic?: boolean;
}

export function usePages(workspaceId: string | undefined) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['pages', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return [];
            const res = await api.get<Page[]>(`/pages?workspaceId=${workspaceId}`);
            return res.data;
        },
        enabled: !!workspaceId,
    });

    const createMutation = useMutation({
        mutationFn: async (input: { title: string; workspaceId: string; icon?: string }) => {
            const res = await api.post<Page>('/pages', input);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', workspaceId] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdatePageInput }) => {
            const res = await api.patch<Page>(`/pages/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', workspaceId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/pages/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages', workspaceId] });
        },
    });

    return {
        pages: query.data || [],
        isLoading: query.isLoading,
        createPage: createMutation.mutateAsync,
        updatePage: updateMutation.mutateAsync,
        deletePage: deleteMutation.mutateAsync,
    };
}

export function usePage(pageId: string | undefined) {
    return useQuery({
        queryKey: ['page', pageId],
        queryFn: async () => {
            if (!pageId) return null;
            const res = await api.get<Page>(`/pages/${pageId}`);
            return res.data;
        },
        enabled: !!pageId,
    });
}
