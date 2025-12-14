'use client'

import React from 'react'

// Property type icons map
export const PROPERTY_TYPE_ICONS: Record<string, string> = {
    title: '📝',
    text: '📄',
    number: '🔢',
    select: '📋',
    multi_select: '🏷️',
    date: '📅',
    person: '👤',
    checkbox: '☑️',
    url: '🔗',
    email: '📧',
    phone: '📞',
    relation: '🔗',
    rollup: '🔄',
    formula: 'ƒ',
    created_time: '🕐',
    created_by: '👤',
    last_edited_time: '🕐',
    last_edited_by: '👤',
}

// Property type labels
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
    title: 'Título',
    text: 'Texto',
    number: 'Número',
    select: 'Selección',
    multi_select: 'Multi-selección',
    date: 'Fecha',
    person: 'Persona',
    checkbox: 'Casilla',
    url: 'URL',
    email: 'Email',
    phone: 'Teléfono',
    relation: 'Relación',
    rollup: 'Resumen',
    formula: 'Fórmula',
    created_time: 'Creado',
    created_by: 'Creado por',
    last_edited_time: 'Editado',
    last_edited_by: 'Editado por',
}

interface PropertyTypeIconProps {
    type: string
    showLabel?: boolean
    className?: string
}

export default function PropertyTypeIcon({
    type,
    showLabel = false,
    className = '',
}: PropertyTypeIconProps) {
    const icon = PROPERTY_TYPE_ICONS[type] || '📄'
    const label = PROPERTY_TYPE_LABELS[type] || type

    return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
            <span>{icon}</span>
            {showLabel && <span className="text-sm text-muted-foreground">{label}</span>}
        </span>
    )
}
