'use client'

import { ReactNode, useState } from 'react'
import { X } from 'lucide-react'

interface AnimatedChipProps {
    children: ReactNode
    icon?: ReactNode
    onClick?: () => void
    onRemove?: () => void
    variant?: 'default' | 'primary' | 'secondary'
    size?: 'sm' | 'md'
    removable?: boolean
    className?: string
    style?: React.CSSProperties
}

const variantStyles = {
    default: 'bg-muted hover:bg-muted/80 text-foreground',
    primary: 'bg-primary/10 hover:bg-primary/20 text-primary',
    secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
}

const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
}

export default function AnimatedChip({
    children,
    icon,
    onClick,
    onRemove,
    variant = 'primary',
    size = 'md',
    removable = true,
    className = '',
    style,
}: AnimatedChipProps) {
    const [isRemoving, setIsRemoving] = useState(false)

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsRemoving(true)
        setTimeout(() => {
            onRemove?.()
        }, 200)
    }

    return (
        <span
            className={`
                inline-flex items-center rounded-md font-medium
                transition-all duration-200 ease-out
                animate-chip-pop
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-sm active:scale-95' : ''}
                ${isRemoving ? 'scale-0 opacity-0' : ''}
                ${className}
            `}
            onClick={onClick}
            style={style}
        >
            {icon && (
                <span className="flex-shrink-0 opacity-70">
                    {icon}
                </span>
            )}
            <span className="truncate max-w-[120px]">
                {children}
            </span>
            {removable && onRemove && (
                <button
                    onClick={handleRemove}
                    className="flex-shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors ml-0.5"
                >
                    <X size={12} />
                </button>
            )}
        </span>
    )
}
