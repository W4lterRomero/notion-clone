"use client"

import { useWorkspaceStore } from "@/store/workspaceStore"

export function Header() {
    const { currentWorkspace } = useWorkspaceStore()

    return (
        <header className="border-b px-6 py-3 flex items-center justify-between bg-background">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                    {currentWorkspace ? currentWorkspace.name : "Select a Workspace"}
                </h1>
            </div>
        </header>
    )
}
