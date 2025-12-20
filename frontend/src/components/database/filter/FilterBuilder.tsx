'use client'

import { useState } from 'react'
import { Plus, X, Filter, ChevronDown } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import {
    FilterGroup,
    FilterCondition,
    createFilterCondition,
    createFilterGroup,
    addConditionToGroup,
    removeConditionFromGroup,
    updateConditionInGroup,
} from '@/hooks/useFilterEngine'
import FilterConditionRow from './FilterConditionRow'

interface FilterBuilderProps {
    filter: FilterGroup | null
    properties: DatabaseProperty[]
    matchCount: number
    totalCount: number
    onChange: (filter: FilterGroup | null) => void
    onClose: () => void
}

export default function FilterBuilder({
    filter,
    properties,
    matchCount,
    totalCount,
    onChange,
    onClose,
}: FilterBuilderProps) {
    // Initialize filter if null
    const currentFilter = filter || createFilterGroup('and')

    const handleAddCondition = () => {
        const firstProp = properties.find(p => p.type !== 'formula' && p.type !== 'rollup')
        if (!firstProp) return

        const newCondition = createFilterCondition(firstProp.id, 'contains', '')
        onChange(addConditionToGroup(currentFilter, newCondition))
    }

    const handleAddGroup = () => {
        const newGroup = createFilterGroup('or')
        onChange(addConditionToGroup(currentFilter, newGroup))
    }

    const handleUpdateCondition = (conditionId: string, updates: Partial<FilterCondition>) => {
        onChange(updateConditionInGroup(currentFilter, conditionId, updates))
    }

    const handleRemoveCondition = (conditionId: string) => {
        const updated = removeConditionFromGroup(currentFilter, conditionId)
        if (updated.conditions.length === 0) {
            onChange(null)
        } else {
            onChange(updated)
        }
    }

    const handleToggleGroupType = () => {
        onChange({
            ...currentFilter,
            type: currentFilter.type === 'and' ? 'or' : 'and',
        })
    }

    const handleClearAll = () => {
        onChange(null)
    }

    const renderCondition = (condition: FilterCondition | FilterGroup, index: number) => {
        if ('type' in condition) {
            // Nested group
            return (
                <div key={condition.id} className="ml-4 mt-2 p-3 border-l-2 border-primary/30 rounded-r-lg bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            onClick={() => {
                                // Toggle nested group type
                                const updated = {
                                    ...currentFilter,
                                    conditions: currentFilter.conditions.map(c =>
                                        c.id === condition.id
                                            ? { ...condition, type: condition.type === 'and' ? 'or' : 'and' }
                                            : c
                                    ),
                                }
                                onChange(updated as FilterGroup)
                            }}
                            className="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                            {condition.type.toUpperCase()}
                        </button>
                        <button
                            onClick={() => handleRemoveCondition(condition.id)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    {condition.conditions.map((nested, i) => renderCondition(nested as FilterCondition, i))}
                    <button
                        onClick={() => {
                            const newCond = createFilterCondition(properties[0]?.id || '', 'contains', '')
                            const updatedNested = addConditionToGroup(condition, newCond)
                            onChange({
                                ...currentFilter,
                                conditions: currentFilter.conditions.map(c =>
                                    c.id === condition.id ? updatedNested : c
                                ),
                            })
                        }}
                        className="mt-2 flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    >
                        <Plus size={12} /> Agregar condición
                    </button>
                </div>
            )
        }

        // Regular condition
        return (
            <div key={condition.id}>
                {index > 0 && (
                    <div className="flex items-center gap-2 my-1">
                        <div className="h-px flex-1 bg-border" />
                        <button
                            onClick={handleToggleGroupType}
                            className="px-2 py-0.5 text-xs font-medium rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                        >
                            {currentFilter.type.toUpperCase()}
                        </button>
                        <div className="h-px flex-1 bg-border" />
                    </div>
                )}
                <FilterConditionRow
                    condition={condition}
                    properties={properties}
                    onChange={(updates) => handleUpdateCondition(condition.id, updates)}
                    onRemove={() => handleRemoveCondition(condition.id)}
                />
            </div>
        )
    }

    return (
        <div className="w-[calc(100vw-2rem)] sm:w-[400px] md:w-[500px] max-w-[500px] bg-popover border rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-primary" />
                    <span className="font-medium text-sm">Filtros</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {matchCount} de {totalCount} filas
                    </span>
                    <button onClick={onClose} className="p-1 rounded hover:bg-muted">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-3 max-h-[400px] overflow-y-auto">
                {currentFilter.conditions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        <p>No hay filtros activos</p>
                        <p className="text-xs mt-1">Agrega un filtro para comenzar</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground mb-2 font-medium">
                            Donde
                        </div>
                        {currentFilter.conditions.map((condition, index) =>
                            renderCondition(condition, index)
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-3 border-t bg-muted/20">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleAddCondition}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
                    >
                        <Plus size={14} /> Condición
                    </button>
                    <button
                        onClick={handleAddGroup}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors text-muted-foreground"
                    >
                        <Plus size={14} /> Grupo
                    </button>
                </div>
                {currentFilter.conditions.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                        Limpiar todo
                    </button>
                )}
            </div>
        </div>
    )
}
