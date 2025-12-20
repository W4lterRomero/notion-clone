'use client'

import { useState, useRef, useEffect } from 'react'
import { useDatabaseProperties } from '@/hooks/useDatabaseProperties'
import { useDatabaseRows, useCreateRow } from '@/hooks/useDatabaseRows'
import { useDatabaseViews, useViewConfig } from '@/hooks/useDatabaseViews'
import { useFilterEngine, FilterGroup, SortConfig, FilterableRow } from '@/hooks/useFilterEngine'
import PropertyHeader from './PropertyHeader'
import PropertyCell from './PropertyCell'
import FilterBuilder from './filter/FilterBuilder'
import SortBuilder from './filter/SortBuilder'
import { Plus, Loader2, Filter, ArrowUpDown, X } from 'lucide-react'

interface TableViewProps {
    databaseId: string
    workspaceId: string
}

export default function TableView({ databaseId, workspaceId }: TableViewProps) {
    const { data: properties, isLoading: loadingProps } = useDatabaseProperties(databaseId)
    const { data: rows, isLoading: loadingRows } = useDatabaseRows(databaseId)
    const createRowMutation = useCreateRow()

    // View config
    const { data: views } = useDatabaseViews(databaseId)
    const currentView = views?.find(v => v.isDefault) || views?.[0]
    const { config, updateConfig } = useViewConfig(databaseId, currentView?.id || null)

    // Filter/Sort state (from view config or local)
    const [localFilter, setLocalFilter] = useState<FilterGroup | null>(null)
    const [localSorts, setLocalSorts] = useState<SortConfig[]>([])

    // Use config from view if available
    const activeFilter = ((config.filter as FilterGroup | undefined) ?? localFilter) || null
    const activeSorts = (config.sorts as SortConfig[] | undefined) ?? localSorts

    // Popover state
    const [showFilterBuilder, setShowFilterBuilder] = useState(false)
    const [showSortBuilder, setShowSortBuilder] = useState(false)
    const filterButtonRef = useRef<HTMLButtonElement>(null)
    const sortButtonRef = useRef<HTMLButtonElement>(null)

    // Apply filter engine
    const { rows: filteredRows, stats } = useFilterEngine({
        rows: (rows || []) as unknown as FilterableRow[],
        properties: properties || [],
        filter: activeFilter,
        sorts: activeSorts,
    })

    // Handle filter changes (save to view config)
    const handleFilterChange = async (filter: FilterGroup | null) => {
        setLocalFilter(filter)
        if (currentView) {
            await updateConfig({ filter: filter || undefined })
        }
    }

    const handleSortChange = async (sorts: SortConfig[]) => {
        setLocalSorts(sorts)
        if (currentView) {
            await updateConfig({ sorts })
        }
    }

    const handleCreateRow = async () => {
        await createRowMutation.mutateAsync({
            databaseId,
            title: '',
        })
    }

    // Close popovers on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node
            if (showFilterBuilder && filterButtonRef.current && !filterButtonRef.current.contains(target)) {
                const popover = document.getElementById('filter-popover')
                if (popover && !popover.contains(target)) {
                    setShowFilterBuilder(false)
                }
            }
            if (showSortBuilder && sortButtonRef.current && !sortButtonRef.current.contains(target)) {
                const popover = document.getElementById('sort-popover')
                if (popover && !popover.contains(target)) {
                    setShowSortBuilder(false)
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showFilterBuilder, showSortBuilder])

    if (loadingProps || loadingRows) {
        return (
            <div className="border rounded-lg p-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Sort properties: title first, then by position
    const sortedProperties = [...(properties || [])].sort((a, b) => {
        if (a.type === 'title') return -1
        if (b.type === 'title') return 1
        return a.position - b.position
    })

    const hasActiveFilter = activeFilter && activeFilter.conditions.length > 0
    const hasActiveSort = activeSorts.length > 0

    return (
        <div className="space-y-2">
            {/* Toolbar */}
            <div className="flex items-center gap-1 sm:gap-2 px-1">
                {/* Filter Button */}
                <div className="relative">
                    <button
                        ref={filterButtonRef}
                        onClick={() => setShowFilterBuilder(!showFilterBuilder)}
                        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${hasActiveFilter
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted text-muted-foreground'
                            }`}
                    >
                        <Filter size={14} />
                        <span className="hidden sm:inline">Filtrar</span>
                        {hasActiveFilter && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                {activeFilter?.conditions.length}
                            </span>
                        )}
                    </button>
                    {showFilterBuilder && (
                        <div
                            id="filter-popover"
                            className="absolute top-full left-0 mt-1 z-50"
                        >
                            <FilterBuilder
                                filter={activeFilter}
                                properties={properties || []}
                                matchCount={stats.filteredRows}
                                totalCount={stats.totalRows}
                                onChange={handleFilterChange}
                                onClose={() => setShowFilterBuilder(false)}
                            />
                        </div>
                    )}
                </div>

                {/* Sort Button */}
                <div className="relative">
                    <button
                        ref={sortButtonRef}
                        onClick={() => setShowSortBuilder(!showSortBuilder)}
                        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${hasActiveSort
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted text-muted-foreground'
                            }`}
                    >
                        <ArrowUpDown size={14} />
                        <span className="hidden sm:inline">Ordenar</span>
                        {hasActiveSort && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                {activeSorts.length}
                            </span>
                        )}
                    </button>
                    {showSortBuilder && (
                        <div
                            id="sort-popover"
                            className="absolute top-full left-0 mt-1 z-50"
                        >
                            <SortBuilder
                                sorts={activeSorts}
                                properties={properties || []}
                                onChange={handleSortChange}
                                onClose={() => setShowSortBuilder(false)}
                            />
                        </div>
                    )}
                </div>

                {/* Active filter chips */}
                {hasActiveFilter && (
                    <div className="flex items-center gap-1 ml-2">
                        <span className="text-xs text-muted-foreground">
                            {stats.filteredRows} de {stats.totalRows} filas
                        </span>
                        <button
                            onClick={() => handleFilterChange(null)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground"
                            title="Limpiar filtros"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="relative">
                {/* Scroll hint - visible on mobile */}
                <div className="sm:hidden text-xs text-muted-foreground text-center mb-1 flex items-center justify-center gap-1">
                    <span>← Desliza →</span>
                </div>
                {/* Right edge scroll indicator */}
                <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 sm:hidden" />
                <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full border-collapse min-w-[400px]">
                        {/* Header Row */}
                        <thead>
                            <tr>
                                {sortedProperties.map((property) => {
                                    // Check if this property has active sort
                                    const sortIndex = activeSorts.findIndex(s => s.propertyId === property.id)
                                    const sortConfig = sortIndex >= 0 ? activeSorts[sortIndex] : null

                                    return (
                                        <th key={property.id} className="text-left p-0 relative whitespace-nowrap">
                                            <PropertyHeader
                                                databaseId={databaseId}
                                                property={property}
                                                workspaceId={workspaceId}
                                                allProperties={properties || []}
                                            />
                                            {sortConfig && (
                                                <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                                                    {sortIndex + 1}
                                                </span>
                                            )}
                                        </th>
                                    )
                                })}
                                <th className="text-left p-0">
                                    <PropertyHeader databaseId={databaseId} isAddButton />
                                </th>
                            </tr>
                        </thead>

                        {/* Data Rows */}
                        <tbody>
                            {filteredRows.map((row) => (
                                <tr key={row.id} className="border-b hover:bg-muted/30 transition-colors">
                                    {sortedProperties.map((property) => {
                                        // Find value for this property
                                        const propertyValue = row.propertyValues?.find(
                                            (pv) => pv.propertyId === property.id
                                        )

                                        // For title property, use row.title if no property value
                                        let cellValue = propertyValue?.value
                                        if (property.type === 'title' && !cellValue) {
                                            cellValue = row.title
                                        }

                                        // Get relatedRows for relation properties
                                        const relatedRows = (propertyValue as { relatedRows?: { id: string; title: string; icon: string | null }[] })?.relatedRows

                                        return (
                                            <td key={property.id} className="p-0">
                                                <PropertyCell
                                                    databaseId={databaseId}
                                                    workspaceId={workspaceId}
                                                    rowId={row.id}
                                                    property={property}
                                                    value={cellValue}
                                                    relatedRows={relatedRows}
                                                />
                                            </td>
                                        )
                                    })}
                                    <td className="p-0 border-r" />
                                </tr>
                            ))}

                            {/* Empty state */}
                            {filteredRows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={(sortedProperties.length || 0) + 1}
                                        className="p-8 text-center text-muted-foreground"
                                    >
                                        {hasActiveFilter
                                            ? 'No hay filas que coincidan con el filtro.'
                                            : 'No hay filas. Haz clic en "Nueva fila" para agregar una.'}
                                    </td>
                                </tr>
                            )}

                            {/* Add Row Button */}
                            <tr>
                                <td colSpan={(sortedProperties.length || 0) + 1} className="p-0">
                                    <button
                                        onClick={handleCreateRow}
                                        disabled={createRowMutation.isPending}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 w-full transition-colors"
                                    >
                                        {createRowMutation.isPending ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Plus size={14} />
                                        )}
                                        <span>Nueva fila</span>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
