"use client";

import { useState, useCallback } from "react";
import { Block, useBlocks, UpdateBlockInput } from "@/hooks/useBlocks";
import { BlockRenderer } from "./BlockRenderer";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// R11: @dnd-kit imports for drag & drop
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface BlockEditorProps {
    pageId: string;
}

export function BlockEditor({ pageId }: BlockEditorProps) {
    const { blocks, isLoading, createBlock, updateBlock, deleteBlock, reorderBlocks } = useBlocks(pageId);
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

    // R11: Setup drag sensors with activation constraint
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required before drag starts
            },
        }),
        useSensor(KeyboardSensor)
    );

    // Helper to get block at specific position
    const getBlockAtPosition = useCallback((position: number) => {
        return blocks.find(b => b.position === position);
    }, [blocks]);

    const handleCreateBlock = useCallback(async (afterPosition: number = -1, content: string = '', type: string = 'paragraph') => {
        const position = afterPosition >= 0 ? afterPosition + 1 : blocks.length;
        try {
            const newBlock = await createBlock({
                type,
                content,
                position,
                pageId,
            });
            setFocusedBlockId(newBlock.id);
            return newBlock;
        } catch (error) {
            console.error('Failed to create block:', error);
            return null;
        }
    }, [blocks.length, createBlock, pageId]);

    const handleUpdateBlock = useCallback(async (id: string, data: UpdateBlockInput) => {
        try {
            await updateBlock({ id, data });
        } catch (error) {
            console.error('Failed to update block:', error);
        }
    }, [updateBlock]);

    const handleDeleteBlock = useCallback(async (id: string) => {
        try {
            await deleteBlock(id);
        } catch (error) {
            console.error('Failed to delete block:', error);
        }
    }, [deleteBlock]);

    // R11-R13: Handle drag end and reorder blocks
    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = blocks.findIndex(b => b.id === active.id);
        const newIndex = blocks.findIndex(b => b.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        // Calculate new positions for reordering
        const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex);
        const blocksWithNewPositions = reorderedBlocks.map((block, index) => ({
            id: block.id,
            position: index,
        }));

        try {
            await reorderBlocks(blocksWithNewPositions);
        } catch (error) {
            console.error('Failed to reorder blocks:', error);
        }
    }, [blocks, reorderBlocks]);

    // R1-R4: Split block at cursor position
    const handleSplitBlock = useCallback(async (
        blockId: string,
        contentBefore: string,
        contentAfter: string
    ) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        try {
            await updateBlock({ id: blockId, data: { content: contentBefore } });

            let newBlockType = 'paragraph';
            if (['bulleted_list', 'numbered_list', 'todo', 'quote'].includes(block.type)) {
                newBlockType = block.type;
            }

            const newBlock = await createBlock({
                type: newBlockType,
                content: contentAfter,
                position: block.position + 1,
                pageId,
                properties: block.type === 'todo' ? { checked: false } : undefined,
            });

            if (newBlock) {
                setFocusedBlockId(newBlock.id);
            }
        } catch (error) {
            console.error('Failed to split block:', error);
        }
    }, [blocks, updateBlock, createBlock, pageId]);

    // R5-R8: Merge with previous block
    const handleMergeWithPrevious = useCallback(async (
        currentBlockId: string,
        currentContent: string
    ) => {
        const currentBlock = blocks.find(b => b.id === currentBlockId);
        if (!currentBlock) return;

        const prevBlock = getBlockAtPosition(currentBlock.position - 1);
        if (!prevBlock) return;

        if (prevBlock.type === 'divider') {
            await deleteBlock(prevBlock.id);
            const blockBeforeDivider = getBlockAtPosition(prevBlock.position - 1);
            if (blockBeforeDivider) {
                setFocusedBlockId(blockBeforeDivider.id);
            }
            return;
        }

        try {
            await updateBlock({
                id: prevBlock.id,
                data: { content: prevBlock.content + currentContent }
            });
            await deleteBlock(currentBlockId);
            setFocusedBlockId(prevBlock.id);
        } catch (error) {
            console.error('Failed to merge blocks:', error);
        }
    }, [blocks, getBlockAtPosition, updateBlock, deleteBlock]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {blocks.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">Esta página está vacía</p>
                    <Button onClick={() => handleCreateBlock()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar primer bloque
                    </Button>
                </div>
            ) : (
                // R11: Wrap with DndContext and SortableContext
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={blocks.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-1">
                            {blocks.map((block) => (
                                <BlockRenderer
                                    key={block.id}
                                    block={block}
                                    isFocused={focusedBlockId === block.id}
                                    onFocus={() => setFocusedBlockId(block.id)}
                                    onUpdate={(data) => handleUpdateBlock(block.id, data)}
                                    onDelete={() => handleDeleteBlock(block.id)}
                                    onAddBlock={() => handleCreateBlock(block.position)}
                                    onSplitBlock={(contentBefore, contentAfter) =>
                                        handleSplitBlock(block.id, contentBefore, contentAfter)
                                    }
                                    onMergeWithPrevious={(content) =>
                                        handleMergeWithPrevious(block.id, content)
                                    }
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {blocks.length > 0 && (
                <div className="mt-4 flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleCreateBlock()}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar bloque
                    </Button>
                </div>
            )}
        </div>
    );
}

