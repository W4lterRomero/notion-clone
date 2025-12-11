"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Block, UpdateBlockInput } from "@/hooks/useBlocks";
import { cn } from "@/lib/utils";
import { debounce } from "@/lib/debounce";
import { SlashCommand } from "./SlashCommand";

// R12: @dnd-kit sortable imports
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
    GripVertical,
    Plus,
    Trash2,
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
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BlockRendererProps {
    block: Block;
    isFocused: boolean;
    onFocus: () => void;
    onUpdate: (data: UpdateBlockInput) => void;
    onDelete: () => void;
    onAddBlock: () => void;
    // R1-R4: Split block when pressing Enter
    onSplitBlock: (contentBefore: string, contentAfter: string) => void;
    // R5-R8: Merge with previous block when pressing Backspace at start
    onMergeWithPrevious: (currentContent: string) => void;
}

const blockTypeIcons: Record<string, React.ReactNode> = {
    paragraph: <Type className="h-4 w-4" />,
    heading1: <Heading1 className="h-4 w-4" />,
    heading2: <Heading2 className="h-4 w-4" />,
    heading3: <Heading3 className="h-4 w-4" />,
    bulleted_list: <List className="h-4 w-4" />,
    numbered_list: <ListOrdered className="h-4 w-4" />,
    todo: <CheckSquare className="h-4 w-4" />,
    quote: <Quote className="h-4 w-4" />,
    code: <Code className="h-4 w-4" />,
    divider: <Minus className="h-4 w-4" />,
};

const blockTypeLabels: Record<string, string> = {
    paragraph: "Texto",
    heading1: "Encabezado 1",
    heading2: "Encabezado 2",
    heading3: "Encabezado 3",
    bulleted_list: "Lista con viñetas",
    numbered_list: "Lista numerada",
    todo: "Tarea",
    quote: "Cita",
    code: "Código",
    divider: "Divisor",
};

// Round 42: Markdown shortcuts detection
const detectMarkdownShortcut = (text: string): string | null => {
    if (text === "# ") return "heading1";
    if (text === "## ") return "heading2";
    if (text === "### ") return "heading3";
    if (text === "- " || text === "* ") return "bulleted_list";
    if (text === "1. ") return "numbered_list";
    if (text === "[] " || text === "[ ] ") return "todo";
    if (text === "> ") return "quote";
    if (text === "``` ") return "code";
    if (text === "---") return "divider";
    return null;
};

