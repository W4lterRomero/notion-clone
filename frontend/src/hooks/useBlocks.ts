import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Block {
    id: string;
    type: string;
    content: string;
    properties: Record<string, any> | null;
    position: number;
    pageId: string;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBlockInput {
    type: string;
    content?: string;
    properties?: Record<string, any>;
    position: number;
    pageId: string;
    parentId?: string;
}

export interface UpdateBlockInput {
    type?: string;
    content?: string;
    properties?: Record<string, any>;
    position?: number;
}

export function useBlocks(pageId: string | undefined) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['blocks', pageId],
        queryFn: async () => {
            if (!pageId) return [];
            const res = await api.get<Block[]>(`/blocks/page/${pageId}`);
            return res.data;
        },
        enabled: !!pageId,
    });

    const createMutation = useMutation({
        mutationFn: async (input: CreateBlockInput) => {
            const res = await api.post<Block>('/blocks', input);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocks', pageId] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateBlockInput }) => {
            const res = await api.put<Block>(`/blocks/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocks', pageId] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/blocks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocks', pageId] });
        },
    });

    const reorderMutation = useMutation({
        mutationFn: async (blocks: { id: string; position: number }[]) => {
            const res = await api.patch<Block[]>('/blocks/reorder', { blocks });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocks', pageId] });
        },
    });

    return {
        blocks: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        createBlock: createMutation.mutateAsync,
        updateBlock: updateMutation.mutateAsync,
        deleteBlock: deleteMutation.mutateAsync,
        reorderBlocks: reorderMutation.mutateAsync,
    };
}
