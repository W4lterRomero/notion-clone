'use client'

import { useState, useRef, useCallback } from 'react'
import { Search, Plus, Check, Link2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { useDatabaseRows, useUpdateRelations, useCreateRow } from '@/hooks/useDatabaseRows'
import GlassPopover from '@/components/ui/GlassPopover'
import AnimatedChip from '@/components/ui/AnimatedChip'
import PageSidePanel from '@/components/ui/PageSidePanel'

interface RelatedRow {
    id: string
    title: string
    icon: string | null
}

interface RelationCellProps {
    databaseId: string
    rowId: string
    property: DatabaseProperty
    value: string[] | null
    relatedRows?: RelatedRow[]
    workspaceId: string
}

export default function RelationCell({
    databaseId,
    rowId,
    property,
    value,
    relatedRows = [],
    workspaceId,
}: RelationCellProps) {
    const router = useRouter()
    const triggerRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [sidePanelPageId, setSidePanelPageId] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    const updateRelationsMutation = useUpdateRelations()
    const createRowMutation = useCreateRow()

    // Get config from property
    const config = property.config as { databaseId?: string; type?: string }
    const relatedDatabaseId = config?.databaseId

    // Fetch rows from the related database
    const { data: availableRows = [], isLoading: loadingRows } = useDatabaseRows(relatedDatabaseId || null)

    // Current selected IDs
    const selectedIds = value || []

    // Filter available rows by search
    const filteredRows = availableRows.filter((row) =>
        (row.title || 'Sin título').toLowerCase().includes(search.toLowerCase())
    )

    const handleToggle = useCallback(async (targetRowId: string) => {
        const newValue = selectedIds.includes(targetRowId)
            ? selectedIds.filter((id) => id !== targetRowId)
            : [...selectedIds, targetRowId]

        await updateRelationsMutation.mutateAsync({
            databaseId,
            rowId,
            propertyId: property.id,
            targetRowIds: newValue,
        })
    }, [selectedIds, databaseId, rowId, property.id, updateRelationsMutation])

    const handleRemove = useCallback(async (targetRowId: string) => {
        const newValue = selectedIds.filter((id) => id !== targetRowId)
        await updateRelationsMutation.mutateAsync({
            databaseId,
            rowId,
            propertyId: property.id,
            targetRowIds: newValue,
        })
    }, [selectedIds, databaseId, rowId, property.id, updateRelationsMutation])

    const handleCreateNew = useCallback(async () => {
        if (!relatedDatabaseId || !search.trim()) return

        setIsCreating(true)
        try {
            const newRow = await createRowMutation.mutateAsync({
                databaseId: relatedDatabaseId,
                title: search.trim(),
            })

            // Auto-select the newly created row
            if (newRow?.id) {
                await updateRelationsMutation.mutateAsync({
                    databaseId,
                    rowId,
                    propertyId: property.id,
                    targetRowIds: [...selectedIds, newRow.id],
                })
            }

            setSearch('')
        } finally {
            setIsCreating(false)
        }
    }, [relatedDatabaseId, search, createRowMutation, databaseId, rowId, property.id, selectedIds, updateRelationsMutation])

    const handleChipClick = (pageId: string) => {
        setSidePanelPageId(pageId)
    }

    const handleNavigateToPage = (pageId: string) => {
        setSidePanelPageId(null)
        router.push(`/pages/${pageId}`)
    }

    if (!relatedDatabaseId) {
        return (
            <div className="px-3 py-2 min-w-[150px] text-muted-foreground/50 text-sm italic flex items-center gap-2">
                <Link2 size={14} />
                Configura la relación
            </div>
        )
    }

    return (
        <>
            {/* Cell Content */}
            <div
                ref={triggerRef}
                className="px-3 py-2 min-w-[150px] cursor-pointer hover:bg-muted/30 transition-colors flex items-center gap-1.5 flex-wrap group"
                onClick={() => setIsOpen(true)}
            >
                {relatedRows.length > 0 ? (
                    relatedRows.map((row, index) => (
                        <AnimatedChip
                            key={row.id}
                            icon={row.icon ? <span>{row.icon}</span> : <Link2 size={12} />}
                            onClick={() => handleChipClick(row.id)}
                            onRemove={() => handleRemove(row.id)}
                            variant="primary"
                            size="sm"
                            className={`animate-chip-pop`}
                            style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
                        >
                            {row.title || 'Sin título'}
                        </AnimatedChip>
                    ))
                ) : (
                    <span className="text-muted-foreground/50 text-sm flex items-center gap-1.5 group-hover:text-muted-foreground transition-colors">
                        <Link2 size={14} />
                        Seleccionar relación
                    </span>
                )}
            </div>

            {/* Glass Popover */}
            <GlassPopover
                isOpen={isOpen}
                onClose={() => {
                    setIsOpen(false)
                    setSearch('')
                }}
                triggerRef={triggerRef}
                title={`🔗 ${property.name}`}
                width={340}
            >
                {/* Search Input */}
                <div className="p-3 border-b border-border/50">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar o crear..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-transparent focus:border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Row List */}
                <div className="max-h-60 overflow-y-auto">
                    {loadingRows ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredRows.length === 0 ? (
                        <div className="p-4 text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                                {search ? `No hay resultados para "${search}"` : 'No hay filas disponibles'}
                            </p>
                            {search && (
                                <button
                                    onClick={handleCreateNew}
                                    disabled={isCreating}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isCreating ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Plus size={14} />
                                    )}
                                    Crear &quot;{search}&quot;
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {filteredRows.map((row) => {
                                const isSelected = selectedIds.includes(row.id)
                                return (
                                    <div
                                        key={row.id}
                                        className={`
                                            px-4 py-2.5 cursor-pointer flex items-center gap-3
                                            hover:bg-muted/50 transition-colors
                                            ${isSelected ? 'bg-primary/5' : ''}
                                        `}
                                        onClick={() => handleToggle(row.id)}
                                    >
                                        {/* Checkbox */}
                                        <div className={`
                                            w-5 h-5 rounded-md border-2 flex items-center justify-center
                                            transition-all duration-200
                                            ${isSelected
                                                ? 'bg-primary border-primary text-primary-foreground scale-105'
                                                : 'border-muted-foreground/30 hover:border-primary/50'
                                            }
                                        `}>
                                            {isSelected && <Check size={12} strokeWidth={3} />}
                                        </div>

                                        {/* Row Info */}
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="text-base flex-shrink-0">
                                                {row.icon || '📄'}
                                            </span>
                                            <span className="text-sm truncate font-medium">
                                                {row.title || 'Sin título'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </>
                    )}
                </div>

                {/* Create New Button */}
                {search && filteredRows.length > 0 && (
                    <div className="p-2 border-t border-border/50">
                        <button
                            onClick={handleCreateNew}
                            disabled={isCreating}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isCreating ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <Plus size={14} />
                            )}
                            Crear &quot;{search}&quot;
                        </button>
                    </div>
                )}
            </GlassPopover>

            {/* Side Panel for Page Preview */}
            <PageSidePanel
                isOpen={sidePanelPageId !== null}
                onClose={() => setSidePanelPageId(null)}
                pageId={sidePanelPageId}
                onNavigate={handleNavigateToPage}
            />
        </>
    )
}
