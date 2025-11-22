import apiClient from "./client";
import { Block } from "../types";

export const blockApi = {
  async getPageBlocks(pageId: number): Promise<Block[]> {
    const response = await apiClient.get(`/pages/${pageId}/blocks`);
    return response.data;
  },

  async create(
    pageId: number,
    data: { type: string; content?: string; properties?: string; position: number; parentBlockId?: number }
  ): Promise<Block> {
    const response = await apiClient.post(`/pages/${pageId}/blocks`, data);
    return response.data;
  },

  async update(
    pageId: number,
    blockId: number,
    data: { type?: string; content?: string; properties?: string; position?: number }
  ): Promise<Block> {
    const response = await apiClient.put(`/pages/${pageId}/blocks/${blockId}`, data);
    return response.data;
  },

  async delete(pageId: number, blockId: number): Promise<void> {
    await apiClient.delete(`/pages/${pageId}/blocks/${blockId}`);
  },

  async bulkUpdate(
    pageId: number,
    blocks: Array<{ type: string; content?: string; properties?: string; position: number }>
  ): Promise<Block[]> {
    const response = await apiClient.post(`/pages/${pageId}/blocks/bulk`, blocks);
    return response.data;
  },
};
