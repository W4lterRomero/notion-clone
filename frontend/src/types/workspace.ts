export interface Workspace {
    id: string;
    name: string;
    icon?: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
}

export type CreateWorkspaceInput = {
    name: string;
    icon?: string;
};
