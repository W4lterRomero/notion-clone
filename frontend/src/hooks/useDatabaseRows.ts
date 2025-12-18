'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface DatabaseRow {
    id: string
    title: string | null
    icon: string | null
    type: 'page'
    parentDatabaseId: string
    propertyValues: PropertyValue[]
    createdAt: string
    updatedAt: string
}

export interface PropertyValue {
    id: string
    rowId: string
    propertyId: string
    value: unknown
    property: {
        id: string
        name: string
        type: string
    }
}

// Hook para obtener rows de una database
export function useDatabaseRows(databaseId: string | null) {
    return useQuery({
        queryKey: ['database-rows', databaseId],
        queryFn: async () => {
            if (!databaseId) return []
            const token = localStorage.getItem('access_token')
            const { data } = await axios.get<DatabaseRow[]>(
                `${API_URL}/databases/${databaseId}/rows`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            return data
        },
        enabled: !!databaseId,
    })
}

// Hook para crear row
export function useCreateRow() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            databaseId,
            ...dto
        }: {
            databaseId: string
            title?: string
            icon?: string
        }) => {
            const token = localStorage.getItem('access_token')
            const { data } = await axios.post<DatabaseRow>(
                `${API_URL}/databases/${databaseId}/rows`,
                dto,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            return data
        },
        onSuccess: (newRow) => {
            queryClient.invalidateQueries({
                queryKey: ['database-rows', newRow.parentDatabaseId],
            })
        },
    })
}

// Hook para actualizar property value
export function useUpdateRowValue() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            databaseId,
            rowId,
            propertyId,
            value,
        }: {
            databaseId: string
            rowId: string
            propertyId: string
            value: unknown
        }) => {
            const token = localStorage.getItem('access_token')
            const { data } = await axios.patch(
                `${API_URL}/databases/${databaseId}/rows/${rowId}/values`,
                { propertyId, value },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['database-rows', variables.databaseId],
            })
        },
    })
}

// Hook para actualizar relations (for relation property type)
export function useUpdateRelations() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            databaseId,
            rowId,
            propertyId,
            targetRowIds,
        }: {
            databaseId: string
            rowId: string
            propertyId: string
            targetRowIds: string[]
        }) => {
            const token = localStorage.getItem('access_token')
            const { data } = await axios.patch(
                `${API_URL}/databases/${databaseId}/rows/${rowId}/relations`,
                { propertyId, targetRowIds },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['database-rows', variables.databaseId],
            })
        },
    })
}

// Hook para eliminar row
export function useDeleteRow() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            databaseId,
            rowId,
        }: {
            databaseId: string
            rowId: string
        }) => {
            const token = localStorage.getItem('access_token')
            await axios.delete(`${API_URL}/databases/${databaseId}/rows/${rowId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            return { databaseId, rowId }
        },
        onSuccess: ({ databaseId }) => {
            queryClient.invalidateQueries({
                queryKey: ['database-rows', databaseId],
            })
        },
    })
}
