'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, X } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { useUpdateRowValue } from '@/hooks/useDatabaseRows'
import { useUpdateProperty } from '@/hooks/useDatabaseProperties'
import { v4 as uuidv4 } from 'uuid'

// Color palette for select options
export const OPTION_COLORS: Record<string, { bg: string; text: string }> = {
    red: { bg: 'bg-red-100', text: 'text-red-700' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    green: { bg: 'bg-green-100', text: 'text-green-700' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-700' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-700' },
}

export interface SelectOption {
    id: string
    name: string
    color: string
}

interface SelectCellProps {
    databaseId: string
    rowId: string
    property: DatabaseProperty
    value: string | null
}

export default function SelectCell({
    databaseId,
    rowId,
    property,
    value,
}: SelectCellProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newOptionName, setNewOptionName] = useState('')
    const menuRef = useRef<HTMLDivElement>(null)
    const updateValueMutation = useUpdateRowValue()
    const updatePropertyMutation = useUpdateProperty()

    // Get options from property config
    const options: SelectOption[] = (property.config as { options?: SelectOption[] })?.options || []

    // Find selected option
    const selectedOption = options.find(opt => opt.id === value)

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

    const handleSelect = async (optionId: string | null) => {
        setIsOpen(false)
        await updateValueMutation.mutateAsync({
            databaseId,
            rowId,
            propertyId: property.id,
            value: optionId,
        })
    }

    const handleCreateOption = async () => {
        if (!newOptionName.trim()) return

        const newOption: SelectOption = {
            id: uuidv4(),
            name: newOptionName.trim(),
            color: Object.keys(OPTION_COLORS)[options.length % 8], // Cycle colors
        }

        const updatedOptions = [...options, newOption]

        // Update property config with new option
        await updatePropertyMutation.mutateAsync({
            databaseId,
            propertyId: property.id,
            config: { options: updatedOptions },
        })

        // Select the new option
        await handleSelect(newOption.id)
        setNewOptionName('')
        setIsCreating(false)
    }

    return (
        <div ref={menuRef} className="relative min-w-[150px]">
            {/* Trigger */}
            <div
                className="px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOption ? (
                    <span
                        className={`px-2 py-0.5 rounded text-sm ${OPTION_COLORS[selectedOption.color]?.bg || 'bg-gray-100'} ${OPTION_COLORS[selectedOption.color]?.text || 'text-gray-700'}`}
                    >
                        {selectedOption.name}
                    </span>
                ) : (
                    <span className="text-muted-foreground/50 text-sm">Seleccionar...</span>
                )}
                <ChevronDown size={14} className="text-muted-foreground" />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-popover border rounded-lg shadow-lg overflow-hidden">
                    {/* Clear option */}
                    {value && (
                        <div
                            className="px-3 py-2 text-sm text-muted-foreground hover:bg-muted cursor-pointer flex items-center gap-2"
                            onClick={() => handleSelect(null)}
                        >
                            <X size={14} />
                            <span>Limpiar selección</span>
                        </div>
                    )}

                    {/* Options list */}
                    {options.map((option) => (
                        <div
                            key={option.id}
                            className={`px-3 py-2 cursor-pointer hover:bg-muted transition-colors ${option.id === value ? 'bg-muted' : ''
                                }`}
                            onClick={() => handleSelect(option.id)}
                        >
                            <span
                                className={`px-2 py-0.5 rounded text-sm ${OPTION_COLORS[option.color]?.bg || 'bg-gray-100'} ${OPTION_COLORS[option.color]?.text || 'text-gray-700'}`}
                            >
                                {option.name}
                            </span>
                        </div>
                    ))}

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
