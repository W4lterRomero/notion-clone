'use client'

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDatabaseProperties } from '@/hooks/useDatabaseProperties'
import { useDatabaseRows, DatabaseRow } from '@/hooks/useDatabaseRows'
import GalleryCard from './GalleryCard'
import FullPagePeek from './FullPagePeek'
import ViewSkeleton from './ViewSkeleton'
import { Grid, LayoutGrid, Square, LayoutDashboard } from 'lucide-react'

interface GalleryViewProps {
    databaseId: string
    workspaceId: string
    viewConfig: {
        imageSize?: 'small' | 'medium' | 'large'
        fitImage?: boolean
        visibleProperties?: string[]
        sorts?: Array<{ propertyId: string; direction: 'asc' | 'desc' }>
    }
}

const SIZE_CLASSES = {
    small: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
    medium: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    large: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

const SIZE_HEIGHTS = {
    small: 'h-32',
    medium: 'h-44',
    large: 'h-56',
}

export default function GalleryView({ databaseId, workspaceId, viewConfig }: GalleryViewProps) {
    const { data: properties, isLoading: loadingProps } = useDatabaseProperties(databaseId)
    const { data: rows, isLoading: loadingRows } = useDatabaseRows(databaseId)

    const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>(
        viewConfig.imageSize || 'medium'
    )
    const [selectedRow, setSelectedRow] = useState<DatabaseRow | null>(null)
    const [selectedIndex, setSelectedIndex] = useState<number>(-1)

    // Find URL property for cover image
    const imageProperty = useMemo(() =>
        properties?.find(p => p.type === 'url'),
        [properties]
    )

    const visibleProps = useMemo(() =>
        properties?.filter(
            p => (viewConfig.visibleProperties?.includes(p.id) ?? true) &&
                p.type !== 'title' &&
                p.type !== 'url'
        ).slice(0, 3),
        [properties, viewConfig.visibleProperties]
    )

    // Handle card click
    const handleCardClick = useCallback((row: DatabaseRow, index: number) => {
        setSelectedRow(row)
        setSelectedIndex(index)
    }, [])

    // Row navigation in modal
    const handleRowNavigate = useCallback((direction: 'prev' | 'next') => {
        if (!rows || selectedIndex === -1) return

        if (direction === 'prev' && selectedIndex > 0) {
            setSelectedRow(rows[selectedIndex - 1])
            setSelectedIndex(selectedIndex - 1)
        } else if (direction === 'next' && selectedIndex < rows.length - 1) {
            setSelectedRow(rows[selectedIndex + 1])
            setSelectedIndex(selectedIndex + 1)
        }
    }, [rows, selectedIndex])

    // Keyboard navigation
    useEffect(() => {
        if (!selectedRow) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') handleRowNavigate('prev')
            else if (e.key === 'ArrowRight') handleRowNavigate('next')
            else if (e.key === 'Escape') {
                setSelectedRow(null)
                setSelectedIndex(-1)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedRow, handleRowNavigate])

    // Show skeleton during loading
    if (loadingProps || loadingRows) {
        return <ViewSkeleton type="gallery" />
    }

    return (
        <>
            <div>
                {/* Gallery Controls */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                            {rows?.length || 0} elementos
                        </span>
                    </div>
                    <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
                        <motion.button
                            onClick={() => setImageSize('small')}
                            className={`p-2 rounded-lg transition-all ${imageSize === 'small'
                                ? 'bg-background shadow-sm text-primary'
                                : 'hover:bg-muted text-muted-foreground'
                                }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Vista compacta"
                        >
                            <Grid size={16} />
                        </motion.button>
                        <motion.button
                            onClick={() => setImageSize('medium')}
                            className={`p-2 rounded-lg transition-all ${imageSize === 'medium'
                                ? 'bg-background shadow-sm text-primary'
                                : 'hover:bg-muted text-muted-foreground'
                                }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Vista media"
                        >
                            <LayoutGrid size={16} />
                        </motion.button>
                        <motion.button
                            onClick={() => setImageSize('large')}
                            className={`p-2 rounded-lg transition-all ${imageSize === 'large'
                                ? 'bg-background shadow-sm text-primary'
                                : 'hover:bg-muted text-muted-foreground'
                                }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Vista grande"
                        >
                            <Square size={16} />
                        </motion.button>
                    </div>
                </div>

                {/* Gallery Grid */}
                <motion.div
                    layout
                    className={`grid gap-4 ${SIZE_CLASSES[imageSize]}`}
                >
                    <AnimatePresence mode="popLayout">
                        {rows?.map((row, index) => {
                            // Get image URL from property
                            const imagePv = imageProperty
                                ? row.propertyValues?.find(pv => pv.propertyId === imageProperty.id)
                                : null
                            const imageUrl = imagePv?.value as string | undefined

                            return (
                                <motion.div
                                    key={row.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.02 }}
                                >
                                    <GalleryCard
                                        row={row}
                                        properties={visibleProps || []}
                                        imageUrl={imageUrl}
                                        imageHeight={SIZE_HEIGHTS[imageSize]}
                                        fitImage={viewConfig.fitImage ?? true}
                                        onClick={() => handleCardClick(row, index)}
                                    />
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </motion.div>

                {/* Empty state */}
                {(!rows || rows.length === 0) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-16 text-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                            <LayoutDashboard className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No hay elementos para mostrar</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                            Agrega filas en la vista de tabla
                        </p>
                    </motion.div>
                )}

                {/* Keyboard hint */}
                {rows && rows.length > 0 && (
                    <div className="mt-4 text-center text-xs text-muted-foreground/60">
                        Click en una tarjeta para ver detalles ·
                        <kbd className="mx-1 px-1.5 py-0.5 bg-muted rounded">←</kbd>
                        <kbd className="px-1.5 py-0.5 bg-muted rounded">→</kbd>
                        para navegar
                    </div>
                )}
            </div>

            {/* Row Peek Modal */}
            <FullPagePeek
                row={selectedRow}
                rows={rows}
                properties={properties || []}
                isOpen={!!selectedRow}
                onClose={() => {
                    setSelectedRow(null)
                    setSelectedIndex(-1)
                }}
                onNavigate={handleRowNavigate}
                databaseId={databaseId}
                workspaceId={workspaceId}
            />
        </>
    )
}
