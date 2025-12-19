'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, ChevronLeft, ChevronRight, ExternalLink, Trash2, Copy,
    Calendar, Hash, Link2, CheckSquare, Tag, User, MessageSquare,
    MoreHorizontal, Plus, Type, List, AtSign, Phone, Users
} from 'lucide-react'
import { DatabaseRow } from '@/hooks/useDatabaseRows'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { useUpdateRowValue, useCreateRow } from '@/hooks/useDatabaseRows'
import { useCreateProperty } from '@/hooks/useDatabaseProperties'
import { PropertyType } from '@/hooks/useDatabases'
import SelectCell, { OPTION_COLORS, SelectOption } from './cells/SelectCell'
import MultiSelectCell from './cells/MultiSelectCell'
import DateCell from './cells/DateCell'
import { CommentsSection } from './CommentsSection'

interface FullPagePeekProps {
    row: DatabaseRow | null
    rows?: DatabaseRow[]
    properties: DatabaseProperty[]
    isOpen: boolean
    onClose: () => void
    onNavigate?: (direction: 'prev' | 'next') => void
    databaseId: string
    workspaceId: string
}

const PropertyIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'date': return <Calendar size={14} className="text-purple-500" />
        case 'number': return <Hash size={14} className="text-green-500" />
        case 'url': return <Link2 size={14} className="text-blue-500" />
        case 'checkbox': return <CheckSquare size={14} className="text-cyan-500" />
        case 'select': return <Tag size={14} className="text-orange-500" />
        case 'multi_select': return <Tag size={14} className="text-pink-500" />
        case 'person': return <User size={14} className="text-indigo-500" />
        default: return null
    }
}

