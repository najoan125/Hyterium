"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-white dark:bg-[#191919] text-gray-900 dark:text-gray-100">
            <nav className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                        ← Back to Home
                    </Link>
                    <h1 className="text-lg font-semibold">Settings</h1>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto py-12 px-6">
                <div className="space-y-10">
                    {/* Profile Section */}
                    <section>
                        <h2 className="text-xl font-medium mb-4">My Profile</h2>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-medium">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium text-lg">{user?.username}</div>
                                <div className="text-gray-500 dark:text-gray-400">{user?.email}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                router.push("/auth/login");
                            }}
                            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                            Log out
                        </button>
                    </section>

                    <hr className="border-gray-200 dark:border-gray-800" />

                    {/* Appearance Section */}
                    <section>
                        <h2 className="text-xl font-medium mb-4">Appearance</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Theme</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Customize how Notion looks on your device</div>
                                </div>
                                <select
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="system">System</option>
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                </select>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
