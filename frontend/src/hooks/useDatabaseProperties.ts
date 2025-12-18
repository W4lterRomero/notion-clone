'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { DatabaseProperty, PropertyType } from './useDatabases'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Hook para obtener properties de una database
export function useDatabaseProperties(databaseId: string | null) {
    return useQuery({
        queryKey: ['database-properties', databaseId],
        queryFn: async () => {
            if (!databaseId) return []
            const token = localStorage.getItem('access_token')
            const { data } = await axios.get<DatabaseProperty[]>(
                `${API_URL}/databases/${databaseId}/properties`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            return data
        },
        enabled: !!databaseId,
    })
}

// Hook para crear property
export function useCreateProperty() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            databaseId,
            ...dto
        }: {
            databaseId: string
            name: string
            type: PropertyType
            config?: Record<string, unknown>
            position?: number
        }) => {
            const token = localStorage.getItem('access_token')
            const { data } = await axios.post<DatabaseProperty>(
                `${API_URL}/databases/${databaseId}/properties`,
                dto,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            return data
        },
        onSuccess: (newProperty) => {
            queryClient.invalidateQueries({
                queryKey: ['database-properties', newProperty.databaseId],
            })
            queryClient.invalidateQueries({
                queryKey: ['database', newProperty.databaseId],
            })
        },
    })
}

// Hook para actualizar property
export function useUpdateProperty() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            databaseId,
            propertyId,
            ...dto
        }: {
            databaseId: string
            propertyId: string
            name?: string
            config?: Record<string, unknown>
            position?: number
        }) => {
            const token = localStorage.getItem('access_token')
            const { data } = await axios.patch<DatabaseProperty>(
                `${API_URL}/databases/${databaseId}/properties/${propertyId}`,
                dto,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            return data
        },
        onSuccess: (updatedProperty) => {
            queryClient.invalidateQueries({
                queryKey: ['database-properties', updatedProperty.databaseId],
            })
            queryClient.invalidateQueries({
                queryKey: ['database', updatedProperty.databaseId],
            })
            // Also invalidate rows since relation/rollup configs affect row data
            queryClient.invalidateQueries({
                queryKey: ['database-rows', updatedProperty.databaseId],
            })
        },
    })
}

// Hook para eliminar property
export function useDeleteProperty() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            databaseId,
            propertyId,
        }: {
            databaseId: string
            propertyId: string
        }) => {
            const token = localStorage.getItem('access_token')
            await axios.delete(
                `${API_URL}/databases/${databaseId}/properties/${propertyId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            return { databaseId, propertyId }
        },
        onSuccess: ({ databaseId }) => {
            queryClient.invalidateQueries({
                queryKey: ['database-properties', databaseId],
            })
            queryClient.invalidateQueries({
                queryKey: ['database', databaseId],
            })
        },
    })
}
