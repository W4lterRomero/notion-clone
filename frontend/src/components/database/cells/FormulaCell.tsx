'use client'

import { DatabaseProperty } from '@/hooks/useDatabases'
import { AlertCircle, Check, X, Calendar, Hash, Type } from 'lucide-react'

interface FormulaResult {
    value: unknown
    error?: string
    type: 'number' | 'string' | 'boolean' | 'date' | 'null' | 'error'
}

interface FormulaCellProps {
    databaseId: string
    rowId: string
    property: DatabaseProperty
    value: unknown
    formulaResult?: FormulaResult
}

export default function FormulaCell({
    property,
    value,
    formulaResult,
}: FormulaCellProps) {
    // Determine the display based on result type
    const renderValue = () => {
        if (formulaResult?.error) {
            return (
                <div className="flex items-center gap-1.5 text-red-500" title={formulaResult.error}>
                    <AlertCircle size={14} />
                    <span className="text-xs truncate">Error</span>
                </div>
            )
        }

        if (value === null || value === undefined) {
            return (
                <span className="text-muted-foreground/40">—</span>
            )
        }

        const type = formulaResult?.type || typeof value

        switch (type) {
            case 'number':
                return (
                    <div className="flex items-center gap-1.5">
                        <Hash size={12} className="text-blue-500/60" />
                        <span className="font-mono text-sm">
                            {formatNumber(value as number)}
                        </span>
                    </div>
                )

            case 'boolean':
                return value ? (
                    <div className="flex items-center gap-1.5 text-green-600">
                        <Check size={14} strokeWidth={3} />
                        <span className="text-sm">Yes</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <X size={14} />
                        <span className="text-sm">No</span>
                    </div>
                )

            case 'date':
                return (
                    <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-purple-500/60" />
                        <span className="text-sm">
                            {formatDate(value as string)}
                        </span>
                    </div>
                )

            case 'string':
            default:
                return (
                    <div className="flex items-center gap-1.5">
                        <Type size={12} className="text-green-500/60" />
                        <span className="text-sm truncate max-w-[200px]">
                            {String(value)}
                        </span>
                    </div>
                )
        }
    }

    return (
        <div className="px-3 py-2 min-w-[120px] flex items-center">
            {renderValue()}
        </div>
    )
}

// Helper functions
function formatNumber(num: number): string {
    if (Number.isInteger(num)) {
        return num.toLocaleString()
    }
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr)
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    } catch {
        return dateStr
    }
}
