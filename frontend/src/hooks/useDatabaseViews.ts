'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ============================================
// TYPES
// ============================================

export interface SortConfig {
    propertyId: string
    direction: 'asc' | 'desc'
}

export interface FilterCondition {
    propertyId: string
    operator: string
    value: unknown
}

export interface FilterGroup {
    type: 'and' | 'or'
    conditions: (FilterCondition | FilterGroup)[]
}

export interface TableViewConfig {
    visibleProperties?: string[]
    propertyWidths?: Record<string, number>
    sorts?: SortConfig[]
    filter?: FilterGroup
    wrapCells?: boolean
}

export interface DatabaseView {
    id: string
    databaseId: string
    name: string
    type: 'table' | 'board' | 'calendar' | 'gallery' | 'list' | 'timeline'
    config: TableViewConfig
    position: number
    isDefault: boolean
    createdAt: string
    updatedAt: string
}

// ============================================
// API FUNCTIONS
// ============================================

const getAuthHeaders = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
})

async function fetchViews(databaseId: string): Promise<DatabaseView[]> {
    const response = await axios.get(
        `${API_URL}/databases/${databaseId}/views`,
        getAuthHeaders()
    )
    return response.data
}

async function createView(
    databaseId: string,
    data: { name: string; type: string; config?: TableViewConfig }
): Promise<DatabaseView> {
    const response = await axios.post(
        `${API_URL}/databases/${databaseId}/views`,
        data,
        getAuthHeaders()
    )
    return response.data
}

async function updateView(
    databaseId: string,
    viewId: string,
    data: Partial<DatabaseView>
): Promise<DatabaseView> {
    const response = await axios.patch(
        `${API_URL}/databases/${databaseId}/views/${viewId}`,
        data,
        getAuthHeaders()
    )
    return response.data
}

async function deleteView(databaseId: string, viewId: string): Promise<void> {
    await axios.delete(
        `${API_URL}/databases/${databaseId}/views/${viewId}`,
        getAuthHeaders()
    )
}

// ============================================
// HOOKS
// ============================================

export function useDatabaseViews(databaseId: string) {
    return useQuery({
        queryKey: ['database-views', databaseId],
        queryFn: () => fetchViews(databaseId),
        enabled: !!databaseId,
    })
}

export function useCreateView() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ databaseId, name, type, config }: {
            databaseId: string
            name: string
            type: string
            config?: TableViewConfig
        }) => createView(databaseId, { name, type, config }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['database-views', variables.databaseId],
            })
        },
    })
}

export function useUpdateView() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ databaseId, viewId, ...data }: {
            databaseId: string
            viewId: string
            name?: string
            config?: TableViewConfig
            isDefault?: boolean
        }) => updateView(databaseId, viewId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['database-views', variables.databaseId],
            })
        },
    })
}

export function useDeleteView() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ databaseId, viewId }: { databaseId: string; viewId: string }) =>
            deleteView(databaseId, viewId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['database-views', variables.databaseId],
            })
        },
    })
}

// ============================================
// VIEW CONFIG HELPERS
// ============================================

export function useViewConfig(databaseId: string, viewId: string | null) {
    const { data: views } = useDatabaseViews(databaseId)
    const updateViewMutation = useUpdateView()

    const currentView = viewId
        ? views?.find(v => v.id === viewId)
        : views?.find(v => v.isDefault) || views?.[0]

    const updateConfig = async (updates: Partial<TableViewConfig>) => {
        if (!currentView) return

        await updateViewMutation.mutateAsync({
            databaseId,
            viewId: currentView.id,
            config: {
                ...currentView.config,
                ...updates,
            },
        })
    }

    return {
        view: currentView,
        config: currentView?.config || {},
        updateConfig,
        isUpdating: updateViewMutation.isPending,
    }
}
