"use client";

import { usePages } from "@/hooks/usePages";
import { Plus, FileText, MoreHorizontal, Trash2, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface PageTreeProps {
    workspaceId: string;
}

export function PageTree({ workspaceId }: PageTreeProps) {
    const { pages, isLoading, createPage, deletePage } = usePages(workspaceId);
    const pathname = usePathname();
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // R19: Filter pages by search query
    const filteredPages = useMemo(() => {
        if (!pages) return [];
        if (!searchQuery.trim()) return pages;
        return pages.filter((page) => {
            const title = page.title || "Sin título";
            return title.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [pages, searchQuery]);

    const handleCreatePage = async () => {
        setIsCreating(true);
        try {
            const newPage = await createPage({
                workspaceId,
                title: "Sin título",
                icon: "📄",
            });
            router.push(`/workspaces/${workspaceId}/pages/${newPage.id}`);
        } catch (error) {
            console.error("Failed to create page:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeletePage = async (pageId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("¿Eliminar esta página?")) {
            try {
                await deletePage(pageId);
                if (pathname.includes(pageId)) {
                    router.push(`/workspaces/${workspaceId}`);
                }
            } catch (error) {
                console.error("Failed to delete page:", error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-2 px-2">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-8 bg-muted rounded animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {/* R19: Search input - only show if 5+ pages */}
            {pages.length >= 5 && (
                <div className="px-2 pb-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar páginas..."
                            className="w-full pl-7 pr-7 py-1.5 text-xs bg-muted/50 border border-transparent rounded-md focus:outline-none focus:border-primary/50 focus:bg-background transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
                            >
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Header con botón de nueva página */}
            <div className="px-4 py-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Páginas
                    {searchQuery && ` (${filteredPages.length})`}
                </span>
                <button
                    onClick={handleCreatePage}
                    disabled={isCreating}
                    className={cn(
                        "p-1 hover:bg-muted rounded transition-all",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        isCreating && "animate-pulse"
                    )}
                    title="Nueva página"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            {/* Lista de páginas */}
            {filteredPages.length === 0 ? (
                <div className="px-4 py-8 text-sm text-muted-foreground text-center">
                    {searchQuery ? (
                        <>
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Sin resultados para "{searchQuery}"</p>
                        </>
                    ) : (
                        <>
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Sin páginas aún</p>
                            <button
                                onClick={handleCreatePage}
                                disabled={isCreating}
                                className="text-primary hover:underline mt-2 text-xs"
                            >
                                Crear la primera página
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-0.5 px-2">
                    <TooltipProvider delayDuration={500}>
                        {filteredPages.map((page) => {
                            const isActive = pathname.includes(page.id);
                            const title = page.title || "Sin título";
                            const showTooltip = title.length > 20;

                            return (
                                <div key={page.id} className="group relative">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={`/workspaces/${workspaceId}/pages/${page.id}`}
                                                className={cn(
                                                    "flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-all w-full",
                                                    "hover:bg-muted hover:pl-3",
                                                    isActive &&
                                                    "bg-primary/10 text-primary font-medium border-l-2 border-primary pl-2"
                                                )}
                                            >
                                                <span className="text-base flex-shrink-0">
                                                    {page.icon || "📄"}
                                                </span>
                                                <span className="truncate flex-1">
                                                    {title}
                                                </span>
                                            </Link>
                                        </TooltipTrigger>
                                        {showTooltip && (
                                            <TooltipContent side="right">
                                                <p>{title}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>

                                    {/* Menu contextual */}
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-1 rounded hover:bg-muted">
                                                    <MoreHorizontal className="h-3 w-3" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={(e) =>
                                                        handleDeletePage(page.id, e)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </TooltipProvider>
                </div>
            )}
        </div>
    );
}
