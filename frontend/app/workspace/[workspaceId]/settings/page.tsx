"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWorkspaceStore } from "@/lib/store/workspaceStore";
import { workspaceApi } from "@/lib/api/workspace";
import Link from "next/link";

export default function WorkspaceSettingsPage() {
    const router = useRouter();
    const params = useParams();
    const workspaceId = Number(params.workspaceId);
    const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();

    const [name, setName] = useState("");
    const [icon, setIcon] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWorkspace = async () => {
            try {
                const workspace = await workspaceApi.getById(workspaceId);
                setCurrentWorkspace(workspace);
                setName(workspace.name);
                setIcon(workspace.icon || "📁");
            } catch (error) {
                console.error("Failed to load workspace:", error);
                router.push(`/workspace/${workspaceId}`);
            } finally {
                setLoading(false);
            }
        };
        loadWorkspace();
    }, [workspaceId, setCurrentWorkspace, router]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const updated = await workspaceApi.update(workspaceId, { name, icon });
            setCurrentWorkspace(updated);
            alert("Workspace updated successfully!");
        } catch (error) {
            console.error("Failed to update workspace:", error);
            alert("Failed to update workspace.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) {
            try {
                await workspaceApi.delete(workspaceId);
                router.push("/");
            } catch (error) {
                console.error("Failed to delete workspace:", error);
                alert("Failed to delete workspace.");
            }
        }
    };

    if (loading) return <div className="p-12 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-white dark:bg-[#191919] text-gray-900 dark:text-gray-100">
            <nav className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/workspace/${workspaceId}`} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                        ← Back to Workspace
                    </Link>
                    <h1 className="text-lg font-semibold">Workspace Settings</h1>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto py-12 px-6">
                <div className="space-y-10">
                    <section>
                        <h2 className="text-xl font-medium mb-4">General</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Workspace Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Icon</label>
                                <input
                                    type="text"
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-16 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    maxLength={2}
                                />
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
                            >
                                {isSaving ? "Saving..." : "Update Workspace"}
                            </button>
                        </div>
                    </section>

                    <hr className="border-gray-200 dark:border-gray-800" />

                    <section>
                        <h2 className="text-xl font-medium mb-4 text-red-600">Danger Zone</h2>
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
                            <h3 className="font-medium text-red-800 dark:text-red-400 mb-2">Delete Workspace</h3>
                            <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                                Permanently delete this workspace and all of its pages. This action cannot be undone.
                            </p>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                            >
                                Delete Workspace
                            </button>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
