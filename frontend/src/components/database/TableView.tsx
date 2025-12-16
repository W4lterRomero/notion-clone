'use client'

import { useDatabaseProperties } from '@/hooks/useDatabaseProperties'
import { useDatabaseRows, useCreateRow } from '@/hooks/useDatabaseRows'
import PropertyHeader from './PropertyHeader'
import PropertyCell from './PropertyCell'
import { Plus, Loader2 } from 'lucide-react'

interface TableViewProps {
    databaseId: string
    workspaceId: string
}

export default function TableView({ databaseId, workspaceId }: TableViewProps) {
    const { data: properties, isLoading: loadingProps } = useDatabaseProperties(databaseId)
    const { data: rows, isLoading: loadingRows } = useDatabaseRows(databaseId)
    const createRowMutation = useCreateRow()

    const handleCreateRow = async () => {
        await createRowMutation.mutateAsync({
            databaseId,
            title: '',
        })
    }

    if (loadingProps || loadingRows) {
        return (
            <div className="border rounded-lg p-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Sort properties: title first, then by position
    const sortedProperties = [...(properties || [])].sort((a, b) => {
        if (a.type === 'title') return -1
        if (b.type === 'title') return 1
        return a.position - b.position
    })

    return (
        <div className="border rounded-lg overflow-auto">
            <table className="w-full border-collapse">
                {/* Header Row */}
                <thead>
                    <tr>
                        {sortedProperties.map((property) => (
                            <th key={property.id} className="text-left p-0">
                                <PropertyHeader databaseId={databaseId} property={property} />
                            </th>
                        ))}
                        <th className="text-left p-0">
                            <PropertyHeader databaseId={databaseId} isAddButton />
                        </th>
                    </tr>
                </thead>

                {/* Data Rows */}
                <tbody>
                    {rows?.map((row) => (
                        <tr key={row.id} className="border-b hover:bg-muted/30 transition-colors">
                            {sortedProperties.map((property) => {
                                // Find value for this property
                                const propertyValue = row.propertyValues?.find(
                                    (pv) => pv.propertyId === property.id
                                )

                                // For title property, use row.title if no property value
                                let cellValue = propertyValue?.value
                                if (property.type === 'title' && !cellValue) {
                                    cellValue = row.title
                                }

                                return (
                                    <td key={property.id} className="p-0">
                                        <PropertyCell
                                            databaseId={databaseId}
                                            workspaceId={workspaceId}
                                            rowId={row.id}
                                            property={property}
                                            value={cellValue}
                                        />
                                    </td>
                                )
                            })}
                            <td className="p-0 border-r" />
                        </tr>
                    ))}

                    {/* Empty state */}
                    {(!rows || rows.length === 0) && (
                        <tr>
                            <td
                                colSpan={(sortedProperties.length || 0) + 1}
                                className="p-8 text-center text-muted-foreground"
                            >
                                No hay filas. Haz clic en &quot;Nueva fila&quot; para agregar una.
                            </td>
                        </tr>
                    )}

                    {/* Add Row Button */}
                    <tr>
                        <td colSpan={(sortedProperties.length || 0) + 1} className="p-0">
                            <button
                                onClick={handleCreateRow}
                                disabled={createRowMutation.isPending}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 w-full transition-colors"
                            >
                                {createRowMutation.isPending ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Plus size={14} />
                                )}
                                <span>Nueva fila</span>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
