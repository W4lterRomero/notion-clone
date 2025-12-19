import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Send, User as UserIcon, Trash2 } from 'lucide-react'
import { useComments } from '@/hooks/useComments'

export function CommentsSection({ pageId }: { pageId: string }) {
    const { comments, createComment, deleteComment, isLoading, isCreating } = useComments(pageId)
    const [newComment, setNewComment] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim()) return

        try {
            await createComment(newComment)
            setNewComment('')
        } catch (error) {
            console.error('Failed to add comment', error)
        }
    }

    return (
        <div className="space-y-6">
            {/* Comment List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center text-sm text-muted-foreground py-4">Cargando comentarios...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-4 italic">
                        No hay comentarios aún. ¡Sé el primero!
                    </div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                {comment.author?.avatar ? (
                                    <img src={comment.author.avatar} alt={comment.author.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <UserIcon size={14} />
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{comment.author?.name || 'Usuario'}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => deleteComment(comment.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 transition-all"
                                        title="Eliminar comentario"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-background border rounded-lg p-3 shadow-sm">
                                    {comment.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="relative">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="w-full min-h-[80px] p-3 pr-12 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y text-sm transition-shadow"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit(e)
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={!newComment.trim() || isCreating}
                    className="absolute bottom-3 right-3 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                >
                    <Send size={14} />
                </button>
            </form>
        </div>
    )
}
