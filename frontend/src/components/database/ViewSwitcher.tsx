'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Table, LayoutGrid, Calendar, Image, Plus, ChevronDown, MoreHorizontal, Pencil, Copy, Trash2 } from 'lucide-react'
import { useDatabaseViews, useCreateView, useUpdateView, useDeleteView } from '@/hooks/useDatabaseViews'

interface ViewSwitcherProps {
    databaseId: string
    currentViewId: string | null
    onViewChange: (viewId: string) => void
}

const VIEW_ICONS = {
    table: Table,
    board: LayoutGrid,
    calendar: Calendar,
    gallery: Image,
    list: Table,
    timeline: Calendar,
}

const VIEW_LABELS = {
    table: 'Tabla',
    board: 'Board',
    calendar: 'Calendario',
    gallery: 'Galería',
    list: 'Lista',
    timeline: 'Timeline',
}

export default function ViewSwitcher({ databaseId, currentViewId, onViewChange }: ViewSwitcherProps) {
    const { data: views, isLoading } = useDatabaseViews(databaseId)
    const createViewMutation = useCreateView()
    const updateViewMutation = useUpdateView()
    const deleteViewMutation = useDeleteView()

    const [showCreateMenu, setShowCreateMenu] = useState(false)
    const [editingViewId, setEditingViewId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')

    // Find current view
    const currentView = views?.find(v => v.id === currentViewId) || views?.[0]

    const handleCreateView = async (type: 'table' | 'board' | 'calendar' | 'gallery') => {
        const name = VIEW_LABELS[type]
        await createViewMutation.mutateAsync({
            databaseId,
            name,
            type,
            config: type === 'board' ? { groupBy: '', cardPreview: 'content' as const, sorts: [] } :
                type === 'calendar' ? { dateProperty: '', showWeekends: true, sorts: [] } :
                    type === 'gallery' ? { imageSize: 'medium' as const, fitImage: true, sorts: [], visibleProperties: [] } :
                        { visibleProperties: [], propertyWidths: {}, sorts: [] },
        })
        setShowCreateMenu(false)
    }

    const handleRenameView = async (viewId: string) => {
        if (!editingName.trim()) return
        await updateViewMutation.mutateAsync({
            databaseId,
            viewId,
            name: editingName,
        })
        setEditingViewId(null)
    }

    const handleDeleteView = async (viewId: string) => {
        if (views && views.length <= 1) {
            return // Can't delete last view
        }
        await deleteViewMutation.mutateAsync({ databaseId, viewId })
    }

    if (isLoading) {
        return <div className="h-10 bg-muted/30 rounded animate-pulse w-48" />
    }

    return (
        <div className="flex items-center gap-1 mb-3 md:mb-4 flex-wrap">
            {/* View Tabs */}
            <div className="flex items-center bg-muted/30 rounded-lg p-1 gap-0.5 sm:gap-1">
                {views?.map((view, index) => {
                    const Icon = VIEW_ICONS[view.type as keyof typeof VIEW_ICONS] || Table
                    const isActive = view.id === currentView?.id

                    return (
                        <div key={view.id} className="relative group">
                            {editingViewId === view.id ? (
                                <input
                                    autoFocus
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={() => handleRenameView(view.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameView(view.id)
                                        if (e.key === 'Escape') setEditingViewId(null)
                                    }}
                                    className="px-3 py-1.5 text-sm bg-background border rounded-md w-28 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            ) : (
                                <motion.button
                                    onClick={() => onViewChange(view.id)}
                                    className={`relative flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${isActive
                                        ? 'text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeViewIndicator"
                                            className="absolute inset-0 bg-background rounded-md shadow-sm"
                                            initial={false}
                                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <span className="relative flex items-center gap-1 sm:gap-2">
                                        <Icon size={14} />
                                        <span className="hidden sm:inline text-xs sm:text-sm">{view.name}</span>
                                    </span>
                                </motion.button>
                            )}

                            {/* View Options Dropdown */}
                            {isActive && !editingViewId && (
                                <div className="absolute right-0 top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <div className="bg-popover border rounded-lg shadow-lg p-1 min-w-[140px]">
                                        <button
                                            onClick={() => {
                                                setEditingViewId(view.id)
                                                setEditingName(view.name)
                                            }}
                                            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-muted"
                                        >
                                            <Pencil size={14} />
                                            Renombrar
                                        </button>
                                        <button
                                            onClick={() => handleCreateView(view.type as 'table' | 'board' | 'calendar' | 'gallery')}
                                            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-muted"
                                        >
                                            <Copy size={14} />
                                            Duplicar
                                        </button>
                                        {views && views.length > 1 && (
                                            <button
                                                onClick={() => handleDeleteView(view.id)}
                                                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-muted text-destructive"
                                            >
                                                <Trash2 size={14} />
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Add View Button */}
            <div className="relative">
                <motion.button
                    onClick={() => setShowCreateMenu(!showCreateMenu)}
                    className="flex items-center gap-1 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Plus size={14} />
                </motion.button>

                {showCreateMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 top-full mt-1 bg-popover border rounded-lg shadow-lg p-1 min-w-[160px] z-20"
                    >
                        {(['table', 'board', 'calendar', 'gallery'] as const).map((type) => {
                            const Icon = VIEW_ICONS[type]
                            return (
                                <button
                                    key={type}
                                    onClick={() => handleCreateView(type)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-muted"
                                >
                                    <Icon size={16} />
                                    {VIEW_LABELS[type]}
                                </button>
                            )
                        })}
                    </motion.div>
                )}
            </div>

            {/* Click outside to close */}
            {showCreateMenu && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowCreateMenu(false)}
                />
            )}
        </div>
    )
}
