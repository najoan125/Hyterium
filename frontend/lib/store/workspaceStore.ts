import { create } from "zustand";
import { Workspace, Page } from "../types";

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  pages: Page[];
  currentPage: Page | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setPages: (pages: Page[]) => void;
  setCurrentPage: (page: Page | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: number, data: Partial<Workspace>) => void;
  removeWorkspace: (id: number) => void;
  addPage: (page: Page) => void;
  updatePage: (id: number, data: Partial<Page>) => void;
  removePage: (id: number) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  pages: [],
  currentPage: null,

  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setPages: (pages) => set({ pages }),
  setCurrentPage: (page) => set({ currentPage: page }),

  addWorkspace: (workspace) =>
    set((state) => ({
      workspaces: [...state.workspaces, workspace],
    })),

  updateWorkspace: (id, data) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, ...data } : w)),
      currentWorkspace:
        state.currentWorkspace?.id === id ? { ...state.currentWorkspace, ...data } : state.currentWorkspace,
    })),

  removeWorkspace: (id) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
    })),

  addPage: (page) =>
    set((state) => ({
      pages: [...state.pages, page],
    })),

  updatePage: (id, data) =>
    set((state) => ({
      pages: state.pages.map((p) => (p.id === id ? { ...p, ...data } : p)),
      currentPage: state.currentPage?.id === id ? { ...state.currentPage, ...data } : state.currentPage,
    })),

  removePage: (id) =>
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== id),
      currentPage: state.currentPage?.id === id ? null : state.currentPage,
    })),
}));
