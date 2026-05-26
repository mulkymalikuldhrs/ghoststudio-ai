// ────────────────────────────────────────────────────────────────────────────────
// App Store — Global App State (Zustand)
// GhostStudio AI v2.0
// ────────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";

// ─── Toast Types ─────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

// ─── Notification Types ──────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: "info" | "success" | "warning" | "error" | "agent" | "system";
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  link?: string;
}

// ─── Store Interface ─────────────────────────────────────────────────────────

interface AppStore {
  // ── Theme ───────────────────────────────────────────────────────────────
  theme: "light" | "dark" | "system";
  setTheme: (theme: AppStore["theme"]) => void;

  // ── Toast Notifications ─────────────────────────────────────────────────
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // ── Notifications ───────────────────────────────────────────────────────
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, "id" | "read" | "timestamp">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  unreadCount: () => number;

  // ── Command Palette ─────────────────────────────────────────────────────
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // ── Global Loading ──────────────────────────────────────────────────────
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // ── Navigation ──────────────────────────────────────────────────────────
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
  previousRoute: string | null;

  // ── Onboarding ──────────────────────────────────────────────────────────
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let toastCounter = 0;
let notificationCounter = 0;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>((set, get) => ({
  // ── Theme ───────────────────────────────────────────────────────────────
  theme: "dark",
  setTheme: (theme) => set({ theme }),

  // ── Toast Notifications ─────────────────────────────────────────────────
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),

  // ── Notifications ───────────────────────────────────────────────────────
  notifications: [],
  addNotification: (notification) => {
    const id = `notif-${++notificationCounter}`;
    const timestamp = new Date().toISOString();
    set((state) => ({
      notifications: [
        { ...notification, id, read: false, timestamp },
        ...state.notifications,
      ],
    }));
  },
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  clearNotifications: () => set({ notifications: [] }),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  // ── Command Palette ─────────────────────────────────────────────────────
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // ── Global Loading ──────────────────────────────────────────────────────
  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),

  // ── Navigation ──────────────────────────────────────────────────────────
  currentRoute: "/",
  setCurrentRoute: (route) =>
    set((state) => ({
      previousRoute: state.currentRoute,
      currentRoute: route,
    })),
  previousRoute: null,

  // ── Onboarding ──────────────────────────────────────────────────────────
  onboardingComplete: false,
  setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
  onboardingStep: 0,
  setOnboardingStep: (step) => set({ onboardingStep: step }),
}));
