'use client'

import { motion } from 'framer-motion'

interface ViewSkeletonProps {
    type?: 'table' | 'board' | 'calendar' | 'gallery'
}

export default function ViewSkeleton({ type = 'table' }: ViewSkeletonProps) {
    if (type === 'board') {
        return (
            <div className="flex gap-4 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="w-72 flex-shrink-0"
                    >
                        {/* Column header */}
                        <div className="h-10 bg-muted/50 rounded-lg mb-3 animate-pulse" />
                        {/* Cards */}
                        <div className="space-y-2">
                            {[...Array(3)].map((_, j) => (
                                <div
                                    key={j}
                                    className="h-24 bg-muted/30 rounded-lg animate-pulse"
                                    style={{ animationDelay: `${j * 100}ms` }}
                                />
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        )
    }

    if (type === 'calendar') {
        return (
            <div className="border rounded-xl overflow-hidden">
                {/* Header */}
                <div className="h-14 bg-muted/30 border-b animate-pulse" />
                {/* Week days */}
                <div className="grid grid-cols-7 border-b">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="h-10 bg-muted/20 animate-pulse border-r last:border-r-0" />
                    ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                    {[...Array(35)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.01 }}
                            className="h-24 border-r border-b last:border-r-0 p-2"
                        >
                            <div className="w-6 h-6 bg-muted/40 rounded-full animate-pulse" />
                        </motion.div>
                    ))}
                </div>
            </div>
        )
    }

    if (type === 'gallery') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-xl overflow-hidden border"
                    >
                        <div className="h-40 bg-gradient-to-br from-muted/50 to-muted/30 animate-pulse" />
                        <div className="p-3 space-y-2">
                            <div className="h-4 bg-muted/40 rounded w-3/4 animate-pulse" />
                            <div className="h-3 bg-muted/30 rounded w-1/2 animate-pulse" />
                        </div>
                    </motion.div>
                ))}
            </div>
        )
    }

    // Default: table skeleton
    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex border-b bg-muted/20">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex-1 h-10 border-r last:border-r-0 px-3 py-2">
                        <div className="h-5 bg-muted/40 rounded animate-pulse" />
                    </div>
                ))}
            </div>
            {/* Rows */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex border-b last:border-b-0"
                >
                    {[...Array(4)].map((_, j) => (
                        <div key={j} className="flex-1 h-12 border-r last:border-r-0 px-3 py-3">
                            <div
                                className="h-5 bg-muted/30 rounded animate-pulse"
                                style={{ width: `${50 + Math.random() * 40}%` }}
                            />
                        </div>
                    ))}
                </motion.div>
            ))}
        </div>
    )
}
