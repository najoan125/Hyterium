import Link from "next/link";
import {
    ChevronLeft,
    Plus,
    FileText,
    Settings,
    LogOut,
    ChevronsLeft,
    Folder,
    User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Workspace, Page, User } from "@/lib/types";

interface SidebarProps {
    currentWorkspace?: Workspace;
    pages: Page[];
    user?: User | null;
    onLogout: () => void;
    onCreatePage: () => void;
    workspaceId: number;
}

export function Sidebar({
    currentWorkspace,
    pages,
    user,
    onLogout,
    onCreatePage,
    workspaceId
}: SidebarProps) {
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
                    <Link
                        href={`/workspace/${workspaceId}/settings`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100 rounded-md transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        <span>Workspace Settings</span>
                    </Link>
                    <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100 rounded-md transition-colors"
                    >
                        <UserIcon className="w-4 h-4" />
                        <span>User Settings</span>
                    </Link>
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
                        {pages.map((page) => (
                            <Link
                                key={page.id}
                                href={`/workspace/${workspaceId}/page/${page.id}`}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100 rounded-md transition-colors group"
                            >
                                <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                                <span className="truncate">{page.title}</span>
                            </Link>
                        ))}
                        {pages.length === 0 && (
                            <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 italic">
                                No pages yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
                <div className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
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
                        onClick={onLogout}
                        className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
