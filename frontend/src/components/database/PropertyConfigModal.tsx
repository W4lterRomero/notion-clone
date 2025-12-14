'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { useUpdateProperty } from '@/hooks/useDatabaseProperties'
import { OPTION_COLORS, SelectOption } from './cells/SelectCell'
import { v4 as uuidv4 } from 'uuid'

interface PropertyConfigModalProps {
    isOpen: boolean
    onClose: () => void
    databaseId: string
    property: DatabaseProperty
}

const COLOR_OPTIONS = Object.keys(OPTION_COLORS) as (keyof typeof OPTION_COLORS)[]

export default function PropertyConfigModal({
    isOpen,
    onClose,
    databaseId,
    property,
}: PropertyConfigModalProps) {
    const updatePropertyMutation = useUpdateProperty()
    const [newOptionName, setNewOptionName] = useState('')
    const [selectedColor, setSelectedColor] = useState<string>('blue')

    if (!isOpen) return null

    // Get existing options
    const options: SelectOption[] = (property.config as { options?: SelectOption[] })?.options || []

    const handleAddOption = async () => {
        if (!newOptionName.trim()) return

        const newOption: SelectOption = {
            id: uuidv4(),
            name: newOptionName.trim(),
            color: selectedColor,
        }

        await updatePropertyMutation.mutateAsync({
            databaseId,
            propertyId: property.id,
            config: { options: [...options, newOption] },
        })

        setNewOptionName('')
        setSelectedColor('blue')
    }

    const handleRemoveOption = async (optionId: string) => {
        const updatedOptions = options.filter(opt => opt.id !== optionId)
        await updatePropertyMutation.mutateAsync({
            databaseId,
            propertyId: property.id,
            config: { options: updatedOptions },
        })
    }

    const handleUpdateOptionColor = async (optionId: string, newColor: string) => {
        const updatedOptions = options.map(opt =>
            opt.id === optionId ? { ...opt, color: newColor } : opt
        )
        await updatePropertyMutation.mutateAsync({
            databaseId,
            propertyId: property.id,
            config: { options: updatedOptions },
        })
    }

    const handleUpdateOptionName = async (optionId: string, newName: string) => {
        if (!newName.trim()) return
        const updatedOptions = options.map(opt =>
            opt.id === optionId ? { ...opt, name: newName.trim() } : opt
        )
        await updatePropertyMutation.mutateAsync({
            databaseId,
            propertyId: property.id,
            config: { options: updatedOptions },
        })
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-md border">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">
                        Configurar {property.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {property.type === 'select' || property.type === 'multi_select' ? (
                        <>
                            <p className="text-sm text-muted-foreground mb-4">
                                Opciones disponibles
                            </p>

                            {/* Existing options */}
                            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                                {options.map((option) => (
                                    <div
                                        key={option.id}
                                        className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50"
                                    >
                                        {/* Color picker */}
                                        <div className="relative group">
                                            <div
                                                className={`w-6 h-6 rounded cursor-pointer ${OPTION_COLORS[option.color]?.bg || 'bg-gray-100'}`}
                                            />
                                            <div className="absolute hidden group-hover:flex top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg p-2 gap-1 flex-wrap w-32 z-10">
                                                {COLOR_OPTIONS.map((color) => (
                                                    <div
                                                        key={color}
                                                        className={`w-6 h-6 rounded cursor-pointer ${OPTION_COLORS[color]?.bg} ${option.color === color ? 'ring-2 ring-primary' : ''
                                                            }`}
                                                        onClick={() => handleUpdateOptionColor(option.id, color)}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Name input */}
                                        <input
                                            type="text"
                                            defaultValue={option.name}
                                            onBlur={(e) => handleUpdateOptionName(option.id, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.currentTarget.blur()
                                                }
                                            }}
                                            className="flex-1 px-2 py-1 text-sm border-transparent hover:border-input border rounded focus:outline-none focus:ring-2 focus:ring-primary/50 bg-transparent"
                                        />

                                        {/* Delete button */}
                                        <button
                                            onClick={() => handleRemoveOption(option.id)}
                                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add new option */}
                            <div className="flex items-center gap-2 p-2 rounded border">
                                {/* Color selector for new option */}
                                <div className="relative group">
                                    <div
                                        className={`w-6 h-6 rounded cursor-pointer ${OPTION_COLORS[selectedColor]?.bg || 'bg-blue-100'}`}
                                    />
                                    <div className="absolute hidden group-hover:flex top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg p-2 gap-1 flex-wrap w-32 z-10">
                                        {COLOR_OPTIONS.map((color) => (
                                            <div
                                                key={color}
                                                className={`w-6 h-6 rounded cursor-pointer ${OPTION_COLORS[color]?.bg} ${selectedColor === color ? 'ring-2 ring-primary' : ''
                                                    }`}
                                                onClick={() => setSelectedColor(color)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    value={newOptionName}
                                    onChange={(e) => setNewOptionName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddOption()
                                    }}
                                    className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Nueva opción..."
                                />

                                <button
                                    onClick={handleAddOption}
                                    disabled={!newOptionName.trim()}
                                    className="p-1 text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-50"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Este tipo de propiedad no tiene configuración adicional.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}
