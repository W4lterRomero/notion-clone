"use client"

import { useWorkspaceStore } from "@/store/workspaceStore"
import { useAuth } from "@/hooks/useAuth"

export default function WorkspaceIndexPage() {
    const { user } = useAuth()

    return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <h2 className="text-2xl font-bold">Welcome back, {user?.name}</h2>
            <p className="text-muted-foreground">Select a workspace from the sidebar or create a new one.</p>
        </div>
    )
}
