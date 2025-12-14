'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, X } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { useUpdateRowValue } from '@/hooks/useDatabaseRows'

interface DateValue {
    start: string | null
    end?: string | null
}

interface DateCellProps {
    databaseId: string
    rowId: string
    property: DatabaseProperty
    value: DateValue | string | null
}

export default function DateCell({
    databaseId,
    rowId,
    property,
    value,
}: DateCellProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const updateValueMutation = useUpdateRowValue()

    // Normalize value to DateValue format
    const dateValue: DateValue = typeof value === 'string'
        ? { start: value, end: null }
        : value || { start: null, end: null }

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return null
        try {
            const date = new Date(dateStr)
            return date.toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })
        } catch {
            return dateStr
        }
    }

    const handleDateChange = async (newStart: string | null) => {
        const newValue: DateValue = { start: newStart, end: null }
        await updateValueMutation.mutateAsync({
            databaseId,
            rowId,
            propertyId: property.id,
            value: newValue,
        })
    }

    const handleClear = async () => {
        await updateValueMutation.mutateAsync({
            databaseId,
            rowId,
            propertyId: property.id,
            value: null,
        })
        setIsOpen(false)
    }

    const displayDate = formatDate(dateValue.start)

    return (
        <div ref={menuRef} className="relative min-w-[150px]">
            {/* Trigger */}
            <div
                className="px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Calendar size={14} className="text-muted-foreground" />
                {displayDate ? (
                    <span className="text-sm">{displayDate}</span>
                ) : (
                    <span className="text-muted-foreground/50 text-sm">Sin fecha</span>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg p-4 min-w-[250px]">
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Fecha</label>
                        <input
                            type="date"
                            value={dateValue.start || ''}
                            onChange={(e) => handleDateChange(e.target.value || null)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-2 border-t">
                        {dateValue.start && (
                            <button
                                onClick={handleClear}
                                className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                            >
                                <X size={14} />
                                Limpiar
                            </button>
                        )}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="ml-auto px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                        >
                            Listo
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
