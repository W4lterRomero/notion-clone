'use client'

import { useParams } from 'next/navigation'
import DatabaseView from '@/components/database/DatabaseView'
import { PageHeader } from '@/components/editor/PageHeader'
import { useDatabase, useUpdateDatabase } from '@/hooks/useDatabases'
import { Loader2 } from 'lucide-react'

export default function DatabasePage() {
    const params = useParams()
    const databaseId = params.databaseId as string

    const { data: database, isLoading } = useDatabase(databaseId)
    const updateDatabase = useUpdateDatabase()

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!database) {
        return <div>Database not found</div>
    }

    return (
        <div className="h-full flex flex-col">
            <div className="px-12 pt-8 pb-4">
                <PageHeader
                    title={database.title}
                    icon={database.icon || undefined}
                    onTitleChange={(newTitle) => {
                        updateDatabase.mutate({
                            id: databaseId,
                            title: newTitle
                        })
                    }}
                    onIconChange={(newIcon) => {
                        updateDatabase.mutate({
                            id: databaseId,
                            icon: newIcon
                        })
                    }}
                />
            </div>
            <div className="flex-1 overflow-hidden">
                <DatabaseView databaseId={databaseId} />
            </div>
        </div>
    )
}
