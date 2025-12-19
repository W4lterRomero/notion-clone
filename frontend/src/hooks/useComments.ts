import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export interface Comment {
    id: string
    content: string
    createdAt: string
    authorId: string
    pageId: string
    author: {
        id: string
        name: string
        avatar?: string
        email: string
    }
}

export function useComments(pageId: string) {
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['comments', pageId],
        queryFn: async () => {
            if (!pageId) return []
            const res = await api.get<Comment[]>(`/comments?pageId=${pageId}`)
            return res.data
        },
        enabled: !!pageId,
    })

    const createCommentMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await api.post<Comment>('/comments', {
                content,
                pageId,
            })
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', pageId] })
        },
    })

    const deleteCommentMutation = useMutation({
        mutationFn: async (commentId: string) => {
            await api.delete(`/comments/${commentId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', pageId] })
        },
    })

    return {
        comments: data || [],
        isLoading,
        createComment: createCommentMutation.mutateAsync,
        deleteComment: deleteCommentMutation.mutateAsync,
        isCreating: createCommentMutation.isPending,
        isDeleting: deleteCommentMutation.isPending,
    }
}
