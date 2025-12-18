import { Workspace } from './workspace';

export interface Page {
    id: string;
    title: string;
    icon?: string;
    cover?: string;
    type?: 'page' | 'database';
    isPublic: boolean;
    workspaceId: string;
    workspace?: Workspace;
    parentId?: string;
    children?: Page[];
    createdAt: string;
    updatedAt: string;
}

export type CreatePageInput = {
    title: string;
    workspaceId: string;
    parentId?: string;
    icon?: string;
};

