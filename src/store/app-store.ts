"use client";

import { create } from "zustand";

export type DashboardPage =
  | "projects"
  | "create"
  | "templates"
  | "analytics"
  | "settings";

interface AppStore {
  // Navigation
  currentPage: DashboardPage;
  setCurrentPage: (page: DashboardPage) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Notifications
  notifications: number;
  setNotifications: (count: number) => void;

  // Selected project
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentPage: "projects",
  setCurrentPage: (page) => set({ currentPage: page }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  notifications: 3,
  setNotifications: (count) => set({ notifications: count }),
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
}));
