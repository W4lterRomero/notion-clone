'use client'

import { useDatabase } from '@/hooks/useDatabases'
import TableView from './TableView'
import { Loader2, Database } from 'lucide-react'

interface DatabaseViewProps {
    databaseId: string
}

export default function DatabaseView({ databaseId }: DatabaseViewProps) {
    const { data: database, isLoading, error } = useDatabase(databaseId)

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !database) {
        return (
            <div className="p-8 text-center">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Base de datos no encontrada</p>
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <span className="text-4xl">{database.icon || '📊'}</span>
                <h1 className="text-3xl font-semibold">{database.title}</h1>
            </div>

            {/* View Tabs (placeholder for future views) */}
            <div className="mb-4 flex items-center gap-2 border-b">
                <button className="px-3 py-2 text-sm font-medium border-b-2 border-primary text-primary">
                    Tabla
                </button>
                <button className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    + Agregar vista
                </button>
            </div>

            {/* Table View */}
            <TableView databaseId={databaseId} />
        </div>
    )
}