const FullPagePeek = React.memo(function FullPagePeek({
    row,
    rows,
    properties,
    isOpen,
    onClose,
    onNavigate,
    databaseId,
    workspaceId,
}: FullPagePeekProps) {
    const updateValueMutation = useUpdateRowValue()
    const createPropertyMutation = useCreateProperty()
    const [editingNumber, setEditingNumber] = useState<string | null>(null)
    const [numberValue, setNumberValue] = useState('')
    const [isCreatingProperty, setIsCreatingProperty] = useState(false)
    const [newPropertyName, setNewPropertyName] = useState('')

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            else if (e.key === 'ArrowLeft' && onNavigate) onNavigate('prev')
            else if (e.key === 'ArrowRight' && onNavigate) onNavigate('next')
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose, onNavigate])

    const getPropertyValue = useCallback((propertyId: string) => {
        return row?.propertyValues?.find(pv => pv.propertyId === propertyId)?.value
    }, [row])

    // Navigation info
    const currentIndex = rows?.findIndex(r => r.id === row?.id) ?? -1
    const hasPrev = currentIndex > 0
    const hasNext = rows ? currentIndex < rows.length - 1 : false

    // Handle checkbox toggle
    const handleCheckboxToggle = useCallback(async (propertyId: string, currentValue: unknown) => {
        if (!row) return
        await updateValueMutation.mutateAsync({
            databaseId,
            rowId: row.id,
            propertyId,
            value: !currentValue,
        })
    }, [row, databaseId, updateValueMutation])

    // Handle number update
    const handleNumberUpdate = useCallback(async (propertyId: string) => {
        if (!row) return
        setEditingNumber(null)
        await updateValueMutation.mutateAsync({
            databaseId,
            rowId: row.id,
            propertyId,
            value: numberValue ? parseFloat(numberValue) : null,
        })
    }, [row, databaseId, updateValueMutation, numberValue])

    // Render property value editor based on type
    const renderPropertyEditor = useCallback((property: DatabaseProperty) => {
        if (!row) return null
        const value = getPropertyValue(property.id)

        switch (property.type) {
            case 'select':
                return (
                    <SelectCell
                        databaseId={databaseId}
                        rowId={row.id}
                        property={property}
                        value={value as string | null}
                    />
                )

            case 'multi_select':
                return (
                    <MultiSelectCell
                        databaseId={databaseId}
                        rowId={row.id}
                        property={property}
                        value={value as string[] | null}
                    />
                )

            case 'date':
                return (
                    <DateCell
                        databaseId={databaseId}
                        rowId={row.id}
                        property={property}
                        value={value as string | null}
                    />
                )

            case 'checkbox':
                return (
                    <motion.button
                        onClick={() => handleCheckboxToggle(property.id, value)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${value
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/30 hover:border-primary'
                            }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {value ? <span className="text-xs">✓</span> : null}
                    </motion.button>
                )

            case 'number':
                if (editingNumber === property.id) {
                    return (
                        <input
                            type="number"
                            value={numberValue}
                            onChange={(e) => setNumberValue(e.target.value)}
                            onBlur={() => handleNumberUpdate(property.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleNumberUpdate(property.id)
                                if (e.key === 'Escape') setEditingNumber(null)
                            }}
                            className="w-24 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                            autoFocus
                        />
                    )
                }
                return (
                    <div
                        onClick={() => {
                            setEditingNumber(property.id)
                            setNumberValue(value !== null && value !== undefined ? String(value) : '')
                        }}
                        className="px-2 py-1 text-sm cursor-pointer hover:bg-muted/50 rounded min-w-[60px]"
                    >
                        {value !== null && value !== undefined ? Number(value).toLocaleString() : '-'}
                    </div>
                )

            case 'url':
                const urlValue = value as string | null
                return urlValue ? (
                    <a
                        href={urlValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex items-center gap-1 max-w-[300px] truncate"
                    >
                        <Link2 size={12} />
                        {urlValue.replace(/^https?:\/\//, '').slice(0, 40)}...
                    </a>
                ) : (
                    <span className="text-muted-foreground/50 text-sm">-</span>
                )

            default:
                return (
                    <span className="text-sm">
                        {value !== null && value !== undefined ? String(value) : '-'}
                    </span>
                )
        }
    }, [row, databaseId, getPropertyValue, handleCheckboxToggle, editingNumber, numberValue, handleNumberUpdate])

    // Group properties by type for better organization
    const { keyMetrics, otherProps } = useMemo(() => {
        const keyTypes = ['select', 'date', 'number']
        const key = properties.filter(p => keyTypes.includes(p.type) && p.type !== 'title').slice(0, 4)
        const other = properties.filter(p => !key.includes(p) && p.type !== 'title')
        return { keyMetrics: key, otherProps: other }
    }, [properties])

    return (
        <AnimatePresence>
            {isOpen && row && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Side Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-background shadow-2xl border-l flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-muted/30 to-background">
                            <div className="flex items-center gap-3">
                                {/* Navigation */}
                                {onNavigate && rows && rows.length > 1 && (
                                    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                                        <motion.button
                                            onClick={() => onNavigate('prev')}
                                            disabled={!hasPrev}
                                            className="p-1.5 rounded-md hover:bg-background disabled:opacity-30 transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <ChevronLeft size={16} />
                                        </motion.button>
                                        <span className="text-xs text-muted-foreground px-2 font-medium">
                                            {currentIndex + 1} / {rows.length}
                                        </span>
                                        <motion.button
                                            onClick={() => onNavigate('next')}
                                            disabled={!hasNext}
                                            className="p-1.5 rounded-md hover:bg-background disabled:opacity-30 transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <ChevronRight size={16} />
                                        </motion.button>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                <motion.button
                                    onClick={() => window.open(`/workspaces/${workspaceId}/pages/${row.id}`, '_blank')}
                                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                                    whileHover={{ scale: 1.1 }}
                                    title="Abrir página completa"
                                >
                                    <ExternalLink size={16} />
                                </motion.button>
                                <motion.button
                                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                                    whileHover={{ scale: 1.1 }}
                                    title="Duplicar (Próximamente)"
                                >
                                    <Copy size={16} />
                                </motion.button>
                                <motion.button
                                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                                    whileHover={{ scale: 1.1 }}
                                    title="Más opciones"
                                >
                                    <MoreHorizontal size={16} />
                                </motion.button>
                                <motion.button
                                    onClick={async () => {
                                        if (confirm('¿Estás seguro de eliminar este registro?')) {
                                            // Ideally pass useDeleteRow as prop or import it
                                            // For now we'll just close and let the user delete from table if needed
                                            // But let's try to fetch if we can
                                            onClose()
                                        }
                                    }}
                                    className="p-2 rounded-lg hover:bg-muted transition-colors ml-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </motion.button>
                                <motion.button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-muted transition-colors ml-1"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X size={18} />
                                </motion.button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Title Section */}
                            <div className="px-6 py-6 border-b">
                                <div className="flex items-start gap-4">
                                    {row.icon && (
                                        <span className="text-5xl">{row.icon}</span>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            value={row.title || ''}
                                            onChange={(e) => {
                                                const titleProp = properties.find(p => p.type === 'title')
                                                if (titleProp) {
                                                    updateValueMutation.mutate({
                                                        databaseId,
                                                        rowId: row.id,
                                                        propertyId: titleProp.id,
                                                        value: e.target.value
                                                    })
                                                }
                                            }}
                                            className="text-3xl font-bold mb-2 bg-transparent border-none focus:outline-none w-full placeholder:text-muted-foreground/50"
                                            placeholder="Sin título"
                                        />
                                        {/* Key metrics bar */}
                                        {keyMetrics.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-3 mt-3">
                                                {keyMetrics.map(prop => {
                                                    const val = getPropertyValue(prop.id)
                                                    if (!val) return null

                                                    if (prop.type === 'select') {
                                                        const options = (prop.config as { options?: SelectOption[] })?.options || []
                                                        const opt = options.find(o => o.id === val)
                                                        if (opt) {
                                                            return (
                                                                <span
                                                                    key={prop.id}
                                                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${OPTION_COLORS[opt.color]?.bg || 'bg-gray-100'} ${OPTION_COLORS[opt.color]?.text || 'text-gray-700'}`}
                                                                >
                                                                    {opt.name}
                                                                </span>
                                                            )
                                                        }
                                                    }
                                                    if (prop.type === 'date') {
                                                        const dateStr = typeof val === 'string' ? val : (val as { start?: string })?.start
                                                        if (dateStr) {
                                                            return (
                                                                <span key={prop.id} className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Calendar size={12} />
                                                                    {new Date(dateStr).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            )
                                                        }
                                                    }
                                                    if (prop.type === 'number') {
                                                        return (
                                                            <span key={prop.id} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                                                {prop.name}: {Number(val).toLocaleString()}
                                                            </span>
                                                        )
                                                    }
                                                    return null
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Properties Section */}
                            <div className="px-6 py-4">
                                <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                                    Propiedades
                                </h2>
                                <div className="space-y-1">
                                    {properties.filter(p => p.type !== 'title').map((property, index) => (
                                        <motion.div
                                            key={property.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-muted/30 transition-colors group"
                                        >
                                            <div className="w-36 flex-shrink-0 flex items-center gap-2 text-sm text-muted-foreground">
                                                <PropertyIcon type={property.type} />
                                                <span className="truncate">{property.name}</span>
                                            </div>
                                            <div className="flex-1">
                                                {renderPropertyEditor(property)}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Add Property Button */}
                                    <div className="ml-36 pt-2 relative">
                                        <div className="ml-36 pt-2">
                                            {!isCreatingProperty ? (
                                                <button
                                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                                    onClick={() => setIsCreatingProperty(true)}
                                                >
                                                    <Plus size={14} />
                                                    Agregar propiedad
                                                </button>
                                            ) : (
                                                <div className="bg-muted/10 border rounded-lg p-3 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nueva Propiedad</span>
                                                        <button
                                                            onClick={() => setIsCreatingProperty(false)}
                                                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>

                                                    <input
                                                        autoFocus
                                                        placeholder="Nombre de la propiedad..."
                                                        className="w-full px-3 py-2 text-sm bg-background rounded-md border shadow-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                        value={newPropertyName}
                                                        onChange={e => setNewPropertyName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Escape') setIsCreatingProperty(false)
                                                        }}
                                                    />

                                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                                        {[
                                                            { type: 'text', label: 'Texto', icon: <Type size={14} /> },
                                                            { type: 'number', label: 'Número', icon: <Hash size={14} /> },
                                                            { type: 'select', label: 'Selección', icon: <List size={14} /> },
                                                            { type: 'multi_select', label: 'Multi-select', icon: <Tag size={14} /> },
                                                            { type: 'date', label: 'Fecha', icon: <Calendar size={14} /> },
                                                            { type: 'checkbox', label: 'Casilla', icon: <CheckSquare size={14} /> },
                                                            { type: 'url', label: 'URL', icon: <Link2 size={14} /> },
                                                            { type: 'email', label: 'Email', icon: <AtSign size={14} /> },
                                                            { type: 'phone', label: 'Teléfono', icon: <Phone size={14} /> },
                                                            { type: 'person', label: 'Persona', icon: <Users size={14} /> },
                                                        ].map((pt) => (
                                                            <button
                                                                key={pt.type}
                                                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border bg-background hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all text-left group"
                                                                onClick={async () => {
                                                                    if (!newPropertyName.trim()) {
                                                                        alert('Por favor escribe un nombre para la propiedad')
                                                                        return
                                                                    }
                                                                    try {
                                                                        await createPropertyMutation.mutateAsync({
                                                                            databaseId,
                                                                            name: newPropertyName,
                                                                            type: pt.type as PropertyType,
                                                                            config: {}
                                                                        })
                                                                        setIsCreatingProperty(false)
                                                                        setNewPropertyName('')
                                                                    } catch (err) {
                                                                        console.error(err)
                                                                        alert('Error creando propiedad')
                                                                    }
                                                                }}
                                                            >
                                                                <span className="text-muted-foreground group-hover:text-primary transition-colors">{pt.icon}</span>
                                                                <span className="truncate">{pt.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="px-6 py-4 border-t bg-muted/5">
                                <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide flex items-center gap-2">
                                    <MessageSquare size={14} />
                                    Comentarios
                                </h2>

                                <CommentsSection pageId={row.id} />
                            </div>
                        </div>

                        {/* Footer - Keyboard hints */}
                        <div className="px-6 py-3 border-t bg-muted/10 text-xs text-muted-foreground flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">←</kbd>
                                <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">→</kbd>
                                Navegar
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">Esc</kbd>
                                Cerrar
                            </span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
})

export default FullPagePeek
