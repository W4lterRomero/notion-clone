'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X, Check } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { useUpdateRowValue } from '@/hooks/useDatabaseRows'
import { useUpdateProperty } from '@/hooks/useDatabaseProperties'
import { OPTION_COLORS, COLOR_NAMES, SelectOption } from './SelectCell'
import { cn } from '@/lib/utils'

const generateId = () => crypto.randomUUID()

interface MultiSelectCellProps {
    databaseId: string
    rowId: string
    property: DatabaseProperty
    value: string[] | null
}

interface DropdownPosition {
    top: number
    left: number
    width: number
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
    const [position, setPosition] = useState<DropdownPosition>({ top: 0, left: 0, width: 200 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const updateValueMutation = useUpdateRowValue()
    const updatePropertyMutation = useUpdateProperty()

    const options: SelectOption[] = (property.config as { options?: SelectOption[] })?.options || []
    const selectedIds: string[] = Array.isArray(value) ? value : []
    const selectedOptions = options.filter(opt => selectedIds.includes(opt.id))

    // Calculate position when opening
    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            const dropdownHeight = 250
            const dropdownWidth = Math.max(rect.width, 200)
            const viewportHeight = window.innerHeight
            const viewportWidth = window.innerWidth
            const padding = 8

            // Vertical positioning
            const spaceBelow = viewportHeight - rect.bottom
            const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight

            // Horizontal positioning - ensure dropdown stays within viewport
            let left = rect.left
            if (left + dropdownWidth > viewportWidth - padding) {
                left = viewportWidth - dropdownWidth - padding
            }
            if (left < padding) {
                left = padding
            }

            setPosition({
                top: showAbove ? rect.top - dropdownHeight : rect.bottom + 4,
                left: left,
                width: Math.min(dropdownWidth, viewportWidth - padding * 2),
            })
        }
    }, [])

    // Update position when opening or on scroll/resize
    useEffect(() => {
        if (isOpen) {
            updatePosition()
            window.addEventListener('scroll', updatePosition, true)
            window.addEventListener('resize', updatePosition)
            return () => {
                window.removeEventListener('scroll', updatePosition, true)
                window.removeEventListener('resize', updatePosition)
            }
        }
    }, [isOpen, updatePosition])

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node
            if (
                triggerRef.current && !triggerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false)
                setIsCreating(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

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
            id: generateId(),
            name: newOptionName.trim(),
            color: COLOR_NAMES[options.length % COLOR_NAMES.length],
        }

        await updatePropertyMutation.mutateAsync({
            databaseId,
            propertyId: property.id,
            config: { options: [...options, newOption] },
        })

        // Also select the new option
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

    const handleOpenToggle = () => {
        if (!isOpen) updatePosition()
        setIsOpen(!isOpen)
    }

    // Dropdown content rendered via Portal
    const dropdownContent = isOpen && typeof document !== 'undefined' ? createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setIsOpen(false)}
            />
            {/* Dropdown */}
            <div
                ref={dropdownRef}
                className="fixed z-[9999] bg-popover border rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
                style={{
                    top: position.top,
                    left: position.left,
                    minWidth: position.width,
                    maxWidth: 300,
                }}
            >
                {/* Options list */}
                <div className="max-h-48 overflow-y-auto">
                    {options.map((option) => {
                        const isSelected = selectedIds.includes(option.id)
                        return (
                            <div
                                key={option.id}
                                className={cn(
                                    "px-3 py-2 cursor-pointer hover:bg-muted transition-colors flex items-center justify-between",
                                    isSelected && "bg-muted/50"
                                )}
                                onClick={() => handleToggle(option.id)}
                            >
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-sm font-medium",
                                    OPTION_COLORS[option.color]?.bg,
                                    OPTION_COLORS[option.color]?.text
                                )}>
                                    {option.name}
                                </span>
                                {isSelected && <Check size={14} className="text-primary" />}
                            </div>
                        )
                    })}

                    {options.length === 0 && !isCreating && (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                            Sin opciones
                        </div>
                    )}
                </div>

                {/* Create new option */}
                {isCreating ? (
                    <div className="p-2 border-t">
                        <input
                            type="text"
                            value={newOptionName}
                            onChange={(e) => setNewOptionName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateOption()
                                if (e.key === 'Escape') setIsCreating(false)
                            }}
                            className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                            placeholder="Nombre de opción..."
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
        </>,
        document.body
    ) : null

    return (
        <div className="relative w-full">
            {/* Trigger */}
            <div
                ref={triggerRef}
                className="px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-1 flex-wrap min-h-[40px]"
                onClick={handleOpenToggle}
            >
                {selectedOptions.length > 0 ? (
                    selectedOptions.map((option) => (
                        <span
                            key={option.id}
                            className={cn(
                                "px-2 py-0.5 rounded text-sm font-medium flex items-center gap-1",
                                OPTION_COLORS[option.color]?.bg,
                                OPTION_COLORS[option.color]?.text
                            )}
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

            {/* Portal dropdown */}
            {dropdownContent}
        </div>
    )
}
