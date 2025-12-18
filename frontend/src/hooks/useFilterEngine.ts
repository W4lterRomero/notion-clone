'use client'

import { useMemo } from 'react'
import { DatabaseProperty, PropertyType } from './useDatabases'

// ============================================
// TYPES
// ============================================

export type FilterOperator =
    // Text operators
    | 'equals' | 'not_equals' | 'contains' | 'not_contains'
    | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty'
    // Number operators
    | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal'
    // Date operators
    | 'is_before' | 'is_after' | 'is_on_or_before' | 'is_on_or_after' | 'is_within'

export interface FilterCondition {
    id: string
    propertyId: string
    operator: FilterOperator
    value: unknown
}

export interface FilterGroup {
    id: string
    type: 'and' | 'or'
    conditions: (FilterCondition | FilterGroup)[]
}

export interface SortConfig {
    propertyId: string
    direction: 'asc' | 'desc'
}

// Minimal row interface for filtering - works with any row type
export interface FilterableRow {
    id: string
    title: string | null
    propertyValues: Array<{
        propertyId: string
        value: unknown
    }>
}

export interface UseFilterEngineProps<T extends FilterableRow = FilterableRow> {
    rows: T[]
    properties: DatabaseProperty[]
    filter?: FilterGroup | null
    sorts?: SortConfig[]
}

// ============================================
// OPERATOR REGISTRY
// ============================================

export const OPERATORS_BY_TYPE: Record<PropertyType, FilterOperator[]> = {
    title: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
    text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
    number: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'is_empty', 'is_not_empty'],
    select: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
    multi_select: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
    date: ['equals', 'is_before', 'is_after', 'is_on_or_before', 'is_on_or_after', 'is_within', 'is_empty', 'is_not_empty'],
    person: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
    checkbox: ['equals'],
    url: ['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'],
    email: ['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'],
    phone: ['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'],
    relation: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
    rollup: ['equals', 'not_equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'],
    formula: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'is_empty', 'is_not_empty'],
}

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
    equals: 'es igual a',
    not_equals: 'no es igual a',
    contains: 'contiene',
    not_contains: 'no contiene',
    starts_with: 'empieza con',
    ends_with: 'termina con',
    is_empty: 'está vacío',
    is_not_empty: 'no está vacío',
    greater_than: 'mayor que',
    less_than: 'menor que',
    greater_or_equal: 'mayor o igual a',
    less_or_equal: 'menor o igual a',
    is_before: 'es antes de',
    is_after: 'es después de',
    is_on_or_before: 'es en o antes de',
    is_on_or_after: 'es en o después de',
    is_within: 'está dentro de',
}

// Relative date options
export const RELATIVE_DATES = {
    today: () => new Date().toISOString().split('T')[0],
    yesterday: () => {
        const d = new Date()
        d.setDate(d.getDate() - 1)
        return d.toISOString().split('T')[0]
    },
    tomorrow: () => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        return d.toISOString().split('T')[0]
    },
    this_week: () => {
        const now = new Date()
        const start = new Date(now)
        start.setDate(now.getDate() - now.getDay())
        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
    },
    last_week: () => {
        const now = new Date()
        const start = new Date(now)
        start.setDate(now.getDate() - now.getDay() - 7)
        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
    },
    this_month: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
    },
}

// ============================================
// FILTER EVALUATION
// ============================================

function getPropertyValue(row: FilterableRow, propertyId: string, properties: DatabaseProperty[]): unknown {
    // Check for title property
    const property = properties.find(p => p.id === propertyId)
    if (property?.type === 'title') {
        return row.title
    }

    const propValue = row.propertyValues.find(pv => pv.propertyId === propertyId)
    return propValue?.value ?? null
}

function isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'string' && value.trim() === '') return true
    if (Array.isArray(value) && value.length === 0) return true
    return false
}

function evaluateCondition(
    row: FilterableRow,
    condition: FilterCondition,
    properties: DatabaseProperty[]
): boolean {
    const value = getPropertyValue(row, condition.propertyId, properties)
    const property = properties.find(p => p.id === condition.propertyId)
    const filterValue = condition.value

    // Handle empty checks first
    if (condition.operator === 'is_empty') {
        return isEmpty(value)
    }
    if (condition.operator === 'is_not_empty') {
        return !isEmpty(value)
    }

    // Handle null values for other operators
    if (value === null || value === undefined) {
        return false
    }

    switch (condition.operator) {
        case 'equals':
            if (property?.type === 'checkbox') {
                return Boolean(value) === Boolean(filterValue)
            }
            return String(value).toLowerCase() === String(filterValue).toLowerCase()

        case 'not_equals':
            return String(value).toLowerCase() !== String(filterValue).toLowerCase()

        case 'contains':
            if (Array.isArray(value)) {
                // For multi_select, person, relation
                return value.some(v =>
                    String(v).toLowerCase().includes(String(filterValue).toLowerCase())
                )
            }
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase())

        case 'not_contains':
            if (Array.isArray(value)) {
                return !value.some(v =>
                    String(v).toLowerCase().includes(String(filterValue).toLowerCase())
                )
            }
            return !String(value).toLowerCase().includes(String(filterValue).toLowerCase())

        case 'starts_with':
            return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase())

        case 'ends_with':
            return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase())

        case 'greater_than':
            return Number(value) > Number(filterValue)

        case 'less_than':
            return Number(value) < Number(filterValue)

        case 'greater_or_equal':
            return Number(value) >= Number(filterValue)

        case 'less_or_equal':
            return Number(value) <= Number(filterValue)

        case 'is_before':
            return new Date(String(value)) < new Date(String(filterValue))

        case 'is_after':
            return new Date(String(value)) > new Date(String(filterValue))

        case 'is_on_or_before':
            return new Date(String(value)) <= new Date(String(filterValue))

        case 'is_on_or_after':
            return new Date(String(value)) >= new Date(String(filterValue))

        case 'is_within':
            if (typeof filterValue === 'object' && filterValue !== null) {
                const { start, end } = filterValue as { start: string; end: string }
                const dateValue = new Date(String(value))
                return dateValue >= new Date(start) && dateValue <= new Date(end)
            }
            return false

        default:
            return false
    }
}

