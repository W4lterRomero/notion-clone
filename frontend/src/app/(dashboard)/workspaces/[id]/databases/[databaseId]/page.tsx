'use client'

import { useParams } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import DatabaseView from '@/components/database/DatabaseView'

export default function DatabasePage() {
    const params = useParams()
    const databaseId = params.databaseId as string

    return (
        <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <DatabaseView databaseId={databaseId} />
            </main>
        </div>
    )
}
