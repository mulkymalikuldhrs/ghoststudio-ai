"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

// User hook
export function useUser() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!session,
  });
}

// Projects hook
export function useProjects(status?: string) {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["projects", status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const res = await fetch(`/api/projects${params}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
    enabled: !!session,
  });
}

// Project detail hook
export function useProject(id: string) {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
    enabled: !!session && !!id,
  });
}

// Templates hook
export function useTemplates(category?: string, search?: string) {
  return useQuery({
    queryKey: ["templates", category, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category && category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      const res = await fetch(`/api/templates?${params}`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });
}

// Analytics hook
export function useAnalytics() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!session,
  });
}

// Create project mutation
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; prompt?: string; niche?: string }) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Delete project mutation
export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Generate script mutation
export function useGenerateScript() {
  return useMutation({
    mutationFn: async (data: { prompt: string; niche: string; duration: number }) => {
      const res = await fetch("/api/projects/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to generate script");
      return res.json();
    },
  });
}

// Create checkout mutation
export function useCreateCheckout() {
  return useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) throw new Error("Failed to create checkout");
      return res.json();
    },
  });
}
