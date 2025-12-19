'use client'

import React, { useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ExternalLink, Trash2, Copy } from 'lucide-react'
import { DatabaseRow } from '@/hooks/useDatabaseRows'
import { DatabaseProperty } from '@/hooks/useDatabases'

interface RowPeekModalProps {
    row: DatabaseRow | null
    rows?: DatabaseRow[]
    properties: DatabaseProperty[]
    isOpen: boolean
    onClose: () => void
    onNavigate?: (direction: 'prev' | 'next') => void
    onRowClick?: (rowId: string) => void
    databaseId: string
    workspaceId: string
}

const RowPeekModal = React.memo(function RowPeekModal({
    row,
    rows,
    properties,
    isOpen,
    onClose,
    onNavigate,
    onRowClick,
    databaseId,
    workspaceId,
}: RowPeekModalProps) {
    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            } else if (e.key === 'ArrowLeft' && onNavigate) {
                onNavigate('prev')
            } else if (e.key === 'ArrowRight' && onNavigate) {
                onNavigate('next')
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose, onNavigate])

    const getPropertyValue = useCallback((propertyId: string) => {
        return row?.propertyValues?.find(pv => pv.propertyId === propertyId)?.value
    }, [row])

    const formatValue = useCallback((value: unknown, type: string): string => {
        if (value === null || value === undefined) return '-'

        switch (type) {
            case 'date':
                return new Date(value as string).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            case 'checkbox':
                return value ? '✓' : '✗'
            case 'number':
                return Number(value).toLocaleString()
            case 'multi_select':
                return Array.isArray(value) ? value.join(', ') : String(value)
            default:
                return String(value)
        }
    }, [])

    const currentIndex = rows?.findIndex(r => r.id === row?.id) ?? -1
    const hasPrev = currentIndex > 0
    const hasNext = rows ? currentIndex < rows.length - 1 : false

    return (
        <AnimatePresence>
            {isOpen && row && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-background shadow-2xl border-l overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
                            <div className="flex items-center gap-2">
                                {/* Navigation */}
                                {onNavigate && (
                                    <div className="flex items-center gap-1 mr-4">
                                        <motion.button
                                            onClick={() => onNavigate('prev')}
                                            disabled={!hasPrev}
                                            className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <ChevronLeft size={18} />
                                        </motion.button>
                                        <span className="text-xs text-muted-foreground min-w-[50px] text-center">
                                            {currentIndex + 1} / {rows?.length}
                                        </span>
                                        <motion.button
                                            onClick={() => onNavigate('next')}
                                            disabled={!hasNext}
                                            className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <ChevronRight size={18} />
                                        </motion.button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <motion.button
                                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="Abrir en página completa"
                                >
                                    <ExternalLink size={16} />
                                </motion.button>
                                <motion.button
                                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="Duplicar"
                                >
                                    <Copy size={16} />
                                </motion.button>
                                <motion.button
                                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </motion.button>
                                <motion.button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X size={18} />
                                </motion.button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Title */}
                            <div className="px-6 py-8 border-b">
                                <div className="flex items-center gap-3">
                                    {row.icon && (
                                        <span className="text-4xl">{row.icon}</span>
                                    )}
                                    <h1 className="text-3xl font-bold">
                                        {row.title || 'Sin título'}
                                    </h1>
                                </div>
                            </div>

                            {/* Properties */}
                            <div className="px-6 py-6 space-y-4">
                                {properties.filter(p => p.type !== 'title').map((property) => {
                                    const value = getPropertyValue(property.id)

                                    return (
                                        <motion.div
                                            key={property.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-start gap-4 py-2 group hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                                        >
                                            <div className="w-32 flex-shrink-0 text-sm text-muted-foreground">
                                                {property.name}
                                            </div>
                                            <div className="flex-1 text-sm">
                                                {property.type === 'select' && value ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                        {String(value)}
                                                    </span>
                                                ) : property.type === 'multi_select' && Array.isArray(value) ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {value.map((v: string, i: number) => (
                                                            <span
                                                                key={i}
                                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                                                            >
                                                                {v}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : property.type === 'checkbox' ? (
                                                    <span className={`text-lg ${value ? 'text-green-500' : 'text-muted-foreground'}`}>
                                                        {value ? '☑' : '☐'}
                                                    </span>
                                                ) : property.type === 'url' && value ? (
                                                    <a
                                                        href={String(value)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline"
                                                    >
                                                        {String(value)}
                                                    </a>
                                                ) : (
                                                    <span className={!value ? 'text-muted-foreground' : ''}>
                                                        {formatValue(value, property.type)}
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Keyboard hints */}
                        <div className="px-6 py-3 border-t bg-muted/20 text-xs text-muted-foreground flex items-center gap-4">
                            <span>
                                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">←</kbd>
                                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] ml-1">→</kbd>
                                <span className="ml-1">Navegar</span>
                            </span>
                            <span>
                                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd>
                                <span className="ml-1">Cerrar</span>
                            </span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
})

export default RowPeekModal
