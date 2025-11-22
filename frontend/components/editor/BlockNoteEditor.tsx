"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import * as Y from "yjs";
import YPartyKitProvider from "y-partykit/provider";
import { blockApi } from "@/lib/api/block";
import { useAuthStore } from "@/lib/store/authStore";
import { Block } from "@/lib/types";

interface BlockNoteEditorProps {
  pageId: number;
  workspaceId: number;
  initialBlocks?: Block[];
  editable?: boolean;
  onUsersChange?: (users: any[]) => void;
}

// Generate random color for user
const generateUserColor = () => {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
    "#F7B731", "#5F27CD", "#00D2D3", "#FF9FF3", "#54A0FF"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default function BlockNoteEditorComponent({
  pageId,
  workspaceId,
  initialBlocks = [],
  editable = true,
  onUsersChange,
}: BlockNoteEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<BlockNoteEditor | null>(null);
  const isInitialLoadRef = useRef(true);
  const providerRef = useRef<YPartyKitProvider | null>(null);
  const lastSavedContentRef = useRef<any[]>([]);
  const saveRetryCountRef = useRef(0);
  const user = useAuthStore((state) => state.user);

  // Create Y.Doc and PartyKit provider
  const { doc, provider } = useMemo(() => {
    const doc = new Y.Doc();
    const roomName = `notion-workspace-${workspaceId}-page-${pageId}`;

    console.log(`Creating PartyKit provider for room: ${roomName}`);

    const provider = new YPartyKitProvider(
      "blocknote-dev.yousefed.partykit.dev",
      roomName,
      doc
    );

    providerRef.current = provider;

    return { doc, provider };
  }, [workspaceId, pageId]);

  // Get user info for collaboration
  const userInfo = useMemo(() => {
    if (!user) {
      return {
        name: "Anonymous",
        color: generateUserColor(),
      };
    }
    return {
      name: user.username || user.email || "User",
      color: generateUserColor(),
    };
  }, [user]);

  // Create BlockNote editor with Yjs collaboration
  const editor = useCreateBlockNote({
    collaboration: {
      provider,
      fragment: doc.getXmlFragment("document-store"),
      user: userInfo,
    },
  });

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
      // Mark editor as ready after a brief delay to ensure full initialization
      setTimeout(() => {
        setIsEditorReady(true);
      }, 500);
    }
  }, [editor]);

  // Load initial blocks from API
  const loadBlocks = useCallback(async () => {
    try {
      const loadedBlocks = await blockApi.getPageBlocks(pageId);
      console.log('Loaded blocks from API:', loadedBlocks);

      const blockNoteBlocks = loadedBlocks.map((block) => {
        try {
          const content = block.content ? JSON.parse(block.content) : [];
          const props = block.properties ? JSON.parse(block.properties) : {};

          return {
            type: block.type,
            content: content,
            props: props,
          };
        } catch (parseError) {
          console.error('Error parsing block:', block, parseError);
          return {
            type: block.type || "paragraph",
            content: [],
            props: {},
          };
        }
      });

      console.log('Parsed BlockNote blocks:', blockNoteBlocks);

      // Only update editor content on initial load
      if (isInitialLoadRef.current && editorRef.current) {
        // Wait for editor to be fully ready
        await new Promise(resolve => setTimeout(resolve, 300));

        // Always load blocks on initial load if we have blocks from API
        if (blockNoteBlocks.length > 0) {
          try {
            console.log('Loading blocks into editor...', blockNoteBlocks);
            editorRef.current?.replaceBlocks(editorRef.current.document, blockNoteBlocks as any);
            console.log('Editor updated successfully');
          } catch (editorError) {
            console.error('Error updating editor:', editorError);
          }
        } else {
          console.log('No blocks to load from API');
        }

        isInitialLoadRef.current = false;

        // Wait a bit more to ensure editor content is settled
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load blocks:", error);
      setIsLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (editor) {
      loadBlocks();
    }
  }, [pageId, editor, loadBlocks]);

  // Monitor Yjs Provider connection and awareness
  useEffect(() => {
    if (!provider) return;

    // Connection status monitoring
    const handleStatus = (event: any) => {
      console.log('Yjs Provider status:', event.status);
      if (event.status === 'disconnected') {
        console.warn('Yjs Provider disconnected - collaboration may not work');
      } else if (event.status === 'connected') {
        console.log('Yjs Provider connected/reconnected');

        // Set local user state when connected
        if (user) {
          provider.awareness.setLocalState({
            user: {
              id: user.id,
              name: user.username || user.email || 'Anonymous',
              color: generateUserColor(),
            },
            cursor: null,
          });
        }
      }
    };

    // Awareness changes monitoring
    const handleAwarenessChange = () => {
      const states = Array.from(provider.awareness.getStates().entries());
      const activeUsers = states
        .filter(([clientId, state]: [any, any]) => state?.user)
        .map(([clientId, state]: [any, any]) => ({
          clientId,
          ...state.user,
        }));

      console.log('Active users:', activeUsers);
      onUsersChange?.(activeUsers);
    };

    provider.on('status', handleStatus);
    provider.awareness.on('change', handleAwarenessChange);

    // Set initial user state
    if (user) {
      provider.awareness.setLocalState({
        user: {
          id: user.id,
          name: user.username || user.email || 'Anonymous',
          color: generateUserColor(),
        },
        cursor: null,
      });
    }

    return () => {
      provider.off('status', handleStatus);
      provider.awareness.off('change', handleAwarenessChange);
      provider.awareness.setLocalState(null); // Clean up on unmount
    };
  }, [provider, user, onUsersChange]);

  // Save blocks to backend (debounced)
  const saveBlocks = useCallback(async (content: any[], isRetry: boolean = false) => {
    // 안전 검사: 빈 배열을 보내지 않도록 방지
    if (!content || content.length === 0) {
      console.warn('Skipping save - no content to save');
      return;
    }

    // 중복 저장 방지: 같은 내용이면 저장하지 않음
    if (JSON.stringify(content) === JSON.stringify(lastSavedContentRef.current)) {
      console.log('Skipping save - content unchanged');
      return;
    }

    try {
      setIsSaving(true);
      const blockRequests = content.map((block: any, index: number) => ({
        type: block.type || 'paragraph',
        content: JSON.stringify(block.content || []),
        properties: JSON.stringify(block.props || {}),
        position: index,
      }));

      console.log(`Saving ${blockRequests.length} blocks for pageId:`, pageId);

      // 추가 안전 검사
      if (blockRequests.length === 0) {
        console.error('Block requests is empty, aborting save');
        return;
      }

      await blockApi.bulkUpdate(pageId, blockRequests);
      console.log('Save successful!');
      lastSavedContentRef.current = content;
      saveRetryCountRef.current = 0;
    } catch (error: any) {
      console.error("Failed to save blocks:", error);

      // 백엔드 에러 메시지 출력
      if (error?.response?.data) {
        console.error("Backend error details:", error.response.data);
      }

      // 네트워크 오류 시 재시도
      if (error?.code === 'ERR_NETWORK' || error?.response?.status >= 500) {
        if (saveRetryCountRef.current < 3 && !isRetry) {
          saveRetryCountRef.current++;
          console.log(`Retrying save... (attempt ${saveRetryCountRef.current}/3)`);
          setTimeout(() => saveBlocks(content, true), 2000);
          return;
        }
      }

      // 최종 실패 시에만 알림
      if (saveRetryCountRef.current >= 3 || !isRetry) {
        const errorMessage = error?.response?.data?.message || 'Failed to save after multiple attempts. Your content is still in the editor.';
        alert(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  }, [pageId]);

  // Save immediately (for keyboard shortcut)
  const saveImmediately = useCallback(async () => {
    if (!editor || !isEditorReady || isLoading || isInitialLoadRef.current) {
      console.log('Cannot save - editor not ready');
      return;
    }

    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const content = editor.document;
    await saveBlocks(content);
  }, [editor, isEditorReady, isLoading, saveBlocks]);

  // Auto-save on editor changes
  const handleChange = useCallback(() => {
    // Don't save if editor is not ready or still loading
    if (!editor || !isEditorReady || isLoading || isInitialLoadRef.current) {
      console.log('Skipping save - editor not ready or still loading');
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 2 seconds
    saveTimeoutRef.current = setTimeout(() => {
      const content = editor.document;
      saveBlocks(content);
    }, 2000);
  }, [editor, isEditorReady, isLoading, saveBlocks]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+S (Mac) or Ctrl+S (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser's default save dialog
        saveImmediately();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveImmediately]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (providerRef.current) {
        providerRef.current.destroy();
      }
    };
  }, []);

  const { theme, resolvedTheme } = useTheme();
  const editorTheme = resolvedTheme === 'dark' ? 'dark' : 'light';

  // Show loading state until both editor is loaded and ready
  if (isLoading || !isEditorReady) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? "Loading content..." : "Initializing editor..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blocknote-editor-container relative">
      {isSaving && (
        <div className="absolute top-2 right-2 z-10 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
          Saving...
        </div>
      )}
      <div className={`transition-opacity duration-300 ${isEditorReady ? 'opacity-100' : 'opacity-0'}`}>
        <BlockNoteView
          editor={editor}
          onChange={handleChange}
          editable={editable}
          theme={editorTheme}
        />
      </div>
    </div>
  );
}
