'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Database, Link2, Calculator } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { useUpdateProperty } from '@/hooks/useDatabaseProperties'
import { OPTION_COLORS, SelectOption } from './cells/SelectCell'
import { usePages } from '@/hooks/usePages'

// Use native crypto.randomUUID instead of uuid package
const generateId = () => crypto.randomUUID()

interface PropertyConfigModalProps {
    isOpen: boolean
    onClose: () => void
    databaseId: string
    property: DatabaseProperty
    workspaceId: string
    allProperties: DatabaseProperty[]
}

const COLOR_OPTIONS = Object.keys(OPTION_COLORS) as (keyof typeof OPTION_COLORS)[]

const ROLLUP_FUNCTIONS = [
    { value: 'count', label: 'Cuenta' },
    { value: 'sum', label: 'Suma' },
    { value: 'average', label: 'Promedio' },
    { value: 'min', label: 'Mínimo' },
    { value: 'max', label: 'Máximo' },
    { value: 'range', label: 'Rango' },
    { value: 'show_original', label: 'Mostrar original' },
]

export default function PropertyConfigModal({
    isOpen,
    onClose,
    databaseId,
    property,
    workspaceId,
    allProperties,
}: PropertyConfigModalProps) {
    const updatePropertyMutation = useUpdateProperty()
    const [newOptionName, setNewOptionName] = useState('')
    const [selectedColor, setSelectedColor] = useState<string>('blue')

    // Fetch all pages/databases in workspace for relation config
    const { pages } = usePages(workspaceId)
    // Filter pages that are databases
    const databases = pages.filter((p) => p.type === 'database')

    // Relation config state
    const relationConfig = property.config as { databaseId?: string; type?: string }
    const [selectedDatabaseId, setSelectedDatabaseId] = useState(relationConfig?.databaseId || '')

    // Rollup config state
    const rollupConfig = property.config as {
        relationPropertyId?: string
        rollupPropertyId?: string
        function?: string
    }
    const [selectedRelationPropertyId, setSelectedRelationPropertyId] = useState(rollupConfig?.relationPropertyId || '')
    const [selectedRollupPropertyId, setSelectedRollupPropertyId] = useState(rollupConfig?.rollupPropertyId || '')
    const [selectedRollupFunction, setSelectedRollupFunction] = useState(rollupConfig?.function || 'count')

    // Get relation properties for rollup config
    const relationProperties = allProperties.filter(p => p.type === 'relation')

    // Get target database properties for rollup (from the related database)
    const selectedRelationProperty = relationProperties.find(p => p.id === selectedRelationPropertyId)
    const targetDatabaseId = (selectedRelationProperty?.config as { databaseId?: string })?.databaseId

    // We need to fetch target database properties - for now, show basic options
    // In a full implementation, you'd fetch these from the API

    useEffect(() => {
        setSelectedDatabaseId(relationConfig?.databaseId || '')
    }, [relationConfig?.databaseId])

    useEffect(() => {
        setSelectedRelationPropertyId(rollupConfig?.relationPropertyId || '')
        setSelectedRollupPropertyId(rollupConfig?.rollupPropertyId || '')
        setSelectedRollupFunction(rollupConfig?.function || 'count')
    }, [rollupConfig?.relationPropertyId, rollupConfig?.rollupPropertyId, rollupConfig?.function])

    if (!isOpen) return null

    // Get existing options for select/multi_select
    const options: SelectOption[] = (property.config as { options?: SelectOption[] })?.options || []

    const handleAddOption = async () => {
        if (!newOptionName.trim()) return

        const newOption: SelectOption = {
            id: generateId(),
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

    // Handle relation database change
    const handleRelationDatabaseChange = async (newDatabaseId: string) => {
        setSelectedDatabaseId(newDatabaseId)
        await updatePropertyMutation.mutateAsync({
            databaseId,
            propertyId: property.id,
            config: {
                databaseId: newDatabaseId,
                type: 'many_to_many',
            },
        })
    }

    // Handle rollup config change
    const handleRollupConfigChange = async (
        relationPropertyId: string,
        rollupPropertyId: string,
        func: string
    ) => {
        await updatePropertyMutation.mutateAsync({
            databaseId,
            propertyId: property.id,
            config: {
                relationPropertyId,
                rollupPropertyId,
                function: func,
            },
        })
    }

    const renderRelationConfig = () => (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary mb-2">
                <Link2 size={18} />
                <span className="font-medium">Configuración de Relación</span>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Database relacionada
                </label>
                <select
                    value={selectedDatabaseId}
                    onChange={(e) => handleRelationDatabaseChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">Seleccionar database...</option>
                    {databases
                        .filter(db => db.id !== databaseId) // Exclude current database
                        .map((db) => (
                            <option key={db.id} value={db.id}>
                                {db.icon && `${db.icon} `}{db.title || 'Sin título'}
                            </option>
                        ))
                    }
                </select>
            </div>

            {selectedDatabaseId && (
                <p className="text-xs text-muted-foreground">
                    Las filas de esta database podrán vincularse con filas de la database seleccionada.
                </p>
            )}
        </div>
    )

    const renderRollupConfig = () => (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary mb-2">
                <Calculator size={18} />
                <span className="font-medium">Configuración de Rollup</span>
            </div>

            {relationProperties.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    ⚠️ Primero debes crear una propiedad de tipo &quot;Relación&quot; para poder usar Rollup.
                </p>
            ) : (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Propiedad de relación
                        </label>
                        <select
                            value={selectedRelationPropertyId}
                            onChange={(e) => {
                                setSelectedRelationPropertyId(e.target.value)
                                handleRollupConfigChange(e.target.value, selectedRollupPropertyId, selectedRollupFunction)
                            }}
                            className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">Seleccionar relación...</option>
                            {relationProperties.map((prop) => (
                                <option key={prop.id} value={prop.id}>
                                    {prop.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Función de agregación
                        </label>
                        <select
                            value={selectedRollupFunction}
                            onChange={(e) => {
                                setSelectedRollupFunction(e.target.value)
                                handleRollupConfigChange(selectedRelationPropertyId, selectedRollupPropertyId, e.target.value)
                            }}
                            className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            {ROLLUP_FUNCTIONS.map((func) => (
                                <option key={func.value} value={func.value}>
                                    {func.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        El rollup calculará automáticamente valores basados en las filas relacionadas.
                    </p>
                </>
            )}
        </div>
    )

    const renderSelectConfig = () => (
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
    )

    const renderConfigContent = () => {
        switch (property.type) {
            case 'select':
            case 'multi_select':
                return renderSelectConfig()
            case 'relation':
                return renderRelationConfig()
            case 'rollup':
                return renderRollupConfig()
            default:
                return (
                    <p className="text-sm text-muted-foreground">
                        Este tipo de propiedad no tiene configuración adicional.
                    </p>
                )
        }
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
                    {renderConfigContent()}
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
