'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Plus, X } from 'lucide-react'
import { DatabaseRow } from '@/hooks/useDatabaseRows'

interface CalendarDayCellProps {
    date: Date
    events: DatabaseRow[]
    isCurrentMonth: boolean
    isToday: boolean
    isWeekend: boolean
}

export default function CalendarDayCell({
    date,
    events,
    isCurrentMonth,
    isToday,
    isWeekend,
}: CalendarDayCellProps) {
    const [showAll, setShowAll] = useState(false)
    const maxVisible = 3
    const hasMore = events.length > maxVisible

    return (
        <div
            className={`min-h-[100px] border-r border-b p-1.5 transition-colors ${!isCurrentMonth ? 'bg-muted/20' : ''
                } ${isWeekend ? 'bg-muted/10' : ''} hover:bg-muted/30`}
        >
            {/* Date Number */}
            <div className="flex items-center justify-between mb-1">
                <span
                    className={`w-7 h-7 flex items-center justify-center text-sm rounded-full transition-colors ${isToday
                            ? 'bg-primary text-primary-foreground font-bold'
                            : !isCurrentMonth
                                ? 'text-muted-foreground'
                                : ''
                        }`}
                >
                    {format(date, 'd')}
                </span>
                <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
                >
                    <Plus size={14} />
                </motion.button>
            </div>

            {/* Events */}
            <div className="space-y-1">
                <AnimatePresence>
                    {(showAll ? events : events.slice(0, maxVisible)).map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ delay: index * 0.02 }}
                            className="group px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded truncate cursor-pointer hover:bg-primary/20 transition-colors"
                        >
                            {event.icon && <span className="mr-1">{event.icon}</span>}
                            {event.title || 'Sin título'}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* More indicator */}
                {hasMore && !showAll && (
                    <motion.button
                        onClick={() => setShowAll(true)}
                        className="w-full text-left px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                        whileHover={{ x: 2 }}
                    >
                        +{events.length - maxVisible} más
                    </motion.button>
                )}

                {showAll && hasMore && (
                    <motion.button
                        onClick={() => setShowAll(false)}
                        className="w-full text-left px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                        whileHover={{ x: 2 }}
                    >
                        Mostrar menos
                    </motion.button>
                )}
            </div>
        </div>
    )
}
