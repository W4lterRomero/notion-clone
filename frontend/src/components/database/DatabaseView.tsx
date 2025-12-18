'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDatabase } from '@/hooks/useDatabases'
import { useDatabaseViews } from '@/hooks/useDatabaseViews'
import TableView from './TableView'
import BoardView from './BoardView'
import CalendarView from './CalendarView'
import GalleryView from './GalleryView'
import ViewSwitcher from './ViewSwitcher'
import { Loader2, Database } from 'lucide-react'

interface DatabaseViewProps {
    databaseId: string
}

export default function DatabaseView({ databaseId }: DatabaseViewProps) {
    const { data: database, isLoading: loadingDb, error } = useDatabase(databaseId)
    const { data: views, isLoading: loadingViews } = useDatabaseViews(databaseId)

    const [currentViewId, setCurrentViewId] = useState<string | null>(null)

    // Set default view when views load
    useEffect(() => {
        if (views && views.length > 0 && !currentViewId) {
            const defaultView = views.find(v => v.isDefault) || views[0]
            setCurrentViewId(defaultView.id)
        }
    }, [views, currentViewId])

    const currentView = views?.find(v => v.id === currentViewId)

    if (loadingDb || loadingViews) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !database) {
        return (
            <div className="p-8 text-center">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Base de datos no encontrada</p>
            </div>
        )
    }

    const renderView = () => {
        if (!currentView) {
            return <TableView databaseId={databaseId} workspaceId={database.workspaceId} />
        }

        switch (currentView.type) {
            case 'board':
                return <BoardView databaseId={databaseId} workspaceId={database.workspaceId} viewConfig={currentView.config} />
            case 'calendar':
                return <CalendarView databaseId={databaseId} workspaceId={database.workspaceId} viewConfig={currentView.config} />
            case 'gallery':
                return <GalleryView databaseId={databaseId} workspaceId={database.workspaceId} viewConfig={currentView.config} />
            case 'table':
            default:
                return <TableView databaseId={databaseId} workspaceId={database.workspaceId} />
        }
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <span className="text-4xl">{database.icon || '📊'}</span>
                <h1 className="text-3xl font-semibold">{database.title}</h1>
            </div>

            {/* View Switcher */}
            <ViewSwitcher
                databaseId={databaseId}
                currentViewId={currentViewId}
                onViewChange={setCurrentViewId}
            />

            {/* View Content with Animation */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentViewId || 'default'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderView()}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
