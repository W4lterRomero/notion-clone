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

    // Build recursive tree from flat list
    const pageTree = useMemo(() => {
        if (!pages) return [];

        const tree: Array<typeof pages[0] & { children: typeof pages }> = [];
        const map = new Map<string, typeof pages[0] & { children: typeof pages }>();

        // Initialize map with all pages + empty children array
        pages.forEach(page => {
            map.set(page.id, { ...page, children: [] });
        });

        // Build hierarchy
        pages.forEach(page => {
            const node = map.get(page.id);
            if (!node) return;

            if (page.parentId && map.has(page.parentId)) {
                map.get(page.parentId)!.children.push(node);
            } else {
                // Determine if it's a root item (no parent or parent not found in list)
                // BUT: if we are searching, we flatten result
                tree.push(node);
            }
        });

        return tree;
    }, [pages]);

    // Recursive render component
    const PageItem = ({ page, level = 0 }: { page: typeof pages[0] & { children: typeof pages }, level?: number }) => {
        const isActive = pathname.includes(page.id);
        const title = page.title || "Sin título";
        const hasChildren = page.children && page.children.length > 0;
        const [isExpanded, setIsExpanded] = useState(false);

        // Auto-expand if active child
        // (Simplified for now: keep closed unless manually opened or active)

        return (
            <div className="select-none">
                <div
                    className={cn(
                        "group relative flex items-center gap-1 rounded text-sm transition-all w-full hover:bg-muted py-1",
                        isActive && "bg-primary/10 text-primary font-medium"
                    )}
                    style={{ paddingLeft: `${(level * 12) + 8}px` }}
                >
                    {/* Expand/Collapse Toggle */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsExpanded(!isExpanded);
                        }}
                        className={cn(
                            "h-4 w-4 flex items-center justify-center rounded hover:bg-muted-foreground/20 text-muted-foreground transition-transform",
                            hasChildren ? "opacity-100" : "opacity-0",
                            isExpanded && "rotate-90"
                        )}
                        disabled={!hasChildren}
                    >
                        <span className="text-[10px]">▶</span>
                    </button>

                    <Link
                        href={page.type === 'database'
                            ? `/workspaces/${workspaceId}/databases/${page.id}`
                            : `/workspaces/${workspaceId}/pages/${page.id}`
                        }
                        className="flex-1 flex items-center gap-2 overflow-hidden"
                    >
                        <span className="text-base flex-shrink-0">
                            {page.icon || (page.type === 'database' ? '📊' : '📄')}
                        </span>
                        <span className="truncate">
                            {title}
                        </span>
                    </Link>

                    {/* Actions Menu */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center px-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-0.5 rounded hover:bg-muted-foreground/20">
                                    <MoreHorizontal className="h-3 w-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => handleDeletePage(page.id, e)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Children */}
                {isExpanded && hasChildren && (
                    <div>
                        {page.children.map(child => (
                            <PageItem key={child.id} page={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-2 px-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                ))}
            </div>
        );
    }

    // Render Logic:
    // If Searching -> Show FLAT filtered list
    // If Not Searching -> Show TREE (only roots)

    const listToRender = searchQuery ? filteredPages.map(p => ({ ...p, children: [] })) : pageTree;

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
            <div className="px-4 py-1.5 flex items-center justify-between group">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Páginas
                </span>
                <button
                    onClick={handleCreatePage}
                    disabled={isCreating}
                    className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Nueva página"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            {listToRender.length === 0 ? (
                <div className="px-4 py-4 text-sm text-muted-foreground text-center">
                    <p>Sin páginas</p>
                </div>
            ) : (
                <div className="space-y-0.5">
                    {listToRender.map((node) => (
                        <PageItem key={node.id} page={node} />
                    ))}
                </div>
            )}
        </div>
    );
}
