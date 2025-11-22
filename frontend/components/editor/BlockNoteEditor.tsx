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
        // Wait a bit for editor to be ready
        await new Promise(resolve => setTimeout(resolve, 100));

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

  // Auto-save on editor changes
  const handleChange = useCallback(() => {
    if (!editor) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 2 seconds
    saveTimeoutRef.current = setTimeout(() => {
      const content = editor.document;
      saveBlocks(content);
    }, 2000);
  }, [editor, saveBlocks]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="blocknote-editor-container relative">
      {isSaving && (
        <div className="absolute top-2 right-2 text-xs text-gray-500 dark:text-gray-400">
          Saving...
        </div>
      )}
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        editable={editable}
        theme={editorTheme}
      />
    </div>
  );
}
