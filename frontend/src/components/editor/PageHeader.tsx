"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    icon?: string;
    onTitleChange?: (title: string) => void;
    onIconChange?: (icon: string) => void;
}

const defaultEmojis = ["📝", "📚", "💡", "🎯", "🚀", "⭐", "📌", "💼", "🎨", "📊"];

export function PageHeader({ title, icon, onTitleChange, onIconChange }: PageHeaderProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(title);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        if (editedTitle !== title && onTitleChange) {
            onTitleChange(editedTitle);
        }
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleTitleBlur();
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        if (onIconChange) {
            onIconChange(emoji);
        }
        setShowEmojiPicker(false);
    };

    return (
        <div className="mb-8">
            {/* Icon */}
            <div className="relative inline-block mb-2">
                <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-6xl hover:bg-muted rounded-lg p-2 transition-colors"
                >
                    {icon || "📄"}
                </button>

                {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-2 p-2 bg-popover border rounded-lg shadow-lg z-10">
                        <div className="grid grid-cols-5 gap-1">
                            {defaultEmojis.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className="text-2xl p-1 hover:bg-muted rounded"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Title */}
            {isEditingTitle ? (
                <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleTitleKeyDown}
                    autoFocus
                    className="text-4xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto"
                />
            ) : (
                <h1
                    onClick={() => setIsEditingTitle(true)}
                    className={cn(
                        "text-4xl font-bold cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors",
                        "empty:before:content-['Sin_título'] empty:before:text-muted-foreground"
                    )}
                >
                    {title || "Sin título"}
                </h1>
            )}
        </div>
    );
}
