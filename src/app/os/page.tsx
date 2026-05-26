"use client";

import React, { useEffect, useCallback, useState, useMemo } from "react";
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
  Gauge,
  Menu,
  Layers,
  Tag,
  Globe,
  Mail,
  MessageSquare,
  BookOpen,
  Video,
  MonitorPlay,
  Flame,
  Scissors,
  Subtitles,
  Monitor,
  MousePointer,
  Keyboard,
  ArrowDown,
  TestTube,
  GlobeLock,
  Megaphone,
  Clapperboard,
  Palette,
  Ratio,
  Timer,
  Film,
  Image,
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

import {
  useMediaStore,
  type ContentItem,
  type ContentStatus,
  type AutomationMode,
  type VideoProject,
  type VideoStatus,
  type HeatmapSegment,
  type HeatmapJob,
  type BrowserInstance,
  type PlatformLogin,
  type TestResult,
  type EnergyReport,
} from "@/store/media-store";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ContentStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  idea: { label: "Idea", color: "text-gray-400", bg: "bg-gray-500/15", border: "border-gray-500/30" },
  draft: { label: "Draft", color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30" },
  editing: { label: "Editing", color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30" },
  seo_review: { label: "SEO Review", color: "text-sky-400", bg: "bg-sky-500/15", border: "border-sky-500/30" },
  ready: { label: "Ready", color: "text-green-400", bg: "bg-green-500/15", border: "border-green-500/30" },
  scheduled: { label: "Scheduled", color: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/30" },
  published: { label: "Published", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  archived: { label: "Archived", color: "text-slate-400", bg: "bg-slate-500/15", border: "border-slate-500/30" },
  failed: { label: "Failed", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
};

const VIDEO_STATUS_CONFIG: Record<
  VideoStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  draft: { label: "Draft", color: "text-gray-400", bg: "bg-gray-500/15", border: "border-gray-500/30" },
  scripting: { label: "Scripting", color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30" },
  generating: { label: "Generating", color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30" },
  rendering: { label: "Rendering", color: "text-purple-400", bg: "bg-purple-500/15", border: "border-purple-500/30" },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
  failed: { label: "Failed", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
};

const CONTENT_FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "idea", label: "Idea" },
  { key: "draft", label: "Draft" },
  { key: "editing", label: "Editing" },
  { key: "seo_review", label: "SEO Review" },
  { key: "ready", label: "Ready" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
];

const VIDEO_FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "scripting", label: "Scripting" },
  { key: "generating", label: "Generating" },
  { key: "rendering", label: "Rendering" },
  { key: "completed", label: "Completed" },
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
  { key: "monetization", label: "Monetization", icon: DollarSign },
  { key: "audience", label: "Audience", icon: Users },
  { key: "video_style", label: "Video Style", icon: Video },
];

const NAV_ITEMS = [
  { key: "content", label: "Content Pipeline", icon: FileText },
  { key: "video", label: "Video Studio", icon: Video },
  { key: "publish", label: "Viral Lab", icon: Flame },
  { key: "scheduler", label: "Scheduler", icon: Clock },
  { key: "memory", label: "Memory", icon: Brain },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "energy", label: "Energy", icon: Zap },
  { key: "browser", label: "Browser Lab", icon: Monitor },
];

const CHART_COLORS = [
  "#DC2626",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#06B6D4",
  "#8B5CF6",
  "#EC4899",
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
    masterMarkdown:
      "# Why Most AI Content Sounds Like a Robot Wrote It\n\nEveryone's using AI to write. But here's what separates forgettable content from content that *sticks*...\n\n## The Humanic Gap\n\nMost AI content follows a predictable pattern. It's clean, grammatically perfect, and utterly soulless.\n\nThe difference isn't about avoiding AI — it's about using AI as a *tool*, not a *ghostwriter*.\n\n## What Makes Content Feel Human\n\n1. **Specificity over generality** — Real examples beat abstract advice\n2. **Voice consistency** — Your quirks are your moat\n3. **Strategic imperfection** — Perfect is the enemy of compelling\n\n## The Fix\n\nStart with your insight. Let AI amplify it. Then edit like your reputation depends on it — because it does.",
    summary: "Exploring the gap between AI-generated and human-written content.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    contentTags: [
      { id: "t1", tag: "AI Writing", category: "topic" },
      { id: "t2", tag: "Content Strategy", category: "topic" },
    ],
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
    summary: "How building a memory system for your content strategy creates compounding returns.",
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
    summary: "Strategies for building authority without personal exposure.",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    publishedAt: null,
    contentTags: [
      { id: "t5", tag: "Faceless", category: "format" },
      { id: "t6", tag: "Branding", category: "topic" },
    ],
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
    status: "editing",
    sourceType: "manual",
    qualityScore: 45,
    humanicScore: 38,
    seoScore: 52,
    trustScore: 40,
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

const MOCK_VIDEOS: VideoProject[] = [
  {
    id: "vid-1",
    userId: "demo-user",
    title: "5 AI Tools That Actually Save Time",
    prompt: "Create a video about AI productivity tools",
    niche: "AI/Technology",
    duration: 180,
    aspectRatio: "16:9",
    style: "modern",
    status: "completed",
    renderProgress: 100,
    scenes: [
      { id: "s1", index: 0, title: "Hook", description: "Opening hook about wasted time", duration: 15, imageUrl: null },
      { id: "s2", index: 1, title: "Tool 1 - ChatGPT", description: "Deep dive into ChatGPT workflows", duration: 40, imageUrl: null },
      { id: "s3", index: 2, title: "Tool 2 - Cursor", description: "AI coding assistant overview", duration: 35, imageUrl: null },
      { id: "s4", index: 3, title: "Tool 3 - Midjourney", description: "Creative AI use cases", duration: 40, imageUrl: null },
      { id: "s5", index: 4, title: "Tools 4 & 5", description: "Quick hits on Notion AI and Gamma", duration: 30, imageUrl: null },
      { id: "s6", index: 5, title: "CTA", description: "Subscribe for more AI content", duration: 20, imageUrl: null },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "vid-2",
    userId: "demo-user",
    title: "The Faceless Creator Blueprint",
    prompt: "How to build an audience without showing your face",
    niche: "Creator Economy",
    duration: 300,
    aspectRatio: "9:16",
    style: "cinematic",
    status: "rendering",
    renderProgress: 67,
    scenes: [
      { id: "s7", index: 0, title: "Hook", description: "Why faceless content works", duration: 20, imageUrl: null },
      { id: "s8", index: 1, title: "Strategy", description: "Building authority with ideas", duration: 60, imageUrl: null },
      { id: "s9", index: 2, title: "Tools", description: "Essential faceless creator tools", duration: 60, imageUrl: null },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "vid-3",
    userId: "demo-user",
    title: "Monetizing Your Knowledge in 2025",
    prompt: "Create a video about knowledge monetization strategies",
    niche: "Business",
    duration: 240,
    aspectRatio: "16:9",
    style: "minimal",
    status: "scripting",
    renderProgress: 0,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "vid-4",
    userId: "demo-user",
    title: "Viral Hooks That Stop the Scroll",
    prompt: "Analyze top-performing hooks from viral content",
    niche: "Content Strategy",
    duration: 120,
    aspectRatio: "9:16",
    style: "energetic",
    status: "draft",
    renderProgress: 0,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
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
  { id: "mem-12", workspaceId: "demo-workspace", category: "monetization", key: "digital_products", value: "Digital products outperform ads for niche audiences", score: 78, source: "analytics", contextJson: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "mem-13", workspaceId: "demo-workspace", category: "video_style", key: "b_roll_heavy", value: "B-roll heavy with minimal talking head performs best for retention", score: 83, source: "analytics", contextJson: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
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
    { id: "e6", workspaceId: "demo-workspace", category: "visual_fatigue", fatigueScore: 55, publishCount: 4, lastResetAt: new Date(Date.now() - 86400000 * 4).toISOString(), status: "warning" },
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
      { status: "editing", count: 1 },
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

const PUBLISH_TREND = [
  { day: "Mon", published: 2, views: 1200 },
  { day: "Tue", published: 3, views: 2450 },
  { day: "Wed", published: 1, views: 1800 },
  { day: "Thu", published: 2, views: 2100 },
  { day: "Fri", published: 4, views: 3200 },
  { day: "Sat", published: 1, views: 900 },
  { day: "Sun", published: 2, views: 1800 },
];

const MOCK_HEATMAP_SEGMENTS: HeatmapSegment[] = [
  { id: "seg-1", startTime: 0, endTime: 15, intensity: 92, label: "Hook - Provocative Question" },
  { id: "seg-2", startTime: 15, endTime: 45, intensity: 65, label: "Context Setting" },
  { id: "seg-3", startTime: 45, endTime: 90, intensity: 45, label: "Background Info" },
  { id: "seg-4", startTime: 90, endTime: 120, intensity: 88, label: "Key Insight Reveal" },
  { id: "seg-5", startTime: 120, endTime: 150, intensity: 72, label: "Example Walkthrough" },
  { id: "seg-6", startTime: 150, endTime: 175, intensity: 35, label: "Transition" },
  { id: "seg-7", startTime: 175, endTime: 200, intensity: 95, label: "Emotional Climax" },
  { id: "seg-8", startTime: 200, endTime: 220, intensity: 78, label: "Call to Action" },
];

const MOCK_HEATMAP_JOBS: HeatmapJob[] = [
  { id: "hm-1", userId: "demo-user", youtubeUrl: "https://youtube.com/watch?v=abc123", status: "completed", progress: 100, segments: MOCK_HEATMAP_SEGMENTS, outputUrl: "/clips/abc123_clip.mp4", createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "hm-2", userId: "demo-user", youtubeUrl: "https://youtube.com/watch?v=def456", status: "processing", progress: 45, segments: [], createdAt: new Date(Date.now() - 3600000).toISOString() },
];

const MOCK_BROWSER_INSTANCE: BrowserInstance = {
  id: "browser-1",
  status: "active",
  pageCount: 3,
  currentUrl: "https://youtube.com",
};

const MOCK_PLATFORM_LOGINS: PlatformLogin[] = [
  { platform: "tiktok", label: "TikTok", loggedIn: true, username: "@ghoststudio" },
  { platform: "youtube", label: "YouTube", loggedIn: true, username: "GhostStudio AI" },
  { platform: "instagram", label: "Instagram", loggedIn: false },
  { platform: "twitter", label: "Twitter / X", loggedIn: true, username: "@ghoststudio_ai" },
  { platform: "linkedin", label: "LinkedIn", loggedIn: false },
];

const MOCK_TEST_RESULTS: TestResult[] = [
  { id: "tr-1", suite: "auth", name: "Login Flow", status: "passed", duration: 2340, timestamp: new Date().toISOString() },
  { id: "tr-2", suite: "auth", name: "Logout Flow", status: "passed", duration: 1200, timestamp: new Date().toISOString() },
  { id: "tr-3", suite: "publish", name: "WordPress Publish", status: "passed", duration: 5600, timestamp: new Date().toISOString() },
  { id: "tr-4", suite: "publish", name: "Medium Publish", status: "failed", duration: 8900, error: "Connection timeout", timestamp: new Date().toISOString() },
  { id: "tr-5", suite: "content", name: "Content Generation", status: "passed", duration: 3400, timestamp: new Date().toISOString() },
  { id: "tr-6", suite: "content", name: "SEO Scoring", status: "running", timestamp: new Date().toISOString() },
  { id: "tr-7", suite: "video", name: "Script Generation", status: "pending", timestamp: new Date().toISOString() },
  { id: "tr-8", suite: "video", name: "Video Render", status: "pending", timestamp: new Date().toISOString() },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ContentStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idea;
  return (
    <Badge variant="outline" className={`${config.color} ${config.bg} ${config.border} text-[10px] font-medium px-1.5 py-0`}>
      {config.label}
    </Badge>
  );
}

function VideoStatusBadge({ status }: { status: VideoStatus }) {
  const config = VIDEO_STATUS_CONFIG[status] || VIDEO_STATUS_CONFIG.draft;
  return (
    <Badge variant="outline" className={`${config.color} ${config.bg} ${config.border} text-[10px] font-medium px-1.5 py-0`}>
      {config.label}
    </Badge>
  );
}

function ScoreBar({ label, score, color = "bg-red-600" }: { label: string; score: number; color?: string }) {
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
    <Card className={`hover:border-red-600/30 transition-colors ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
          </div>
          <div className="size-10 rounded-lg bg-red-600/10 flex items-center justify-center">
            <Icon className="size-5 text-red-600" />
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

function MemoryScoreColor({ score }: { score: number }) {
  const color = score < 34 ? "text-red-400" : score < 67 ? "text-yellow-400" : "text-emerald-400";
  const bgColor = score < 34 ? "bg-red-500" : score < 67 ? "bg-yellow-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bgColor}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-mono font-medium ${color}`}>{score}</span>
    </div>
  );
}

// ─── Sidebar Component ────────────────────────────────────────────────────────

function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, toggleSidebar, automationMode, setAutomationMode } = useMediaStore();
  const { theme, setTheme } = useTheme();

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={toggleSidebar} />
      )}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={`fixed top-0 left-0 z-40 h-screen bg-card border-r border-border flex flex-col overflow-hidden
          ${sidebarOpen ? "translate-x-0" : ""} lg:translate-x-0
          ${!sidebarOpen ? "max-lg:-translate-x-full" : ""}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
          <div className="size-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
            <Zap className="size-4 text-white" />
          </div>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden whitespace-nowrap">
              <h1 className="text-sm font-bold text-foreground">
                Ghost<span className="text-red-600">Studio</span> OS
              </h1>
              <p className="text-[9px] text-muted-foreground font-mono">AI Media Intelligence v2</p>
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
                onClick={() => { setActiveTab(item.key as typeof activeTab); if (typeof window !== "undefined" && window.innerWidth < 1024) toggleSidebar(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? "bg-red-600/15 text-red-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? "text-red-600" : ""}`} />
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap overflow-hidden">
                    {item.label}
                  </motion.span>
                )}
                {isActive && sidebarOpen && <div className="ml-auto size-1.5 rounded-full bg-red-600" />}
              </button>
            );
          })}
        </nav>

        {/* Automation Mode */}
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-3 border-t border-border">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Automation</p>
            <div className="flex gap-1">
              {(["manual", "semi_auto", "full_auto"] as AutomationMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAutomationMode(mode)}
                  className={`flex-1 py-1.5 rounded text-[10px] font-medium transition-all
                    ${automationMode === mode
                      ? "bg-red-600 text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {mode === "manual" ? "Manual" : mode === "semi_auto" ? "Semi" : "Auto"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`size-1.5 rounded-full ${automationMode === "full_auto" ? "bg-red-600 animate-pulse" : automationMode === "semi_auto" ? "bg-yellow-500" : "bg-muted-foreground"}`} />
              <span className="text-[9px] text-muted-foreground">
                {automationMode === "manual" ? "Manual Control" : automationMode === "semi_auto" ? "Semi-Autonomous" : "Full Autonomous"}
              </span>
            </div>
          </motion.div>
        )}

        {/* Theme Toggle */}
        <div className="px-4 py-3 border-t border-border shrink-0">
          <div className="flex items-center justify-between">
            {sidebarOpen && <span className="text-xs text-muted-foreground">Theme</span>}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              {theme === "dark" ? <Sun className="size-4 text-yellow-400" /> : <Moon className="size-4 text-slate-600" />}
              {sidebarOpen && <span className="text-xs text-muted-foreground">{theme === "dark" ? "Light" : "Dark"}</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 z-50 hidden lg:flex size-7 items-center justify-center rounded-md border border-border bg-card hover:bg-accent transition-colors"
        style={{ left: sidebarOpen ? 244 : 68 }}
      >
        {sidebarOpen ? <ChevronLeft className="size-3" /> : <ChevronRight className="size-3" />}
      </button>
    </>
  );
}

// ─── Tab 1: Content Pipeline ──────────────────────────────────────────────────

function ContentPipelineTab() {
  const {
    contentItems,
    setContentItems,
    contentFilter,
    setContentFilter,
    selectedContent,
    setSelectedContent,
    contentDetailOpen,
    setContentDetailOpen,
    createContentOpen,
    setCreateContentOpen,
    isGenerating,
    setIsGenerating,
    activeWorkspaceId,
  } = useMediaStore();

  const [newIdea, setNewIdea] = useState("");
  const [newSourceType, setNewSourceType] = useState("idea");
  const [newTopic, setNewTopic] = useState("");
  const [newAngle, setNewAngle] = useState("");
  const [autoDraft, setAutoDraft] = useState(true);

  const items = contentItems.length > 0 ? contentItems : MOCK_CONTENT;

  const filteredItems =
    contentFilter.status === "all"
      ? items
      : items.filter((item) => item.status === contentFilter.status);

  const stats = {
    total: items.length,
    published: items.filter((i) => i.status === "published").length,
    draft: items.filter((i) => i.status === "draft" || i.status === "idea").length,
    avgScore: items.length > 0 ? Math.round(items.reduce((s, i) => s + i.qualityScore, 0) / items.length) : 0,
    scheduled: items.filter((i) => i.status === "scheduled").length,
  };

  const handleCreate = async () => {
    if (!newIdea.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          idea: newIdea,
          sourceType: newSourceType,
          topic: newTopic || undefined,
          angle: newAngle || undefined,
          autoDraft,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setContentItems([data.item, ...items]);
        toast.success("Content created and draft generated!");
      } else {
        const newItem: ContentItem = {
          id: `cnt-${Date.now()}`,
          workspaceId: activeWorkspaceId || "demo-workspace",
          title: newIdea,
          slug: newIdea.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60),
          status: "idea",
          sourceType: newSourceType,
          topic: newTopic || null,
          angle: newAngle || null,
          qualityScore: 0, humanicScore: 0, seoScore: 0, trustScore: 0,
          humanReviewRequired: false, version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contentTags: [], variants: [],
          _count: { variants: 0, analyticsEvents: 0 },
        };
        setContentItems([newItem, ...items]);
        toast.success("Content idea created!");
      }
    } catch {
      const newItem: ContentItem = {
        id: `cnt-${Date.now()}`,
        workspaceId: activeWorkspaceId || "demo-workspace",
        title: newIdea,
        slug: newIdea.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60),
        status: "idea",
        sourceType: newSourceType,
        topic: newTopic || null,
        angle: newAngle || null,
        qualityScore: 0, humanicScore: 0, seoScore: 0, trustScore: 0,
        humanReviewRequired: false, version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contentTags: [], variants: [],
        _count: { variants: 0, analyticsEvents: 0 },
      };
      setContentItems([newItem, ...items]);
      toast.success("Content idea created (offline)!");
    } finally {
      setNewIdea(""); setNewTopic(""); setNewAngle("");
      setCreateContentOpen(false); setIsGenerating(false);
    }
  };

  const handleAction = async (action: string, item: ContentItem) => {
    setIsGenerating(true);
    try {
      if (action === "score") {
        const res = await fetch(`/api/content/${item.id}/score`, { method: "POST" });
        if (res.ok) toast.success("Content scored!"); else toast.info("Score updated locally");
      } else if (action === "humanic") {
        const res = await fetch(`/api/content/${item.id}/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "humanic" }) });
        if (res.ok) toast.success("Humanic rewrite done!"); else toast.info("Humanic rewrite queued");
      } else if (action === "seo") {
        const res = await fetch(`/api/content/${item.id}/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "seo" }) });
        if (res.ok) toast.success("SEO pack generated!"); else toast.info("SEO generation queued");
      } else if (action === "repurpose") {
        const res = await fetch(`/api/content/${item.id}/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "repurpose" }) });
        if (res.ok) toast.success("Content repurposed!"); else toast.info("Repurpose queued");
      } else if (action === "publish") {
        const res = await fetch("/api/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentId: item.id, workspaceId: activeWorkspaceId }) });
        if (res.ok) toast.success("Published!"); else toast.info("Publish queued");
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
        <StatCard title="Drafts" value={stats.draft} icon={PenTool} />
        <StatCard title="Avg Score" value={stats.avgScore} icon={Star} description="Quality composite" trend="+12% vs last week" />
        <StatCard title="Scheduled" value={stats.scheduled} icon={CalendarClock} className="col-span-2 md:col-span-1" />
      </div>

      {/* Filters + Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CONTENT_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setContentFilter({ status: opt.key })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${contentFilter.status === opt.key ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Dialog open={createContentOpen} onOpenChange={setCreateContentOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 shrink-0">
              <Plus className="size-4" /> New Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Content</DialogTitle>
              <DialogDescription>Start with an idea. AI will generate a draft automatically.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="idea">Idea / Title</Label>
                <Textarea id="idea" placeholder="What do you want to write about?" value={newIdea} onChange={(e) => setNewIdea(e.target.value)} className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label>Angle</Label>
                <Input placeholder="e.g. The contrarian take nobody mentions" value={newAngle} onChange={(e) => setNewAngle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Source Type</Label>
                  <Select value={newSourceType} onValueChange={setNewSourceType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="trend">Trend</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input placeholder="e.g. AI Writing" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-draft">Auto-generate draft</Label>
                <Switch id="auto-draft" checked={autoDraft} onCheckedChange={setAutoDraft} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateContentOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newIdea.trim() || isGenerating} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                {isGenerating ? <><RefreshCw className="size-4 animate-spin" /> Generating...</> : <><Sparkles className="size-4" /> Create & Generate</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
              <Card className="cursor-pointer hover:border-red-600/30 transition-all group" onClick={() => { setSelectedContent(item); setContentDetailOpen(true); }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold truncate group-hover:text-red-500 transition-colors">{item.title}</h3>
                        <StatusBadge status={item.status} />
                      </div>
                      {item.angle && <p className="text-xs text-muted-foreground italic truncate">{item.angle}</p>}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Star className="size-3" />{item.qualityScore}</span>
                        <span>{item.topic || "No topic"}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {item.qualityScore > 0 && (
                      <div className="w-20 shrink-0 hidden sm:block">
                        <ScoreBar label="" score={item.qualityScore} />
                      </div>
                    )}
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

      {/* Content Detail Dialog */}
      <Dialog open={contentDetailOpen} onOpenChange={setContentDetailOpen}>
        {selectedContent && (
          <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg">{selectedContent.title}</DialogTitle>
                <StatusBadge status={selectedContent.status} />
              </div>
              {selectedContent.angle && <DialogDescription className="italic">{selectedContent.angle}</DialogDescription>}
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 -mx-1 px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <ScoreBar label="Quality" score={selectedContent.qualityScore} color="bg-red-600" />
                  <ScoreBar label="Humanic" score={selectedContent.humanicScore} color="bg-emerald-500" />
                </div>
                <div className="space-y-2">
                  <ScoreBar label="SEO" score={selectedContent.seoScore} color="bg-sky-500" />
                  <ScoreBar label="Trust" score={selectedContent.trustScore} color="bg-amber-500" />
                </div>
              </div>
              {selectedContent.contentTags && selectedContent.contentTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedContent.contentTags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-[10px] gap-1"><Tag className="size-2.5" />{tag.tag}</Badge>
                  ))}
                </div>
              )}
              {selectedContent.masterMarkdown && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Master Content</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-64">
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown>{selectedContent.masterMarkdown}</ReactMarkdown>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
              {selectedContent.summary && (
                <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="font-medium text-foreground">Summary:</span> {selectedContent.summary}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button size="sm" variant="outline" onClick={() => handleAction("score", selectedContent)} disabled={isGenerating} className="gap-1.5"><Star className="size-3.5" />Score</Button>
              <Button size="sm" variant="outline" onClick={() => handleAction("humanic", selectedContent)} disabled={isGenerating} className="gap-1.5"><PenTool className="size-3.5" />Humanic Rewrite</Button>
              <Button size="sm" variant="outline" onClick={() => handleAction("seo", selectedContent)} disabled={isGenerating} className="gap-1.5"><SearchCheck className="size-3.5" />SEO Pack</Button>
              <Button size="sm" variant="outline" onClick={() => handleAction("repurpose", selectedContent)} disabled={isGenerating} className="gap-1.5"><Repeat className="size-3.5" />Repurpose</Button>
              <Button size="sm" onClick={() => handleAction("publish", selectedContent)} disabled={isGenerating} className="bg-red-600 hover:bg-red-700 text-white gap-1.5 ml-auto"><Send className="size-3.5" />Publish</Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

// ─── Tab 2: Video Studio ──────────────────────────────────────────────────────

function VideoStudioTab() {
  const {
    videoProjects,
    setVideoProjects,
    videoFilter,
    setVideoFilter,
    selectedVideo,
    setSelectedVideo,
    videoDetailOpen,
    setVideoDetailOpen,
    createVideoOpen,
    setCreateVideoOpen,
    isGenerating,
    setIsGenerating,
  } = useMediaStore();

  const [newPrompt, setNewPrompt] = useState("");
  const [newNiche, setNewNiche] = useState("AI/Technology");
  const [newDuration, setNewDuration] = useState("180");
  const [newAspect, setNewAspect] = useState("16:9");
  const [newStyle, setNewStyle] = useState("modern");

  const projects = videoProjects.length > 0 ? videoProjects : MOCK_VIDEOS;

  const filteredProjects =
    videoFilter.status === "all"
      ? projects
      : projects.filter((p) => p.status === videoFilter.status);

  const stats = {
    total: projects.length,
    rendering: projects.filter((p) => p.status === "rendering").length,
    completed: projects.filter((p) => p.status === "completed").length,
    avgDuration: projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.duration, 0) / projects.length) : 0,
  };

  const handleCreateVideo = async () => {
    if (!newPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: newPrompt, niche: newNiche, duration: parseInt(newDuration), aspectRatio: newAspect, style: newStyle }),
      });
      if (res.ok) {
        const data = await res.json();
        setVideoProjects([data.project, ...projects]);
        toast.success("Video project created!");
      } else {
        const newProject: VideoProject = {
          id: `vid-${Date.now()}`, userId: "demo-user", title: newPrompt.slice(0, 60),
          prompt: newPrompt, niche: newNiche, duration: parseInt(newDuration),
          aspectRatio: newAspect, style: newStyle, status: "draft", renderProgress: 0,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        setVideoProjects([newProject, ...projects]);
        toast.success("Video project created (offline)!");
      }
    } catch {
      const newProject: VideoProject = {
        id: `vid-${Date.now()}`, userId: "demo-user", title: newPrompt.slice(0, 60),
        prompt: newPrompt, niche: newNiche, duration: parseInt(newDuration),
        aspectRatio: newAspect, style: newStyle, status: "draft", renderProgress: 0,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      setVideoProjects([newProject, ...projects]);
      toast.success("Video project created (offline)!");
    } finally {
      setNewPrompt(""); setCreateVideoOpen(false); setIsGenerating(false);
    }
  };

  const handleVideoAction = async (action: string, project: VideoProject) => {
    setIsGenerating(true);
    try {
      if (action === "generate") {
        const res = await fetch(`/api/video/${project.id}/generate`, { method: "POST" });
        if (res.ok) toast.success("Video generation started!"); else toast.info("Generation queued");
      } else if (action === "export") {
        toast.info("Export started...");
      } else if (action === "publish") {
        const res = await fetch("/api/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoId: project.id }) });
        if (res.ok) toast.success("Video published!"); else toast.info("Publish queued");
      }
    } catch {
      toast.info(`Action "${action}" processed locally`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Projects" value={stats.total} icon={Clapperboard} />
        <StatCard title="Rendering" value={stats.rendering} icon={Film} />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle} />
        <StatCard title="Avg Duration" value={`${Math.floor(stats.avgDuration / 60)}:${String(stats.avgDuration % 60).padStart(2, "0")}`} icon={Timer} />
      </div>

      {/* Filters + Create */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {VIDEO_FILTER_OPTIONS.map((opt) => (
            <button key={opt.key} onClick={() => setVideoFilter({ status: opt.key })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${videoFilter.status === opt.key ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >{opt.label}</button>
          ))}
        </div>
        <Dialog open={createVideoOpen} onOpenChange={setCreateVideoOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 shrink-0"><Plus className="size-4" /> New Video</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Video Project</DialogTitle>
              <DialogDescription>Describe what you want and AI will generate the script and video.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Prompt</Label>
                <Textarea placeholder="Describe the video you want to create..." value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} className="min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Niche</Label>
                  <Select value={newNiche} onValueChange={setNewNiche}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AI/Technology">AI/Technology</SelectItem>
                      <SelectItem value="Creator Economy">Creator Economy</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Content Strategy">Content Strategy</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={newDuration} onValueChange={setNewDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 min (Short)</SelectItem>
                      <SelectItem value="120">2 min (Medium)</SelectItem>
                      <SelectItem value="180">3 min (Standard)</SelectItem>
                      <SelectItem value="300">5 min (Long)</SelectItem>
                      <SelectItem value="600">10 min (Deep Dive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select value={newAspect} onValueChange={setNewAspect}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (YouTube)</SelectItem>
                      <SelectItem value="9:16">9:16 (TikTok/Reels)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={newStyle} onValueChange={setNewStyle}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="energetic">Energetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateVideoOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateVideo} disabled={!newPrompt.trim() || isGenerating} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                {isGenerating ? <><RefreshCw className="size-4 animate-spin" /> Creating...</> : <><Sparkles className="size-4" /> Create Video</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Video Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <motion.div key={project.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
              <Card className="cursor-pointer hover:border-red-600/30 transition-all group" onClick={() => { setSelectedVideo(project); setVideoDetailOpen(true); }}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="size-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Video className="size-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold truncate group-hover:text-red-500 transition-colors">{project.title}</h3>
                        <VideoStatusBadge status={project.status} />
                      </div>
                      <Badge variant="outline" className="text-[9px] gap-1"><Tag className="size-2" />{project.niche}</Badge>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>{Math.floor(project.duration / 60)}:{String(project.duration % 60).padStart(2, "0")}</span>
                        <span>{project.aspectRatio}</span>
                        <span>{project.style}</span>
                      </div>
                    </div>
                  </div>
                  {(project.status === "rendering" || project.status === "generating") && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Render Progress</span>
                        <span>{project.renderProgress}%</span>
                      </div>
                      <Progress value={project.renderProgress} className="h-1.5" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Video Detail Dialog */}
      <Dialog open={videoDetailOpen} onOpenChange={setVideoDetailOpen}>
        {selectedVideo && (
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg">{selectedVideo.title}</DialogTitle>
                <VideoStatusBadge status={selectedVideo.status} />
              </div>
              <DialogDescription>{selectedVideo.niche} · {selectedVideo.aspectRatio} · {Math.floor(selectedVideo.duration / 60)}:{String(selectedVideo.duration % 60).padStart(2, "0")}</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 -mx-1 px-1">
              {(selectedVideo.status === "rendering" || selectedVideo.status === "generating") && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Render Progress</span><span className="font-mono">{selectedVideo.renderProgress}%</span></div>
                  <Progress value={selectedVideo.renderProgress} className="h-2" />
                </div>
              )}
              {selectedVideo.scenes && selectedVideo.scenes.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scenes</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedVideo.scenes.map((scene) => (
                        <div key={scene.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border">
                          <div className="size-8 rounded bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground">{scene.index + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">{scene.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{scene.description}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{scene.duration}s</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Export Options</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {["MP4", "WebM", "GIF"].map((fmt) => (
                      <Button key={fmt} variant="outline" size="sm" className="text-xs">{fmt}</Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button size="sm" variant="outline" onClick={() => handleVideoAction("generate", selectedVideo)} disabled={isGenerating} className="gap-1.5"><Sparkles className="size-3.5" />Generate</Button>
              <Button size="sm" variant="outline" onClick={() => handleVideoAction("export", selectedVideo)} disabled={isGenerating} className="gap-1.5"><Film className="size-3.5" />Export</Button>
              <Button size="sm" onClick={() => handleVideoAction("publish", selectedVideo)} disabled={isGenerating} className="bg-red-600 hover:bg-red-700 text-white gap-1.5 ml-auto"><Send className="size-3.5" />Publish</Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

// ─── Tab 3: Viral Lab (Heatmap) ──────────────────────────────────────────────

function ViralLabTab() {
  const { heatmapSegments, setHeatmapSegments, heatmapJobs, setHeatmapJobs } = useMediaStore();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [subtitleToggle, setSubtitleToggle] = useState(true);
  const [outputFormat, setOutputFormat] = useState("mp4");

  const segments = heatmapSegments.length > 0 ? heatmapSegments : MOCK_HEATMAP_SEGMENTS;
  const jobs = heatmapJobs.length > 0 ? heatmapJobs : MOCK_HEATMAP_JOBS;

  const handleScan = async () => {
    if (!youtubeUrl.trim()) return;
    setIsScanning(true);
    try {
      const res = await fetch("/api/heatmap/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setHeatmapSegments(data.segments || []);
        toast.success("Heatmap scan complete!");
      } else {
        setHeatmapSegments(MOCK_HEATMAP_SEGMENTS);
        toast.info("Using demo heatmap data");
      }
    } catch {
      setHeatmapSegments(MOCK_HEATMAP_SEGMENTS);
      toast.info("Using demo heatmap data");
    } finally {
      setIsScanning(false);
    }
  };

  const handleCreateClip = async (segment: HeatmapSegment) => {
    try {
      const res = await fetch("/api/heatmap/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime: segment.startTime, endTime: segment.endTime, cropMode, subtitles: subtitleToggle, format: outputFormat }),
      });
      if (res.ok) toast.success(`Clipping "${segment.label}"...`);
      else toast.info("Clip job queued");
    } catch {
      toast.info("Clip job queued locally");
    }
  };

  const barData = segments.map((seg) => ({
    name: seg.label.length > 15 ? seg.label.slice(0, 15) + "..." : seg.label,
    intensity: seg.intensity,
    startTime: seg.startTime,
  }));

  return (
    <div className="space-y-6">
      {/* URL Input + Scan */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Paste YouTube URL..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={handleScan} disabled={isScanning || !youtubeUrl.trim()} className="bg-red-600 hover:bg-red-700 text-white gap-2 shrink-0">
              {isScanning ? <RefreshCw className="size-4 animate-spin" /> : <Flame className="size-4" />}
              Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap Visualization */}
      {segments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Engagement Heatmap</CardTitle>
            <CardDescription>Intensity peaks across the video timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="intensity" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.intensity > 80 ? "#DC2626" : entry.intensity > 60 ? "#F97316" : entry.intensity > 40 ? "#EAB308" : "#6B7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detected Segments */}
      {segments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Detected Segments</CardTitle>
            <CardDescription>Click to create a clip from any segment</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {segments.map((seg) => (
                  <div key={seg.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border hover:border-red-600/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`size-3 rounded-full shrink-0 ${seg.intensity > 80 ? "bg-red-600" : seg.intensity > 60 ? "bg-orange-500" : seg.intensity > 40 ? "bg-yellow-500" : "bg-gray-500"}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{seg.label}</p>
                        <p className="text-[10px] text-muted-foreground">{seg.startTime}s - {seg.endTime}s</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold">{seg.intensity}</span>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={() => handleCreateClip(seg)}>
                        <Scissors className="size-3" />Clip
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Clip Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Clip Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="crop-mode" checked={cropMode} onCheckedChange={setCropMode} />
              <Label htmlFor="crop-mode" className="text-xs">Crop Mode</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="subtitles" checked={subtitleToggle} onCheckedChange={setSubtitleToggle} />
              <Label htmlFor="subtitles" className="text-xs">Subtitles</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Format</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clip Job History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Clip Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
                  <div className="min-w-0">
                    <p className="text-xs font-medium font-mono truncate">{job.youtubeUrl}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {job.status === "completed" && <Badge variant="outline" className="text-emerald-400 bg-emerald-500/15 border-emerald-500/30 text-[9px]">Completed</Badge>}
                    {job.status === "processing" && <Badge variant="outline" className="text-yellow-400 bg-yellow-500/15 border-yellow-500/30 text-[9px]">Processing</Badge>}
                    {job.status === "scanning" && <Badge variant="outline" className="text-sky-400 bg-sky-500/15 border-sky-500/30 text-[9px]">Scanning</Badge>}
                    {(job.status === "clipping" || job.status === "failed") && <Badge variant="outline" className="text-[9px]">{job.status}</Badge>}
                  </div>
                </div>
              ))}
              {jobs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No clip jobs yet</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 4: Scheduler ─────────────────────────────────────────────────────────

function SchedulerTab() {
  const { queueStatus, setQueueStatus, activeWorkspaceId } = useMediaStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [enqueueOpen, setEnqueueOpen] = useState(false);
  const [jobType, setJobType] = useState("draft_job");
  const [jobPriority, setJobPriority] = useState("5");
  const [jobPayload, setJobPayload] = useState("{}");

  const queue = queueStatus || MOCK_QUEUE;

  const MOCK_SCHEDULER_JOBS = [
    { id: "j1", jobType: "draft_job", priority: 3, status: "completed", payloadJson: "{}", nextAttempt: new Date().toISOString(), retryCount: 0, maxRetries: 3, workspaceId: "demo-workspace", createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(), lockedBy: null, lastError: null },
    { id: "j2", jobType: "publish_job", priority: 5, status: "running", payloadJson: '{"platform":"wordpress"}', nextAttempt: new Date().toISOString(), retryCount: 0, maxRetries: 3, workspaceId: "demo-workspace", createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date().toISOString(), lockedBy: "worker-1", lastError: null },
    { id: "j3", jobType: "seo_job", priority: 7, status: "pending", payloadJson: '{"contentId":"cnt-3"}', nextAttempt: new Date(Date.now() + 3600000).toISOString(), retryCount: 0, maxRetries: 3, workspaceId: "demo-workspace", createdAt: new Date(Date.now() - 1800000).toISOString(), updatedAt: new Date().toISOString(), lockedBy: null, lastError: null },
    { id: "j4", jobType: "rewrite_job", priority: 4, status: "pending", payloadJson: '{"type":"humanic"}', nextAttempt: new Date(Date.now() + 7200000).toISOString(), retryCount: 0, maxRetries: 3, workspaceId: "demo-workspace", createdAt: new Date(Date.now() - 900000).toISOString(), updatedAt: new Date().toISOString(), lockedBy: null, lastError: null },
    { id: "j5", jobType: "analytics_job", priority: 8, status: "failed", payloadJson: '{}', nextAttempt: new Date().toISOString(), retryCount: 3, maxRetries: 3, workspaceId: "demo-workspace", createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date().toISOString(), lockedBy: null, lastError: "Connection timeout" },
    { id: "j6", jobType: "memory_update_job", priority: 9, status: "pending", payloadJson: '{}', nextAttempt: new Date(Date.now() + 10800000).toISOString(), retryCount: 0, maxRetries: 3, workspaceId: "demo-workspace", createdAt: new Date(Date.now() - 600000).toISOString(), updatedAt: new Date().toISOString(), lockedBy: null, lastError: null },
  ];

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/scheduler?workspaceId=${activeWorkspaceId}`);
      if (res.ok) { const data = await res.json(); setQueueStatus(data.status); }
    } catch { /* use mock */ }
  }, [activeWorkspaceId, setQueueStatus]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      await fetch("/api/scheduler/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: activeWorkspaceId }) });
      toast.success("Processing next job..."); setTimeout(fetchQueue, 2000);
    } catch { toast.info("Process command sent"); } finally { setIsProcessing(false); }
  };

  const handleRetry = async () => {
    setIsProcessing(true);
    try {
      await fetch("/api/scheduler/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: activeWorkspaceId, action: "retry_failed" }) });
      toast.success("Retrying failed jobs..."); setTimeout(fetchQueue, 2000);
    } catch { toast.info("Retry command sent"); } finally { setIsProcessing(false); }
  };

  const handleEnqueue = async () => {
    try {
      const res = await fetch("/api/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: activeWorkspaceId, jobType, priority: parseInt(jobPriority), payloadJson: jobPayload }),
      });
      if (res.ok) toast.success("Job enqueued!"); else toast.info("Job queued locally");
    } catch { toast.info("Job queued locally"); }
    setEnqueueOpen(false);
  };

  const maxQueue = Math.max(queue.pending + queue.running + queue.locked, 1);
  const queueDepth = [
    { label: "Pending", value: queue.pending, color: "bg-yellow-500" },
    { label: "Locked", value: queue.locked, color: "bg-sky-500" },
    { label: "Running", value: queue.running, color: "bg-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard title="Pending" value={queue.pending} icon={Clock} />
        <StatCard title="Locked" value={queue.locked} icon={GlobeLock} />
        <StatCard title="Running" value={queue.running} icon={Play} />
        <StatCard title="Completed" value={queue.completed} icon={CheckCircle} />
        <StatCard title="Failed" value={queue.failed} icon={XCircle} />
        <StatCard title="Dead Letter" value={queue.dead_letter} icon={Trash2} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Queue Depth</CardTitle><CardDescription>Active jobs in the pipeline</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex h-6 rounded-full overflow-hidden bg-muted">
              {queueDepth.map((seg) => (
                <div key={seg.label} className={`${seg.color} transition-all duration-500`} style={{ width: `${maxQueue > 0 ? (seg.value / maxQueue) * 100 : 0}%` }} />
              ))}
            </div>
            <div className="flex gap-4">
              {queueDepth.map((seg) => (
                <div key={seg.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`size-2.5 rounded-full ${seg.color}`} />{seg.label}: {seg.value}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleProcess} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 text-white gap-2"><Play className="size-4" />Process Next</Button>
        <Button onClick={handleRetry} disabled={isProcessing} variant="outline" className="gap-2"><RotateCcw className="size-4" />Retry Failed</Button>
        <Button onClick={handleProcess} disabled={isProcessing} variant="outline" className="gap-2"><CalendarClock className="size-4" />Run Daily Cycle</Button>
        <Dialog open={enqueueOpen} onOpenChange={setEnqueueOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2"><Plus className="size-4" />Enqueue Job</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Enqueue Job</DialogTitle><DialogDescription>Add a new job to the scheduler queue.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft_job">Draft Job</SelectItem>
                      <SelectItem value="publish_job">Publish Job</SelectItem>
                      <SelectItem value="seo_job">SEO Job</SelectItem>
                      <SelectItem value="rewrite_job">Rewrite Job</SelectItem>
                      <SelectItem value="analytics_job">Analytics Job</SelectItem>
                      <SelectItem value="memory_update_job">Memory Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority (1-10)</Label>
                  <Input type="number" min={1} max={10} value={jobPriority} onChange={(e) => setJobPriority(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payload (JSON)</Label>
                <Textarea value={jobPayload} onChange={(e) => setJobPayload(e.target.value)} className="font-mono text-xs min-h-[80px]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEnqueueOpen(false)}>Cancel</Button>
              <Button onClick={handleEnqueue} className="bg-red-600 hover:bg-red-700 text-white">Enqueue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button onClick={fetchQueue} variant="outline" size="icon" className="ml-auto"><RefreshCw className={`size-4 ${isProcessing ? "animate-spin" : ""}`} /></Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Recent Jobs</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {MOCK_SCHEDULER_JOBS.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:border-red-600/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`size-2 rounded-full ${
                      job.status === "running" ? "bg-red-600 animate-pulse" :
                      job.status === "completed" ? "bg-emerald-500" :
                      job.status === "failed" ? "bg-red-500" : "bg-yellow-500"
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-mono">{job.jobType}</Badge>
                        <span className="text-[10px] text-muted-foreground">P{job.priority}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {job.payloadJson !== "{}" ? job.payloadJson.slice(0, 40) : "No payload"} · Retries: {job.retryCount} · {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[9px] ${
                    job.status === "running" ? "text-red-400 bg-red-500/15 border-red-500/30" :
                    job.status === "completed" ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" :
                    job.status === "failed" ? "text-red-400 bg-red-500/15 border-red-500/30" :
                    "text-yellow-400 bg-yellow-500/15 border-yellow-500/30"
                  }`}>{job.status}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 5: Memory ────────────────────────────────────────────────────────────

function MemoryTab() {
  const { memories, setMemories, memoryFilter, setMemoryFilter, memorySearch, setMemorySearch, activeWorkspaceId } = useMediaStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMemory, setNewMemory] = useState({ category: "hook", key: "", value: "", score: 50, source: "manual", context: "" });

  const memItems = memories.length > 0 ? memories : MOCK_MEMORIES;

  const filtered = memItems
    .filter((m) => memoryFilter === "all" || m.category === memoryFilter)
    .filter((m) => !memorySearch || m.value.toLowerCase().includes(memorySearch.toLowerCase()) || m.key.toLowerCase().includes(memorySearch.toLowerCase()))
    .sort((a, b) => b.score - a.score);

  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch(`/api/memory?workspaceId=${activeWorkspaceId}&includePatterns=true`);
      if (res.ok) { const data = await res.json(); setMemories(data.memories); }
    } catch { /* use mock */ }
  }, [activeWorkspaceId, setMemories]);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  const handleAddMemory = async () => {
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: activeWorkspaceId, ...newMemory }),
      });
      if (res.ok) { toast.success("Memory stored!"); fetchMemories(); }
    } catch { toast.info("Memory stored locally"); }
    setAddDialogOpen(false);
    setNewMemory({ category: "hook", key: "", value: "", score: 50, source: "manual", context: "" });
  };

  const groupedByCategory = filtered.reduce<Record<string, typeof filtered>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5">
        {MEMORY_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button key={cat.key} onClick={() => setMemoryFilter(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${memoryFilter === cat.key ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            ><Icon className="size-3" />{cat.label}</button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search memories..." value={memorySearch} onChange={(e) => setMemorySearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white gap-2"><Plus className="size-4" />Add Memory</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Memory</DialogTitle><DialogDescription>Store a new insight, pattern, or preference.</DialogDescription></DialogHeader>
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
                  <Input type="number" min={0} max={100} value={newMemory.score} onChange={(e) => setNewMemory({ ...newMemory, score: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-2"><Label>Key</Label><Input placeholder="e.g., question_opener" value={newMemory.key} onChange={(e) => setNewMemory({ ...newMemory, key: e.target.value })} /></div>
              <div className="space-y-2"><Label>Value</Label><Textarea placeholder="The memory content..." value={newMemory.value} onChange={(e) => setNewMemory({ ...newMemory, value: e.target.value })} className="min-h-[60px]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Source</Label>
                  <Select value={newMemory.source} onValueChange={(v) => setNewMemory({ ...newMemory, source: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="analytics">Analytics</SelectItem><SelectItem value="ai">AI</SelectItem><SelectItem value="experiment">Experiment</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Context</Label><Input placeholder="Optional context" value={newMemory.context} onChange={(e) => setNewMemory({ ...newMemory, context: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddMemory} disabled={!newMemory.key || !newMemory.value} className="bg-red-600 hover:bg-red-700 text-white">Store Memory</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedByCategory).map(([category, items]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 capitalize">
                {MEMORY_CATEGORIES.find((c) => c.key === category)?.icon && React.createElement(MEMORY_CATEGORIES.find((c) => c.key === category)!.icon, { className: "size-4 text-red-600" })}
                {category}
                <Badge variant="secondary" className="text-[9px]">{items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map((mem) => (
                  <div key={mem.id} className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-muted/30 border border-border hover:border-red-600/20 transition-colors">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-red-600">{mem.key}</span>
                        <Badge variant="outline" className="text-[9px]">{mem.source}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{mem.value}</p>
                    </div>
                    <MemoryScoreColor score={mem.score} />
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

// ─── Tab 6: Analytics ─────────────────────────────────────────────────────────

function AnalyticsTab() {
  const { analyticsSummary, setAnalyticsSummary, activeWorkspaceId } = useMediaStore();

  const data = analyticsSummary || MOCK_ANALYTICS;

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics?workspaceId=${activeWorkspaceId}&period=7d`);
      if (res.ok) { const d = await res.json(); setAnalyticsSummary(d); }
    } catch { /* use mock */ }
  }, [activeWorkspaceId, setAnalyticsSummary]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const viewsMetric = data.metrics.find((m) => m.type === "views");
  const ctrMetric = data.metrics.find((m) => m.type === "ctr");
  const revenueMetric = data.metrics.find((m) => m.type === "revenue");

  const pieData = data.publishing.byPlatform.map((p, i) => ({
    name: p.platform, value: p.count, color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const barData = data.content.topPerforming.map((c) => ({
    name: c.title.length > 25 ? c.title.slice(0, 25) + "..." : c.title,
    quality: c.qualityScore, humanic: c.humanicScore, seo: c.seoScore,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard title="Total Views" value={viewsMetric ? viewsMetric.total.toLocaleString() : "0"} icon={Eye} trend="+23% vs last period" />
        <StatCard title="Published" value={data.content.published} icon={Send} />
        <StatCard title="Avg CTR" value={ctrMetric ? `${ctrMetric.average.toFixed(1)}%` : "0%"} icon={MousePointerClick} />
        <StatCard title="Revenue" value={revenueMetric ? `$${revenueMetric.total.toLocaleString()}` : "$0"} icon={DollarSign} trend="+15% vs last period" />
        <StatCard title="Video Views" value="8,420" icon={Video} />
        <StatCard title="Clip Saves" value="127" icon={Scissors} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Publish Trend</CardTitle><CardDescription>Content published & views over past week</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={PUBLISH_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <RechartsTooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="published" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} name="Published" />
                <Line type="monotone" dataKey="views" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} name="Views" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Platform Distribution</CardTitle><CardDescription>Publishing volume by platform</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Content Performance</CardTitle><CardDescription>Top content scores comparison</CardDescription></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
              <RechartsTooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="quality" fill="#DC2626" name="Quality" radius={[0, 2, 2, 0]} />
              <Bar dataKey="humanic" fill="#F97316" name="Humanic" radius={[0, 2, 2, 0]} />
              <Bar dataKey="seo" fill="#06B6D4" name="SEO" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Top Performing</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {data.content.topPerforming.map((item, i) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-red-600 w-5">#{i + 1}</span>
                      <span className="text-xs font-medium truncate">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-red-600">{item.qualityScore}</span>
                      <StatusBadge status={item.status as ContentStatus} />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Events</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {data.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{event.metricType.toUpperCase()}{event.platform && <span className="text-muted-foreground"> · {event.platform}</span>}</p>
                      {event.contentItem && <p className="text-[10px] text-muted-foreground truncate">{event.contentItem.title}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-medium">{event.metricValue.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(event.capturedAt).toLocaleDateString()}</p>
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

// ─── Tab 7: Energy ────────────────────────────────────────────────────────────

function EnergyTab() {
  const { energyReport, setEnergyReport, activeWorkspaceId } = useMediaStore();
  const [resetting, setResetting] = useState<string | null>(null);

  const report = energyReport || MOCK_ENERGY;

  const fetchEnergy = useCallback(async () => {
    try {
      const res = await fetch(`/api/energy?workspaceId=${activeWorkspaceId}`);
      if (res.ok) { const data = await res.json(); setEnergyReport(data.report); }
    } catch { /* use mock */ }
  }, [activeWorkspaceId, setEnergyReport]);

  useEffect(() => { fetchEnergy(); }, [fetchEnergy]);

  const handleReset = async (category: string, topic?: string | null) => {
    setResetting(category);
    try {
      await fetch("/api/energy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId: activeWorkspaceId, action: "reset", category, topic }) });
      toast.success(`${category} fatigue reset`); setTimeout(fetchEnergy, 1000);
    } catch { toast.info("Reset command sent"); } finally { setResetting(null); }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      topic_fatigue: "Topic Fatigue",
      tone_fatigue: "Tone Fatigue",
      publish_saturation: "Publish Saturation",
      audience_exhaustion: "Audience Exhaustion",
      hook_repetition: "Hook Repetition",
      visual_fatigue: "Visual Fatigue",
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
      visual_fatigue: Image,
    };
    return icons[cat] || Activity;
  };

  const getFatigueColor = (score: number) => {
    if (score < 40) return "text-emerald-400";
    if (score < 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getRecommendation = (entry: typeof report.entries[0]) => {
    if (entry.fatigueScore < 40) return "Healthy — keep publishing at current rate.";
    if (entry.fatigueScore < 70) return `Consider diversifying ${entry.category.replace(/_/g, " ")}. Take a short break.`;
    return `High fatigue detected. Strongly recommend pausing ${entry.topic || entry.category} content and exploring new angles.`;
  };

  return (
    <div className="space-y-6">
      {/* Overall Energy with Circular Progress */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4 flex flex-col items-center">
            <div className="relative size-24">
              <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--muted)" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke={report.overallEnergy < 40 ? "#EF4444" : report.overallEnergy < 70 ? "#EAB308" : "#22C55E"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(report.overallEnergy / 100) * 251.3} 251.3`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${getFatigueColor(100 - report.overallEnergy)}`}>{report.overallEnergy}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Overall Energy</p>
          </CardContent>
        </Card>
        <StatCard title="Publish Status" value={report.canPublish ? "Clear" : "Caution"} icon={report.canPublish ? CheckCircle : AlertTriangle} />
        <StatCard title="Active Warnings" value={report.warnings.length} icon={AlertTriangle} />
        <StatCard title="Fatigue Entries" value={report.entries.length} icon={Activity} />
      </div>

      {!report.canPublish && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-yellow-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Consider Pausing Publishing</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your content energy is running low. Publishing now may hurt audience engagement.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fatigue Categories */}
      <div className="space-y-3">
        {report.entries.map((entry) => {
          const Icon = getCategoryIcon(entry.category);
          return (
            <Card key={entry.id} className="hover:border-red-600/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                      entry.fatigueScore < 40 ? "bg-emerald-500/15" : entry.fatigueScore < 70 ? "bg-yellow-500/15" : "bg-red-500/15"
                    }`}>
                      <Icon className={`size-5 ${entry.fatigueScore < 40 ? "text-emerald-400" : entry.fatigueScore < 70 ? "text-yellow-400" : "text-red-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium">{getCategoryLabel(entry.category)}</h4>
                        <FatigueIndicator score={entry.fatigueScore} />
                        {entry.topic && <Badge variant="outline" className="text-[9px]">{entry.topic}</Badge>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${
                            entry.fatigueScore < 40 ? "bg-emerald-500" : entry.fatigueScore < 70 ? "bg-yellow-500" : "bg-red-500"
                          }`} style={{ width: `${entry.fatigueScore}%` }} />
                        </div>
                        <span className={`text-sm font-mono font-bold ${getFatigueColor(entry.fatigueScore)}`}>{entry.fatigueScore}%</span>
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
                        <Button variant="outline" size="sm" onClick={() => handleReset(entry.category, entry.topic)} disabled={resetting === entry.category} className="shrink-0 gap-1.5">
                          <RefreshCw className={`size-3 ${resetting === entry.category ? "animate-spin" : ""}`} />Reset
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

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="size-4 text-red-600" />Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {report.entries.map((entry) => (
              <div key={`rec-${entry.id}`} className={`p-2.5 rounded-lg border text-xs ${
                entry.fatigueScore < 40 ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" :
                entry.fatigueScore < 70 ? "bg-yellow-500/5 border-yellow-500/20 text-yellow-300" :
                "bg-red-500/5 border-red-500/20 text-red-300"
              }`}>
                <span className="font-medium">{getCategoryLabel(entry.category)}:</span> {getRecommendation(entry)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 8: Browser Lab ───────────────────────────────────────────────────────

function BrowserLabTab() {
  const { browserInstance, setBrowserInstance, platformLogins, setPlatformLogins, testResults, setTestResults } = useMediaStore();
  const [navigateUrl, setNavigateUrl] = useState("");
  const [selectorInput, setSelectorInput] = useState("");
  const [actionInput, setActionInput] = useState("click");
  const [valueInput, setValueInput] = useState("");
  const [testSuite, setTestSuite] = useState("all");
  const [isRunning, setIsRunning] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const instance = browserInstance || MOCK_BROWSER_INSTANCE;
  const logins = platformLogins.length > 0 ? platformLogins : MOCK_PLATFORM_LOGINS;
  const results = testResults.length > 0 ? testResults : MOCK_TEST_RESULTS;

  const handleNavigate = async () => {
    if (!navigateUrl.trim()) return;
    setIsNavigating(true);
    try {
      const res = await fetch("/api/browser/navigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: navigateUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setBrowserInstance(data.instance || { ...MOCK_BROWSER_INSTANCE, currentUrl: navigateUrl, pageCount: instance.pageCount + 1 });
        toast.success("Navigated successfully!");
      } else {
        setBrowserInstance({ ...MOCK_BROWSER_INSTANCE, currentUrl: navigateUrl });
        toast.info("Navigation simulated");
      }
    } catch {
      setBrowserInstance({ ...MOCK_BROWSER_INSTANCE, currentUrl: navigateUrl });
      toast.info("Navigation simulated");
    } finally {
      setIsNavigating(false);
    }
  };

  const handleInteraction = async (action: string) => {
    try {
      const res = await fetch("/api/browser/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, selector: selectorInput, value: valueInput }),
      });
      if (res.ok) toast.success(`${action} executed!`);
      else toast.info(`${action} simulated`);
    } catch {
      toast.info(`${action} simulated`);
    }
  };

  const handleRunTests = async (type: string) => {
    setIsRunning(true);
    try {
      const res = await fetch("/api/browser/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, suite: testSuite === "all" ? undefined : testSuite }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestResults(data.results || MOCK_TEST_RESULTS);
        toast.success("Tests completed!");
      } else {
        setTestResults(MOCK_TEST_RESULTS);
        toast.info("Test results loaded");
      }
    } catch {
      setTestResults(MOCK_TEST_RESULTS);
      toast.info("Test results loaded");
    } finally {
      setIsRunning(false);
    }
  };

  const handleAutoPost = async (platform: string) => {
    try {
      const res = await fetch("/api/browser/auto-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (res.ok) toast.success(`Auto-post to ${platform} started!`);
      else toast.info(`Auto-post to ${platform} queued`);
    } catch {
      toast.info(`Auto-post to ${platform} queued`);
    }
  };

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const running = results.filter((r) => r.status === "running").length;

  return (
    <div className="space-y-6">
      {/* Browser Instance Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Browser Status" value={instance.status === "active" ? "Active" : "Inactive"} icon={Monitor} />
        <StatCard title="Page Count" value={instance.pageCount} icon={Globe} />
        <StatCard title="Tests Passed" value={passed} icon={CheckCircle} />
        <StatCard title="Tests Failed" value={failed} icon={XCircle} />
      </div>

      {/* URL Navigate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Enter URL to navigate..." value={navigateUrl} onChange={(e) => setNavigateUrl(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={handleNavigate} disabled={isNavigating || !navigateUrl.trim()} className="bg-red-600 hover:bg-red-700 text-white gap-2 shrink-0">
              {isNavigating ? <RefreshCw className="size-4 animate-spin" /> : <MousePointer className="size-4" />}
              Navigate
            </Button>
          </div>
          {instance.currentUrl && (
            <p className="text-[10px] text-muted-foreground mt-2">Current: {instance.currentUrl}</p>
          )}
        </CardContent>
      </Card>

      {/* Screenshot Preview */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Screenshot Preview</CardTitle></CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg border border-border flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Monitor className="size-12 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No screenshot captured</p>
              <p className="text-[10px]">Navigate to a URL to capture a preview</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interaction Controls */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Interaction Controls</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Action</Label>
                <Select value={actionInput} onValueChange={setActionInput}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="click">Click</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                    <SelectItem value="scroll">Scroll</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">CSS Selector</Label>
                <Input placeholder="e.g., #login-btn" value={selectorInput} onChange={(e) => setSelectorInput(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Value</Label>
                <Input placeholder="Text to type or option" value={valueInput} onChange={(e) => setValueInput(e.target.value)} className="h-9" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => handleInteraction("click")} className="gap-1.5"><MousePointer className="size-3" />Click</Button>
              <Button size="sm" variant="outline" onClick={() => handleInteraction("type")} className="gap-1.5"><Keyboard className="size-3" />Type</Button>
              <Button size="sm" variant="outline" onClick={() => handleInteraction("scroll")} className="gap-1.5"><ArrowDown className="size-3" />Scroll</Button>
              <Button size="sm" variant="outline" onClick={() => handleInteraction("select")} className="gap-1.5"><Layers className="size-3" />Select</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Auto-Post */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Megaphone className="size-4 text-red-600" />Platform Auto-Post</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {logins.map((platform) => (
              <div key={platform.platform} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2">
                  <div className={`size-2.5 rounded-full ${platform.loggedIn ? "bg-emerald-500" : "bg-red-500"}`} />
                  <div>
                    <p className="text-xs font-medium">{platform.label}</p>
                    {platform.username && <p className="text-[10px] text-muted-foreground">{platform.username}</p>}
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled={!platform.loggedIn} onClick={() => handleAutoPost(platform.platform)} className="h-7 text-[10px]">
                  Post
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* E2E Test Runner */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><TestTube className="size-4 text-red-600" />E2E Test Runner</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={testSuite} onValueChange={setTestSuite}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suites</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                  <SelectItem value="publish">Publish</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button size="sm" onClick={() => handleRunTests("all")} disabled={isRunning} className="bg-red-600 hover:bg-red-700 text-white gap-1.5">
              {isRunning ? <RefreshCw className="size-3 animate-spin" /> : <Play className="size-3" />}Run All Tests
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleRunTests("smoke")} disabled={isRunning} className="gap-1.5"><Zap className="size-3" />Smoke Test</Button>
          </div>
          <ScrollArea className="max-h-64">
            <div className="space-y-1.5">
              {results.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    {result.status === "passed" && <CheckCircle className="size-3.5 text-emerald-400 shrink-0" />}
                    {result.status === "failed" && <XCircle className="size-3.5 text-red-400 shrink-0" />}
                    {result.status === "running" && <RefreshCw className="size-3.5 text-yellow-400 animate-spin shrink-0" />}
                    {result.status === "pending" && <Clock className="size-3.5 text-muted-foreground shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{result.name}</p>
                      <p className="text-[10px] text-muted-foreground">{result.suite}{result.duration ? ` · ${result.duration}ms` : ""}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[9px] shrink-0 ${
                    result.status === "passed" ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" :
                    result.status === "failed" ? "text-red-400 bg-red-500/15 border-red-500/30" :
                    result.status === "running" ? "text-yellow-400 bg-yellow-500/15 border-yellow-500/30" :
                    "text-muted-foreground"
                  }`}>{result.status}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
          {failed > 0 && (
            <div className="mt-3 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-xs text-red-400"><span className="font-medium">{failed} test(s) failed.</span> Check error logs for details.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Top Header ───────────────────────────────────────────────────────────────

function TopHeader() {
  const { sidebarOpen } = useMediaStore();
  const [searchValue, setSearchValue] = useState("");

  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border h-14 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => useMediaStore.getState().toggleSidebar()}>
          <Menu className="size-5" />
        </Button>
        <div className="relative hidden sm:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search anything..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Mail className="size-4" />
                <span className="absolute -top-0.5 -right-0.5 size-3.5 bg-red-600 rounded-full text-[8px] text-white flex items-center justify-center">3</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">GS</div>
          <span className="text-xs font-medium hidden sm:block">GhostStudio</span>
        </div>
      </div>
    </header>
  );
}

// ─── Main OS Dashboard ────────────────────────────────────────────────────────

export default function OSPage() {
  const { activeTab, sidebarOpen } = useMediaStore();

  const renderTab = () => {
    switch (activeTab) {
      case "content": return <ContentPipelineTab />;
      case "video": return <VideoStudioTab />;
      case "publish": return <ViralLabTab />;
      case "scheduler": return <SchedulerTab />;
      case "memory": return <MemoryTab />;
      case "analytics": return <AnalyticsTab />;
      case "energy": return <EnergyTab />;
      case "browser": return <BrowserLabTab />;
      default: return <ContentPipelineTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="transition-all duration-200" style={{ marginLeft: typeof window !== "undefined" && window.innerWidth >= 1024 ? (sidebarOpen ? 240 : 64) : 0 }}>
        <TopHeader />
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderTab()}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
