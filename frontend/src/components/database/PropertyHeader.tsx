'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Settings, Type, Hash, Calendar, CheckSquare, Link, AtSign, Phone, Users, List, Tag, Trash2, MoreHorizontal } from 'lucide-react'
import { DatabaseProperty, PropertyType } from '@/hooks/useDatabases'
import { useCreateProperty, useDeleteProperty } from '@/hooks/useDatabaseProperties'
import PropertyConfigModal from './PropertyConfigModal'

interface PropertyHeaderProps {
    databaseId: string
    property?: DatabaseProperty
    isAddButton?: boolean
    workspaceId?: string
    allProperties?: DatabaseProperty[]
}

const propertyTypeIcons: Record<PropertyType, React.ReactNode> = {
    title: <Type size={14} />,
    text: <Type size={14} />,
    number: <Hash size={14} />,
    select: <List size={14} />,
    multi_select: <Tag size={14} />,
    date: <Calendar size={14} />,
    person: <Users size={14} />,
    checkbox: <CheckSquare size={14} />,
    url: <Link size={14} />,
    email: <AtSign size={14} />,
    phone: <Phone size={14} />,
    relation: <Link size={14} />,
    rollup: <Hash size={14} />,
    formula: <Hash size={14} />,
}

const propertyTypes: { type: PropertyType; label: string }[] = [
    { type: 'text', label: 'Texto' },
    { type: 'number', label: 'Número' },
    { type: 'select', label: 'Selección' },
    { type: 'multi_select', label: 'Multi-selección' },
    { type: 'date', label: 'Fecha' },
    { type: 'person', label: 'Persona' },
    { type: 'checkbox', label: 'Casilla' },
    { type: 'url', label: 'URL' },
    { type: 'email', label: 'Email' },
    { type: 'phone', label: 'Teléfono' },
    { type: 'relation', label: 'Relación' },
    { type: 'rollup', label: 'Rollup' },
    { type: 'formula', label: 'Fórmula' },
]

export default function PropertyHeader({
    databaseId,
    property,
    isAddButton,
    workspaceId = '',
    allProperties = [],
}: PropertyHeaderProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [isSelectingType, setIsSelectingType] = useState(false)
    const [isConfigOpen, setIsConfigOpen] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [newPropertyName, setNewPropertyName] = useState('')
    const menuRef = useRef<HTMLDivElement>(null)
    const deletePropertyMutation = useDeleteProperty()
    const [selectedType, setSelectedType] = useState<PropertyType>('text')
    const createPropertyMutation = useCreateProperty()

    const handleCreateProperty = async (type: PropertyType) => {
        if (!newPropertyName.trim()) return

        // Set appropriate default config based on type
        let config: Record<string, unknown> = {}
        if (type === 'select' || type === 'multi_select') {
            config = { options: [] }
        } else if (type === 'relation') {
            config = { databaseId: '', type: 'many_to_many' }
        } else if (type === 'rollup') {
            config = { relationPropertyId: '', rollupPropertyId: '', function: 'count' }
        } else if (type === 'formula') {
            config = { expression: '' }
        }

        await createPropertyMutation.mutateAsync({
            databaseId,
            name: newPropertyName,
            type: type,
            config,
        })

        setIsCreating(false)
        setIsSelectingType(false)
        setNewPropertyName('')
        setSelectedType('text')
    }

    if (isAddButton) {
        return (
            <div className="px-2 sm:px-3 py-2 border-r border-b bg-muted/50 min-w-[60px] sm:min-w-[80px] md:min-w-[120px]">
                {isCreating ? (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={newPropertyName}
                            onChange={(e) => setNewPropertyName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    setIsSelectingType(true)
                                }
                                if (e.key === 'Escape') {
                                    setIsCreating(false)
                                    setNewPropertyName('')
                                }
                            }}
                            onBlur={(e) => {
                                const relatedTarget = e.relatedTarget as HTMLElement
                                if (relatedTarget?.closest?.('.property-type-selector')) return
                                setTimeout(() => {
                                    if (!isSelectingType) {
                                        setIsCreating(false)
                                        setNewPropertyName('')
                                    }
                                }, 150)
                            }}
                            className="w-full px-2 py-1 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Nombre de propiedad"
                            autoFocus
                        />
                        {isSelectingType && newPropertyName.trim() && (
                            <div className="property-type-selector absolute z-50 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto w-48">
                                {propertyTypes.map((pt) => (
                                    <div
                                        key={pt.type}
                                        className={`px-3 py-2 cursor-pointer hover:bg-muted flex items-center gap-2 text-sm ${selectedType === pt.type ? 'bg-muted' : ''
                                            }`}
                                        onClick={() => {
                                            handleCreateProperty(pt.type)
                                        }}
                                    >
                                        <span className="text-muted-foreground">
                                            {propertyTypeIcons[pt.type]}
                                        </span>
                                        <span>{pt.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:bg-muted px-2 py-1 rounded w-full transition-colors"
                    >
                        <Plus size={14} />
                        <span>Agregar propiedad</span>
                    </button>
                )}
            </div>
        )
    }

    if (!property) return null

    const canConfigure = property.type === 'select' || property.type === 'multi_select' || property.type === 'relation' || property.type === 'rollup'
    const canDelete = property.type !== 'title'

    const handleDeleteProperty = async () => {
        if (confirm(`¿Eliminar la propiedad "${property.name}"?`)) {
            await deletePropertyMutation.mutateAsync({
                databaseId,
                propertyId: property.id,
            })
        }
        setShowMenu(false)
    }

    return (
        <>
            <div ref={menuRef} className="px-2 sm:px-3 py-2 border-r border-b bg-muted/50 min-w-[80px] sm:min-w-[100px] md:min-w-[120px] group relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-muted-foreground hidden sm:inline">
                            {propertyTypeIcons[property.type] || <Type size={14} />}
                        </span>
                        <span className="text-xs sm:text-sm font-medium truncate max-w-[60px] sm:max-w-[100px]">{property.name}</span>
                    </div>
                    {(canConfigure || canDelete) && (
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-all"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                    )}
                </div>

                {showMenu && (
                    <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1 bg-popover border rounded-lg shadow-lg p-1 min-w-[140px] z-50">
                        {canConfigure && (
                            <button
                                onClick={() => { setIsConfigOpen(true); setShowMenu(false); }}
                                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-muted"
                            >
                                <Settings size={14} />
                                Configurar
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleDeleteProperty}
                                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-muted text-destructive"
                            >
                                <Trash2 size={14} />
                                Eliminar
                            </button>
                        )}
                    </div>
                )}
            </div>

            {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />}

            {canConfigure && (
                <PropertyConfigModal
                    isOpen={isConfigOpen}
                    onClose={() => setIsConfigOpen(false)}
                    databaseId={databaseId}
                    property={property}
                    workspaceId={workspaceId}
                    allProperties={allProperties}
                />
            )}
        </>
    )
}

