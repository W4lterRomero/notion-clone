'use client'

import { Plus, X, ArrowUpDown, GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { SortConfig } from '@/hooks/useFilterEngine'

interface SortBuilderProps {
    sorts: SortConfig[]
    properties: DatabaseProperty[]
    onChange: (sorts: SortConfig[]) => void
    onClose: () => void
}

export default function SortBuilder({
    sorts,
    properties,
    onChange,
    onClose,
}: SortBuilderProps) {
    const handleAddSort = () => {
        // Find first property not already sorted
        const usedIds = new Set(sorts.map(s => s.propertyId))
        const availableProp = properties.find(
            p => !usedIds.has(p.id) && p.type !== 'formula'
        )
        if (!availableProp) return

        onChange([...sorts, { propertyId: availableProp.id, direction: 'asc' }])
    }

    const handleUpdateSort = (index: number, updates: Partial<SortConfig>) => {
        const newSorts = [...sorts]
        newSorts[index] = { ...newSorts[index], ...updates }
        onChange(newSorts)
    }

    const handleRemoveSort = (index: number) => {
        onChange(sorts.filter((_, i) => i !== index))
    }

    const handleMoveSort = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= sorts.length) return
        const newSorts = [...sorts]
        const [moved] = newSorts.splice(fromIndex, 1)
        newSorts.splice(toIndex, 0, moved)
        onChange(newSorts)
    }

    const handleClearAll = () => {
        onChange([])
    }

    // Get available properties for dropdown
    const getAvailableProperties = (currentPropertyId: string) => {
        const usedIds = new Set(sorts.map(s => s.propertyId))
        usedIds.delete(currentPropertyId)
        return properties.filter(p => !usedIds.has(p.id) && p.type !== 'formula')
    }

    return (
        <div className="w-[calc(100vw-2rem)] sm:w-[350px] md:w-[400px] max-w-[400px] bg-popover border rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <ArrowUpDown size={16} className="text-primary" />
                    <span className="font-medium text-sm">Ordenar</span>
                </div>
                <button onClick={onClose} className="p-1 rounded hover:bg-muted">
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="p-3 max-h-[300px] overflow-y-auto">
                {sorts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        <p>Sin ordenamiento</p>
                        <p className="text-xs mt-1">Las filas aparecen en orden de creación</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sorts.map((sort, index) => (
                            <div
                                key={`${sort.propertyId}-${index}`}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group animate-in slide-in-from-top-2 duration-200"
                            >
                                {/* Drag Handle */}
                                <div className="flex flex-col gap-0.5">
                                    <button
                                        onClick={() => handleMoveSort(index, index - 1)}
                                        disabled={index === 0}
                                        className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                                    >
                                        <ArrowUp size={12} />
                                    </button>
                                    <button
                                        onClick={() => handleMoveSort(index, index + 1)}
                                        disabled={index === sorts.length - 1}
                                        className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                                    >
                                        <ArrowDown size={12} />
                                    </button>
                                </div>

                                {/* Priority Number */}
                                <span className="w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full bg-primary/10 text-primary">
                                    {index + 1}
                                </span>

                                {/* Property Selector */}
                                <select
                                    value={sort.propertyId}
                                    onChange={(e) => handleUpdateSort(index, { propertyId: e.target.value })}
                                    className="flex-1 px-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    {getAvailableProperties(sort.propertyId).map((prop) => (
                                        <option key={prop.id} value={prop.id}>
                                            {prop.name}
                                        </option>
                                    ))}
                                </select>

                                {/* Direction Selector */}
                                <select
                                    value={sort.direction}
                                    onChange={(e) => handleUpdateSort(index, { direction: e.target.value as 'asc' | 'desc' })}
                                    className="px-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="asc">↑ Ascendente</option>
                                    <option value="desc">↓ Descendente</option>
                                </select>

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemoveSort(index)}
                                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-3 border-t bg-muted/20">
                <button
                    onClick={handleAddSort}
                    disabled={sorts.length >= properties.length}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                >
                    <Plus size={14} /> Agregar ordenamiento
                </button>
                {sorts.length > 0 && (
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
