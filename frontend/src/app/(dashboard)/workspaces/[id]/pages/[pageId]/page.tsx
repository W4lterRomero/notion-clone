"use client";

import { useParams, useRouter } from "next/navigation";
import { usePage, usePages } from "@/hooks/usePages";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { PageHeader } from "@/components/editor/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PageEditorPage() {
    const params = useParams();
    const workspaceId = params.id as string;
    const pageId = params.pageId as string;

    const { data: page, isLoading, error } = usePage(pageId);
    const { updatePage } = usePages(workspaceId);

    const handleTitleChange = async (title: string) => {
        try {
            await updatePage({ id: pageId, data: { title } });
        } catch (error) {
            console.error("Failed to update title:", error);
        }
    };

    const handleIconChange = async (icon: string) => {
        try {
            await updatePage({ id: pageId, data: { icon } });
        } catch (error) {
            console.error("Failed to update icon:", error);
        }
    };

    const router = useRouter()

    if (page?.type === 'database') {
        router.replace(`/workspaces/${params.id}/databases/${pageId}`)
        return null
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-medium mb-2">Página no encontrada</h2>
                <p className="text-muted-foreground mb-4">
                    La página que buscas no existe o no tienes acceso.
                </p>
                <Link href={`/workspaces/${workspaceId}`}>
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al workspace
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Back button */}
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-4 py-2 z-10">
                <Link href={`/workspaces/${workspaceId}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {page.workspace?.name || "Workspace"}
                    </Button>
                </Link>
            </div>

            {/* Page content */}
            <div className="max-w-3xl mx-auto px-4 py-8">
                <PageHeader
                    title={page.title}
                    icon={page.icon}
                    onTitleChange={handleTitleChange}
                    onIconChange={handleIconChange}
                />

                <BlockEditor pageId={pageId} workspaceId={workspaceId} />
            </div>
        </div>
    );
}
