'use client'

import { useRef, useEffect, useState, ReactNode, useCallback } from 'react'
import { X } from 'lucide-react'

interface GlassPopoverProps {
    isOpen: boolean
    onClose: () => void
    triggerRef: React.RefObject<HTMLElement>
    children: ReactNode
    title?: string
    width?: number
    showCloseButton?: boolean
}

export default function GlassPopover({
    isOpen,
    onClose,
    triggerRef,
    children,
    title,
    width = 320,
    showCloseButton = true,
}: GlassPopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const [isClosing, setIsClosing] = useState(false)

    // Calculate position relative to trigger
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            const popoverHeight = 300 // estimated
            const spaceBelow = window.innerHeight - rect.bottom
            const spaceAbove = rect.top

            // Position below if enough space, otherwise above
            const top = spaceBelow > popoverHeight || spaceBelow > spaceAbove
                ? rect.bottom + 8
                : rect.top - popoverHeight - 8

            // Horizontal centering with bounds checking
            let left = rect.left + (rect.width / 2) - (width / 2)
            left = Math.max(16, Math.min(left, window.innerWidth - width - 16))

            setPosition({ top, left })
        }
    }, [isOpen, triggerRef, width])

    const handleClose = useCallback(() => {
        setIsClosing(true)
        setTimeout(() => {
            setIsClosing(false)
            onClose()
        }, 150)
    }, [onClose])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                handleClose()
            }
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, triggerRef, handleClose])

    if (!isOpen && !isClosing) return null

    return (
        <div
            ref={popoverRef}
            className={`
                fixed z-50 rounded-xl shadow-2xl overflow-hidden
                glass glass-border
                ${isClosing ? 'animate-popover-out' : 'animate-popover-in'}
            `}
            style={{
                top: position.top,
                left: position.left,
                width,
            }}
        >
            {/* Header */}
            {(title || showCloseButton) && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                    {title && (
                        <h3 className="text-sm font-semibold text-foreground">
                            {title}
                        </h3>
                    )}
                    {showCloseButton && (
                        <button
                            onClick={handleClose}
                            className="p-1 rounded-md hover:bg-muted transition-colors"
                        >
                            <X size={16} className="text-muted-foreground" />
                        </button>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
                {children}
            </div>
        </div>
    )
}
