'use client'

import { useState } from 'react'
import { X, Database } from 'lucide-react'
import { useCreateDatabase } from '@/hooks/useDatabases'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { Button } from '@/components/ui/button'

interface CreateDatabaseModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: (databaseId: string) => void
}

export default function CreateDatabaseModal({
    isOpen,
    onClose,
    onSuccess,
}: CreateDatabaseModalProps) {
    const [title, setTitle] = useState('')
    const [icon, setIcon] = useState('📊')
    const { currentWorkspace } = useWorkspaceStore()
    const createDatabaseMutation = useCreateDatabase()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!currentWorkspace?.id) {
            alert('No workspace seleccionado')
            return
        }

        try {
            const database = await createDatabaseMutation.mutateAsync({
                workspaceId: currentWorkspace.id,
                title: title || 'Base de datos sin título',
                icon,
            })

            onSuccess?.(database.id)
            onClose()
            setTitle('')
            setIcon('📊')
        } catch (error) {
            console.error('Error al crear database:', error)
            alert('Error al crear la base de datos')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6 border">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Crear Base de Datos</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Icon Selector */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Icono
                        </label>
                        <input
                            type="text"
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            className="w-full px-3 py-2 border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="📊"
                        />
                    </div>

                    {/* Title Input */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Título
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Base de datos sin título"
                            autoFocus
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={createDatabaseMutation.isPending}
                        >
                            {createDatabaseMutation.isPending ? 'Creando...' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
