'use client'

import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import {
    FilterCondition,
    FilterOperator,
    OPERATORS_BY_TYPE,
    OPERATOR_LABELS,
    RELATIVE_DATES,
} from '@/hooks/useFilterEngine'

interface FilterConditionRowProps {
    condition: FilterCondition
    properties: DatabaseProperty[]
    onChange: (updates: Partial<FilterCondition>) => void
    onRemove: () => void
}

// Value input components by property type
function TextValueInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Valor..."
            className="px-2 py-1.5 text-sm border rounded-md bg-background min-w-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
    )
}

function NumberValueInput({ value, onChange }: { value: number | string; onChange: (v: number) => void }) {
    return (
        <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder="0"
            className="px-2 py-1.5 text-sm border rounded-md bg-background w-24 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
    )
}

function DateValueInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [mode, setMode] = useState<'exact' | 'relative'>('exact')

    return (
        <div className="flex items-center gap-1">
            {mode === 'exact' ? (
                <input
                    type="date"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="px-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            ) : (
                <select
                    value={value || 'today'}
                    onChange={(e) => {
                        const getter = RELATIVE_DATES[e.target.value as keyof typeof RELATIVE_DATES]
                        if (getter) {
                            const result = getter()
                            onChange(typeof result === 'string' ? result : JSON.stringify(result))
                        }
                    }}
                    className="px-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="today">Hoy</option>
                    <option value="yesterday">Ayer</option>
                    <option value="tomorrow">Mañana</option>
                    <option value="this_week">Esta semana</option>
                    <option value="last_week">Semana pasada</option>
                    <option value="this_month">Este mes</option>
                </select>
            )}
            <button
                onClick={() => setMode(mode === 'exact' ? 'relative' : 'exact')}
                className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
                {mode === 'exact' ? '📅' : '🗓️'}
            </button>
        </div>
    )
}

function SelectValueInput({
    value,
    options,
    onChange,
}: {
    value: string
    options: { id: string; name: string; color?: string }[]
    onChange: (v: string) => void
}) {
    return (
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="px-2 py-1.5 text-sm border rounded-md bg-background min-w-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
            <option value="">Seleccionar...</option>
            {options.map((opt) => (
                <option key={opt.id} value={opt.name}>
                    {opt.name}
                </option>
            ))}
        </select>
    )
}

function CheckboxValueInput({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <select
            value={value ? 'true' : 'false'}
            onChange={(e) => onChange(e.target.value === 'true')}
            className="px-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
            <option value="true">Marcado</option>
            <option value="false">No marcado</option>
        </select>
    )
}

export default function FilterConditionRow({
    condition,
    properties,
    onChange,
    onRemove,
}: FilterConditionRowProps) {
    const selectedProperty = properties.find((p) => p.id === condition.propertyId)
    const availableOperators = selectedProperty
        ? OPERATORS_BY_TYPE[selectedProperty.type] || []
        : []

    // Don't show value input for empty checks
    const needsValue = !['is_empty', 'is_not_empty'].includes(condition.operator)

    const renderValueInput = () => {
        if (!needsValue || !selectedProperty) return null

        const propType = selectedProperty.type

        switch (propType) {
            case 'number':
            case 'rollup':
                return (
                    <NumberValueInput
                        value={condition.value as number}
                        onChange={(v) => onChange({ value: v })}
                    />
                )

            case 'date':
                return (
                    <DateValueInput
                        value={condition.value as string}
                        onChange={(v) => onChange({ value: v })}
                    />
                )

            case 'select':
                const selectOptions = (selectedProperty.config as { options?: { id: string; name: string; color?: string }[] })?.options || []
                return (
                    <SelectValueInput
                        value={condition.value as string}
                        options={selectOptions}
                        onChange={(v) => onChange({ value: v })}
                    />
                )

            case 'checkbox':
                return (
                    <CheckboxValueInput
                        value={condition.value as boolean}
                        onChange={(v) => onChange({ value: v })}
                    />
                )

            case 'title':
            case 'text':
            case 'url':
            case 'email':
            case 'phone':
            default:
                return (
                    <TextValueInput
                        value={condition.value as string}
                        onChange={(v) => onChange({ value: v })}
                    />
                )
        }
    }

    return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group animate-in slide-in-from-top-2 duration-200">
            {/* Property Selector */}
            <div className="relative">
                <select
                    value={condition.propertyId}
                    onChange={(e) => {
                        const newProp = properties.find((p) => p.id === e.target.value)
                        const newOperators = newProp ? OPERATORS_BY_TYPE[newProp.type] : []
                        onChange({
                            propertyId: e.target.value,
                            operator: newOperators[0] || 'equals',
                            value: null,
                        })
                    }}
                    className="appearance-none px-3 py-1.5 pr-8 text-sm border rounded-md bg-background min-w-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">Propiedad...</option>
                    {properties.map((prop) => (
                        <option key={prop.id} value={prop.id}>
                            {prop.name}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Operator Selector */}
            <div className="relative">
                <select
                    value={condition.operator}
                    onChange={(e) => onChange({ operator: e.target.value as FilterOperator })}
                    className="appearance-none px-3 py-1.5 pr-8 text-sm border rounded-md bg-background min-w-[140px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={!selectedProperty}
                >
                    {availableOperators.map((op) => (
                        <option key={op} value={op}>
                            {OPERATOR_LABELS[op]}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Value Input */}
            {renderValueInput()}

            {/* Remove Button */}
            <button
                onClick={onRemove}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X size={16} />
            </button>
        </div>
    )
}
