"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { useWorkspaceStore } from "@/lib/store/workspaceStore";
import { workspaceApi } from "@/lib/api/workspace";
import { pageApi } from "@/lib/api/page";
import { Sidebar } from "@/components/ui/Sidebar";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useWorkspaceWebSocket } from "@/lib/hooks/useWorkspaceWebSocket";
import { WebSocketMessage, WebSocketEventType, Page } from "@/lib/types";

export default function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const workspaceId = Number(params.workspaceId);

    // Extract current pageId from pathname
    const currentPageId = pathname?.match(/\/page\/(\d+)/)?.[1]
        ? Number(pathname.match(/\/page\/(\d+)/)?.[1])
        : null;

    const { isAuthenticated, user } = useAuthStore();
    const { currentWorkspace, setCurrentWorkspace, pages, setPages, addPage, updatePage, removePage } = useWorkspaceStore();

    const [loading, setLoading] = useState(true);
    const [showCreatePage, setShowCreatePage] = useState(false);
    const [newPageTitle, setNewPageTitle] = useState("");

    // Handle workspace-level WebSocket messages
    const handleWorkspaceMessage = useCallback((message: WebSocketMessage) => {
        // Ignore messages from current user
        if (message.userId === user?.id) return;

        switch (message.type) {
            case WebSocketEventType.PAGE_CREATED:
                if (message.data) {
                    const newPage = message.data as Page;
                    addPage(newPage);
                }
                break;
            case WebSocketEventType.PAGE_UPDATED:
                if (message.data) {
                    // Check if this is a reorder event
                    if (typeof message.data === 'object' && 'reordered' in message.data) {
                        // Reload all pages to get the correct order
                        pageApi.getWorkspacePages(workspaceId).then(setPages);
                    } else {
                        const updatedPage = message.data as Page;
                        updatePage(updatedPage.id, updatedPage);
                    }
                }
                break;
            case WebSocketEventType.PAGE_DELETED:
                if (message.pageId) {
                    removePage(message.pageId);
                }
                break;
        }
    }, [user?.id, workspaceId, addPage, updatePage, removePage]);

    // Connect to workspace-level WebSocket
    useWorkspaceWebSocket(workspaceId, handleWorkspaceMessage);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        loadData();
    }, [workspaceId, isAuthenticated]);

    const loadData = async () => {
        try {
            const [workspace, loadedPages] = await Promise.all([
                workspaceApi.getById(workspaceId),
                pageApi.getWorkspacePages(workspaceId)
            ]);
            setCurrentWorkspace(workspace);
            setPages(loadedPages);
        } catch (error) {
            console.error("Failed to load workspace data:", error);
            router.push("/workspace");
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePage = async () => {
        if (!newPageTitle.trim()) return;

        try {
            const page = await pageApi.create(workspaceId, { title: newPageTitle });
            setPages([...pages, page]);
            setNewPageTitle("");
            setShowCreatePage(false);
            router.push(`/workspace/${workspaceId}/page/${page.id}`);
        } catch (error) {
            console.error("Failed to create page:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#191919] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white dark:bg-[#191919]">
            <Sidebar
                currentWorkspace={currentWorkspace || undefined}
                pages={pages}
                user={user}
                onLogout={() => useAuthStore.getState().logout()}
                onCreatePage={() => setShowCreatePage(true)}
                workspaceId={workspaceId}
                currentPageId={currentPageId}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>

            <Modal
                isOpen={showCreatePage}
                onClose={() => setShowCreatePage(false)}
                title="Create Page"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Page Title
                        </label>
                        <Input
                            value={newPageTitle}
                            onChange={(e) => setNewPageTitle(e.target.value)}
                            placeholder="Untitled"
                            onKeyPress={(e) => e.key === "Enter" && handleCreatePage()}
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setShowCreatePage(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreatePage}
                            disabled={!newPageTitle.trim()}
                        >
                            Create Page
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
