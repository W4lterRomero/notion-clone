"use client"

import Link from "next/link"
import { useWorkspaces } from "@/hooks/useWorkspaces"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { Button } from "@/components/ui/button"
import { Plus, Layout, Settings, LogOut, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { PageTree } from "./PageTree"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"

export function Sidebar({ className }: { className?: string }) {
    const { user, Logout } = useAuth()
    const { workspaces, createWorkspace } = useWorkspaces()
    const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()
    const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set())

    const handleCreateWorkspace = async () => {
        const name = prompt("Nombre del workspace:")
        if (name) {
            await createWorkspace({ name, icon: "📁" })
        }
    }

    const toggleWorkspace = (wsId: string) => {
        const newExpanded = new Set(expandedWorkspaces)
        if (newExpanded.has(wsId)) {
            newExpanded.delete(wsId)
        } else {
            newExpanded.add(wsId)
        }
        setExpandedWorkspaces(newExpanded)
    }

    const handleSelectWorkspace = (ws: typeof workspaces[0]) => {
        setCurrentWorkspace(ws)
        // Auto-expand when selecting
        if (!expandedWorkspaces.has(ws.id)) {
            const newExpanded = new Set(Array.from(expandedWorkspaces))
            newExpanded.add(ws.id)
            setExpandedWorkspaces(newExpanded)
        }
    }

    return (
        <div className={cn("flex flex-col w-64 border-r bg-muted/20 h-screen", className)}>
            {/* Header */}
            <div className="px-3 py-4 border-b">
                <div className="flex items-center justify-between mb-2 px-1">
                    <h2 className="text-lg font-semibold tracking-tight">Workspaces</h2>
                    <Button variant="ghost" size="icon" onClick={handleCreateWorkspace}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Workspaces and Pages */}
            <div className="flex-1 overflow-y-auto py-2">
                <div className="space-y-1 px-2">
                    {workspaces.map((ws) => {
                        const isSelected = currentWorkspace?.id === ws.id
                        const isExpanded = expandedWorkspaces.has(ws.id)

                        return (
                            <div key={ws.id}>
                                {/* Workspace Row */}
                                <div
                                    className={cn(
                                        "flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer transition-colors",
                                        "hover:bg-muted",
                                        isSelected && "bg-muted"
                                    )}
                                >
                                    <button
                                        onClick={() => toggleWorkspace(ws.id)}
                                        className="p-0.5 hover:bg-muted-foreground/10 rounded"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </button>
                                    <Link
                                        href={`/workspaces/${ws.id}`}
                                        onClick={() => handleSelectWorkspace(ws)}
                                        className="flex items-center gap-2 flex-1"
                                    >
                                        <span className="text-base">{ws.icon || "📁"}</span>
                                        <span className={cn("text-sm truncate", isSelected && "font-medium")}>
                                            {ws.name}
                                        </span>
                                    </Link>
                                </div>

                                {/* Pages under this workspace */}
                                {isExpanded && (
                                    <div className="ml-4 border-l border-border pl-2 mt-1">
                                        <PageTree workspaceId={ws.id} />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="px-3 py-4 border-t space-y-1">
                <div className="flex items-center justify-between px-2">
                    <span className="text-sm text-muted-foreground">Tema</span>
                    <ThemeToggle />
                </div>
                <Button variant="ghost" className="w-full justify-start text-sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                </Button>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-sm text-destructive hover:text-destructive"
                    onClick={Logout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                </Button>
                {user && (
                    <p className="px-2 pt-2 text-xs text-muted-foreground">
                        {user.email}
                    </p>
                )}
            </div>
        </div>
    )
}

