'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { useDatabaseProperties } from '@/hooks/useDatabaseProperties'
import { useDatabaseRows } from '@/hooks/useDatabaseRows'
import { useDatabaseViews, useUpdateView } from '@/hooks/useDatabaseViews'
import CalendarDayCell from './CalendarDayCell'
import { ChevronLeft, ChevronRight, Settings, Loader2 } from 'lucide-react'

interface CalendarViewProps {
    databaseId: string
    workspaceId: string
    viewConfig: {
        dateProperty?: string
        showWeekends?: boolean
        sorts?: Array<{ propertyId: string; direction: 'asc' | 'desc' }>
    }
}

export default function CalendarView({ databaseId, workspaceId, viewConfig }: CalendarViewProps) {
    const { data: properties, isLoading: loadingProps } = useDatabaseProperties(databaseId)
    const { data: rows, isLoading: loadingRows } = useDatabaseRows(databaseId)
    const { data: views } = useDatabaseViews(databaseId)
    const updateViewMutation = useUpdateView()

    const [currentMonth, setCurrentMonth] = useState(new Date())

    // Find the date property
    const dateProperty = properties?.find(p => p.id === viewConfig.dateProperty)
    const dateProperties = properties?.filter(p => p.type === 'date') || []

    // Get calendar days
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    }, [currentMonth])

    // Group rows by date
    const eventsByDate = useMemo(() => {
        if (!dateProperty || !rows) return {}

        const grouped: Record<string, typeof rows> = {}

        rows.forEach(row => {
            const propValue = row.propertyValues?.find(pv => pv.propertyId === dateProperty.id)
            const dateValue = propValue?.value as string

            if (dateValue) {
                const dateKey = format(new Date(dateValue), 'yyyy-MM-dd')
                if (!grouped[dateKey]) grouped[dateKey] = []
                grouped[dateKey].push(row)
            }
        })

        return grouped
    }, [dateProperty, rows])

    // Handler to select date property for calendar
    const selectDateProperty = async (propertyId: string) => {
        // Find the calendar view that uses this viewConfig
        const calendarView = views?.find(v => v.type === 'calendar')
        if (!calendarView) return

        await updateViewMutation.mutateAsync({
            databaseId,
            viewId: calendarView.id,
            config: {
                ...(calendarView.config as Record<string, unknown>),
                dateProperty: propertyId,
                showWeekends: viewConfig.showWeekends ?? true,
            } as Record<string, unknown>,
        })
    }

    const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const goToToday = () => setCurrentMonth(new Date())

    if (loadingProps || loadingRows) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Show config prompt if no date property selected
    if (!viewConfig.dateProperty || !dateProperty) {
        return (
            <div className="border rounded-lg p-8 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Configurar Calendar View</h3>
                <p className="text-muted-foreground mb-4">
                    Selecciona una propiedad Date para mostrar eventos
                </p>
                {dateProperties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No hay propiedades Date. Crea una primero.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {dateProperties.map(prop => (
                            <button
                                key={prop.id}
                                onClick={() => selectDateProperty(prop.id)}
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

    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    return (
        <div className="border rounded-xl overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <motion.button
                            onClick={goToPreviousMonth}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <ChevronLeft size={18} />
                        </motion.button>
                        <motion.button
                            onClick={goToNextMonth}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <ChevronRight size={18} />
                        </motion.button>
                    </div>
                    <h2 className="text-lg font-semibold capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h2>
                </div>
                <motion.button
                    onClick={goToToday}
                    className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Hoy
                </motion.button>
            </div>

            {/* Week Day Headers */}
            <div className="grid grid-cols-7 border-b bg-muted/20">
                {weekDays.map((day, index) => {
                    const isWeekend = index === 0 || index === 6
                    const hidden = !viewConfig.showWeekends && isWeekend

                    if (hidden) return null

                    return (
                        <div
                            key={day}
                            className={`p-3 text-center text-sm font-medium ${isWeekend ? 'text-muted-foreground' : ''
                                }`}
                        >
                            {day}
                        </div>
                    )
                })}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6
                    const hidden = !viewConfig.showWeekends && isWeekend

                    if (hidden) return null

                    const dateKey = format(day, 'yyyy-MM-dd')
                    const events = eventsByDate[dateKey] || []
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isToday = isSameDay(day, new Date())

                    return (
                        <motion.div
                            key={dateKey}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.01 }}
                        >
                            <CalendarDayCell
                                date={day}
                                events={events}
                                isCurrentMonth={isCurrentMonth}
                                isToday={isToday}
                                isWeekend={isWeekend}
                            />
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
