"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
    ChevronLeft,
    Plus,
    FileText,
    Settings,
    LogOut,
    ChevronsLeft,
    Folder,
    User as UserIcon,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Workspace, Page, User, WorkspaceRole } from "@/lib/types";
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
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SidebarProps {
    currentWorkspace?: Workspace;
    pages: Page[];
    user?: User | null;
    onLogout: () => void;
    onCreatePage: () => void;
    onDeletePage: (pageId: number) => void;
    workspaceId: number;
    currentPageId?: number | null;
    onReorderPages: (pages: Page[]) => void;
}

// Sortable PageItem component for drag and drop
function SortablePageItem({
    page,
    workspaceId,
    currentPageId,
    onDeletePage,
    level = 0,
}: {
    page: Page;
    workspaceId: number;
    currentPageId?: number | null;
    onDeletePage: (pageId: number) => void;
    level?: number;
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [wasDragging, setWasDragging] = useState(false);
    const isActive = currentPageId === page.id;
    const hasChildren = page.childPages && page.childPages.length > 0;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: page.id,
        transition: {
            duration: 200,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Track dragging state changes
    useEffect(() => {
        if (isDragging) {
            setWasDragging(true);
        } else if (wasDragging) {
            // Reset after a short delay to allow drag to complete
            const timeout = setTimeout(() => {
                setWasDragging(false);
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [isDragging, wasDragging]);

    const handlePageClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Prevent navigation if currently dragging or just finished dragging
        if (isDragging || wasDragging) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Link
                href={`/workspace/${workspaceId}/page/${page.id}`}
                onClick={handlePageClick}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors group",
                    isActive
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100",
                    (isDragging || wasDragging) && "pointer-events-none"
                )}
                style={{ paddingLeft: `${12 + level * 16}px` }}
            >
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing hover:bg-gray-300/50 dark:hover:bg-gray-700/50 rounded p-0.5"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <GripVertical className="w-3 h-3 text-gray-400" />
                </div>
                {hasChildren && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="hover:bg-gray-300/50 dark:hover:bg-gray-700/50 rounded p-0.5 transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronRight className="w-3 h-3" />
                        )}
                    </button>
                )}
                {!hasChildren && <div className="w-4" />}
                <FileText className={cn(
                    "w-4 h-4 transition-colors flex-shrink-0",
                    isActive
                        ? "text-gray-600 dark:text-gray-300"
                        : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )} />
                <span className="truncate flex-1">{page.title}</span>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeletePage(page.id);
                        }}
                        className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
                        title="Delete page"
                    >
                        <Minus className="w-3 h-3 text-gray-500" />
                    </button>
                </div>
            </Link>
            {hasChildren && isExpanded && (
                <div>
                    {page.childPages!.map((childPage) => (
                        <SortablePageItem
                            key={childPage.id}
                            page={childPage}
                            workspaceId={workspaceId}
                            currentPageId={currentPageId}
                            onDeletePage={onDeletePage}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function Sidebar({
    currentWorkspace,
    pages,
    user,
    onLogout,
    onCreatePage,
    onDeletePage,
    workspaceId,
    currentPageId,
    onReorderPages,
}: SidebarProps) {
    const [showUserSettings, setShowUserSettings] = useState(false);
    const [localPages, setLocalPages] = useState(pages);

    // Update local pages when props change
    useEffect(() => {
        setLocalPages(pages);
    }, [pages]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Calculate new order outside of setState
            const oldIndex = localPages.findIndex((item) => item.id === active.id);
            const newIndex = localPages.findIndex((item) => item.id === over.id);

            const newPages = arrayMove(localPages, oldIndex, newIndex);

            // Update sortOrder for reordered pages
            const updatedPages = newPages.map((page, index) => ({
                ...page,
                sortOrder: index,
            }));

            // Update local state
            setLocalPages(updatedPages);

            // Call the reorder callback after setState
            // Use setTimeout to ensure it runs after the current render cycle
            setTimeout(() => {
                onReorderPages(updatedPages);
            }, 0);
        }
    };

    // Filter only top-level pages (no parent) for the main list
    const topLevelPages = localPages.filter((page) => !page.parentPageId);

    // Check if user is MEMBER or GUEST (hide Workspace Settings)
    const canManageWorkspace = currentWorkspace?.role === WorkspaceRole.OWNER ||
                               currentWorkspace?.role === WorkspaceRole.ADMIN;

    return (
        <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] flex flex-col h-screen sticky top-0">
            {/* Workspace Header */}
            <div className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center shadow-sm text-lg">
                        {currentWorkspace?.icon || "📁"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {currentWorkspace?.name}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {currentWorkspace?.role || "Member"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-6">
                {/* Main Links */}
                <div className="space-y-0.5">
                    <Link
                        href="/workspace"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100 rounded-md transition-colors"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                        <span>All Workspaces</span>
                    </Link>
                    {canManageWorkspace && (
                        <Link
                            href={`/workspace/${workspaceId}/settings`}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100 rounded-md transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Workspace Settings</span>
                        </Link>
                    )}
                </div>

                {/* Pages Section */}
                <div>
                    <div className="flex items-center justify-between px-3 mb-2 group">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Pages
                        </h3>
                        <button
                            onClick={onCreatePage}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all p-0.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-0.5">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={topLevelPages.map((p) => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {topLevelPages.map((page) => (
                                    <SortablePageItem
                                        key={page.id}
                                        page={page}
                                        workspaceId={workspaceId}
                                        currentPageId={currentPageId}
                                        onDeletePage={onDeletePage}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                        {topLevelPages.length === 0 && (
                            <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 italic">
                                No pages yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
                <div
                    onClick={() => setShowUserSettings(!showUserSettings)}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                >
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                {user?.username?.[0]?.toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user?.username}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            Free Plan
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onLogout();
                        }}
                        className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>

                {/* User Settings Dropdown */}
                {showUserSettings && (
                    <div className="mt-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                        <div className="space-y-1">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                USER SETTINGS
                            </div>
                            <Link
                                href="/settings"
                                onClick={() => setShowUserSettings(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                <UserIcon className="w-4 h-4" />
                                <span>Profile Settings</span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
