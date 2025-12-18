'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { Plus, MoreHorizontal, EyeOff } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { DatabaseRow } from '@/hooks/useDatabaseRows'
import BoardCard from './BoardCard'

interface BoardColumnProps {
    column: {
        id: string
        name: string
        color: string
        rows: DatabaseRow[]
    }
    databaseId: string
    properties: DatabaseProperty[]
    cardPreview: 'none' | 'cover' | 'content'
}

const COLOR_CLASSES: Record<string, string> = {
    gray: 'bg-gray-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
}

export default function BoardColumn({ column, databaseId, properties, cardPreview }: BoardColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    })

    return (
        <div
            ref={setNodeRef}
            className={`w-72 min-h-[400px] flex flex-col rounded-xl transition-colors ${isOver ? 'bg-primary/5' : 'bg-muted/30'
                }`}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${COLOR_CLASSES[column.color] || 'bg-gray-500'}`} />
                    <span className="font-medium text-sm">{column.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {column.rows.length}
                    </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 rounded hover:bg-muted">
                        <MoreHorizontal size={14} />
                    </button>
                </div>
            </div>

            {/* Cards Container */}
            <SortableContext items={column.rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                    {column.rows.map((row, index) => (
                        <motion.div
                            key={row.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                        >
                            <BoardCard
                                row={row}
                                properties={properties}
                                cardPreview={cardPreview}
                            />
                        </motion.div>
                    ))}

                    {/* Drop zone indicator when empty */}
                    {column.rows.length === 0 && (
                        <div className={`h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm transition-colors ${isOver ? 'border-primary bg-primary/5' : 'border-muted'
                            }`}>
                            Suelta aquí
                        </div>
                    )}
                </div>
            </SortableContext>

            {/* Add Card Button */}
            <div className="p-2 border-t">
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors">
                    <Plus size={14} />
                    Agregar tarjeta
                </button>
            </div>
        </div>
    )
}
