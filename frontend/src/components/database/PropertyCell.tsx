'use client'

import { useState, useEffect } from 'react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { useUpdateRowValue } from '@/hooks/useDatabaseRows'
import { Check } from 'lucide-react'

interface PropertyCellProps {
    databaseId: string
    rowId: string
    property: DatabaseProperty
    value: unknown
}

export default function PropertyCell({
    databaseId,
    rowId,
    property,
    value,
}: PropertyCellProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [localValue, setLocalValue] = useState<string>(String(value ?? ''))
    const updateValueMutation = useUpdateRowValue()

    // Sync local value when external value changes
    useEffect(() => {
        setLocalValue(String(value ?? ''))
    }, [value])

    const handleSave = async () => {
        if (localValue !== String(value ?? '')) {
            let parsedValue: unknown = localValue

            // Parse value based on property type
            if (property.type === 'number') {
                parsedValue = localValue ? Number(localValue) : null
            } else if (property.type === 'checkbox') {
                parsedValue = localValue === 'true'
            }

            await updateValueMutation.mutateAsync({
                databaseId,
                rowId,
                propertyId: property.id,
                value: parsedValue,
            })
        }
        setIsEditing(false)
    }

    // Render checkbox specially
    if (property.type === 'checkbox') {
        const isChecked = value === true || value === 'true'
        return (
            <div
                className="px-3 py-2 border-r min-w-[150px] cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-center"
                onClick={async () => {
                    await updateValueMutation.mutateAsync({
                        databaseId,
                        rowId,
                        propertyId: property.id,
                        value: !isChecked,
                    })
                }}
            >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'
                    }`}>
                    {isChecked && <Check size={12} />}
                </div>
            </div>
        )
    }

    // Render display value based on type
    const renderValue = () => {
        if (value === null || value === undefined || value === '') {
            return <span className="text-muted-foreground/50">Vacío</span>
        }

        switch (property.type) {
            case 'title':
                return <span className="font-medium">{String(value)}</span>
            case 'number':
                return String(value)
            case 'url':
                return (
                    <a
                        href={String(value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {String(value)}
                    </a>
                )
            case 'email':
                return (
                    <a
                        href={`mailto:${value}`}
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {String(value)}
                    </a>
                )
            default:
                return String(value)
        }
    }

    if (isEditing) {
        return (
            <div className="px-3 py-2 border-r min-w-[150px]">
                <input
                    type={property.type === 'number' ? 'number' : 'text'}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSave()
                        }
                        if (e.key === 'Escape') {
                            setLocalValue(String(value ?? ''))
                            setIsEditing(false)
                        }
                    }}
                    className="w-full px-2 py-1 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                />
            </div>
        )
    }

    return (
        <div
            className="px-3 py-2 border-r min-w-[150px] cursor-text hover:bg-muted/50 transition-colors truncate"
            onClick={() => setIsEditing(true)}
        >
            <span className="text-sm">{renderValue()}</span>
        </div>
    )
}
