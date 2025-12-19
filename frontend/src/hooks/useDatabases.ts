'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface Database {
    id: string
    title: string
    icon: string | null
    cover: string | null
    type: 'database'
    workspaceId: string
    databaseProperties: DatabaseProperty[]
    databaseViews: DatabaseView[]
    createdAt: string
    updatedAt: string
}

export interface DatabaseProperty {
    id: string
    databaseId: string
    name: string
    type: PropertyType
    config: Record<string, unknown>
    position: number
}

export type PropertyType =
    | 'title'
    | 'text'
    | 'number'
    | 'select'
    | 'multi_select'
    | 'date'
    | 'person'
    | 'checkbox'
    | 'url'
    | 'email'
    | 'phone'
    | 'relation'
    | 'rollup'
    | 'formula'

export interface DatabaseView {
    id: string
    databaseId: string
    name: string
    type: 'table' | 'board' | 'calendar' | 'gallery' | 'list' | 'timeline'
    config: Record<string, unknown>
    position: number
    isDefault: boolean
}

// Hook para obtener una database por ID
export function useDatabase(databaseId: string | null) {
    return useQuery({
        queryKey: ['database', databaseId],
        queryFn: async () => {
            if (!databaseId) return null
            const token = localStorage.getItem('access_token')
            const { data } = await axios.get<Database>(
                `${API_URL}/databases/${databaseId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            return data
        },
        enabled: !!databaseId,
    })
}

// Hook para crear database
export function useCreateDatabase() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (dto: {
            workspaceId: string
            title: string
            icon?: string
            cover?: string
            parentId?: string
        }) => {
            const token = localStorage.getItem('access_token')
            const { data } = await axios.post<Database>(
                `${API_URL}/databases`,
                dto,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            return data
        },
        onSuccess: (newDatabase) => {
            queryClient.invalidateQueries({ queryKey: ['pages', newDatabase.workspaceId] })
        },
    })
}

// Hook para actualizar database
export function useUpdateDatabase() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            id,
            ...dto
        }: {
            id: string
            title?: string
            icon?: string
            cover?: string
        }) => {
            const token = localStorage.getItem('access_token')
            const { data } = await axios.patch<Database>(
                `${API_URL}/databases/${id}`,
                dto,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            return data
        },
        onSuccess: (updatedDatabase) => {
            queryClient.invalidateQueries({ queryKey: ['database', updatedDatabase.id] })
        },
    })
}

// Hook para eliminar database
export function useDeleteDatabase() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const token = localStorage.getItem('access_token')
            await axios.delete(`${API_URL}/databases/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages'] })
        },
    })
}
