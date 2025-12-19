'use client'

import React, { useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Calendar, User, Hash, Tag, CheckSquare, Link2 } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { DatabaseRow } from '@/hooks/useDatabaseRows'

interface GalleryCardProps {
    row: DatabaseRow
    properties: DatabaseProperty[]
    imageUrl?: string
    imageHeight: string
    fitImage: boolean
    onClick: () => void
}

// Generate gradient from title/id for consistent colors
const getGradient = (seed: string): string => {
    const gradients = [
        'from-violet-500/30 via-purple-500/20 to-fuchsia-500/30',
        'from-blue-500/30 via-cyan-500/20 to-teal-500/30',
        'from-rose-500/30 via-pink-500/20 to-red-500/30',
        'from-amber-500/30 via-orange-500/20 to-yellow-500/30',
        'from-emerald-500/30 via-green-500/20 to-lime-500/30',
        'from-sky-500/30 via-indigo-500/20 to-blue-500/30',
    ]
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return gradients[hash % gradients.length]
}

const GalleryCard = React.memo(function GalleryCard({
    row,
    properties,
    imageUrl,
    imageHeight,
    fitImage,
    onClick,
}: GalleryCardProps) {
    const getPropertyValue = useCallback((propId: string) => {
        const pv = row.propertyValues?.find(v => v.propertyId === propId)
        return pv?.value
    }, [row.propertyValues])

    const getPropertyIcon = useCallback((type: string): React.ReactNode => {
        switch (type) {
            case 'date':
                return <Calendar size={10} className="text-purple-500/70" />
            case 'person':
                return <User size={10} className="text-blue-500/70" />
            case 'number':
                return <Hash size={10} className="text-green-500/70" />
            case 'select':
            case 'multi_select':
                return <Tag size={10} className="text-orange-500/70" />
            case 'checkbox':
                return <CheckSquare size={10} className="text-cyan-500/70" />
            case 'url':
                return <Link2 size={10} className="text-blue-500/70" />
            default:
                return null
        }
    }, [])

    const formatValue = useCallback((value: unknown, type: string): string | null => {
        if (value === null || value === undefined) return null

        switch (type) {
            case 'date':
                try {
                    return new Date(value as string).toLocaleDateString('es', {
                        month: 'short',
                        day: 'numeric'
                    })
                } catch {
                    return null
                }
            case 'checkbox':
                return value ? '✓' : '✗'
            case 'number':
                return typeof value === 'number' ? value.toLocaleString() : String(value)
            case 'multi_select':
                if (Array.isArray(value)) return value.join(', ')
                return String(value)
            default:
                return String(value).slice(0, 50)
        }
    }, [])

    // Memoize gradient for no-image placeholder
    const gradientClass = useMemo(() => getGradient(row.id || row.title || ''), [row.id, row.title])

    // Get first letter/emoji for placeholder
    const placeholderContent = useMemo(() => {
        if (row.icon) return row.icon
        if (row.title) return row.title.charAt(0).toUpperCase()
        return '📄'
    }, [row.icon, row.title])

    return (
        <motion.div
            className="group bg-background border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            {/* Image */}
            <div className={`relative ${imageHeight} overflow-hidden`}>
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt={row.title || 'Image'}
                        className={`w-full h-full ${fitImage ? 'object-contain bg-muted/30' : 'object-cover'} transition-transform duration-300 group-hover:scale-110`}
                        loading="lazy"
                    />
                ) : (
                    // Gradient placeholder
                    <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                        <motion.span
                            className="text-4xl opacity-50 group-hover:opacity-80 transition-opacity"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            {placeholderContent}
                        </motion.span>
                    </div>
                )}

                {/* Hover overlay with glassmorphism */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3"
                >
                    <span className="text-white text-xs font-medium">Clic para ver más</span>
                </motion.div>
            </div>

            {/* Content */}
            <div className="p-3">
                {/* Title */}
                <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {row.icon && <span className="mr-1.5">{row.icon}</span>}
                    {row.title || 'Sin título'}
                </h3>

                {/* Properties */}
                {properties.length > 0 && (
                    <div className="space-y-1.5">
                        {properties.map(prop => {
                            const value = getPropertyValue(prop.id)
                            const formatted = formatValue(value, prop.type)
                            if (!formatted) return null

                            return (
                                <div
                                    key={prop.id}
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                                >
                                    {getPropertyIcon(prop.type)}
                                    <span className="truncate">{formatted}</span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    )
})

export default GalleryCard
