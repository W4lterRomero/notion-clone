"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { usePages } from "@/hooks/usePages";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Trash2 } from "lucide-react";
import Link from "next/link";

export default function WorkspacePage() {
    const params = useParams();
    const id = params.id as string;
    const { workspaces } = useWorkspaces();
    const { setCurrentWorkspace, currentWorkspace } = useWorkspaceStore();
    const { pages, isLoading, createPage, deletePage } = usePages(id);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (id && workspaces.length > 0) {
            const ws = workspaces.find((w) => w.id === id);
            if (ws) {
                setCurrentWorkspace(ws);
            }
        }
    }, [id, workspaces, setCurrentWorkspace]);

    const handleCreatePage = async () => {
        setIsCreating(true);
        try {
            await createPage({
                title: "Nueva página",
                workspaceId: id,
                icon: "📄",
            });
        } catch (error) {
            console.error("Failed to create page:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeletePage = async (pageId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("¿Estás seguro de eliminar esta página?")) {
            try {
                await deletePage(pageId);
            } catch (error) {
                console.error("Failed to delete page:", error);
            }
        }
    };

    if (!currentWorkspace) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Workspace Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <span className="text-5xl">{currentWorkspace.icon || "📁"}</span>
                    <div>
                        <h1 className="text-3xl font-bold">{currentWorkspace.name}</h1>
                        <p className="text-muted-foreground">
                            {pages.length} página{pages.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <Button onClick={handleCreatePage} disabled={isCreating}>
                    <Plus className="mr-2 h-4 w-4" />
                    {isCreating ? "Creando..." : "Nueva página"}
                </Button>
            </div>

            {/* Pages List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : pages.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay páginas</h3>
                    <p className="text-muted-foreground mb-4">
                        Crea tu primera página para comenzar
                    </p>
                    <Button onClick={handleCreatePage} disabled={isCreating}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear página
                    </Button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {pages.map((page) => (
                        <Link
                            key={page.id}
                            href={`/workspaces/${id}/pages/${page.id}`}
                            className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{page.icon || "📄"}</span>
                                <div>
                                    <h3 className="font-medium">{page.title || "Sin título"}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Editado {new Date(page.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleDeletePage(page.id, e)}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
