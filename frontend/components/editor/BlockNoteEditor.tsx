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
}: BlockNoteEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<BlockNoteEditor | null>(null);
  const isInitialLoadRef = useRef(true);
  const providerRef = useRef<YPartyKitProvider | null>(null);
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

  // Save blocks to backend (debounced)
  const saveBlocks = useCallback(async (content: any[]) => {
    try {
      setIsSaving(true);
      const blockRequests = content.map((block: any, index: number) => ({
        type: block.type,
        content: JSON.stringify(block.content || []),
        properties: JSON.stringify(block.props || {}),
        position: index,
      }));

      console.log('Saving blocks for pageId:', pageId);
      await blockApi.bulkUpdate(pageId, blockRequests);
      console.log('Save successful!');
    } catch (error) {
      console.error("Failed to save blocks:", error);
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
