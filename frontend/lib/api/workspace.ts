import apiClient from "./client";
import { Workspace, WorkspaceMember, InviteLink } from "../types";

export const workspaceApi = {
  async getAll(): Promise<Workspace[]> {
    const response = await apiClient.get("/workspaces");
    return response.data;
  },

  async getById(id: number): Promise<Workspace> {
    const response = await apiClient.get(`/workspaces/${id}`);
    return response.data;
  },

  async create(data: { name: string; description?: string; icon?: string }): Promise<Workspace> {
    const response = await apiClient.post("/workspaces", data);
    return response.data;
  },

  async update(id: number, data: { name?: string; description?: string; icon?: string }): Promise<Workspace> {
    const response = await apiClient.put(`/workspaces/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/workspaces/${id}`);
  },

  async getMembers(workspaceId: number): Promise<WorkspaceMember[]> {
    const response = await apiClient.get(`/workspaces/${workspaceId}/members`);
    return response.data;
  },

  async updateMemberRole(workspaceId: number, memberId: number, role: string): Promise<WorkspaceMember> {
    const response = await apiClient.put(`/workspaces/${workspaceId}/members/${memberId}/role`, { role });
    return response.data;
  },

  async removeMember(workspaceId: number, memberId: number): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  },

  async leaveWorkspace(workspaceId: number): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/members/leave`);
  },

  async getInviteLinks(workspaceId: number): Promise<InviteLink[]> {
    const response = await apiClient.get(`/workspaces/${workspaceId}/invites`);
    return response.data;
  },

  async createInviteLink(
    workspaceId: number,
    data: { role?: string; expiresInDays?: number; maxUses?: number }
  ): Promise<InviteLink> {
    const response = await apiClient.post(`/workspaces/${workspaceId}/invites`, data);
    return response.data;
  },

  async deactivateInviteLink(workspaceId: number, linkId: number): Promise<void> {
    await apiClient.post(`/workspaces/${workspaceId}/invites/${linkId}/deactivate`);
  },

  async acceptInvite(token: string): Promise<Workspace> {
    const response = await apiClient.post(`/invites/${token}/accept`);
    return response.data;
  },
};
