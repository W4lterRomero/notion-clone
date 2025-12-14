'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface WorkspaceMember {
    id: string
    name: string
    email: string
}

export function useWorkspaceMembers(workspaceId: string | null) {
    return useQuery({
        queryKey: ['workspace-members', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return []
            const token = localStorage.getItem('access_token')
            const { data } = await axios.get<WorkspaceMember[]>(
                `${API_URL}/workspaces/${workspaceId}/members`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            return data
        },
        enabled: !!workspaceId,
    })
}