function evaluateFilterGroup(
    row: FilterableRow,
    group: FilterGroup,
    properties: DatabaseProperty[]
): boolean {
    if (group.conditions.length === 0) return true

    const results = group.conditions.map(condition => {
        if ('type' in condition) {
            // It's a nested group
            return evaluateFilterGroup(row, condition as FilterGroup, properties)
        }
        // It's a condition
        return evaluateCondition(row, condition as FilterCondition, properties)
    })

    if (group.type === 'and') {
        return results.every(Boolean)
    } else {
        return results.some(Boolean)
    }
}

// ============================================
// SORTING
// ============================================

function compareValues(a: unknown, b: unknown, direction: 'asc' | 'desc'): number {
    const multiplier = direction === 'asc' ? 1 : -1

    // Handle nulls - always at end
    if (a === null || a === undefined) return 1
    if (b === null || b === undefined) return -1

    // Numbers
    if (typeof a === 'number' && typeof b === 'number') {
        return (a - b) * multiplier
    }

    // Dates
    if (a instanceof Date && b instanceof Date) {
        return (a.getTime() - b.getTime()) * multiplier
    }

    // Booleans
    if (typeof a === 'boolean' && typeof b === 'boolean') {
        return ((a ? 1 : 0) - (b ? 1 : 0)) * multiplier
    }

    // Arrays (compare length for multi_select, relation)
    if (Array.isArray(a) && Array.isArray(b)) {
        return (a.length - b.length) * multiplier
    }

    // Strings (default)
    const strA = String(a).toLowerCase()
    const strB = String(b).toLowerCase()
    return strA.localeCompare(strB) * multiplier
}

function sortRows(
    rows: FilterableRow[],
    sorts: SortConfig[],
    properties: DatabaseProperty[]
): FilterableRow[] {
    if (sorts.length === 0) return rows

    return [...rows].sort((a, b) => {
        for (const sort of sorts) {
            const prop = properties.find(p => p.id === sort.propertyId)
            const valueA = prop?.type === 'title' ? a.title : getPropertyValue(a, sort.propertyId, properties)
            const valueB = prop?.type === 'title' ? b.title : getPropertyValue(b, sort.propertyId, properties)

            const result = compareValues(valueA, valueB, sort.direction)
            if (result !== 0) return result
        }
        return 0
    })
}

// ============================================
// MAIN HOOK
// ============================================

export function useFilterEngine({
    rows,
    properties,
    filter,
    sorts = [],
}: UseFilterEngineProps) {
    const filteredAndSortedRows = useMemo(() => {
        let result = rows

        // Apply filter
        if (filter && filter.conditions.length > 0) {
            result = result.filter(row => evaluateFilterGroup(row, filter, properties))
        }

        // Apply sorts
        if (sorts.length > 0) {
            result = sortRows(result, sorts, properties)
        }

        return result
    }, [rows, properties, filter, sorts])

    const stats = useMemo(() => ({
        totalRows: rows.length,
        filteredRows: filteredAndSortedRows.length,
        hasActiveFilter: filter && filter.conditions.length > 0,
        hasActiveSort: sorts.length > 0,
    }), [rows.length, filteredAndSortedRows.length, filter, sorts.length])

    return {
        rows: filteredAndSortedRows,
        stats,
    }
}

// ============================================
// UTILITIES
// ============================================

export function createFilterCondition(propertyId: string, operator: FilterOperator, value: unknown): FilterCondition {
    return {
        id: crypto.randomUUID(),
        propertyId,
        operator,
        value,
    }
}

export function createFilterGroup(type: 'and' | 'or' = 'and'): FilterGroup {
    return {
        id: crypto.randomUUID(),
        type,
        conditions: [],
    }
}

export function addConditionToGroup(group: FilterGroup, condition: FilterCondition | FilterGroup): FilterGroup {
    return {
        ...group,
        conditions: [...group.conditions, condition],
    }
}

export function removeConditionFromGroup(group: FilterGroup, conditionId: string): FilterGroup {
    return {
        ...group,
        conditions: group.conditions.filter(c => c.id !== conditionId),
    }
}

export function updateConditionInGroup(
    group: FilterGroup,
    conditionId: string,
    updates: Partial<FilterCondition>
): FilterGroup {
    return {
        ...group,
        conditions: group.conditions.map(c => {
            if (c.id === conditionId && !('type' in c)) {
                return { ...c, ...updates }
            }
            if ('type' in c) {
                // Recursively update nested groups
                return updateConditionInGroup(c as FilterGroup, conditionId, updates)
            }
            return c
        }),
    }
}
