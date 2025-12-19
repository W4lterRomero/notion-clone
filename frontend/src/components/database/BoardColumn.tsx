'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react'
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
    onCardClick?: (row: DatabaseRow) => void
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

const COLOR_BG_LIGHT: Record<string, string> = {
    gray: 'bg-gray-500/10',
    red: 'bg-red-500/10',
    orange: 'bg-orange-500/10',
    yellow: 'bg-yellow-500/10',
    green: 'bg-green-500/10',
    blue: 'bg-blue-500/10',
    purple: 'bg-purple-500/10',
    pink: 'bg-pink-500/10',
}

const BoardColumn = React.memo(function BoardColumn({
    column,
    databaseId,
    properties,
    cardPreview,
    onCardClick
}: BoardColumnProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    })

    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev)
    }, [])

    return (
        <motion.div
            ref={setNodeRef}
            layout
            className={`
                ${isCollapsed ? 'w-12' : 'w-72'} 
                min-h-[400px] flex flex-col rounded-xl transition-all duration-300
                ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}
                ${COLOR_BG_LIGHT[column.color] || 'bg-muted/30'}
            `}
        >
            {/* Column Header */}
            <div className={`
                flex items-center gap-2 p-3 border-b cursor-pointer group
                ${isCollapsed ? 'justify-center' : 'justify-between'}
            `}>
                {isCollapsed ? (
                    // Collapsed header - vertical
                    <motion.div
                        className="flex flex-col items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <button
                            onClick={toggleCollapse}
                            className="p-1 rounded hover:bg-muted/50 transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                        <div className={`w-3 h-3 rounded-full ${COLOR_CLASSES[column.color] || 'bg-gray-500'}`} />
                        <span className="text-xs font-medium writing-mode-vertical">
                            {column.name}
                        </span>
                        <motion.span
                            className="text-xs font-bold text-muted-foreground bg-background px-1.5 py-0.5 rounded-full shadow-sm"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                        >
                            {column.rows.length}
                        </motion.span>
                    </motion.div>
                ) : (
                    // Expanded header
                    <>
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={toggleCollapse}
                                className="p-1 rounded hover:bg-muted/50 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <ChevronDown size={14} />
                            </motion.button>
                            <div className={`w-3 h-3 rounded-full ${COLOR_CLASSES[column.color] || 'bg-gray-500'} shadow-sm`} />
                            <span className="font-semibold text-sm">{column.name}</span>
                            <motion.span
                                key={column.rows.length}
                                initial={{ scale: 1.3 }}
                                animate={{ scale: 1 }}
                                className="text-xs font-bold text-muted-foreground bg-background px-2 py-0.5 rounded-full shadow-sm"
                            >
                                {column.rows.length}
                            </motion.span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                                className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Plus size={14} />
                            </motion.button>
                            <motion.button
                                className="p-1.5 rounded-lg hover:bg-background/80 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <MoreHorizontal size={14} />
                            </motion.button>
                        </div>
                    </>
                )}
            </div>

            {/* Cards Container */}
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex-1 flex flex-col"
                    >
                        <SortableContext items={column.rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[500px]">
                                {column.rows.map((row, index) => (
                                    <motion.div
                                        key={row.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        onClick={() => onCardClick?.(row)}
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
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={`
                                            h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center 
                                            text-muted-foreground text-sm transition-all
                                            ${isOver ? 'border-primary bg-primary/10 scale-102' : 'border-muted-foreground/30'}
                                        `}
                                    >
                                        <Plus size={20} className="mb-1 opacity-50" />
                                        <span>Suelta aquí</span>
                                    </motion.div>
                                )}
                            </div>
                        </SortableContext>

                        {/* Add Card Button */}
                        <div className="p-2 border-t bg-background/50">
                            <motion.button
                                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-all"
                                whileHover={{ x: 4 }}
                            >
                                <Plus size={14} />
                                <span>Nueva tarjeta</span>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
})

export default BoardColumn
