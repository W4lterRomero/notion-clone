'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useDatabaseProperties } from '@/hooks/useDatabaseProperties'
import { useDatabaseRows, useUpdateRowValue } from '@/hooks/useDatabaseRows'
import BoardColumn from './BoardColumn'
import BoardCard from './BoardCard'
import { Loader2, Settings } from 'lucide-react'

interface BoardViewProps {
    databaseId: string
    workspaceId: string
    viewConfig: {
        groupBy?: string
        cardPreview?: 'none' | 'cover' | 'content'
        sorts?: Array<{ propertyId: string; direction: 'asc' | 'desc' }>
        hiddenGroups?: string[]
    }
}

export default function BoardView({ databaseId, workspaceId, viewConfig }: BoardViewProps) {
    const { data: properties, isLoading: loadingProps } = useDatabaseProperties(databaseId)
    const { data: rows, isLoading: loadingRows } = useDatabaseRows(databaseId)
    const updateValueMutation = useUpdateRowValue()

    const [activeId, setActiveId] = useState<string | null>(null)
    const [showConfig, setShowConfig] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Find the groupBy property (select type)
    const groupByProperty = properties?.find(p => p.id === viewConfig.groupBy)
    const selectProperties = properties?.filter(p => p.type === 'select') || []

    // Get select options for columns
    const selectOptions = useMemo(() => {
        if (!groupByProperty) return []
        const config = groupByProperty.config as { options?: { id: string; name: string; color: string }[] }
        return config?.options || []
    }, [groupByProperty])

    // Group rows by select value
    const columns = useMemo(() => {
        if (!groupByProperty || !rows) return []

        const grouped: Record<string, typeof rows> = {}

        // Initialize with all options
        selectOptions.forEach(opt => {
            grouped[opt.name] = []
        })
        grouped['Sin asignar'] = []

        // Group rows
        rows.forEach(row => {
            const propValue = row.propertyValues?.find(pv => pv.propertyId === groupByProperty.id)
            const value = propValue?.value as string || 'Sin asignar'
            if (!grouped[value]) grouped[value] = []
            grouped[value].push(row)
        })

        return Object.entries(grouped).map(([name, items]) => ({
            id: name,
            name,
            color: selectOptions.find(o => o.name === name)?.color || 'gray',
            rows: items,
        }))
    }, [groupByProperty, rows, selectOptions])

    const activeRow = useMemo(() => {
        if (!activeId || !rows) return null
        return rows.find(r => r.id === activeId)
    }, [activeId, rows])

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over || !groupByProperty) return

        const activeRowId = active.id as string
        const overColumnId = over.id as string

        // Find which column the card was dropped on
        const targetColumn = columns.find(c => c.id === overColumnId)
        if (!targetColumn) return

        // Update the row's select value
        const newValue = targetColumn.name === 'Sin asignar' ? null : targetColumn.name

        try {
            await updateValueMutation.mutateAsync({
                databaseId,
                rowId: activeRowId,
                propertyId: groupByProperty.id,
                value: newValue,
            })
        } catch (error) {
            console.error('Failed to move card:', error)
        }
    }

    const handleDragOver = (event: DragOverEvent) => {
        // For visual feedback during drag
    }

    if (loadingProps || loadingRows) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Show config prompt if no groupBy property selected
    if (!viewConfig.groupBy || !groupByProperty) {
        return (
            <div className="border rounded-lg p-8 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Configurar Board View</h3>
                <p className="text-muted-foreground mb-4">
                    Selecciona una propiedad Select para agrupar las tarjetas
                </p>
                {selectProperties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No hay propiedades Select. Crea una primero.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {selectProperties.map(prop => (
                            <button
                                key={prop.id}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                            >
                                {prop.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
        >
            <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                    {columns.map((column, index) => (
                        <motion.div
                            key={column.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <BoardColumn
                                column={column}
                                databaseId={databaseId}
                                properties={properties || []}
                                cardPreview={viewConfig.cardPreview || 'content'}
                            />
                        </motion.div>
                    ))}

                    {/* Add Column Placeholder */}
                    <div className="w-72 min-h-[400px] border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary/50 transition-colors cursor-pointer">
                        + Nueva columna
                    </div>
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeRow && (
                    <motion.div
                        initial={{ scale: 1.05, rotate: 2 }}
                        animate={{ scale: 1.05, rotate: 2 }}
                        className="opacity-90"
                    >
                        <BoardCard
                            row={activeRow}
                            properties={properties || []}
                            cardPreview="content"
                            isDragging
                        />
                    </motion.div>
                )}
            </DragOverlay>
        </DndContext>
    )
}
