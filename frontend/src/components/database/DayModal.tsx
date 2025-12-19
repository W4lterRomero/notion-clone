'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { X, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { DatabaseRow } from '@/hooks/useDatabaseRows'
import { DatabaseProperty } from '@/hooks/useDatabases'

interface DayModalProps {
    isOpen: boolean
    date: Date | null
    events: DatabaseRow[]
    properties: DatabaseProperty[]
    onClose: () => void
    onEventClick: (row: DatabaseRow) => void
    onAddEvent?: () => void
}

const DayModal = React.memo(function DayModal({
    isOpen,
    date,
    events,
    properties,
    onClose,
    onEventClick,
    onAddEvent,
}: DayModalProps) {
    // Keyboard handler
    React.useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    const getPropertyValue = useCallback((row: DatabaseRow, propertyId: string) => {
        return row.propertyValues?.find(pv => pv.propertyId === propertyId)?.value
    }, [])

    // Get select property for colors
    const selectProperty = properties.find(p => p.type === 'select')

    return (
        <AnimatePresence>
            {isOpen && date && (
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
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-background rounded-2xl shadow-2xl border overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative px-6 py-5 border-b bg-gradient-to-r from-primary/10 to-primary/5">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <CalendarIcon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold capitalize">
                                        {format(date, 'EEEE', { locale: es })}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {format(date, "d 'de' MMMM, yyyy", { locale: es })}
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                onClick={onClose}
                                className="absolute right-4 top-4 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <X size={18} />
                            </motion.button>
                        </div>

                        {/* Events */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {events.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No hay eventos para este día</p>
                                </div>
                            ) : (
                                <div className="p-4 space-y-2">
                                    {events.map((event, index) => {
                                        const selectValue = selectProperty
                                            ? getPropertyValue(event, selectProperty.id) as string
                                            : null

                                        return (
                                            <motion.button
                                                key={event.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                onClick={() => onEventClick(event)}
                                                className="w-full text-left p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {event.icon && (
                                                        <span className="text-2xl">{event.icon}</span>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate group-hover:text-primary transition-colors">
                                                            {event.title || 'Sin título'}
                                                        </div>
                                                        {selectValue && (
                                                            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                                {selectValue}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-4 border-t bg-muted/20">
                            <motion.button
                                onClick={onAddEvent}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <Plus size={18} />
                                <span>Agregar evento</span>
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
})

export default DayModal
