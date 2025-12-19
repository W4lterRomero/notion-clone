'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { DatabaseRow } from '@/hooks/useDatabaseRows'

interface CalendarDayCellProps {
    date: Date
    events: DatabaseRow[]
    isCurrentMonth: boolean
    isToday: boolean
    isWeekend: boolean
    onDayClick?: (date: Date) => void
    onAddRow?: (date: Date) => void
}

const CalendarDayCell = React.memo(function CalendarDayCell({
    date,
    events,
    isCurrentMonth,
    isToday,
    isWeekend,
    onDayClick,
    onAddRow,
}: CalendarDayCellProps) {
    const [isHovered, setIsHovered] = useState(false)
    const maxVisible = 2
    const hasMore = events.length > maxVisible

    const handleClick = useCallback(() => {
        onDayClick?.(date)
    }, [onDayClick, date])

    return (
        <motion.div
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                min-h-[120px] border-r border-b p-2 transition-all cursor-pointer relative
                ${!isCurrentMonth ? 'bg-muted/20' : 'bg-background'}
                ${isWeekend ? 'bg-muted/10' : ''}
                hover:bg-primary/5 hover:shadow-inner
            `}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.15 }}
        >
            {/* Date Number */}
            <div className="flex items-center justify-between mb-2">
                <motion.span
                    className={`
                        w-8 h-8 flex items-center justify-center text-sm font-medium rounded-full transition-all
                        ${isToday
                            ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30'
                            : !isCurrentMonth
                                ? 'text-muted-foreground/50'
                                : 'hover:bg-muted'
                        }
                    `}
                    animate={isToday ? {
                        boxShadow: ['0 0 0 0 rgba(var(--primary), 0.4)', '0 0 0 8px rgba(var(--primary), 0)', '0 0 0 0 rgba(var(--primary), 0.4)']
                    } : {}}
                    transition={isToday ? { duration: 2, repeat: Infinity } : {}}
                >
                    {format(date, 'd')}
                </motion.span>

                {/* Add button on hover */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={(e) => {
                                e.stopPropagation()
                                onAddRow?.(date)
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                            <Plus size={14} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Events */}
            <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                    {events.slice(0, maxVisible).map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ delay: index * 0.03 }}
                            className="group px-2 py-1 text-xs bg-primary/10 text-primary rounded-md truncate hover:bg-primary/20 transition-colors flex items-center gap-1"
                        >
                            {event.icon && <span className="text-[10px]">{event.icon}</span>}
                            <span className="truncate font-medium">
                                {event.title || 'Sin título'}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* More indicator */}
                {hasMore && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-2 py-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                        +{events.length - maxVisible} más
                    </motion.div>
                )}
            </div>

            {/* Hover overlay hint */}
            <AnimatePresence>
                {isHovered && events.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-background/90 to-transparent text-center"
                    >
                        <span className="text-[10px] text-muted-foreground">
                            Click para ver todo
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
})

export default CalendarDayCell
