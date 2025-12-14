'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { useUpdateRowValue } from '@/hooks/useDatabaseRows'
import { useUpdateProperty } from '@/hooks/useDatabaseProperties'
import { OPTION_COLORS, SelectOption } from './SelectCell'
import { v4 as uuidv4 } from 'uuid'

interface MultiSelectCellProps {
    databaseId: string
    rowId: string
    property: DatabaseProperty
    value: string[] | null
}

export default function MultiSelectCell({
    databaseId,
    rowId,
    property,
    value,
}: MultiSelectCellProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newOptionName, setNewOptionName] = useState('')
    const menuRef = useRef<HTMLDivElement>(null)
    const updateValueMutation = useUpdateRowValue()
    const updatePropertyMutation = useUpdateProperty()

    // Get options from property config
    const options: SelectOption[] = (property.config as { options?: SelectOption[] })?.options || []

    // Selected IDs (ensure array)
    const selectedIds: string[] = Array.isArray(value) ? value : []

    // Selected options
    const selectedOptions = options.filter(opt => selectedIds.includes(opt.id))

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false)
                setIsCreating(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleToggle = async (optionId: string) => {
        const isSelected = selectedIds.includes(optionId)
        const newValue = isSelected
            ? selectedIds.filter(id => id !== optionId)
            : [...selectedIds, optionId]

        await updateValueMutation.mutateAsync({
            databaseId,
            rowId,
            propertyId: property.id,
            value: newValue,
        })
    }

    const handleRemove = async (optionId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const newValue = selectedIds.filter(id => id !== optionId)
        await updateValueMutation.mutateAsync({
            databaseId,
            rowId,
            propertyId: property.id,
            value: newValue,
        })
    }

    const handleCreateOption = async () => {
        if (!newOptionName.trim()) return

        const newOption: SelectOption = {
            id: uuidv4(),
            name: newOptionName.trim(),
            color: Object.keys(OPTION_COLORS)[options.length % 8],
        }

        const updatedOptions = [...options, newOption]

        // Update property config with new option
        await updatePropertyMutation.mutateAsync({
            databaseId,
            propertyId: property.id,
            config: { options: updatedOptions },
        })

        // Add to selection
        const newValue = [...selectedIds, newOption.id]
        await updateValueMutation.mutateAsync({
            databaseId,
            rowId,
            propertyId: property.id,
            value: newValue,
        })

        setNewOptionName('')
        setIsCreating(false)
    }

    return (
        <div ref={menuRef} className="relative min-w-[150px]">
            {/* Trigger */}
            <div
                className="px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-1 flex-wrap min-h-[40px]"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOptions.length > 0 ? (
                    selectedOptions.map((option) => (
                        <span
                            key={option.id}
                            className={`px-2 py-0.5 rounded text-sm flex items-center gap-1 ${OPTION_COLORS[option.color]?.bg || 'bg-gray-100'} ${OPTION_COLORS[option.color]?.text || 'text-gray-700'}`}
                        >
                            {option.name}
                            <X
                                size={12}
                                className="cursor-pointer hover:opacity-70"
                                onClick={(e) => handleRemove(option.id, e)}
                            />
                        </span>
                    ))
                ) : (
                    <span className="text-muted-foreground/50 text-sm">Seleccionar...</span>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-popover border rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                    {/* Options list */}
                    {options.map((option) => {
                        const isSelected = selectedIds.includes(option.id)
                        return (
                            <div
                                key={option.id}
                                className={`px-3 py-2 cursor-pointer hover:bg-muted transition-colors flex items-center justify-between ${isSelected ? 'bg-muted/50' : ''
                                    }`}
                                onClick={() => handleToggle(option.id)}
                            >
                                <span
                                    className={`px-2 py-0.5 rounded text-sm ${OPTION_COLORS[option.color]?.bg || 'bg-gray-100'} ${OPTION_COLORS[option.color]?.text || 'text-gray-700'}`}
                                >
                                    {option.name}
                                </span>
                                {isSelected && (
                                    <span className="text-primary text-sm">✓</span>
                                )}
                            </div>
                        )
                    })}

                    {/* Create new option */}
                    {isCreating ? (
                        <div className="px-3 py-2 border-t">
                            <input
                                type="text"
                                value={newOptionName}
                                onChange={(e) => setNewOptionName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateOption()
                                    if (e.key === 'Escape') setIsCreating(false)
                                }}
                                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Nombre de opción"
                                autoFocus
                            />
                        </div>
                    ) : (
                        <div
                            className="px-3 py-2 border-t text-sm text-muted-foreground hover:bg-muted cursor-pointer flex items-center gap-2"
                            onClick={() => setIsCreating(true)}
                        >
                            <Plus size={14} />
                            <span>Crear opción</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