export function BlockRenderer({
    block,
    isFocused,
    onFocus,
    onUpdate,
    onDelete,
    onAddBlock,
    onSplitBlock,
    onMergeWithPrevious,
}: BlockRendererProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // R12: useSortable hook for drag & drop
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    // Round 43: Slash command state
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
    const [slashQuery, setSlashQuery] = useState("");

    // Set initial content only once when block changes
    useEffect(() => {
        if (contentRef.current && contentRef.current.innerText !== block.content) {
            contentRef.current.innerText = block.content;
        }
    }, [block.id]); // Only on block.id change, not content

    useEffect(() => {
        if (isFocused && contentRef.current) {
            contentRef.current.focus();
            // Move cursor to end
            const range = document.createRange();
            const sel = window.getSelection();
            if (contentRef.current.childNodes.length > 0) {
                range.selectNodeContents(contentRef.current);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }
    }, [isFocused]);

    // Round 41: Debounced update
    const debouncedUpdate = useMemo(
        () =>
            debounce((content: string) => {
                onUpdate({ content });
            }, 500),
        [onUpdate]
    );

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            debouncedUpdate.cancel();
        };
    }, [debouncedUpdate]);

    const handleInput = useCallback(() => {
        if (!contentRef.current) return;
        const newContent = contentRef.current.innerText || "";

        // Round 43: Detect slash command
        if (newContent.endsWith("/") && !showSlashMenu) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                setSlashMenuPosition({
                    top: rect.bottom + window.scrollY + 5,
                    left: rect.left + window.scrollX,
                });
                setShowSlashMenu(true);
                setSlashQuery("");
            }
            return;
        }

        // If slash menu is open, update query
        if (showSlashMenu) {
            const lastSlashIndex = newContent.lastIndexOf("/");
            if (lastSlashIndex !== -1) {
                const query = newContent.substring(lastSlashIndex + 1);
                setSlashQuery(query);
            } else {
                setShowSlashMenu(false);
                debouncedUpdate(newContent);
            }
            return;
        }

        // Round 42: Detect markdown shortcuts
        const shortcutType = detectMarkdownShortcut(newContent);
        if (shortcutType) {
            // Clear the content and convert block type
            if (contentRef.current) {
                contentRef.current.innerText = "";
            }

            if (shortcutType === "todo") {
                onUpdate({ type: shortcutType, content: "", properties: { checked: false } });
            } else {
                onUpdate({ type: shortcutType, content: "" });
            }

            // For divider, create a new block after
            if (shortcutType === "divider") {
                setTimeout(() => onAddBlock(), 100);
            }
            return;
        }

        // Normal flow: debounce API call
        debouncedUpdate(newContent);
    }, [showSlashMenu, debouncedUpdate, onUpdate, onAddBlock]);

    // Round 43: Handle slash command selection
    const handleSlashCommandSelect = useCallback(
        (type: string) => {
            if (!contentRef.current) return;

            const currentContent = contentRef.current.innerText || "";
            // Remove "/" and query from content
            const contentWithoutSlash = currentContent.substring(
                0,
                currentContent.lastIndexOf("/")
            );

            contentRef.current.innerText = contentWithoutSlash.trim();

            if (type === "todo") {
                onUpdate({
                    type,
                    content: contentWithoutSlash.trim(),
                    properties: { checked: false },
                });
            } else {
                onUpdate({
                    type,
                    content: contentWithoutSlash.trim(),
                });
            }

            setShowSlashMenu(false);
            setSlashQuery("");

            // Re-focus the block
            setTimeout(() => contentRef.current?.focus(), 10);
        },
        [onUpdate]
    );

    const handleTypeChange = (newType: string) => {
        if (newType === "todo") {
            onUpdate({ type: newType, properties: { checked: false } });
        } else {
            onUpdate({ type: newType });
        }
    };

    const handleTodoToggle = () => {
        const isChecked = block.properties?.checked ?? false;
        onUpdate({ properties: { ...block.properties, checked: !isChecked } });
    };

    // Round 44: Arrow navigation helpers
    const isAtFirstLine = useCallback((): boolean => {
        const selection = window.getSelection();
        if (!selection || !contentRef.current) return true;
        if (selection.rangeCount === 0) return true;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = contentRef.current.getBoundingClientRect();

        return rect.top - containerRect.top < 30;
    }, []);

    const isAtLastLine = useCallback((): boolean => {
        const selection = window.getSelection();
        if (!selection || !contentRef.current) return true;
        if (selection.rangeCount === 0) return true;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = contentRef.current.getBoundingClientRect();

        return containerRect.bottom - rect.bottom < 30;
    }, []);

    const focusPreviousBlock = useCallback(() => {
        const blockEl = contentRef.current?.closest("[data-block-id]");
        const prevBlockEl = blockEl?.previousElementSibling;

        if (prevBlockEl) {
            const editableEl = prevBlockEl.querySelector(
                "[contenteditable]"
            ) as HTMLElement;
            if (editableEl) {
                editableEl.focus();
                const range = document.createRange();
                const selection = window.getSelection();
                range.selectNodeContents(editableEl);
                range.collapse(false);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }
    }, []);

    const focusNextBlock = useCallback(() => {
        const blockEl = contentRef.current?.closest("[data-block-id]");
        const nextBlockEl = blockEl?.nextElementSibling;

        if (nextBlockEl) {
            const editableEl = nextBlockEl.querySelector(
                "[contenteditable]"
            ) as HTMLElement;
            if (editableEl) {
                editableEl.focus();
                const range = document.createRange();
                const selection = window.getSelection();
                range.selectNodeContents(editableEl);
                range.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }
    }, []);

    // R1-R8: Helper to get cursor position in text
    const getCursorPosition = useCallback((): number => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !contentRef.current) {
            return 0;
        }

        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(contentRef.current);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        return preCaretRange.toString().length;
    }, []);

    // R1-R4: Enhanced keyboard handler with split/merge
    const handleKeyDownInternal = useCallback(
        (e: React.KeyboardEvent) => {
            // If slash menu is open, let it handle the keys
            if (showSlashMenu) {
                if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
                    return; // SlashCommand handles these
                }
            }

            // R1-R4: Enter to split block
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();

                // Flush any pending debounced updates
                debouncedUpdate.flush();

                const cursorPos = getCursorPosition();
                const fullContent = contentRef.current?.innerText || "";
                const contentBefore = fullContent.substring(0, cursorPos);
                const contentAfter = fullContent.substring(cursorPos);

                // Call split handler with text before and after cursor
                onSplitBlock(contentBefore, contentAfter);
                return;
            }

            // R5-R8: Backspace at start to merge with previous block
            if (e.key === "Backspace") {
                const cursorPos = getCursorPosition();

                // Only merge if cursor is at position 0
                if (cursorPos === 0) {
                    e.preventDefault();

                    // Flush any pending debounced updates
                    debouncedUpdate.flush();

                    const currentContent = contentRef.current?.innerText || "";
                    onMergeWithPrevious(currentContent);
                    return;
                }
            }

            // Arrow Up navigation
            if (e.key === "ArrowUp" && !e.shiftKey) {
                if (isAtFirstLine()) {
                    e.preventDefault();
                    focusPreviousBlock();
                    return;
                }
            }

            // Arrow Down navigation
            if (e.key === "ArrowDown" && !e.shiftKey) {
                if (isAtLastLine()) {
                    e.preventDefault();
                    focusNextBlock();
                    return;
                }
            }
        },
        [showSlashMenu, isAtFirstLine, isAtLastLine, focusPreviousBlock, focusNextBlock, getCursorPosition, debouncedUpdate, onSplitBlock, onMergeWithPrevious]
    );

    // Render divider specially
    if (block.type === "divider") {
        return (
            <div
                ref={setNodeRef}
                style={style}
                data-block-id={block.id}
                className="group relative py-2"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div
                    className={cn(
                        "absolute -left-12 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 transition-opacity",
                        isHovered && "opacity-100"
                    )}
                >
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1 rounded hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                </div>
                <hr className="border-t border-border" />
            </div>
        );
    }

    const getBlockStyles = () => {
        switch (block.type) {
            case "heading1":
                return "text-3xl font-bold";
            case "heading2":
                return "text-2xl font-semibold";
            case "heading3":
                return "text-xl font-medium";
            case "bulleted_list":
                return 'pl-6 before:content-["•"] before:absolute before:left-0 before:text-muted-foreground';
            case "numbered_list":
                return "pl-6";
            case "quote":
                return "pl-4 border-l-4 border-primary/30 italic text-muted-foreground";
            case "code":
                return "font-mono text-sm bg-muted p-3 rounded-md whitespace-pre-wrap";
            case "callout":
                return "bg-muted/50 p-3 rounded-md border-l-4 border-primary";
            default:
                return "";
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            data-block-id={block.id}
            className={cn("group relative", isDragging && "shadow-lg rounded-md bg-background")}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Block controls */}
            <div
                className={cn(
                    "absolute -left-16 top-0 flex items-center gap-1 opacity-0 transition-opacity",
                    isHovered && "opacity-100"
                )}
            >
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-muted">
                            <Plus className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        {Object.entries(blockTypeLabels).map(([type, label]) => (
                            <DropdownMenuItem
                                key={type}
                                onClick={() => handleTypeChange(type)}
                            >
                                {blockTypeIcons[type]}
                                <span className="ml-2">{label}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* R12: Drag handle with sortable listeners */}
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {/* Delete button on right */}
            <button
                onClick={onDelete}
                className={cn(
                    "absolute -right-8 top-0 p-1 rounded hover:bg-destructive/10 opacity-0 transition-opacity",
                    isHovered && "opacity-100"
                )}
            >
                <Trash2 className="h-4 w-4 text-destructive" />
            </button>

            {/* Todo checkbox */}
            {block.type === "todo" && (
                <div className="absolute left-0 top-0 pt-0.5">
                    <input
                        type="checkbox"
                        checked={block.properties?.checked ?? false}
                        onChange={handleTodoToggle}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                </div>
            )}

            {/* Content - UNCONTROLLED contentEditable */}
            <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onClick={onFocus}
                onInput={handleInput}
                onKeyDown={handleKeyDownInternal}
                onBlur={() => {
                    debouncedUpdate.flush();
                }}
                className={cn(
                    "relative outline-none min-h-[1.5em] py-1 px-1 rounded",
                    "focus:bg-muted/50",
                    "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
                    block.type === "todo" && "pl-7",
                    block.type === "todo" &&
                    block.properties?.checked &&
                    "line-through text-muted-foreground",
                    getBlockStyles()
                )}
                data-placeholder="Escribe algo o presiona '/' para comandos..."
            />

            {/* Round 43: Slash Command Menu */}
            <SlashCommand
                isOpen={showSlashMenu}
                onClose={() => setShowSlashMenu(false)}
                onSelect={handleSlashCommandSelect}
                position={slashMenuPosition}
                query={slashQuery}
            />
        </div>
    );
}
