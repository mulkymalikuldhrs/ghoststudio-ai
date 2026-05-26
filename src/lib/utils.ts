import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getScoreLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) return { label: "Excellent", color: "text-green-500" };
  if (score >= 60) return { label: "Good", color: "text-emerald-500" };
  if (score >= 40) return { label: "Fair", color: "text-yellow-500" };
  if (score >= 20) return { label: "Poor", color: "text-orange-500" };
  return { label: "Critical", color: "text-red-500" };
}

export function getEnergyLabel(fatigueScore: number): {
  label: string;
  color: string;
} {
  if (fatigueScore <= 20) return { label: "Fresh", color: "text-green-500" };
  if (fatigueScore <= 40) return { label: "Moderate", color: "text-yellow-500" };
  if (fatigueScore <= 60) return { label: "Tiring", color: "text-orange-500" };
  if (fatigueScore <= 80) return { label: "Exhausted", color: "text-red-500" };
  return { label: "Critical", color: "text-red-700" };
}
