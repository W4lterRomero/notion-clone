"use client"

import Link from "next/link"
import { useAuthStore } from "@/store/authStore"
import { useWorkspaces } from "@/hooks/useWorkspaces"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { Button } from "@/components/ui/button"
import { Plus, Layout, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

export function Sidebar({ className }: { className?: string }) {
    const { user, Logout } = useAuth()
    const { workspaces, createWorkspace } = useWorkspaces()
    const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()

    const handleCreateWorkspace = async () => {
        const name = prompt("Enter workspace name:")
        if (name) {
            await createWorkspace({ name, icon: "📁" })
        }
    }

    return (
        <div className={cn("pb-12 w-64 border-r bg-muted/20 h-screen", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="flex items-center justify-between mb-4 px-4">
                        <h2 className="text-lg font-semibold tracking-tight">Workspaces</h2>
                        <Button variant="ghost" size="icon" onClick={handleCreateWorkspace}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="space-y-1">
                        {workspaces.map((ws) => (
                            <Link key={ws.id} href={`/workspaces/${ws.id}`}>
                                <Button
                                    variant={currentWorkspace?.id === ws.id ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                    onClick={() => setCurrentWorkspace(ws)}
                                >
                                    <Layout className="mr-2 h-4 w-4" />
                                    {ws.name}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Settings</h2>
                    <div className="space-y-1">
                        <Button variant="ghost" className="w-full justify-start">
                            <Settings className="mr-2 h-4 w-4" />
                            Profile
                        </Button>
                        <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600" onClick={Logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
                {user && (
                    <div className="px-7 mt-auto">
                        <p className="text-xs text-muted-foreground">Logged in as {user.name}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
