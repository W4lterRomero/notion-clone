'use client'

import { useParams } from 'next/navigation'
import DatabaseView from '@/components/database/DatabaseView'

export default function DatabasePage() {
    const params = useParams()
    const databaseId = params.databaseId as string

    return <DatabaseView databaseId={databaseId} />
}
