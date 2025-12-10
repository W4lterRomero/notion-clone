"use client";

import { useState, useCallback } from "react";
import { Block, useBlocks, UpdateBlockInput } from "@/hooks/useBlocks";
import { BlockRenderer } from "./BlockRenderer";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockEditorProps {
    pageId: string;
}

export function BlockEditor({ pageId }: BlockEditorProps) {
    const { blocks, isLoading, createBlock, updateBlock, deleteBlock } = useBlocks(pageId);
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

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

    // R1-R4: Split block at cursor position
    // Called when user presses Enter in the middle of a block
    const handleSplitBlock = useCallback(async (
        blockId: string,
        contentBefore: string,
        contentAfter: string
    ) => {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        try {
            // 1. Update current block with content before cursor
            await updateBlock({ id: blockId, data: { content: contentBefore } });

            // 2. Determine type for new block
            // Headings split into paragraphs, lists/todos keep their type
            let newBlockType = 'paragraph';
            if (['bulleted_list', 'numbered_list', 'todo', 'quote'].includes(block.type)) {
                newBlockType = block.type;
            }

            // 3. Create new block with content after cursor
            const newBlock = await createBlock({
                type: newBlockType,
                content: contentAfter,
                position: block.position + 1,
                pageId,
                properties: block.type === 'todo' ? { checked: false } : undefined,
            });

            // 4. Focus new block at the start
            if (newBlock) {
                setFocusedBlockId(newBlock.id);
            }
        } catch (error) {
            console.error('Failed to split block:', error);
        }
    }, [blocks, updateBlock, createBlock, pageId]);

    // R5-R8: Merge with previous block
    // Called when user presses Backspace at the start of a block
    const handleMergeWithPrevious = useCallback(async (
        currentBlockId: string,
        currentContent: string
    ) => {
        const currentBlock = blocks.find(b => b.id === currentBlockId);
        if (!currentBlock) return;

        // Find previous block by position
        const prevBlock = getBlockAtPosition(currentBlock.position - 1);
        if (!prevBlock) return; // No previous block to merge with

        // Can't merge into dividers
        if (prevBlock.type === 'divider') {
            // Delete the divider instead and move focus to block before it
            await deleteBlock(prevBlock.id);
            const blockBeforeDivider = getBlockAtPosition(prevBlock.position - 1);
            if (blockBeforeDivider) {
                setFocusedBlockId(blockBeforeDivider.id);
            }
            return;
        }

        try {
            // 1. Calculate merge point (end of previous block content)
            const mergePoint = prevBlock.content.length;

            // 2. Update previous block with merged content
            await updateBlock({
                id: prevBlock.id,
                data: { content: prevBlock.content + currentContent }
            });

            // 3. Delete current block
            await deleteBlock(currentBlockId);

            // 4. Focus previous block at merge point
            // We store the merge point to position cursor correctly
            setFocusedBlockId(prevBlock.id);

            // Return merge info for cursor positioning
            return { prevBlockId: prevBlock.id, mergePoint };
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
