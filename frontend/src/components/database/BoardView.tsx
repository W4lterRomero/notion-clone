'use client'

import React, { useState, useMemo, useCallback } from 'react'
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
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useDatabaseProperties } from '@/hooks/useDatabaseProperties'
import { useDatabaseRows, useUpdateRowValue, DatabaseRow } from '@/hooks/useDatabaseRows'
import { useDatabaseViews, useUpdateView } from '@/hooks/useDatabaseViews'
import BoardColumn from './BoardColumn'
import BoardCard from './BoardCard'
import FullPagePeek from './FullPagePeek'
import ViewSkeleton from './ViewSkeleton'
import { Settings, Columns } from 'lucide-react'

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
    const { data: views } = useDatabaseViews(databaseId)
    const updateValueMutation = useUpdateRowValue()
    const updateViewMutation = useUpdateView()

    const [activeId, setActiveId] = useState<string | null>(null)
    const [selectedRow, setSelectedRow] = useState<DatabaseRow | null>(null)

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

    // Get select options for columns - memoized
    const selectOptions = useMemo(() => {
        if (!groupByProperty) return []
        const config = groupByProperty.config as { options?: { id: string; name: string; color: string }[] }
        return config?.options || []
    }, [groupByProperty])

    // Group rows by select value - memoized
    const columns = useMemo(() => {
        if (!groupByProperty || !rows) return []

        const grouped: Record<string, DatabaseRow[]> = {}

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

    // Config button handler - saves the selected property
    const selectGroupByProperty = useCallback(async (propertyId: string) => {
        const boardView = views?.find(v => v.type === 'board')
        if (!boardView) return

        await updateViewMutation.mutateAsync({
            databaseId,
            viewId: boardView.id,
            config: {
                ...(boardView.config as Record<string, unknown>),
                groupBy: propertyId,
                cardPreview: viewConfig.cardPreview ?? 'content',
            } as Record<string, unknown>,
        })
    }, [views, databaseId, viewConfig.cardPreview, updateViewMutation])

    // Card click handler
    const handleCardClick = useCallback((row: DatabaseRow) => {
        setSelectedRow(row)
    }, [])

    // Row navigation in modal
    const handleRowNavigate = useCallback((direction: 'prev' | 'next') => {
        if (!selectedRow || !rows) return
        const currentIndex = rows.findIndex(r => r.id === selectedRow.id)
        if (direction === 'prev' && currentIndex > 0) {
            setSelectedRow(rows[currentIndex - 1])
        } else if (direction === 'next' && currentIndex < rows.length - 1) {
            setSelectedRow(rows[currentIndex + 1])
        }
    }, [selectedRow, rows])

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }, [])

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over || !groupByProperty) return

        const activeRowId = active.id as string
        const overColumnId = over.id as string

        const targetColumn = columns.find(c => c.id === overColumnId)
        if (!targetColumn) return

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
    }, [groupByProperty, columns, updateValueMutation, databaseId])

    // Show skeleton during loading
    if (loadingProps || loadingRows) {
        return <ViewSkeleton type="board" />
    }

    // Show config prompt if no groupBy property selected
    if (!viewConfig.groupBy || !groupByProperty) {
        return (
            <div className="border rounded-xl p-8 text-center bg-gradient-to-br from-muted/30 to-background">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Columns className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Configurar Board View</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Selecciona una propiedad Select para agrupar las tarjetas en columnas
                </p>
                {selectProperties.length === 0 ? (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            No hay propiedades Select. Crea una primero en la vista de tabla.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                            <Settings size={14} />
                            <span>Tip: Agrega una propiedad "Estado" o "Prioridad" tipo Select</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-3 justify-center">
                        {selectProperties.map(prop => (
                            <motion.button
                                key={prop.id}
                                onClick={() => selectGroupByProperty(prop.id)}
                                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 font-medium"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                🏷️ {prop.name}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
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
                                    onCardClick={handleCardClick}
                                />
                            </motion.div>
                        ))}

                        {/* Add Column Placeholder */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: columns.length * 0.05 }}
                            className="w-72 min-h-[400px] border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary/70 hover:bg-primary/5 transition-all cursor-pointer"
                        >
                            <Columns size={24} className="mb-2 opacity-50" />
                            <span className="text-sm font-medium">Nueva columna</span>
                        </motion.div>
                    </div>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeRow && (
                        <motion.div
                            initial={{ scale: 1.05, rotate: 2 }}
                            animate={{ scale: 1.05, rotate: 2 }}
                            className="opacity-95 shadow-2xl"
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

            {/* Row Peek Modal */}
            <FullPagePeek
                row={selectedRow}
                rows={rows}
                properties={properties || []}
                isOpen={!!selectedRow}
                onClose={() => setSelectedRow(null)}
                onNavigate={handleRowNavigate}
                databaseId={databaseId}
                workspaceId={workspaceId}
            />
        </>
    )
}
