export interface User {
  id: number;
  discordId: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

export enum WorkspaceRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  GUEST = "GUEST",
}

export interface Workspace {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  role: WorkspaceRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: number;
  title: string;
  icon?: string;
  coverImage?: string;
  workspaceId: number;
  parentPageId?: number;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  childPages?: Page[];
}

export interface Block {
  id: number;
  type: string;
  content?: string;
  properties?: string;
  position: number;
  parentBlockId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: number;
  user: User;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface InviteLink {
  id: number;
  token: string;
  role: WorkspaceRole;
  expiresAt?: string;
  isActive: boolean;
  maxUses?: number;
  usedCount: number;
  createdAt: string;
}

export enum WebSocketEventType {
  PAGE_UPDATED = "PAGE_UPDATED",
  PAGE_CREATED = "PAGE_CREATED",
  PAGE_DELETED = "PAGE_DELETED",
  BLOCK_UPDATED = "BLOCK_UPDATED",
  BLOCK_CREATED = "BLOCK_CREATED",
  BLOCK_DELETED = "BLOCK_DELETED",
  BLOCKS_BULK_UPDATED = "BLOCKS_BULK_UPDATED",
  USER_JOINED = "USER_JOINED",
  USER_LEFT = "USER_LEFT",
  CURSOR_MOVED = "CURSOR_MOVED",
}

export interface WebSocketMessage {
  type: WebSocketEventType;
  workspaceId: number;
  pageId?: number;
  blockId?: number;
  userId: number;
  username: string;
  data?: any;
}
