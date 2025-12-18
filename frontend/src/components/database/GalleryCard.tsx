'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ImageOff, Calendar, User, Hash, Tag } from 'lucide-react'
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

export default function GalleryCard({
    row,
    properties,
    imageUrl,
    imageHeight,
    fitImage,
    onClick,
}: GalleryCardProps) {
    const getPropertyValue = (propId: string) => {
        const pv = row.propertyValues?.find(v => v.propertyId === propId)
        return pv?.value
    }

    const getPropertyIcon = (type: string): React.ReactNode => {
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
            default:
                return null
        }
    }

    const formatValue = (value: unknown, type: string): string | null => {
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
    }

    return (
        <motion.div
            className="group bg-background border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer"
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            {/* Image */}
            <div className={`relative ${imageHeight} bg-muted/50 overflow-hidden`}>
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt={row.title || 'Image'}
                        className={`w-full h-full ${fitImage ? 'object-contain' : 'object-cover'} transition-transform group-hover:scale-105`}
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageOff size={32} />
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Content */}
            <div className="p-3">
                {/* Title */}
                <h3 className="font-medium text-sm mb-2 line-clamp-2">
                    {row.icon && <span className="mr-1">{row.icon}</span>}
                    {row.title || 'Sin título'}
                </h3>

                {/* Properties */}
                {properties.length > 0 && (
                    <div className="space-y-1">
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
}
