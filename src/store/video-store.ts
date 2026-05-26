// ────────────────────────────────────────────────────────────────────────────────
// Video Store — Video Creation Wizard State (Zustand)
// GhostStudio AI v2.0
// ────────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import type { VideoCreationStep, ScriptData } from "@/types";

// ─── Scene type for the wizard ───────────────────────────────────────────────

export interface WizardScene {
  order: number;
  narration: string;
  visualDescription: string;
  duration: number;
  mediaUrl?: string;
}

// ─── Store Interface ─────────────────────────────────────────────────────────

interface VideoStore {
  // ── Creation Flow ───────────────────────────────────────────────────────
  currentStep: VideoCreationStep;
  setCurrentStep: (step: VideoCreationStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // ── Project ─────────────────────────────────────────────────────────────
  projectId: string | null;
  setProjectId: (id: string | null) => void;

  // ── Prompt Step ─────────────────────────────────────────────────────────
  prompt: string;
  setPrompt: (prompt: string) => void;
  niche: string;
  setNiche: (niche: string) => void;
  duration: number;
  setDuration: (duration: number) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;

  // ── Script Step ─────────────────────────────────────────────────────────
  script: string;
  setScript: (script: string) => void;
  scriptData: ScriptData | null;
  setScriptData: (data: ScriptData | null) => void;
  isGeneratingScript: boolean;
  setIsGeneratingScript: (generating: boolean) => void;

  // ── Style Step ──────────────────────────────────────────────────────────
  style: string;
  setStyle: (style: string) => void;
  template: string;
  setTemplate: (template: string) => void;

  // ── Scenes Step ─────────────────────────────────────────────────────────
  scenes: WizardScene[];
  setScenes: (scenes: WizardScene[]) => void;

  // ── Voice Step ──────────────────────────────────────────────────────────
  voiceId: string;
  setVoiceId: (voiceId: string) => void;
  subtitleStyle: string;
  setSubtitleStyle: (style: string) => void;
  pacing: string;
  setPacing: (pacing: string) => void;

  // ── Render Step ─────────────────────────────────────────────────────────
  renderProgress: number;
  setRenderProgress: (progress: number) => void;
  renderStatus: "idle" | "queued" | "rendering" | "completed" | "failed";
  setRenderStatus: (status: VideoStore["renderStatus"]) => void;
  isRendering: boolean;
  setIsRendering: (rendering: boolean) => void;

  // ── Preview ─────────────────────────────────────────────────────────────
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;

  // ── Reset ───────────────────────────────────────────────────────────────
  reset: () => void;
}

// ─── Step Order ───────────────────────────────────────────────────────────────

const STEP_ORDER: VideoCreationStep[] = [
  "prompt",
  "script",
  "scenes",
  "voice",
  "render",
  "preview",
];

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState = {
  currentStep: "prompt" as VideoCreationStep,
  projectId: null as string | null,
  prompt: "",
  niche: "general",
  duration: 30,
  aspectRatio: "9:16",
  script: "",
  scriptData: null as ScriptData | null,
  isGeneratingScript: false,
  style: "default",
  template: "default",
  scenes: [] as WizardScene[],
  voiceId: "alloy",
  subtitleStyle: "default",
  pacing: "medium",
  renderProgress: 0,
  renderStatus: "idle" as VideoStore["renderStatus"],
  isRendering: false,
  videoUrl: null as string | null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useVideoStore = create<VideoStore>((set, get) => ({
  ...initialState,

  // ── Creation Flow ───────────────────────────────────────────────────────
  setCurrentStep: (step) => set({ currentStep: step }),
  nextStep: () => {
    const { currentStep } = get();
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx < STEP_ORDER.length - 1) {
      set({ currentStep: STEP_ORDER[idx + 1] });
    }
  },
  prevStep: () => {
    const { currentStep } = get();
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx > 0) {
      set({ currentStep: STEP_ORDER[idx - 1] });
    }
  },

  // ── Project ─────────────────────────────────────────────────────────────
  setProjectId: (id) => set({ projectId: id }),

  // ── Prompt Step ─────────────────────────────────────────────────────────
  setPrompt: (prompt) => set({ prompt }),
  setNiche: (niche) => set({ niche }),
  setDuration: (duration) => set({ duration }),
  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),

  // ── Script Step ─────────────────────────────────────────────────────────
  setScript: (script) => set({ script }),
  setScriptData: (data) => set({ scriptData: data }),
  setIsGeneratingScript: (generating) => set({ isGeneratingScript: generating }),

  // ── Style Step ──────────────────────────────────────────────────────────
  setStyle: (style) => set({ style }),
  setTemplate: (template) => set({ template }),

  // ── Scenes Step ─────────────────────────────────────────────────────────
  setScenes: (scenes) => set({ scenes }),

  // ── Voice Step ──────────────────────────────────────────────────────────
  setVoiceId: (voiceId) => set({ voiceId }),
  setSubtitleStyle: (style) => set({ subtitleStyle: style }),
  setPacing: (pacing) => set({ pacing }),

  // ── Render Step ─────────────────────────────────────────────────────────
  setRenderProgress: (progress) => set({ renderProgress: progress }),
  setRenderStatus: (status) => set({ renderStatus: status }),
  setIsRendering: (rendering) => set({ isRendering: rendering }),

  // ── Preview ─────────────────────────────────────────────────────────────
  setVideoUrl: (url) => set({ videoUrl: url }),

  // ── Reset ───────────────────────────────────────────────────────────────
  reset: () => set(initialState),
}));
