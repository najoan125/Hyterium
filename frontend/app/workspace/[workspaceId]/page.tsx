"use client";

import { useWorkspaceStore } from "@/lib/store/workspaceStore";
import { Button } from "@/components/ui/Button";
import { FileText } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { pageApi } from "@/lib/api/page";
import { useRouter, useParams } from "next/navigation";

export default function WorkspaceDetailPage() {
  const { currentWorkspace, pages, setPages } = useWorkspaceStore();
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const router = useRouter();
  const params = useParams();
  const workspaceId = Number(params.workspaceId);

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

  return (
    <main className="flex-1 p-12 overflow-y-auto h-screen bg-white dark:bg-[#191919] text-gray-900 dark:text-gray-100">
      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">
            Welcome to {currentWorkspace?.name}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            This workspace is empty. Create your first page to start documenting, planning, or collaborating.
          </p>
          <Button onClick={() => setShowCreatePage(true)} size="lg">
            Create First Page
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-medium mb-1">Select a page</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a page from the sidebar to start editing
          </p>
        </div>
      )}

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
    </main>
  );
}
