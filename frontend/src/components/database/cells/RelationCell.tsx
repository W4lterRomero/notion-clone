'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Check, ChevronDown } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { useDatabaseRows, useUpdateRowValue } from '@/hooks/useDatabaseRows'

interface RelatedRow {
    id: string
    title: string
    icon: string | null
}

interface RelationCellProps {
    databaseId: string
    rowId: string
    property: DatabaseProperty
    value: string[] | null
    relatedRows?: RelatedRow[]
    workspaceId: string
}

export default function RelationCell({
    databaseId,
    rowId,
    property,
    value,
    relatedRows = [],
    workspaceId,
}: RelationCellProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const updateValueMutation = useUpdateRowValue()

    // Get config from property
    const config = property.config as { databaseId?: string; type?: string }
    const relatedDatabaseId = config?.databaseId

    // Fetch rows from the related database
    const { data: availableRows = [] } = useDatabaseRows(relatedDatabaseId || null)

    // Current selected IDs
    const selectedIds = value || []

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setSearch('')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Filter available rows by search
    const filteredRows = availableRows.filter((row) =>
        (row.title || 'Untitled').toLowerCase().includes(search.toLowerCase())
    )

    const handleToggle = async (targetRowId: string) => {
        const newValue = selectedIds.includes(targetRowId)
            ? selectedIds.filter((id) => id !== targetRowId)
            : [...selectedIds, targetRowId]

        await updateValueMutation.mutateAsync({
            databaseId,
            rowId,
            propertyId: property.id,
            value: newValue,
        })
    }

    const handleRemove = async (targetRowId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const newValue = selectedIds.filter((id) => id !== targetRowId)
        await updateValueMutation.mutateAsync({
            databaseId,
            rowId,
            propertyId: property.id,
            value: newValue,
        })
    }

    if (!relatedDatabaseId) {
        return (
            <div className="px-3 py-2 min-w-[150px] text-muted-foreground/50 text-sm">
                Configura la relación
            </div>
        )
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className="px-3 py-2 min-w-[150px] cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-1 flex-wrap"
                onClick={() => setIsOpen(!isOpen)}
            >
                {relatedRows.length > 0 ? (
                    relatedRows.map((row) => (
                        <span
                            key={row.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-sm"
                        >
                            {row.icon && <span>{row.icon}</span>}
                            <span className="truncate max-w-[100px]">{row.title}</span>
                            <button
                                onClick={(e) => handleRemove(row.id, e)}
                                className="ml-1 hover:text-destructive"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))
                ) : (
                    <span className="text-muted-foreground/50 text-sm flex items-center gap-1">
                        Seleccionar <ChevronDown size={14} />
                    </span>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-popover border rounded-lg shadow-lg z-50 max-h-64 overflow-hidden">
                    <div className="p-2 border-b">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filteredRows.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                                No hay filas disponibles
                            </div>
                        ) : (
                            filteredRows.map((row) => {
                                const isSelected = selectedIds.includes(row.id)
                                return (
                                    <div
                                        key={row.id}
                                        className={`px-3 py-2 cursor-pointer hover:bg-muted/50 flex items-center gap-2 ${isSelected ? 'bg-primary/10' : ''
                                            }`}
                                        onClick={() => handleToggle(row.id)}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'
                                            }`}>
                                            {isSelected && <Check size={12} />}
                                        </div>
                                        <span className="text-sm truncate">
                                            {row.icon && <span className="mr-1">{row.icon}</span>}
                                            {row.title || 'Untitled'}
                                        </span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
