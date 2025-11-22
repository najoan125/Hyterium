"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { useWorkspaceStore } from "@/lib/store/workspaceStore";
import { workspaceApi } from "@/lib/api/workspace";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Plus, Folder, Users, ChevronRight, LogOut, Settings } from "lucide-react";

export default function WorkspacePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, fetchUser } = useAuthStore();
  const { workspaces, setWorkspaces, addWorkspace } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  useEffect(() => {
    const initAuth = async () => {
      await fetchUser();
    };
    initAuth();
  }, [fetchUser]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/auth/login");
      } else {
        loadWorkspaces();
      }
    }
  }, [isAuthenticated, authLoading, router]);

  const loadWorkspaces = async () => {
    try {
      const data = await workspaceApi.getAll();
      setWorkspaces(data);
    } catch (error) {
      console.error("Failed to load workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    try {
      const workspace = await workspaceApi.create({ name: newWorkspaceName });
      addWorkspace(workspace);
      setNewWorkspaceName("");
      setShowCreateModal(false);
      router.push(`/workspace/${workspace.id}`);
    } catch (error) {
      console.error("Failed to create workspace:", error);
    }
  };

  if (authLoading || loading) {
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
    <div className="min-h-screen bg-white dark:bg-[#191919]">
      {/* Navigation */}
      <nav className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-[#191919]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white dark:text-black font-bold text-lg">N</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Hyterium</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-300">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{user?.username}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => useAuthStore.getState().logout()}
                className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome back</h1>
            <p className="text-gray-500 dark:text-gray-400">Select a workspace to continue your work</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Workspace
          </Button>
        </div>

        {workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-center mb-4">
              <Folder className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No workspaces yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create your first workspace to get started</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Workspace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                onClick={() => router.push(`/workspace/${workspace.id}`)}
                className="group bg-white dark:bg-gray-900/30 p-5 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition-transform">
                    {workspace.icon || "📁"}
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-100 dark:border-gray-700">
                    {workspace.role}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-black dark:group-hover:text-white">
                  {workspace.name}
                </h3>

                {workspace.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                    {workspace.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>{workspace.memberCount} members</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Workspace"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workspace Name
            </label>
            <Input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="e.g., My Awesome Team"
              onKeyPress={(e) => e.key === "Enter" && handleCreateWorkspace()}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={!newWorkspaceName.trim()}
            >
              Create Workspace
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
