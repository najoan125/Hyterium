import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WebSocketMessage } from "../types";
import { authApi } from "../api/auth";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/ws";

export function useWebSocket(
  workspaceId: number | null,
  pageId: number | null,
  onMessage: (message: WebSocketMessage) => void
) {
  const clientRef = useRef<Client | null>(null);
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    if (!workspaceId || !pageId || isConnectedRef.current) return;

    const token = authApi.getToken();
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log("STOMP Debug:", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("WebSocket connected");
      isConnectedRef.current = true;

      client.subscribe(`/topic/workspace.${workspaceId}.page.${pageId}`, (message) => {
        const data: WebSocketMessage = JSON.parse(message.body);
        onMessage(data);
      });

      client.publish({
        destination: `/app/workspace/${workspaceId}/page/${pageId}/join`,
        body: JSON.stringify({}),
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP error:", frame);
    };

    client.onDisconnect = () => {
      console.log("WebSocket disconnected");
      isConnectedRef.current = false;
    };

    client.activate();
    clientRef.current = client;
  }, [workspaceId, pageId, onMessage]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      try {
        // Only send leave message if we're actually connected
        if (isConnectedRef.current && workspaceId && pageId && clientRef.current.connected) {
          clientRef.current.publish({
            destination: `/app/workspace/${workspaceId}/page/${pageId}/leave`,
            body: JSON.stringify({}),
          });
        }
      } catch (error) {
        console.log("Error sending leave message:", error);
      } finally {
        // Always try to deactivate
        try {
          clientRef.current.deactivate();
        } catch (error) {
          console.log("Error deactivating client:", error);
        }
        isConnectedRef.current = false;
      }
    }
  }, [workspaceId, pageId]);

  const sendMessage = useCallback(
    (destination: string, body: any) => {
      if (clientRef.current && isConnectedRef.current && clientRef.current.connected) {
        try {
          clientRef.current.publish({
            destination,
            body: JSON.stringify(body),
          });
        } catch (error) {
          console.error("Error sending message:", error);
        }
      }
    },
    []
  );

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { sendMessage, isConnected: isConnectedRef.current };
}
