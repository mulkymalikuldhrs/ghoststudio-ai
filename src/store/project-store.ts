"use client";

import { create } from "zustand";

export interface Scene {
  id: number;
  narration: string;
  visual: string;
  duration: number;
  subtitle: string;
}

export interface ScriptData {
  title: string;
  hook: string;
  scenes: Scene[];
  cta: string;
  hashtags: string[];
}

export type CreationStep = "prompt" | "script" | "style" | "generate";

interface ProjectStore {
  // Current step in creation flow
  currentStep: CreationStep;
  setCurrentStep: (step: CreationStep) => void;

  // Prompt step data
  prompt: string;
  niche: string;
  duration: number;
  setPrompt: (prompt: string) => void;
  setNiche: (niche: string) => void;
  setDuration: (duration: number) => void;

  // Script step data
  scriptData: ScriptData | null;
  rawScript: string;
  isGeneratingScript: boolean;
  setScriptData: (data: ScriptData | null) => void;
  setRawScript: (script: string) => void;
  setIsGeneratingScript: (generating: boolean) => void;

  // Style step data
  templateId: string | null;
  subtitleStyle: string;
  voiceId: string;
  pacing: string;
  setTemplateId: (id: string | null) => void;
  setSubtitleStyle: (style: string) => void;
  setVoiceId: (id: string) => void;
  setPacing: (pacing: string) => void;

  // Generate step data
  renderProgress: number;
  isRendering: boolean;
  setRenderProgress: (progress: number) => void;
  setIsRendering: (rendering: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentStep: "prompt" as CreationStep,
  prompt: "",
  niche: "motivation",
  duration: 30,
  scriptData: null,
  rawScript: "",
  isGeneratingScript: false,
  templateId: null,
  subtitleStyle: "default",
  voiceId: "alloy",
  pacing: "medium",
  renderProgress: 0,
  isRendering: false,
};

export const useProjectStore = create<ProjectStore>((set) => ({
  ...initialState,

  setCurrentStep: (step) => set({ currentStep: step }),
  setPrompt: (prompt) => set({ prompt }),
  setNiche: (niche) => set({ niche }),
  setDuration: (duration) => set({ duration }),
  setScriptData: (data) => set({ scriptData: data }),
  setRawScript: (script) => set({ rawScript: script }),
  setIsGeneratingScript: (generating) =>
    set({ isGeneratingScript: generating }),
  setTemplateId: (id) => set({ templateId: id }),
  setSubtitleStyle: (style) => set({ subtitleStyle: style }),
  setVoiceId: (id) => set({ voiceId: id }),
  setPacing: (pacing) => set({ pacing }),
  setRenderProgress: (progress) => set({ renderProgress: progress }),
  setIsRendering: (rendering) => set({ isRendering: rendering }),

  reset: () => set(initialState),
}));
