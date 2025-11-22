import apiClient from "./client";
import { Page } from "../types";

export const pageApi = {
  async getWorkspacePages(workspaceId: number): Promise<Page[]> {
    const response = await apiClient.get(`/workspaces/${workspaceId}/pages`);
    return response.data;
  },

  async getById(workspaceId: number, pageId: number): Promise<Page> {
    const response = await apiClient.get(`/workspaces/${workspaceId}/pages/${pageId}`);
    return response.data;
  },

  async create(
    workspaceId: number,
    data: { title: string; icon?: string; coverImage?: string; parentPageId?: number }
  ): Promise<Page> {
    const response = await apiClient.post(`/workspaces/${workspaceId}/pages`, data);
    return response.data;
  },

  async update(
    workspaceId: number,
    pageId: number,
    data: { title?: string; icon?: string; coverImage?: string }
  ): Promise<Page> {
    const response = await apiClient.put(`/workspaces/${workspaceId}/pages/${pageId}`, data);
    return response.data;
  },

  async delete(workspaceId: number, pageId: number): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/pages/${pageId}`);
  },

  async getChildPages(workspaceId: number, pageId: number): Promise<Page[]> {
    const response = await apiClient.get(`/workspaces/${workspaceId}/pages/${pageId}/children`);
    return response.data;
  },

  async reorderPages(
    workspaceId: number,
    pageOrders: Array<{ pageId: number; sortOrder: number; parentPageId?: number }>
  ): Promise<void> {
    await apiClient.post(`/workspaces/${workspaceId}/pages/reorder`, {
      pageOrders,
    });
  },
};
