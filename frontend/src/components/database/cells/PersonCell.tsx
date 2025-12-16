'use client'

import { useState, useRef, useEffect } from 'react'
import { User, X } from 'lucide-react'
import { DatabaseProperty } from '@/hooks/useDatabases'
import { useUpdateRowValue } from '@/hooks/useDatabaseRows'
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers'

interface PersonCellProps {
    databaseId: string
    workspaceId: string
    rowId: string
    property: DatabaseProperty
    value: string[] | null
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

export default function PersonCell({
    databaseId,
    workspaceId,
    rowId,
    property,
    value,
}: PersonCellProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    const { data: members = [] } = useWorkspaceMembers(workspaceId)
    const updateValueMutation = useUpdateRowValue()

    // Selected IDs (ensure array)
    const selectedIds: string[] = Array.isArray(value) ? value : []

    // Selected members
    const selectedMembers = members.filter(m => selectedIds.includes(m.id))

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleToggle = async (memberId: string) => {
        const isSelected = selectedIds.includes(memberId)
        const newValue = isSelected
            ? selectedIds.filter(id => id !== memberId)
            : [...selectedIds, memberId]

        await updateValueMutation.mutateAsync({
            databaseId,
            rowId,
            propertyId: property.id,
            value: newValue,
        })
    }

    const handleRemove = async (memberId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const newValue = selectedIds.filter(id => id !== memberId)
        await updateValueMutation.mutateAsync({
            databaseId,
            rowId,
            propertyId: property.id,
            value: newValue,
        })
    }

    return (
        <div ref={menuRef} className="relative min-w-[150px]">
            {/* Trigger */}
            <div
                className="px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-1 flex-wrap min-h-[40px]"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedMembers.length > 0 ? (
                    selectedMembers.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-sm"
                        >
                            <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
                                {getInitials(member.name || member.email)}
                            </div>
                            <span className="max-w-[80px] truncate">
                                {member.name || member.email.split('@')[0]}
                            </span>
                            <X
                                size={12}
                                className="cursor-pointer hover:opacity-70"
                                onClick={(e) => handleRemove(member.id, e)}
                            />
                        </div>
                    ))
                ) : (
                    <div className="flex items-center gap-2 text-muted-foreground/50 text-sm">
                        <User size={14} />
                        <span>Sin asignar</span>
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-popover border rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                    {members.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                            No hay miembros en este workspace
                        </div>
                    ) : (
                        members.map((member) => {
                            const isSelected = selectedIds.includes(member.id)
                            return (
                                <div
                                    key={member.id}
                                    className={`px-3 py-2 cursor-pointer hover:bg-muted transition-colors flex items-center gap-3 ${isSelected ? 'bg-muted/50' : ''
                                        }`}
                                    onClick={() => handleToggle(member.id)}
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
                                        {getInitials(member.name || member.email)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {member.name || 'Sin nombre'}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {member.email}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <span className="text-primary text-sm">✓</span>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
