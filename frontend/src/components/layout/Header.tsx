"use client"

import { useWorkspaceStore } from "@/store/workspaceStore"
import { Menu } from "lucide-react"

interface HeaderProps {
    onMenuClick?: () => void
    showMenuButton?: boolean
}

export function Header({ onMenuClick, showMenuButton }: HeaderProps) {
    const { currentWorkspace } = useWorkspaceStore()

    return (
        <header className="border-b px-3 sm:px-4 md:px-6 py-2 sm:py-3 flex items-center justify-between bg-background">
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Hamburger menu button - visible only on mobile */}
                {showMenuButton && (
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-md hover:bg-muted md:hidden"
                        aria-label="Toggle menu"
                    >
                        <Menu size={20} />
                    </button>
                )}
                <h1 className="text-lg sm:text-xl font-semibold truncate">
                    {currentWorkspace ? currentWorkspace.name : "Select a Workspace"}
                </h1>
            </div>
        </header>
    )
}
