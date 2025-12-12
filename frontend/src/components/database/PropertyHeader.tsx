'use client'

import { useState } from 'react'
import { Plus, MoreHorizontal, Type, Hash, Calendar, CheckSquare, Link, AtSign, Phone, Users, List } from 'lucide-react'
import { DatabaseProperty, PropertyType } from '@/hooks/useDatabases'
import { useCreateProperty } from '@/hooks/useDatabaseProperties'

interface PropertyHeaderProps {
    databaseId: string
    property?: DatabaseProperty
    isAddButton?: boolean
}

const propertyTypeIcons: Record<PropertyType, React.ReactNode> = {
    title: <Type size={14} />,
    text: <Type size={14} />,
    number: <Hash size={14} />,
    select: <List size={14} />,
    multi_select: <List size={14} />,
    date: <Calendar size={14} />,
    person: <Users size={14} />,
    checkbox: <CheckSquare size={14} />,
    url: <Link size={14} />,
    email: <AtSign size={14} />,
    phone: <Phone size={14} />,
}

export default function PropertyHeader({
    databaseId,
    property,
    isAddButton,
}: PropertyHeaderProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [newPropertyName, setNewPropertyName] = useState('')
    const createPropertyMutation = useCreateProperty()

    if (isAddButton) {
        return (
            <div className="px-3 py-2 border-r border-b bg-muted/50 min-w-[150px]">
                {isCreating ? (
                    <input
                        type="text"
                        value={newPropertyName}
                        onChange={(e) => setNewPropertyName(e.target.value)}
                        onBlur={async () => {
                            if (newPropertyName.trim()) {
                                await createPropertyMutation.mutateAsync({
                                    databaseId,
                                    name: newPropertyName,
                                    type: 'text',
                                })
                            }
                            setIsCreating(false)
                            setNewPropertyName('')
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur()
                            }
                            if (e.key === 'Escape') {
                                setIsCreating(false)
                                setNewPropertyName('')
                            }
                        }}
                        className="w-full px-2 py-1 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Nombre de propiedad"
                        autoFocus
                    />
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

    return (
        <div className="px-3 py-2 border-r border-b bg-muted/50 min-w-[150px] group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                        {propertyTypeIcons[property.type] || <Type size={14} />}
                    </span>
                    <span className="text-sm font-medium">{property.name}</span>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-all">
                    <MoreHorizontal size={14} />
                </button>
            </div>
        </div>
    )
}
