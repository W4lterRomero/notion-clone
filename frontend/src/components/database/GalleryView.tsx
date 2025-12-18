'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDatabaseProperties } from '@/hooks/useDatabaseProperties'
import { useDatabaseRows } from '@/hooks/useDatabaseRows'
import GalleryCard from './GalleryCard'
import { Loader2, Settings, Grid, LayoutGrid, Square } from 'lucide-react'

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
    small: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    medium: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    large: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3',
}

const SIZE_HEIGHTS = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64',
}

export default function GalleryView({ databaseId, workspaceId, viewConfig }: GalleryViewProps) {
    const { data: properties, isLoading: loadingProps } = useDatabaseProperties(databaseId)
    const { data: rows, isLoading: loadingRows } = useDatabaseRows(databaseId)

    const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>(
        viewConfig.imageSize || 'medium'
    )
    const [lightboxRow, setLightboxRow] = useState<string | null>(null)

    // Find URL property for cover image
    const imageProperty = properties?.find(p => p.type === 'url')
    const visibleProps = properties?.filter(
        p => (viewConfig.visibleProperties?.includes(p.id) ?? true) &&
            p.type !== 'title' &&
            p.type !== 'url'
    ).slice(0, 3)

    if (loadingProps || loadingRows) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div>
            {/* Gallery Controls */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                    {rows?.length || 0} elementos
                </div>
                <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                    <motion.button
                        onClick={() => setImageSize('small')}
                        className={`p-1.5 rounded transition-colors ${imageSize === 'small' ? 'bg-background shadow-sm' : 'hover:bg-muted'
                            }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Grid size={14} />
                    </motion.button>
                    <motion.button
                        onClick={() => setImageSize('medium')}
                        className={`p-1.5 rounded transition-colors ${imageSize === 'medium' ? 'bg-background shadow-sm' : 'hover:bg-muted'
                            }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <LayoutGrid size={14} />
                    </motion.button>
                    <motion.button
                        onClick={() => setImageSize('large')}
                        className={`p-1.5 rounded transition-colors ${imageSize === 'large' ? 'bg-background shadow-sm' : 'hover:bg-muted'
                            }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Square size={14} />
                    </motion.button>
                </div>
            </div>

            {/* Gallery Grid */}
            <div className={`grid gap-4 ${SIZE_CLASSES[imageSize]}`}>
                {rows?.map((row, index) => {
                    // Get image URL from property
                    const imagePv = imageProperty
                        ? row.propertyValues?.find(pv => pv.propertyId === imageProperty.id)
                        : null
                    const imageUrl = imagePv?.value as string | undefined

                    return (
                        <motion.div
                            key={row.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                        >
                            <GalleryCard
                                row={row}
                                properties={visibleProps || []}
                                imageUrl={imageUrl}
                                imageHeight={SIZE_HEIGHTS[imageSize]}
                                fitImage={viewConfig.fitImage ?? true}
                                onClick={() => setLightboxRow(row.id)}
                            />
                        </motion.div>
                    )
                })}

                {/* Empty state */}
                {(!rows || rows.length === 0) && (
                    <div className="col-span-full p-8 text-center text-muted-foreground">
                        No hay elementos para mostrar
                    </div>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxRow && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
                        onClick={() => setLightboxRow(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="max-w-4xl max-h-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {(() => {
                                const row = rows?.find(r => r.id === lightboxRow)
                                const imagePv = imageProperty
                                    ? row?.propertyValues?.find(pv => pv.propertyId === imageProperty.id)
                                    : null
                                const imageUrl = imagePv?.value as string | undefined

                                if (!imageUrl) {
                                    return (
                                        <div className="bg-muted/50 rounded-xl p-8 text-center text-muted-foreground">
                                            Sin imagen
                                        </div>
                                    )
                                }

                                return (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={imageUrl}
                                        alt={row?.title || 'Image'}
                                        className="max-w-full max-h-[80vh] object-contain rounded-xl"
                                    />
                                )
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
