'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { GripVertical, Calendar, User, Hash } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { DatabaseRow } from '@/hooks/useDatabaseRows'

interface BoardCardProps {
    row: DatabaseRow
    properties: DatabaseProperty[]
    cardPreview: 'none' | 'cover' | 'content'
    isDragging?: boolean
}

export default function BoardCard({ row, properties, cardPreview, isDragging }: BoardCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: row.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    // Get preview properties (first 2-3 non-title properties)
    const previewProps = properties
        .filter(p => p.type !== 'title' && p.type !== 'select')
        .slice(0, 3)

    const getPropertyValue = (propId: string) => {
        const pv = row.propertyValues?.find(v => v.propertyId === propId)
        return pv?.value
    }

    const getPropertyIcon = (type: string): React.ReactNode => {
        switch (type) {
            case 'date':
                return <Calendar size={12} className="text-purple-500/70" />
            case 'person':
                return <User size={12} className="text-blue-500/70" />
            case 'number':
                return <Hash size={12} className="text-green-500/70" />
            default:
                return null
        }
    }

    const formatValue = (value: unknown, type: string): string | null => {
        if (value === null || value === undefined) return null

        switch (type) {
            case 'date':
                try {
                    return new Date(value as string).toLocaleDateString('es', {
                        month: 'short',
                        day: 'numeric'
                    })
                } catch {
                    return null
                }
            case 'checkbox':
                return value ? '✓' : '✗'
            case 'number':
                return typeof value === 'number' ? value.toLocaleString() : String(value)
            default:
                return String(value).slice(0, 30)
        }
    }

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`group bg-background border rounded-lg shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${isDragging || isSortableDragging ? 'opacity-50 shadow-lg rotate-2' : ''
                }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Drag Handle */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
                <GripVertical size={12} />
            </div>

            {/* Card Content */}
            <div className="p-3">
                {/* Title */}
                <div className="font-medium text-sm mb-2 line-clamp-2">
                    {row.icon && <span className="mr-1">{row.icon}</span>}
                    {row.title || 'Sin título'}
                </div>

                {/* Preview Properties */}
                {cardPreview === 'content' && previewProps.length > 0 && (
                    <div className="space-y-1.5">
                        {previewProps.map(prop => {
                            const value = getPropertyValue(prop.id)
                            const formatted = formatValue(value, prop.type)
                            if (!formatted) return null

                            return (
                                <div
                                    key={prop.id}
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                                >
                                    {getPropertyIcon(prop.type)}
                                    <span className="truncate">{formatted}</span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    )
}
