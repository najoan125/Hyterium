"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { workspaceApi } from "@/lib/api/workspace";

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const { isAuthenticated, fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await fetchUser();
    };
    init();
  }, [fetchUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/invite/${token}`);
      return;
    }
    acceptInvite();
  }, [isAuthenticated, token]);

  const acceptInvite = async () => {
    try {
      setLoading(true);
      const workspace = await workspaceApi.acceptInvite(token);
      setLoading(false);
      router.push(`/workspace/${workspace.id}`);
    } catch (err: unknown) {
      const error = err as any;
      setError(error.response?.data?.message || "Failed to accept invite");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Processing invite...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/workspace")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go to Workspaces
          </button>
        </div>
      </div>
    );
  }

  return null;
}
