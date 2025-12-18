'use client'

import { DatabaseProperty } from '@/hooks/useDatabases'
import { Hash, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RollupCellProps {
    databaseId: string
    rowId: string
    property: DatabaseProperty
    value: number | string | null
}

export default function RollupCell({
    databaseId,
    rowId,
    property,
    value,
}: RollupCellProps) {
    const config = property.config as {
        relationPropertyId?: string
        rollupPropertyId?: string
        function?: string
    }

    // Check if rollup is properly configured
    if (!config?.relationPropertyId || !config?.rollupPropertyId || !config?.function) {
        return (
            <div className="px-3 py-2 min-w-[150px] text-muted-foreground/50 text-sm italic">
                Configura el rollup
            </div>
        )
    }

    // Format the display value
    const formatValue = () => {
        if (value === null || value === undefined) {
            return <span className="text-muted-foreground/50">—</span>
        }

        if (typeof value === 'number') {
            // Format based on function type
            switch (config.function) {
                case 'count':
                    return (
                        <span className="inline-flex items-center gap-1">
                            <Hash size={14} className="text-muted-foreground" />
                            {value}
                        </span>
                    )
                case 'sum':
                    return (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                            <TrendingUp size={14} />
                            {value.toLocaleString()}
                        </span>
                    )
                case 'average':
                    return (
                        <span className="inline-flex items-center gap-1 text-blue-600">
                            <Minus size={14} />
                            {value.toFixed(2)}
                        </span>
                    )
                case 'min':
                    return (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                            <TrendingDown size={14} />
                            {value.toLocaleString()}
                        </span>
                    )
                case 'max':
                    return (
                        <span className="inline-flex items-center gap-1 text-purple-600">
                            <TrendingUp size={14} />
                            {value.toLocaleString()}
                        </span>
                    )
                case 'range':
                    return (
                        <span className="text-cyan-600">
                            {value.toLocaleString()}
                        </span>
                    )
                default:
                    return value.toLocaleString()
            }
        }

        // String value (show_original)
        return <span>{String(value)}</span>
    }

    // Get function label for tooltip
    const getFunctionLabel = () => {
        switch (config.function) {
            case 'count': return 'Cuenta'
            case 'sum': return 'Suma'
            case 'average': return 'Promedio'
            case 'min': return 'Mínimo'
            case 'max': return 'Máximo'
            case 'range': return 'Rango'
            case 'show_original': return 'Original'
            default: return config.function
        }
    }

    return (
        <div
            className="px-3 py-2 min-w-[150px] text-sm bg-muted/20"
            title={`${getFunctionLabel()}: ${value ?? '—'}`}
        >
            {formatValue()}
        </div>
    )
}
