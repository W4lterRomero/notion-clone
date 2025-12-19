'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { useDatabaseProperties } from '@/hooks/useDatabaseProperties'
import { useDatabaseRows, useCreateRow, useUpdateRowValue, DatabaseRow } from '@/hooks/useDatabaseRows'
import { useDatabaseViews, useUpdateView } from '@/hooks/useDatabaseViews'
import CalendarDayCell from './CalendarDayCell'
import DayModal from './DayModal'
import FullPagePeek from './FullPagePeek'
import ViewSkeleton from './ViewSkeleton'
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react'

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
    // Modal states
    const [selectedDay, setSelectedDay] = useState<Date | null>(null)
    const [selectedRow, setSelectedRow] = useState<DatabaseRow | null>(null)

    // Find the date property
    const dateProperty = properties?.find(p => p.id === viewConfig.dateProperty)
    const dateProperties = properties?.filter(p => p.type === 'date') || []

    // Get calendar days - memoized for performance
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    }, [currentMonth])

    // Group rows by date - memoized for performance
    const eventsByDate = useMemo(() => {
        if (!dateProperty || !rows) return {}
        const grouped: Record<string, DatabaseRow[]> = {}
        rows.forEach(row => {
            const propValue = row.propertyValues?.find(pv => pv.propertyId === dateProperty.id)
            // Handle both string format (legacy) and object format (new DateCell)
            let dateString: string | null = null

            if (typeof propValue?.value === 'string') {
                dateString = propValue.value
            } else if (typeof propValue?.value === 'object' && propValue?.value !== null) {
                // Cast to unknown first then to the expected shape to avoid TS errors
                const dateObj = propValue.value as unknown as { start?: string }
                if (dateObj.start) dateString = dateObj.start
            }

            if (dateString) {
                try {
                    const dateKey = format(new Date(dateString), 'yyyy-MM-dd')
                    if (!grouped[dateKey]) grouped[dateKey] = []
                    grouped[dateKey].push(row)
                } catch (e) {
                    console.error('Invalid date format:', dateString)
                }
            }
        })
        return grouped
    }, [dateProperty, rows])

    // Get events for selected day
    const selectedDayEvents = useMemo(() => {
        if (!selectedDay) return []
        const dateKey = format(selectedDay, 'yyyy-MM-dd')
        return eventsByDate[dateKey] || []
    }, [selectedDay, eventsByDate])

    // Handler to select date property for calendar
    const selectDateProperty = useCallback(async (propertyId: string) => {
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
    }, [views, databaseId, viewConfig.showWeekends, updateViewMutation])

    // Navigation handlers
    const goToPreviousMonth = useCallback(() => setCurrentMonth(prev => subMonths(prev, 1)), [])
    const goToNextMonth = useCallback(() => setCurrentMonth(prev => addMonths(prev, 1)), [])
    const goToToday = useCallback(() => setCurrentMonth(new Date()), [])

    // Day click handler
    const handleDayClick = useCallback((date: Date) => {
        setSelectedDay(date)
    }, [])

    const createRowMutation = useCreateRow()
    const updateValueMutation = useUpdateRowValue()

    // Add row handler
    const handleAddRow = useCallback(async (date: Date) => {
        if (!dateProperty) return
        try {
            // 1. Create empty row
            const newRow = await createRowMutation.mutateAsync({
                databaseId,
                title: '',
            })

            // 2. Set date immediately
            const dateStr = format(date, 'yyyy-MM-dd')
            // DateCell expects string in some places, object in others. 
            // The backend usually expects { start: ... } for dates or just the string if simplified.
            // Based on `DateCell` reading logic in `CalendarView` (lines 60-65), it reads both.
            // But `DateCell` WRITES { start: date } usually.
            // Let's send the object structure to be safe and consistent with DateCell.
            await updateValueMutation.mutateAsync({
                databaseId,
                rowId: newRow.id,
                propertyId: dateProperty.id,
                value: { start: dateStr }
            })

            // 3. Open the new row
            // We need to fetch the row or just use the object we have. 
            // newRow from create might not have the property set yet in its return value.
            // But we can set it manually for the UI or just let invalidation handle it.
            // Let's set selectedRow to newRow for now.
            setSelectedRow({
                ...newRow,
                propertyValues: [
                    ...(newRow.propertyValues || []),
                    {
                        id: 'temp',
                        rowId: newRow.id,
                        propertyId: dateProperty.id,
                        value: { start: dateStr },
                        property: dateProperty
                    }
                ] as any
            })

        } catch (e) {
            console.error('Failed to create row', e)
        }
    }, [createRowMutation, updateValueMutation, databaseId, dateProperty])

    // Event click handler (from DayModal)
    const handleEventClick = useCallback((row: DatabaseRow) => {
        setSelectedRow(row)
    }, [])

    // Row navigation in peek modal
    const handleRowNavigate = useCallback((direction: 'prev' | 'next') => {
        if (!selectedRow || !selectedDayEvents.length) return
        const currentIndex = selectedDayEvents.findIndex(r => r.id === selectedRow.id)
        if (direction === 'prev' && currentIndex > 0) {
            setSelectedRow(selectedDayEvents[currentIndex - 1])
        } else if (direction === 'next' && currentIndex < selectedDayEvents.length - 1) {
            setSelectedRow(selectedDayEvents[currentIndex + 1])
        }
    }, [selectedRow, selectedDayEvents])

    // Show skeleton during loading
    if (loadingProps || loadingRows) {
        return <ViewSkeleton type="calendar" />
    }

    // Show config prompt if no date property selected
    if (!viewConfig.dateProperty || !dateProperty) {
        return (
            <div className="border rounded-xl p-8 text-center bg-gradient-to-br from-muted/30 to-background">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Settings className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Configurar Calendar View</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Selecciona una propiedad de tipo Fecha para mostrar eventos en el calendario
                </p>
                {dateProperties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No hay propiedades Date. Crea una primero en la vista de tabla.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {dateProperties.map(prop => (
                            <motion.button
                                key={prop.id}
                                onClick={() => selectDateProperty(prop.id)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                📅 {prop.name}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    return (
        <>
            <div className="border rounded-xl overflow-hidden shadow-sm">
                {/* Calendar Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-muted/40 to-muted/20 border-b">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-background/80 rounded-lg p-1 shadow-sm">
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
                        <h2 className="text-xl font-bold capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h2>
                    </div>
                    <motion.button
                        onClick={goToToday}
                        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Hoy
                    </motion.button>
                </div>

                {/* Week Day Headers */}
                <div className="grid grid-cols-7 border-b bg-muted/10">
                    {weekDays.map((day, index) => {
                        const isWeekend = index === 0 || index === 6
                        const hidden = !viewConfig.showWeekends && isWeekend
                        if (hidden) return null
                        return (
                            <div
                                key={day}
                                className={`p-3 text-center text-sm font-semibold ${isWeekend ? 'text-muted-foreground/70' : 'text-foreground'
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
                                transition={{ delay: index * 0.008 }}
                            >
                                <CalendarDayCell
                                    date={day}
                                    events={events}
                                    isCurrentMonth={isCurrentMonth}
                                    isToday={isToday}
                                    isWeekend={isWeekend}
                                    onDayClick={handleDayClick}
                                    onAddRow={handleAddRow}
                                />
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* Day Events Modal */}
            <DayModal
                isOpen={!!selectedDay && !selectedRow}
                date={selectedDay}
                events={selectedDayEvents}
                properties={properties || []}
                onClose={() => setSelectedDay(null)}
                onEventClick={handleEventClick}
            />

            {/* Row Peek Modal */}
            <FullPagePeek
                row={selectedRow}
                rows={selectedDayEvents}
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

