import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Workspace, CreateWorkspaceInput } from '@/types/workspace';
import { useWorkspaceStore } from '@/store/workspaceStore';

export function useWorkspaces() {
    const { setWorkspaces } = useWorkspaceStore();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['workspaces'],
        queryFn: async () => {
            const res = await api.get<Workspace[]>('/workspaces');
            setWorkspaces(res.data);
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (input: CreateWorkspaceInput) => {
            const res = await api.post<Workspace>('/workspaces', input);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
    });

    return {
        workspaces: query.data || [],
        isLoading: query.isLoading,
        createWorkspace: createMutation.mutateAsync,
    };
}
