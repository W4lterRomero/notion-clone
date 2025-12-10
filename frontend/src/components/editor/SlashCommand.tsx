"use client";

import { useState, useEffect, useRef } from "react";
import {
    Type,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Code,
    Minus,
    Lightbulb,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Command {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    type: string;
    keywords: string[];
}

const commands: Command[] = [
    {
        id: "paragraph",
        title: "Texto",
        description: "Texto simple",
        icon: <Type className="h-5 w-5" />,
        type: "paragraph",
        keywords: ["text", "paragraph", "p", "texto"],
    },
    {
        id: "heading1",
        title: "Encabezado 1",
        description: "Título grande",
        icon: <Heading1 className="h-5 w-5" />,
        type: "heading1",
        keywords: ["h1", "heading", "title", "encabezado"],
    },
    {
        id: "heading2",
        title: "Encabezado 2",
        description: "Título mediano",
        icon: <Heading2 className="h-5 w-5" />,
        type: "heading2",
        keywords: ["h2", "heading", "encabezado"],
    },
    {
        id: "heading3",
        title: "Encabezado 3",
        description: "Título pequeño",
        icon: <Heading3 className="h-5 w-5" />,
        type: "heading3",
        keywords: ["h3", "heading", "encabezado"],
    },
    {
        id: "bulleted",
        title: "Lista con viñetas",
        description: "Lista con bullets",
        icon: <List className="h-5 w-5" />,
        type: "bulleted_list",
        keywords: ["bullet", "list", "ul", "lista"],
    },
    {
        id: "numbered",
        title: "Lista numerada",
        description: "Lista con números",
        icon: <ListOrdered className="h-5 w-5" />,
        type: "numbered_list",
        keywords: ["number", "list", "ol", "numerada"],
    },
    {
        id: "todo",
        title: "Tarea",
        description: "Lista de tareas",
        icon: <CheckSquare className="h-5 w-5" />,
        type: "todo",
        keywords: ["todo", "checkbox", "task", "tarea"],
    },
    {
        id: "toggle",
        title: "Toggle",
        description: "Contenido colapsable",
        icon: <ChevronRight className="h-5 w-5" />,
        type: "toggle",
        keywords: ["toggle", "collapse", "dropdown"],
    },
    {
        id: "quote",
        title: "Cita",
        description: "Texto citado",
        icon: <Quote className="h-5 w-5" />,
        type: "quote",
        keywords: ["quote", "citation", "cita"],
    },
    {
        id: "code",
        title: "Código",
        description: "Bloque de código",
        icon: <Code className="h-5 w-5" />,
        type: "code",
        keywords: ["code", "snippet", "codigo"],
    },
    {
        id: "divider",
        title: "Divisor",
        description: "Línea horizontal",
        icon: <Minus className="h-5 w-5" />,
        type: "divider",
        keywords: ["divider", "separator", "hr", "linea"],
    },
    {
        id: "callout",
        title: "Callout",
        description: "Texto destacado",
        icon: <Lightbulb className="h-5 w-5" />,
        type: "callout",
        keywords: ["callout", "note", "info", "nota"],
    },
];

interface SlashCommandProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: string) => void;
    position: { top: number; left: number };
    query: string;
}

export function SlashCommand({
    isOpen,
    onClose,
    onSelect,
    position,
    query,
}: SlashCommandProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    // Filter commands by query
    const filteredCommands = commands.filter((cmd) => {
        const searchText = query.toLowerCase();
        if (!searchText) return true;
        return (
            cmd.title.toLowerCase().includes(searchText) ||
            cmd.description.toLowerCase().includes(searchText) ||
            cmd.keywords.some((kw) => kw.includes(searchText))
        );
    });

    // Reset selected index when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) =>
                    prev < filteredCommands.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredCommands.length - 1
                );
            } else if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                if (filteredCommands[selectedIndex]) {
                    onSelect(filteredCommands[selectedIndex].type);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);
        return () => window.removeEventListener("keydown", handleKeyDown, true);
    }, [isOpen, selectedIndex, filteredCommands, onSelect, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (menuRef.current && menuRef.current.children[selectedIndex]) {
            const selectedEl = menuRef.current.children[selectedIndex] as HTMLElement;
            selectedEl.scrollIntoView({ block: "nearest" });
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg w-72 max-h-80 overflow-y-auto"
            style={{ top: position.top, left: position.left }}
        >
            <div className="p-2 text-xs text-muted-foreground border-b">
                Bloques básicos
            </div>
            <div ref={menuRef}>
                {filteredCommands.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                        No hay resultados para &quot;{query}&quot;
                    </div>
                ) : (
                    filteredCommands.map((cmd, index) => (
                        <button
                            key={cmd.id}
                            className={cn(
                                "w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-muted transition-colors",
                                index === selectedIndex && "bg-muted"
                            )}
                            onClick={() => onSelect(cmd.type)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <span className="flex-shrink-0 p-1.5 bg-muted rounded">
                                {cmd.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{cmd.title}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {cmd.description}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
