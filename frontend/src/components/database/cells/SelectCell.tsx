'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Plus, X, Check } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { useUpdateRowValue } from '@/hooks/useDatabaseRows'
import { useUpdateProperty } from '@/hooks/useDatabaseProperties'
import { cn } from '@/lib/utils'

const generateId = () => crypto.randomUUID()

// Clean, Notion-like color palette
export const OPTION_COLORS: Record<string, { bg: string; text: string }> = {
    red: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-200' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-800 dark:text-orange-200' },
    yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-200' },
    green: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-200' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-800 dark:text-blue-200' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-200' },
    pink: { bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-800 dark:text-pink-200' },
    gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-200' },
}

export const COLOR_NAMES = Object.keys(OPTION_COLORS)

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

interface DropdownPosition {
    top: number
    left: number
    width: number
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
    const [position, setPosition] = useState<DropdownPosition>({ top: 0, left: 0, width: 200 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const updateValueMutation = useUpdateRowValue()
    const updatePropertyMutation = useUpdateProperty()

    const options: SelectOption[] = (property.config as { options?: SelectOption[] })?.options || []
    const selectedOption = options.find(opt => opt.id === value)

    // Calculate position when opening
    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            const dropdownHeight = 250 // approximate max height
            const dropdownWidth = Math.max(rect.width, 200)
            const viewportHeight = window.innerHeight
            const viewportWidth = window.innerWidth
            const padding = 8 // padding from viewport edges

            // Vertical positioning
            const spaceBelow = viewportHeight - rect.bottom
            const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight

            // Horizontal positioning - ensure dropdown doesn't go off-screen
            let left = rect.left
            if (left + dropdownWidth > viewportWidth - padding) {
                // Align to right edge of viewport
                left = viewportWidth - dropdownWidth - padding
            }
            if (left < padding) {
                // Ensure minimum left padding
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
            id: generateId(),
            name: newOptionName.trim(),
            color: COLOR_NAMES[options.length % COLOR_NAMES.length],
        }

        await updatePropertyMutation.mutateAsync({
            databaseId,
            propertyId: property.id,
            config: { options: [...options, newOption] },
        })

        await handleSelect(newOption.id)
        setNewOptionName('')
        setIsCreating(false)
    }

    const handleToggle = () => {
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
                {/* Clear option */}
                {value && (
                    <div
                        className="px-3 py-2 text-sm text-muted-foreground hover:bg-muted cursor-pointer flex items-center gap-2 border-b"
                        onClick={() => handleSelect(null)}
                    >
                        <X size={14} />
                        <span>Limpiar</span>
                    </div>
                )}

                {/* Options list */}
                <div className="max-h-48 overflow-y-auto">
                    {options.length === 0 && !isCreating && (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                            Sin opciones
                        </div>
                    )}
                    {options.map((option) => (
                        <div
                            key={option.id}
                            className={cn(
                                "px-3 py-2 cursor-pointer hover:bg-muted transition-colors flex items-center justify-between",
                                option.id === value && "bg-muted"
                            )}
                            onClick={() => handleSelect(option.id)}
                        >
                            <span className={cn(
                                "px-2 py-0.5 rounded text-sm font-medium",
                                OPTION_COLORS[option.color]?.bg,
                                OPTION_COLORS[option.color]?.text
                            )}>
                                {option.name}
                            </span>
                            {option.id === value && <Check size={14} className="text-primary" />}
                        </div>
                    ))}
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
                className="px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between min-h-[40px]"
                onClick={handleToggle}
            >
                {selectedOption ? (
                    <span className={cn(
                        "px-2 py-0.5 rounded text-sm font-medium",
                        OPTION_COLORS[selectedOption.color]?.bg,
                        OPTION_COLORS[selectedOption.color]?.text
                    )}>
                        {selectedOption.name}
                    </span>
                ) : (
                    <span className="text-muted-foreground/50 text-sm">Seleccionar...</span>
                )}
                <ChevronDown size={14} className={cn(
                    "text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                )} />
            </div>

            {/* Portal dropdown */}
            {dropdownContent}
        </div>
    )
}
