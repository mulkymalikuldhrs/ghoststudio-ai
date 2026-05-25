'use client'

import { create } from 'zustand'

export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  name: string
  type: string
  autonomousLevel: number
  trialStart: string | null
  trialEnd: string | null
  subscriptionTier: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  userRole?: string
  userAlias?: string
}

export type TabId = 'dashboard' | 'planner' | 'finance' | 'vault' | 'assistant' | 'settings'

interface AppState {
  currentUser: User | null
  currentWorkspace: Workspace | null
  activeTab: TabId
  sidebarOpen: boolean
  workspaces: Workspace[]

  setUser: (user: User | null) => void
  setWorkspace: (workspace: Workspace | null) => void
  setTab: (tab: TabId) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setWorkspaces: (workspaces: Workspace[]) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  currentWorkspace: null,
  activeTab: 'dashboard',
  sidebarOpen: false,
  workspaces: [],

  setUser: (user) => set({ currentUser: user }),
  setWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setTab: (tab) => set({ activeTab: tab, sidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setWorkspaces: (workspaces) => set({ workspaces }),
}))
