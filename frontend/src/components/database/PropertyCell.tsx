'use client'

import { useState, useEffect } from 'react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { useUpdateRowValue } from '@/hooks/useDatabaseRows'
import { Check } from 'lucide-react'

// Import cell components
import SelectCell from './cells/SelectCell'
import MultiSelectCell from './cells/MultiSelectCell'
import DateCell from './cells/DateCell'
import PersonCell from './cells/PersonCell'

// Base props for simple cell components
interface BaseCellProps {
    databaseId: string
    rowId: string
    property: DatabaseProperty
    value: unknown
}

// Extended props for PropertyCell (includes workspaceId for PersonCell)
interface PropertyCellProps extends BaseCellProps {
    workspaceId: string
}

export default function PropertyCell({
    databaseId,
    workspaceId,
    rowId,
    property,
    value,
}: PropertyCellProps) {
    // Route to specific cell component based on type
    switch (property.type) {
        case 'select':
            return (
                <SelectCell
                    databaseId={databaseId}
                    rowId={rowId}
                    property={property}
                    value={value as string | null}
                />
            )

        case 'multi_select':
            return (
                <MultiSelectCell
                    databaseId={databaseId}
                    rowId={rowId}
                    property={property}
                    value={value as string[] | null}
                />
            )

        case 'date':
            return (
                <DateCell
                    databaseId={databaseId}
                    rowId={rowId}
                    property={property}
                    value={value as { start: string | null; end?: string | null } | string | null}
                />
            )

        case 'person':
            return (
                <PersonCell
                    databaseId={databaseId}
                    workspaceId={workspaceId}
                    rowId={rowId}
                    property={property}
                    value={value as string[] | null}
                />
            )

        case 'checkbox':
            return (
                <CheckboxCell
                    databaseId={databaseId}
                    rowId={rowId}
                    property={property}
                    value={value}
                />
            )

        case 'url':
        case 'email':
            return (
                <LinkCell
                    databaseId={databaseId}
                    rowId={rowId}
                    property={property}
                    value={value}
                />
            )

        case 'title':
        case 'text':
        case 'number':
        case 'phone':
        default:
            return (
                <TextCell
                    databaseId={databaseId}
                    rowId={rowId}
                    property={property}
                    value={value}
                />
            )
    }
}

// Checkbox Cell Component
function CheckboxCell({
    databaseId,
    rowId,
    property,
    value,
}: BaseCellProps) {
    const updateValueMutation = useUpdateRowValue()
    const isChecked = value === true || value === 'true'

    return (
        <div
            className="px-3 py-2 min-w-[150px] cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-center"
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

// Text/Number/Title Cell Component
function TextCell({
    databaseId,
    rowId,
    property,
    value,
}: BaseCellProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [localValue, setLocalValue] = useState<string>(String(value ?? ''))
    const updateValueMutation = useUpdateRowValue()

    useEffect(() => {
        setLocalValue(String(value ?? ''))
    }, [value])

    const handleSave = async () => {
        if (localValue !== String(value ?? '')) {
            let parsedValue: unknown = localValue

            if (property.type === 'number') {
                parsedValue = localValue ? Number(localValue) : null
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

    if (isEditing) {
        return (
            <div className="px-3 py-2 min-w-[150px]">
                <input
                    type={property.type === 'number' ? 'number' : 'text'}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
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

    const displayValue = value === null || value === undefined || value === ''
        ? <span className="text-muted-foreground/50">Vacío</span>
        : property.type === 'title'
            ? <span className="font-medium">{String(value)}</span>
            : <span>{String(value)}</span>

    return (
        <div
            className="px-3 py-2 min-w-[150px] cursor-text hover:bg-muted/50 transition-colors truncate"
            onClick={() => setIsEditing(true)}
        >
            <span className="text-sm">{displayValue}</span>
        </div>
    )
}

// URL/Email Link Cell Component
function LinkCell({
    databaseId,
    rowId,
    property,
    value,
}: BaseCellProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [localValue, setLocalValue] = useState<string>(String(value ?? ''))
    const updateValueMutation = useUpdateRowValue()

    useEffect(() => {
        setLocalValue(String(value ?? ''))
    }, [value])

    const handleSave = async () => {
        if (localValue !== String(value ?? '')) {
            await updateValueMutation.mutateAsync({
                databaseId,
                rowId,
                propertyId: property.id,
                value: localValue || null,
            })
        }
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="px-3 py-2 min-w-[150px]">
                <input
                    type={property.type === 'email' ? 'email' : 'url'}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') {
                            setLocalValue(String(value ?? ''))
                            setIsEditing(false)
                        }
                    }}
                    className="w-full px-2 py-1 text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder={property.type === 'email' ? 'email@ejemplo.com' : 'https://...'}
                    autoFocus
                />
            </div>
        )
    }

    if (!value) {
        return (
            <div
                className="px-3 py-2 min-w-[150px] cursor-text hover:bg-muted/50 transition-colors"
                onClick={() => setIsEditing(true)}
            >
                <span className="text-sm text-muted-foreground/50">Vacío</span>
            </div>
        )
    }

    const href = property.type === 'email' ? `mailto:${value}` : String(value)

    return (
        <div className="px-3 py-2 min-w-[150px] hover:bg-muted/50 transition-colors">
            <a
                href={href}
                target={property.type === 'url' ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline truncate block"
                onClick={(e) => e.stopPropagation()}
            >
                {String(value)}
            </a>
        </div>
    )
}
