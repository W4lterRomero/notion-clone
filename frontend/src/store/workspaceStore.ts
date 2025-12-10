import { create } from 'zustand';
import { Workspace } from '@/types/workspace';

interface WorkspaceState {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    setWorkspaces: (workspaces: Workspace[]) => void;
    setCurrentWorkspace: (workspace: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    workspaces: [],
    currentWorkspace: null,
    setWorkspaces: (workspaces) => set({ workspaces }),
    setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
}));
