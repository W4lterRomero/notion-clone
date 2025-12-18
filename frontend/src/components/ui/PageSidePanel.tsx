'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { X, ExternalLink, Loader2 } from 'lucide-react'
import { usePage } from '@/hooks/usePages'

interface PageSidePanelProps {
    isOpen: boolean
    onClose: () => void
    pageId: string | null
    onNavigate?: (pageId: string) => void
}

export default function PageSidePanel({
    isOpen,
    onClose,
    pageId,
    onNavigate,
}: PageSidePanelProps) {
    const panelRef = useRef<HTMLDivElement>(null)
    const [isClosing, setIsClosing] = useState(false)
    const { data: page, isLoading } = usePage(pageId || undefined)

    const handleClose = useCallback(() => {
        setIsClosing(true)
        setTimeout(() => {
            setIsClosing(false)
            onClose()
        }, 200)
    }, [onClose])

    // Close on escape
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, handleClose])

    const handleNavigate = () => {
        if (pageId && onNavigate) {
            onNavigate(pageId)
        }
    }

    if (!isOpen && !isClosing) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/20 z-40 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
                onClick={handleClose}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className={`
                    fixed right-0 top-0 bottom-0 w-[420px] max-w-[90vw]
                    bg-background border-l shadow-2xl z-50
                    ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        {page?.icon && (
                            <span className="text-lg">{page.icon}</span>
                        )}
                        <h2 className="font-semibold text-sm truncate max-w-[250px]">
                            {page?.title || 'Sin título'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-1">
                        {onNavigate && (
                            <button
                                onClick={handleNavigate}
                                className="p-2 rounded-md hover:bg-muted transition-colors"
                                title="Abrir en página completa"
                            >
                                <ExternalLink size={16} className="text-muted-foreground" />
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-md hover:bg-muted transition-colors"
                        >
                            <X size={16} className="text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto h-[calc(100%-56px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : page ? (
                        <div className="space-y-4">
                            {/* Page Icon & Title */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                                    {page.icon || '📄'}
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold">
                                        {page.title || 'Sin título'}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Creado: {new Date(page.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Quick Info */}
                            <div className="p-4 rounded-lg bg-muted/30 border">
                                <p className="text-sm text-muted-foreground">
                                    Haz clic en el botón de expandir para ver el contenido completo de esta página.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-4">
                                <button
                                    onClick={handleNavigate}
                                    className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ExternalLink size={18} />
                                    Abrir página
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            No se pudo cargar la página
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
