import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WebSocketMessage } from "../types";
import { authApi } from "../api/auth";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws";

export function useWorkspaceWebSocket(
  workspaceId: number | null,
  onMessage: (message: WebSocketMessage) => void
) {
  const clientRef = useRef<Client | null>(null);
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    if (!workspaceId || isConnectedRef.current) return;

    const token = authApi.getToken();
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log("STOMP Debug (Workspace):", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("Workspace WebSocket connected");
      isConnectedRef.current = true;

      // Subscribe to workspace-level updates
      client.subscribe(`/topic/workspace.${workspaceId}`, (message) => {
        const data: WebSocketMessage = JSON.parse(message.body);
        onMessage(data);
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP error (Workspace):", frame);
    };

    client.onDisconnect = () => {
      console.log("Workspace WebSocket disconnected");
      isConnectedRef.current = false;
    };

    client.activate();
    clientRef.current = client;
  }, [workspaceId, onMessage]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch (error) {
        console.log("Error deactivating workspace client:", error);
      }
      isConnectedRef.current = false;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { isConnected: isConnectedRef.current };
}
