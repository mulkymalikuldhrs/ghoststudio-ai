"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import {
  FileText,
  Clock,
  Brain,
  BarChart3,
  Zap,
  Settings,
  Sun,
  Moon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  PenTool,
  SearchCheck,
  Repeat,
  Star,
  Send,
  Play,
  RotateCcw,
  CalendarClock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  TrendingUp,
  Eye,
  MousePointerClick,
  DollarSign,
  Users,
  Activity,
  Menu,
  Gauge,
  Layers,
  Tag,
  Globe,
  Mail,
  MessageSquare,
  BookOpen,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,

} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";

import { useMediaStore, type ContentItem, type ContentStatus, type AutomationMode } from "@/store/media-store";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ContentStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  idea: { label: "Idea", color: "text-gray-400", bg: "bg-gray-500/15", border: "border-gray-500/30" },
  draft: { label: "Draft", color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30" },
  editing: { label: "Editing", color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30" },
  seo_review: { label: "SEO Review", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" },
  ready: { label: "Ready", color: "text-green-400", bg: "bg-green-500/15", border: "border-green-500/30" },
  scheduled: { label: "Scheduled", color: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/30" },
  published: { label: "Published", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  archived: { label: "Archived", color: "text-slate-400", bg: "bg-slate-500/15", border: "border-slate-500/30" },
  failed: { label: "Failed", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
};

const FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "idea", label: "Ideas" },
  { key: "draft", label: "Drafts" },
  { key: "ready", label: "Ready" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "failed", label: "Failed" },
];

const MEMORY_CATEGORIES = [
  { key: "all", label: "All", icon: Layers },
  { key: "hook", label: "Hooks", icon: Zap },
  { key: "topic", label: "Topics", icon: BookOpen },
  { key: "tone", label: "Tone", icon: MessageSquare },
  { key: "timing", label: "Timing", icon: Clock },
  { key: "cta", label: "CTA", icon: Send },
  { key: "format", label: "Format", icon: FileText },
  { key: "platform", label: "Platform", icon: Globe },
  { key: "audience", label: "Audience", icon: Users },
];

const NAV_ITEMS = [
  { key: "pipeline", label: "Content Pipeline", icon: FileText },
  { key: "scheduler", label: "Scheduler", icon: Clock },
  { key: "memory", label: "Memory", icon: Brain },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "energy", label: "Energy", icon: Zap },
  { key: "settings", label: "Settings", icon: Settings },
];

const PLATFORM_ICONS: Record<string, string> = {
  wordpress: "WP",
  medium: "M",
  substack: "SS",
  beehiiv: "BV",
  devto: "DV",
  hashnode: "HN",
  ghost: "GH",
  blogger: "BG",
  mirror: "MR",
};

const CHART_COLORS = [
  "oklch(0.60 0.24 25)",
  "oklch(0.70 0.15 25)",
  "oklch(0.55 0.20 0)",
  "oklch(0.75 0.10 25)",
  "oklch(0.45 0.18 0)",
  "oklch(0.65 0.12 200)",
  "oklch(0.55 0.15 120)",
  "oklch(0.60 0.18 300)",
];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CONTENT: ContentItem[] = [
  {
    id: "cnt-1",
    workspaceId: "demo-workspace",
    title: "Why Most AI Content Sounds Like a Robot Wrote It",
    slug: "why-ai-content-sounds-robotic",
    angle: "The humanic gap nobody talks about",
    topic: "AI Writing",
    status: "published",
    sourceType: "idea",
    qualityScore: 87,
    humanicScore: 92,
    seoScore: 78,
    trustScore: 85,
    humanReviewRequired: false,
    version: 3,
    masterMarkdown: "# Why Most AI Content Sounds Like a Robot Wrote It\n\nEveryone's using AI to write. But here's what separates forgettable content from content that *sticks*...\n\n## The Humanic Gap\n\nMost AI content follows a predictable pattern. It's clean, grammatically perfect, and utterly soulless.\n\nThe difference isn't about avoiding AI — it's about using AI as a *tool*, not a *ghostwriter*.\n\n## What Makes Content Feel Human\n\n1. **Specificity over generality** — Real examples beat abstract advice\n2. **Voice consistency** — Your quirks are your moat\n3. **Strategic imperfection** — Perfect is the enemy of compelling\n\n## The Fix\n\nStart with your insight. Let AI amplify it. Then edit like your reputation depends on it — because it does.",
    summary: "Exploring the gap between AI-generated and human-written content, with practical strategies for creating content that resonates.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    contentTags: [{ id: "t1", tag: "AI Writing", category: "topic" }, { id: "t2", tag: "Content Strategy", category: "topic" }],
    variants: [
      { id: "v1", contentId: "cnt-1", platform: "wordpress", variantType: "full", title: "Why Most AI Content Sounds Like a Robot Wrote It", status: "published", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "v2", contentId: "cnt-1", platform: "medium", variantType: "full", status: "published", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    _count: { variants: 2, analyticsEvents: 15 },
  },
  {
    id: "cnt-2",
    workspaceId: "demo-workspace",
    title: "The Memory-Driven Content Strategy That Compounds",
    slug: "memory-driven-content-strategy",
    angle: "Why forgetting is more expensive than remembering",
    topic: "Content Strategy",
    status: "ready",
    sourceType: "idea",
    qualityScore: 82,
    humanicScore: 79,
    seoScore: 88,
    trustScore: 80,
    humanReviewRequired: false,
    version: 2,
    masterMarkdown: "# The Memory-Driven Content Strategy That Compounds\n\nEvery piece of content you publish generates data. Most creators throw it away.\n\n## The Compound Effect\n\nWhen your content system *remembers* what worked, every new piece starts from a higher baseline.",
    summary: "How building a memory system for your content strategy creates compounding returns over time.",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    contentTags: [{ id: "t3", tag: "Strategy", category: "topic" }],
    variants: [
      { id: "v3", contentId: "cnt-2", platform: "wordpress", variantType: "full", status: "ready", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    _count: { variants: 1, analyticsEvents: 3 },
  },
  {
    id: "cnt-3",
    workspaceId: "demo-workspace",
    title: "Energy Systems: When Not to Publish",
    slug: "energy-systems-when-not-to-publish",
    angle: "Rest is a strategy, not a weakness",
    topic: "Publishing Strategy",
    status: "draft",
    sourceType: "idea",
    qualityScore: 65,
    humanicScore: 70,
    seoScore: 55,
    trustScore: 60,
    humanReviewRequired: true,
    version: 1,
    masterMarkdown: "# Energy Systems: When Not to Publish\n\n[Draft in progress...]\n\nThe counterintuitive truth about content: publishing less often can get you *more* results.",
    summary: "Understanding energy systems and fatigue signals in content publishing.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    contentTags: [{ id: "t4", tag: "Energy", category: "topic" }],
    variants: [],
    _count: { variants: 0, analyticsEvents: 0 },
  },
  {
    id: "cnt-4",
    workspaceId: "demo-workspace",
    title: "Building Authority Without Showing Your Face",
    slug: "building-authority-faceless",
    angle: "Ideas > Identity in the attention economy",
    topic: "Personal Branding",
    status: "scheduled",
    sourceType: "trend",
    qualityScore: 75,
    humanicScore: 72,
    seoScore: 80,
    trustScore: 68,
    humanReviewRequired: false,
    version: 2,
    masterMarkdown: "# Building Authority Without Showing Your Face\n\nYou don't need to be a personal brand to build authority. You need to be right consistently.",
    summary: "Strategies for building authority and influence without personal exposure.",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    publishedAt: null,
    contentTags: [{ id: "t5", tag: "Faceless", category: "format" }, { id: "t6", tag: "Branding", category: "topic" }],
    variants: [
      { id: "v4", contentId: "cnt-4", platform: "wordpress", variantType: "full", status: "pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "v5", contentId: "cnt-4", platform: "medium", variantType: "summary", status: "pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    _count: { variants: 2, analyticsEvents: 0 },
  },
  {
    id: "cnt-5",
    workspaceId: "demo-workspace",
    title: "SEO in 2025: What Actually Moves the Needle",
    slug: "seo-2025-what-works",
    status: "idea",
    sourceType: "trend",
    qualityScore: 0,
    humanicScore: 0,
    seoScore: 0,
    trustScore: 0,
    humanReviewRequired: false,
    version: 1,
    topic: "SEO",
    angle: "Cutting through the noise of SEO advice",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    contentTags: [],
    variants: [],
    _count: { variants: 0, analyticsEvents: 0 },
  },
  {
    id: "cnt-6",
    workspaceId: "demo-workspace",
    title: "The Hidden Cost of Content Repurposing",
    slug: "hidden-cost-content-repurposing",
    status: "failed",
    sourceType: "manual",
    qualityScore: 30,
    humanicScore: 25,
    seoScore: 40,
    trustScore: 20,
    humanReviewRequired: true,
    version: 1,
    topic: "Content Operations",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    contentTags: [],
    variants: [],
    _count: { variants: 0, analyticsEvents: 0 },
  },
];

const MOCK_QUEUE = {
  pending: 3,
  locked: 1,
  running: 1,
  completed: 24,
  failed: 2,
  dead_letter: 0,
  total: 31,
};

const MOCK_MEMORIES = [
  { id: "mem-1", workspaceId: "demo-workspace", category: "hook", key: "question_opener", value: "Start with a provocative question that challenges assumptions", score: 89, source: "analytics", contextJson: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "mem-2", workspaceId: "demo-workspace", category: "hook", key: "contrarian_take", value: "Open with an unpopular opinion related to the topic", score: 76, source: "analytics", contextJson: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "mem-3", workspaceId: "demo-workspace", category: "topic", key: "ai_writing", value: "AI writing tools and humanic content creation", score: 92, source: "analytics", contextJson: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "mem-4", workspaceId: "demo-workspace", category: "topic", key: "content_strategy", value: "Content strategy and compound authority building", score: 85, source: "manual", contextJson: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "mem-5", workspaceId: "demo-workspace", category: "tone", key: "direct_professional", value: "Direct, no-BS professional tone with strategic vulnerability", score: 88, source: "ai", contextJson: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "mem-6", workspaceId: "demo-workspace", category: "tone", key: "storytelling", value: "Use storytelling frameworks for complex topics", score: 71, source: "experiment", contextJson: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "mem-7", workspaceId: "demo-workspace", category: "timing", key: "tuesday_morning", value: "Tuesday 9-11 AM gets highest engagement", score: 82, source: "analytics", contextJson: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "mem-8", workspaceId: "demo-workspace", category: "cta", key: "soft_ask", value: "Soft CTA: 'What's your take?' drives more engagement than hard sell", score: 79, source: "analytics", contextJson: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "mem-9", workspaceId: "demo-workspace", category: "format", key: "list_with_narrative", value: "List format with narrative thread connecting points", score: 84, source: "experiment", contextJson: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "mem-10", workspaceId: "demo-workspace", category: "platform", key: "wordpress_long_form", value: "WordPress performs best with 1500-2500 word deep dives", score: 90, source: "analytics", contextJson: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "mem-11", workspaceId: "demo-workspace", category: "audience", key: "technical_founders", value: "Technical founders who value depth over hype", score: 86, source: "manual", contextJson: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const MOCK_ENERGY: EnergyReport = {
  overallEnergy: 72,
  canPublish: true,
  entries: [
    { id: "e1", workspaceId: "demo-workspace", category: "topic_fatigue", topic: "AI Writing", fatigueScore: 45, publishCount: 3, lastResetAt: new Date(Date.now() - 86400000 * 5).toISOString(), status: "fresh" },
    { id: "e2", workspaceId: "demo-workspace", category: "tone_fatigue", topic: "direct_professional", fatigueScore: 62, publishCount: 5, lastResetAt: new Date(Date.now() - 86400000 * 3).toISOString(), status: "warning" },
    { id: "e3", workspaceId: "demo-workspace", category: "publish_saturation", fatigueScore: 38, publishCount: 7, lastResetAt: new Date(Date.now() - 86400000 * 7).toISOString(), status: "fresh" },
    { id: "e4", workspaceId: "demo-workspace", category: "hook_repetition", topic: "question_opener", fatigueScore: 78, publishCount: 6, lastResetAt: new Date(Date.now() - 86400000 * 2).toISOString(), status: "warning" },
    { id: "e5", workspaceId: "demo-workspace", category: "audience_exhaustion", fatigueScore: 22, publishCount: 2, lastResetAt: new Date(Date.now() - 86400000 * 10).toISOString(), status: "fresh" },
  ],
  warnings: ["Hook repetition score is elevated — consider varying your openers", "Tone fatigue approaching threshold for 'direct_professional'"],
};

const MOCK_ANALYTICS = {
  workspaceId: "demo-workspace",
  period: "7d",
  since: new Date(Date.now() - 86400000 * 7).toISOString(),
  content: {
    total: 6,
    byStatus: [
      { status: "idea", count: 1 },
      { status: "draft", count: 1 },
      { status: "ready", count: 1 },
      { status: "scheduled", count: 1 },
      { status: "published", count: 1 },
      { status: "failed", count: 1 },
    ],
    published: 1,
    topPerforming: [
      { id: "cnt-1", title: "Why Most AI Content Sounds Like a Robot Wrote It", qualityScore: 87, humanicScore: 92, seoScore: 78, status: "published" },
      { id: "cnt-2", title: "The Memory-Driven Content Strategy That Compounds", qualityScore: 82, humanicScore: 79, seoScore: 88, status: "ready" },
      { id: "cnt-4", title: "Building Authority Without Showing Your Face", qualityScore: 75, humanicScore: 72, seoScore: 80, status: "scheduled" },
    ],
  },
  publishing: {
    totalJobs: 8,
    successful: 6,
    successRate: 75,
    byPlatform: [
      { platform: "wordpress", count: 4 },
      { platform: "medium", count: 2 },
      { platform: "substack", count: 1 },
      { platform: "hashnode", count: 1 },
    ],
  },
  metrics: [
    { type: "views", total: 12450, count: 7, average: 1778.57 },
    { type: "ctr", total: 342, count: 7, average: 48.86 },
    { type: "opens", total: 4520, count: 7, average: 645.71 },
    { type: "shares", total: 289, count: 7, average: 41.29 },
    { type: "revenue", total: 847, count: 7, average: 121.0 },
  ],
  recentEvents: [
    { id: "ae-1", metricType: "views", metricValue: 2340, platform: "wordpress", capturedAt: new Date(Date.now() - 3600000).toISOString(), contentItem: { id: "cnt-1", title: "Why Most AI Content Sounds Like a Robot Wrote It" } },
    { id: "ae-2", metricType: "ctr", metricValue: 4.2, platform: "wordpress", capturedAt: new Date(Date.now() - 7200000).toISOString(), contentItem: { id: "cnt-1", title: "Why Most AI Content Sounds Like a Robot Wrote It" } },
    { id: "ae-3", metricType: "views", metricValue: 1890, platform: "medium", capturedAt: new Date(Date.now() - 86400000).toISOString(), contentItem: { id: "cnt-1", title: "Why Most AI Content Sounds Like a Robot Wrote It" } },
    { id: "ae-4", metricType: "shares", metricValue: 45, platform: "medium", capturedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(), contentItem: { id: "cnt-1", title: "Why Most AI Content Sounds Like a Robot Wrote It" } },
    { id: "ae-5", metricType: "revenue", metricValue: 127, platform: "wordpress", capturedAt: new Date(Date.now() - 86400000 * 2).toISOString(), contentItem: null },
  ],
};

// ─── Publish Trend Data ───────────────────────────────────────────────────────

const PUBLISH_TREND = [
  { day: "Mon", published: 2, views: 1200 },
  { day: "Tue", published: 3, views: 2450 },
  { day: "Wed", published: 1, views: 1800 },
  { day: "Thu", published: 2, views: 2100 },
  { day: "Fri", published: 4, views: 3200 },
  { day: "Sat", published: 1, views: 900 },
  { day: "Sun", published: 2, views: 1800 },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ContentStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idea;
  return (
    <Badge
      variant="outline"
      className={`${config.color} ${config.bg} ${config.border} text-[10px] font-medium px-1.5 py-0`}
    >
      {config.label}
    </Badge>
  );
}

function ScoreBar({ label, score, color = "bg-primary" }: { label: string; score: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-14 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className="text-muted-foreground w-8 text-right font-mono">{score}</span>
    </div>
  );
}

function FatigueIndicator({ score }: { score: number }) {
  const level = score < 40 ? "fresh" : score < 70 ? "warning" : "exhausted";
  const colors = {
    fresh: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
    warning: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
    exhausted: "text-red-400 bg-red-500/15 border-red-500/30",
  };
  const icons = { fresh: CheckCircle, warning: AlertTriangle, exhausted: XCircle };
  const Icon = icons[level];
  return (
    <Badge variant="outline" className={`${colors[level]} text-[10px] gap-1`}>
      <Icon className="size-3" />
      {level === "fresh" ? "Fresh" : level === "warning" ? "Warning" : "Exhausted"}
    </Badge>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  const code = PLATFORM_ICONS[platform] || platform.slice(0, 2).toUpperCase();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded text-[9px] font-bold bg-muted text-muted-foreground border border-border">
            {code}
          </span>
        </TooltipTrigger>
        <TooltipContent>{platform}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className = "",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={`hover:border-primary/30 transition-colors ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-[10px] text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="size-5 text-primary" />
          </div>
        </div>
        {trend && (
          <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
            <TrendingUp className="size-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sidebar Component ────────────────────────────────────────────────────────

function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen, automationMode, setAutomationMode } = useMediaStore();
  const { theme, setTheme } = useTheme();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={`fixed top-0 left-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-0"} lg:translate-x-0
          ${!sidebarOpen ? "max-lg:-translate-x-full" : ""}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-sidebar-border shrink-0">
          <div className="size-8 rounded-lg gradient-red flex items-center justify-center shrink-0">
            <Zap className="size-4 text-white" />
          </div>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-sm font-bold text-sidebar-foreground">
                AI Media <span className="text-primary">OS</span>
              </h1>
              <p className="text-[9px] text-muted-foreground font-mono">Autonomous Media Engine</p>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); if (typeof window !== "undefined" && window.innerWidth < 1024) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? "bg-sidebar-accent text-sidebar-primary glow-red-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isActive && sidebarOpen && (
                  <div className="ml-auto size-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Automation Mode */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-3 border-t border-sidebar-border"
          >
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Automation</p>
            <div className="flex gap-1">
              {(["manual", "semi_auto", "full_auto"] as AutomationMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAutomationMode(mode)}
                  className={`flex-1 py-1.5 rounded text-[10px] font-medium transition-all
                    ${automationMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {mode === "manual" ? "Manual" : mode === "semi_auto" ? "Semi" : "Auto"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`size-1.5 rounded-full ${automationMode === "full_auto" ? "bg-primary signal-pulse" : automationMode === "semi_auto" ? "bg-yellow-500" : "bg-muted-foreground"}`} />
              <span className="text-[9px] text-muted-foreground">
                {automationMode === "manual" ? "Manual Control" : automationMode === "semi_auto" ? "Semi-Autonomous" : "Full Autonomous"}
              </span>
            </div>
          </motion.div>
        )}

        {/* Theme Toggle */}
        <div className="px-4 py-3 border-t border-sidebar-border shrink-0">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <span className="text-xs text-muted-foreground">Theme</span>
            )}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="size-4 text-yellow-400" />
              ) : (
                <Moon className="size-4 text-slate-600" />
              )}
              {sidebarOpen && (
                <span className="text-xs text-muted-foreground">
                  {theme === "dark" ? "Light" : "Dark"}
                </span>
              )}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 z-50 hidden lg:flex size-7 items-center justify-center rounded-md border border-border bg-card hover:bg-accent transition-colors"
        style={{ left: sidebarOpen ? 244 : 68 }}
      >
        {sidebarOpen ? <ChevronLeft className="size-3" /> : <ChevronRight className="size-3" />}
      </button>
    </>
  );
}

// ─── Content Pipeline Tab ─────────────────────────────────────────────────────

function ContentPipelineTab() {
  const {
    contentItems,
    setContentItems,
    contentFilter,
    setContentFilter,
    selectedContent,
    setSelectedContent,
    setContentDetailOpen,
    createDialogOpen,
    setCreateDialogOpen,
    isGenerating,
    setIsGenerating,
    workspaceId,
  } = useMediaStore();

  const [newIdea, setNewIdea] = useState("");
  const [newSourceType, setNewSourceType] = useState("idea");
  const [newTopic, setNewTopic] = useState("");

  // Use mock data as initial
  const items = contentItems.length > 0 ? contentItems : MOCK_CONTENT;

  const filteredItems =
    contentFilter === "all"
      ? items
      : items.filter((item) => item.status === contentFilter);

  const stats = {
    total: items.length,
    published: items.filter((i) => i.status === "published").length,
    scheduled: items.filter((i) => i.status === "scheduled").length,
    draft: items.filter((i) => i.status === "draft" || i.status === "idea").length,
    avgScore: items.length > 0
      ? Math.round(items.reduce((s, i) => s + i.qualityScore, 0) / items.length)
      : 0,
  };

  const handleCreate = async () => {
    if (!newIdea.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          idea: newIdea,
          sourceType: newSourceType,
          topic: newTopic || undefined,
          autoDraft: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setContentItems([data.item, ...items]);
        toast.success("Content created and draft generated!");
      } else {
        // Still add locally with mock
        const newItem: ContentItem = {
          id: `cnt-${Date.now()}`,
          workspaceId,
          title: newIdea,
          slug: newIdea.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60),
          status: "idea",
          sourceType: newSourceType,
          topic: newTopic || null,
          qualityScore: 0,
          humanicScore: 0,
          seoScore: 0,
          trustScore: 0,
          humanReviewRequired: false,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contentTags: [],
          variants: [],
          _count: { variants: 0, analyticsEvents: 0 },
        };
        setContentItems([newItem, ...items]);
        toast.success("Content idea created!");
      }
    } catch {
      const newItem: ContentItem = {
        id: `cnt-${Date.now()}`,
        workspaceId,
        title: newIdea,
        slug: newIdea.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60),
        status: "idea",
        sourceType: newSourceType,
        topic: newTopic || null,
        qualityScore: 0,
        humanicScore: 0,
        seoScore: 0,
        trustScore: 0,
        humanReviewRequired: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contentTags: [],
        variants: [],
        _count: { variants: 0, analyticsEvents: 0 },
      };
      setContentItems([newItem, ...items]);
      toast.success("Content idea created (offline)!");
    } finally {
      setNewIdea("");
      setNewTopic("");
      setCreateDialogOpen(false);
      setIsGenerating(false);
    }
  };

  const handleAction = async (action: string, item: ContentItem) => {
    setIsGenerating(true);
    try {
      if (action === "score") {
        const res = await fetch(`/api/content/${item.id}/score`, { method: "POST" });
        if (res.ok) {
          toast.success("Content scored!");
        } else {
          toast.info("Score updated locally");
        }
      } else if (action === "generate") {
        const res = await fetch(`/api/content/${item.id}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "draft" }),
        });
        if (res.ok) toast.success("Draft generated!");
        else toast.info("Generation queued");
      } else if (action === "humanic") {
        const res = await fetch(`/api/content/${item.id}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "humanic" }),
        });
        if (res.ok) toast.success("Humanic rewrite done!");
        else toast.info("Humanic rewrite queued");
      } else if (action === "seo") {
        const res = await fetch(`/api/content/${item.id}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "seo" }),
        });
        if (res.ok) toast.success("SEO pack generated!");
        else toast.info("SEO generation queued");
      } else if (action === "repurpose") {
        const res = await fetch(`/api/content/${item.id}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "repurpose" }),
        });
        if (res.ok) toast.success("Content repurposed!");
        else toast.info("Repurpose queued");
      } else if (action === "publish") {
        const res = await fetch("/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId: item.id, workspaceId }),
        });
        if (res.ok) toast.success("Published!");
        else toast.info("Publish queued");
      }
    } catch {
      toast.info(`Action "${action}" processed locally`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard title="Total Content" value={stats.total} icon={FileText} />
        <StatCard title="Published" value={stats.published} icon={CheckCircle} />
        <StatCard title="Scheduled" value={stats.scheduled} icon={CalendarClock} />
        <StatCard title="Drafts & Ideas" value={stats.draft} icon={PenTool} />
        <StatCard
          title="Avg Score"
          value={stats.avgScore}
          icon={Star}
          description="Quality composite"
          trend="+12% vs last week"
          className="col-span-2 md:col-span-1"
        />
      </div>

      {/* Filters + Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setContentFilter(opt.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${contentFilter === opt.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-red text-white gap-2 shrink-0">
              <Plus className="size-4" />
              New Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Content</DialogTitle>
              <DialogDescription>
                Start with an idea. AI will generate a draft automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="idea">Idea / Title</Label>
                <Textarea
                  id="idea"
                  placeholder="What do you want to write about?"
                  value={newIdea}
                  onChange={(e) => setNewIdea(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Source Type</Label>
                  <Select value={newSourceType} onValueChange={setNewSourceType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="trend">Trend</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input
                    placeholder="e.g. AI Writing"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newIdea.trim() || isGenerating}
                className="gradient-red text-white gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Create & Generate
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <Card
                className="cursor-pointer hover:border-primary/30 transition-all group"
                onClick={() => {
                  setSelectedContent(item);
                  setContentDetailOpen(true);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <StatusBadge status={item.status as ContentStatus} />
                      </div>
                      {item.angle && (
                        <p className="text-xs text-muted-foreground italic truncate">
                          {item.angle}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="size-3" />
                          {item.qualityScore}
                        </span>
                        <span>{item.topic || "No topic"}</span>
                        <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.variants?.map((v) => (
                        <PlatformIcon key={v.id} platform={v.platform} />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No content found</p>
            <p className="text-xs">Create a new idea to get started</p>
          </div>
        )}
      </div>

      {/* Content Detail Panel */}
      <ContentDetailPanel onAction={handleAction} />
    </div>
  );
}

// ─── Content Detail Panel ─────────────────────────────────────────────────────

function ContentDetailPanel({ onAction }: { onAction: (action: string, item: ContentItem) => void }) {
  const { selectedContent, contentDetailOpen, setContentDetailOpen, isGenerating } = useMediaStore();

  if (!selectedContent) return null;

  const item = selectedContent;

  return (
    <Dialog open={contentDetailOpen} onOpenChange={setContentDetailOpen}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-lg">{item.title}</DialogTitle>
            <StatusBadge status={item.status as ContentStatus} />
          </div>
          {item.angle && (
            <DialogDescription className="italic">{item.angle}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 -mx-1 px-1">
          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <ScoreBar label="Quality" score={item.qualityScore} color="bg-primary" />
              <ScoreBar label="Humanic" score={item.humanicScore} color="bg-emerald-500" />
            </div>
            <div className="space-y-2">
              <ScoreBar label="SEO" score={item.seoScore} color="bg-blue-500" />
              <ScoreBar label="Trust" score={item.trustScore} color="bg-amber-500" />
            </div>
          </div>

          {/* Tags */}
          {item.contentTags && item.contentTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.contentTags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-[10px] gap-1">
                  <Tag className="size-2.5" />
                  {tag.tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Master Content */}
          {item.masterMarkdown && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Master Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-64">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown>{item.masterMarkdown}</ReactMarkdown>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Variants */}
          {item.variants && item.variants.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Variants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {item.variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={v.platform} />
                        <span className="text-xs font-medium">{v.platform}</span>
                        <Badge variant="outline" className="text-[9px]">
                          {v.variantType}
                        </Badge>
                      </div>
                      <StatusBadge status={v.status as ContentStatus} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {item.summary && (
            <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/30 border border-border">
              <span className="font-medium text-foreground">Summary:</span> {item.summary}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("generate", item)}
            disabled={isGenerating}
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" />
            Generate Draft
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("humanic", item)}
            disabled={isGenerating}
            className="gap-1.5"
          >
            <PenTool className="size-3.5" />
            Humanic Rewrite
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("seo", item)}
            disabled={isGenerating}
            className="gap-1.5"
          >
            <SearchCheck className="size-3.5" />
            SEO Pack
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("repurpose", item)}
            disabled={isGenerating}
            className="gap-1.5"
          >
            <Repeat className="size-3.5" />
            Repurpose
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("score", item)}
            disabled={isGenerating}
            className="gap-1.5"
          >
            <Star className="size-3.5" />
            Score
          </Button>
          <Button
            size="sm"
            onClick={() => onAction("publish", item)}
            disabled={isGenerating}
            className="gradient-red text-white gap-1.5 ml-auto"
          >
            <Send className="size-3.5" />
            Publish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Scheduler Tab ────────────────────────────────────────────────────────────

function SchedulerTab() {
  const { queueStatus, setQueueStatus, workspaceId } = useMediaStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const queue = queueStatus || MOCK_QUEUE;

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/scheduler?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setQueueStatus(data.status);
      }
    } catch {
      // Use mock data
    }
  }, [workspaceId, setQueueStatus]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      await fetch("/api/scheduler/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId }) });
      toast.success("Processing next job...");
      setTimeout(fetchQueue, 2000);
    } catch {
      toast.info("Process command sent");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    setIsProcessing(true);
    try {
      await fetch("/api/scheduler/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId, action: "retry_failed" }) });
      toast.success("Retrying failed jobs...");
      setTimeout(fetchQueue, 2000);
    } catch {
      toast.info("Retry command sent");
    } finally {
      setIsProcessing(false);
    }
  };

  const maxQueue = Math.max(queue.pending + queue.running + queue.locked, 1);
  const queueDepth = [
    { label: "Pending", value: queue.pending, color: "bg-yellow-500" },
    { label: "Locked", value: queue.locked, color: "bg-blue-500" },
    { label: "Running", value: queue.running, color: "bg-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Queue Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard title="Pending" value={queue.pending} icon={Clock} />
        <StatCard title="Running" value={queue.running} icon={Play} />
        <StatCard title="Completed" value={queue.completed} icon={CheckCircle} />
        <StatCard title="Failed" value={queue.failed} icon={XCircle} />
        <StatCard title="Dead Letter" value={queue.dead_letter} icon={Trash2} />
        <StatCard title="Total" value={queue.total} icon={Layers} />
      </div>

      {/* Queue Depth Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Queue Depth</CardTitle>
          <CardDescription>Active jobs in the pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex h-6 rounded-full overflow-hidden bg-muted">
              {queueDepth.map((seg) => (
                <div
                  key={seg.label}
                  className={`${seg.color} transition-all duration-500`}
                  style={{
                    width: `${maxQueue > 0 ? (seg.value / maxQueue) * 100 : 0}%`,
                  }}
                />
              ))}
            </div>
            <div className="flex gap-4">
              {queueDepth.map((seg) => (
                <div key={seg.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`size-2.5 rounded-full ${seg.color}`} />
                  {seg.label}: {seg.value}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleProcess} disabled={isProcessing} className="gradient-red text-white gap-2">
          <Play className="size-4" />
          Process Next Job
        </Button>
        <Button onClick={handleRetry} disabled={isProcessing} variant="outline" className="gap-2">
          <RotateCcw className="size-4" />
          Retry Failed
        </Button>
        <Button onClick={handleProcess} disabled={isProcessing} variant="outline" className="gap-2">
          <CalendarClock className="size-4" />
          Run Daily Cycle
        </Button>
        <Button onClick={fetchQueue} variant="outline" size="icon" className="ml-auto">
          <RefreshCw className={`size-4 ${isProcessing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Job List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {[
                { id: "j1", type: "draft_job", priority: 3, status: "completed", nextAttempt: new Date().toISOString() },
                { id: "j2", type: "publish_job", priority: 5, status: "running", nextAttempt: new Date().toISOString() },
                { id: "j3", type: "seo_job", priority: 7, status: "pending", nextAttempt: new Date(Date.now() + 3600000).toISOString() },
                { id: "j4", type: "rewrite_job", priority: 4, status: "pending", nextAttempt: new Date(Date.now() + 7200000).toISOString() },
                { id: "j5", type: "analytics_job", priority: 8, status: "failed", nextAttempt: new Date(Date.now()).toISOString() },
                { id: "j6", type: "memory_update_job", priority: 9, status: "pending", nextAttempt: new Date(Date.now() + 10800000).toISOString() },
              ].map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-2 rounded-full ${
                      job.status === "running" ? "bg-primary signal-pulse" :
                      job.status === "completed" ? "bg-emerald-500" :
                      job.status === "failed" ? "bg-red-500" :
                      "bg-yellow-500"
                    }`} />
                    <div>
                      <p className="text-xs font-medium font-mono">{job.type}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Priority: {job.priority} · Next: {new Date(job.nextAttempt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={job.status as ContentStatus} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Memory Tab ───────────────────────────────────────────────────────────────

function MemoryTab() {
  const { memories, setMemories, memoryFilter, setMemoryFilter, memorySearch, setMemorySearch, workspaceId } = useMediaStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMemory, setNewMemory] = useState({ category: "hook", key: "", value: "", score: 50 });

  const memItems = memories.length > 0 ? memories : MOCK_MEMORIES;

  const filtered = memItems
    .filter((m) => memoryFilter === "all" || m.category === memoryFilter)
    .filter(
      (m) =>
        !memorySearch ||
        m.value.toLowerCase().includes(memorySearch.toLowerCase()) ||
        m.key.toLowerCase().includes(memorySearch.toLowerCase())
    )
    .sort((a, b) => b.score - a.score);

  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch(`/api/memory?workspaceId=${workspaceId}&includePatterns=true`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories);
      }
    } catch {
      // Use mock data
    }
  }, [workspaceId, setMemories]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleAddMemory = async () => {
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, ...newMemory, source: "manual" }),
      });
      if (res.ok) {
        toast.success("Memory stored!");
        fetchMemories();
      }
    } catch {
      toast.info("Memory stored locally");
    }
    setAddDialogOpen(false);
    setNewMemory({ category: "hook", key: "", value: "", score: 50 });
  };

  const groupedByCategory = filtered.reduce<Record<string, typeof filtered>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5">
        {MEMORY_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              onClick={() => setMemoryFilter(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${memoryFilter === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className="size-3" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search + Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={memorySearch}
            onChange={(e) => setMemorySearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-red text-white gap-2">
              <Plus className="size-4" />
              Add Memory
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Memory</DialogTitle>
              <DialogDescription>
                Store a new insight, pattern, or preference in the memory system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newMemory.category} onValueChange={(v) => setNewMemory({ ...newMemory, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MEMORY_CATEGORIES.filter((c) => c.key !== "all").map((c) => (
                        <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Score (0-100)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={newMemory.score}
                    onChange={(e) => setNewMemory({ ...newMemory, score: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Key</Label>
                <Input
                  placeholder="Unique key (e.g., question_opener)"
                  value={newMemory.key}
                  onChange={(e) => setNewMemory({ ...newMemory, key: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Textarea
                  placeholder="The memory content..."
                  value={newMemory.value}
                  onChange={(e) => setNewMemory({ ...newMemory, value: e.target.value })}
                  className="min-h-[60px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddMemory} disabled={!newMemory.key || !newMemory.value} className="gradient-red text-white">
                Store Memory
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Memory Cards by Category */}
      <div className="space-y-4">
        {Object.entries(groupedByCategory).map(([category, items]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 capitalize">
                {MEMORY_CATEGORIES.find((c) => c.key === category)?.icon && (
                  React.createElement(MEMORY_CATEGORIES.find((c) => c.key === category)!.icon, { className: "size-4 text-primary" })
                )}
                {category}
                <Badge variant="secondary" className="text-[9px]">{items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map((mem) => (
                  <div
                    key={mem.id}
                    className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-muted/30 border border-border hover:border-primary/20 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-primary">{mem.key}</span>
                        <Badge variant="outline" className="text-[9px]">{mem.source}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{mem.value}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="size-3 text-primary" />
                        <span className="font-mono">{mem.score}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Brain className="size-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No memories found</p>
          <p className="text-xs">Add memories or adjust your filters</p>
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const { analyticsSummary, setAnalyticsSummary, workspaceId } = useMediaStore();

  const data = analyticsSummary || MOCK_ANALYTICS;

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics?workspaceId=${workspaceId}&period=7d`);
      if (res.ok) {
        const d = await res.json();
        setAnalyticsSummary(d);
      }
    } catch {
      // Use mock data
    }
  }, [workspaceId, setAnalyticsSummary]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const viewsMetric = data.metrics.find((m) => m.type === "views");
  const ctrMetric = data.metrics.find((m) => m.type === "ctr");
  const opensMetric = data.metrics.find((m) => m.type === "opens");
  const revenueMetric = data.metrics.find((m) => m.type === "revenue");
  const sharesMetric = data.metrics.find((m) => m.type === "shares");

  const pieData = data.publishing.byPlatform.map((p, i) => ({
    name: p.platform,
    value: p.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const barData = data.content.topPerforming.map((c) => ({
    name: c.title.length > 25 ? c.title.slice(0, 25) + "..." : c.title,
    quality: c.qualityScore,
    humanic: c.humanicScore,
    seo: c.seoScore,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          title="Total Views"
          value={viewsMetric ? viewsMetric.total.toLocaleString() : "0"}
          icon={Eye}
          trend="+23% vs last period"
        />
        <StatCard
          title="Avg CTR"
          value={ctrMetric ? `${ctrMetric.average.toFixed(1)}%` : "0%"}
          icon={MousePointerClick}
          trend="+5% vs last period"
        />
        <StatCard
          title="Open Rate"
          value={opensMetric ? `${opensMetric.average.toFixed(0)}` : "0"}
          icon={Mail}
          description="Avg opens per content"
        />
        <StatCard
          title="Subscribers"
          value="1,247"
          icon={Users}
          trend="+8% growth"
        />
        <StatCard
          title="Revenue"
          value={revenueMetric ? `$${revenueMetric.total.toLocaleString()}` : "$0"}
          icon={DollarSign}
          trend="+15% vs last period"
          className="col-span-2 md:col-span-1"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Publish Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Publish Trend</CardTitle>
            <CardDescription>Content published & views over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={PUBLISH_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line
                  type="monotone"
                  dataKey="published"
                  stroke="oklch(0.60 0.24 25)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Published"
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="oklch(0.70 0.15 25)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Platform Distribution</CardTitle>
            <CardDescription>Publishing volume by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Content Performance Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Content Performance</CardTitle>
          <CardDescription>Top content scores comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="quality" fill="oklch(0.60 0.24 25)" name="Quality" radius={[0, 2, 2, 0]} />
              <Bar dataKey="humanic" fill="oklch(0.55 0.20 0)" name="Humanic" radius={[0, 2, 2, 0]} />
              <Bar dataKey="seo" fill="oklch(0.65 0.12 200)" name="SEO" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performing + Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Performing</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {data.content.topPerforming.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-primary w-5">#{i + 1}</span>
                      <span className="text-xs font-medium truncate">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-primary">{item.qualityScore}</span>
                      <StatusBadge status={item.status as ContentStatus} />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {data.recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium">
                        {event.metricType.toUpperCase()}
                        {event.platform && <span className="text-muted-foreground"> · {event.platform}</span>}
                      </p>
                      {event.contentItem && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {event.contentItem.title}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-medium">{event.metricValue.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(event.capturedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Energy Tab ───────────────────────────────────────────────────────────────

function EnergyTab() {
  const { energyReport, setEnergyReport, workspaceId } = useEnergyStore();
  const [resetting, setResetting] = useState<string | null>(null);

  const report = energyReport || MOCK_ENERGY;

  const fetchEnergy = useCallback(async () => {
    try {
      const res = await fetch(`/api/energy?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setEnergyReport(data.report);
      }
    } catch {
      // Use mock
    }
  }, [workspaceId, setEnergyReport]);

  useEffect(() => {
    fetchEnergy();
  }, [fetchEnergy]);

  const handleReset = async (category: string, topic?: string | null) => {
    setResetting(category);
    try {
      await fetch("/api/energy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, action: "reset", category, topic }),
      });
      toast.success(`${category} fatigue reset`);
      setTimeout(fetchEnergy, 1000);
    } catch {
      toast.info("Reset command sent");
    } finally {
      setResetting(null);
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      topic_fatigue: "Topic Fatigue",
      tone_fatigue: "Tone Fatigue",
      publish_saturation: "Publish Saturation",
      hook_repetition: "Hook Repetition",
      audience_exhaustion: "Audience Exhaustion",
    };
    return labels[cat] || cat;
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, React.ElementType> = {
      topic_fatigue: BookOpen,
      tone_fatigue: MessageSquare,
      publish_saturation: Send,
      hook_repetition: Zap,
      audience_exhaustion: Users,
    };
    return icons[cat] || Activity;
  };

  const getFatigueColor = (score: number) => {
    if (score < 40) return "text-emerald-400";
    if (score < 70) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Overall Energy */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Overall Energy"
          value={`${report.overallEnergy}%`}
          icon={Gauge}
          description={report.canPublish ? "Publishing OK" : "Consider pausing"}
          className={report.canPublish ? "" : "border-yellow-500/30"}
        />
        <StatCard
          title="Publish Status"
          value={report.canPublish ? "Clear" : "Caution"}
          icon={report.canPublish ? CheckCircle : AlertTriangle}
        />
        <StatCard
          title="Active Warnings"
          value={report.warnings.length}
          icon={AlertTriangle}
        />
        <StatCard
          title="Fatigue Entries"
          value={report.entries.length}
          icon={Activity}
        />
      </div>

      {/* Should Pause Warning */}
      {!report.canPublish && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Consider Pausing Publishing</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your content energy is running low. Publishing now may hurt audience engagement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="size-4 text-yellow-400" />
              Active Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <AlertTriangle className="size-3 text-yellow-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{warning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fatigue Categories */}
      <div className="space-y-3">
        {report.entries.map((entry) => {
          const Icon = getCategoryIcon(entry.category);
          return (
            <Card key={entry.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                      entry.fatigueScore < 40
                        ? "bg-emerald-500/15"
                        : entry.fatigueScore < 70
                        ? "bg-yellow-500/15"
                        : "bg-red-500/15"
                    }`}>
                      <Icon className={`size-5 ${
                        entry.fatigueScore < 40
                          ? "text-emerald-400"
                          : entry.fatigueScore < 70
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium">{getCategoryLabel(entry.category)}</h4>
                        <FatigueIndicator score={entry.fatigueScore} />
                        {entry.topic && (
                          <Badge variant="outline" className="text-[9px]">{entry.topic}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              entry.fatigueScore < 40
                                ? "bg-emerald-500"
                                : entry.fatigueScore < 70
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${entry.fatigueScore}%` }}
                          />
                        </div>
                        <span className={`text-sm font-mono font-bold ${getFatigueColor(entry.fatigueScore)}`}>
                          {entry.fatigueScore}%
                        </span>
                      </div>
                      <div className="flex gap-4 text-[10px] text-muted-foreground">
                        <span>Publish count: {entry.publishCount}</span>
                        <span>Last reset: {new Date(entry.lastResetAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReset(entry.category, entry.topic)}
                          disabled={resetting === entry.category}
                          className="shrink-0 gap-1.5"
                        >
                          <RefreshCw className={`size-3 ${resetting === entry.category ? "animate-spin" : ""}`} />
                          Reset
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reset fatigue for this category</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Helper hook for energy tab
function useEnergyStore() {
  const { energyReport, setEnergyReport, workspaceId } = useMediaStore();
  return { energyReport, setEnergyReport, workspaceId };
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const { automationMode, setAutomationMode } = useMediaStore();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Configure your AI Media OS settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Automation Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Automation Mode</p>
              <p className="text-xs text-muted-foreground">Control how autonomous the system operates</p>
            </div>
            <Select value={automationMode} onValueChange={(v) => setAutomationMode(v as AutomationMode)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="semi_auto">Semi-Auto</SelectItem>
                <SelectItem value="full_auto">Full Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Theme */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle between light and dark themes</p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          <Separator />

          {/* API Keys placeholder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">API Credentials</p>
                <p className="text-xs text-muted-foreground">Manage your platform API keys</p>
              </div>
            </div>
            <div className="space-y-2">
              {["WordPress", "Medium", "OpenRouter"].map((platform) => (
                <div key={platform} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-muted-foreground" />
                    <span className="text-sm">{platform}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Not configured</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono">0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Engine</span>
              <span className="font-mono">AI Media Intelligence OS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode</span>
              <span className="font-mono capitalize">{automationMode.replace("_", "-")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

function useSidebarMargin(sidebarOpen: boolean) {
  const [margin, setMargin] = useState(0);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) {
        setMargin(sidebarOpen ? 240 : 64);
      } else {
        setMargin(0);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [sidebarOpen]);
  return margin;
}

export default function Home() {
  const { activeTab, sidebarOpen, setSidebarOpen } = useMediaStore();
  const sidebarMargin = useSidebarMargin(sidebarOpen);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        className="flex-1 transition-all duration-200"
        style={{ marginLeft: sidebarMargin }}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="size-5" />
            </Button>
            <div>
              <h2 className="text-sm font-semibold capitalize">
                {activeTab === "pipeline" ? "Content Pipeline" :
                 activeTab === "scheduler" ? "Scheduler" :
                 activeTab === "memory" ? "Memory System" :
                 activeTab === "analytics" ? "Analytics" :
                 activeTab === "energy" ? "Energy System" :
                 "Settings"}
              </h2>
              <p className="text-[10px] text-muted-foreground font-mono">
                AI Media Intelligence OS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground">
              <div className="size-1.5 rounded-full bg-emerald-400 signal-pulse" />
              System Active
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "pipeline" && <ContentPipelineTab />}
              {activeTab === "scheduler" && <SchedulerTab />}
              {activeTab === "memory" && <MemoryTab />}
              {activeTab === "analytics" && <AnalyticsTab />}
              {activeTab === "energy" && <EnergyTab />}
              {activeTab === "settings" && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
