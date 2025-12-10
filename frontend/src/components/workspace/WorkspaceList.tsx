"use client"

import { useWorkspaces } from "@/hooks/useWorkspaces"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function WorkspaceList() {
    const { workspaces, isLoading } = useWorkspaces()

    if (isLoading) {
        return <div>Loading workspaces...</div>
    }

    if (workspaces.length === 0) {
        return (
            <div className="text-center p-8">
                <p>No workspaces found. Create one to get started!</p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
                <Card key={ws.id} className="hover:shadow-md transition-all cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {ws.icon} {ws.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground mb-4">
                            Created {new Date(ws.createdAt).toLocaleDateString()}
                        </div>
                        <Link href={`/workspaces/${ws.id}`}>
                            <Button size="sm" className="w-full">
                                Open <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
