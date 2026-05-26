"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Mail, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useMediaStore } from "@/store/media-store";

import { Sidebar } from "@/components/os/sidebar";
import { ContentPipelineTab } from "@/components/os/content-pipeline-tab";
import { VideoStudioTab } from "@/components/os/video-studio-tab";
import { ViralLabTab } from "@/components/os/viral-lab-tab";
import { SchedulerTab } from "@/components/os/scheduler-tab";
import { MemoryTab } from "@/components/os/memory-tab";
import { AnalyticsTab } from "@/components/os/analytics-tab";
import { EnergyTab } from "@/components/os/energy-tab";
import { BrowserLabTab } from "@/components/os/browser-lab-tab";

// ─── Top Header ───────────────────────────────────────────────────────────────

function TopHeader() {
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

// ─── Tab Renderer ─────────────────────────────────────────────────────────────

function TabContent({ tab }: { tab: string }) {
  switch (tab) {
    case "content":
      return <ContentPipelineTab />;
    case "video":
      return <VideoStudioTab />;
    case "publish":
      return <ViralLabTab />;
    case "scheduler":
      return <SchedulerTab />;
    case "memory":
      return <MemoryTab />;
    case "analytics":
      return <AnalyticsTab />;
    case "energy":
      return <EnergyTab />;
    case "browser":
      return <BrowserLabTab />;
    default:
      return <ContentPipelineTab />;
  }
}

// ─── Main OS Dashboard ────────────────────────────────────────────────────────

export default function OSPage() {
  const { activeTab, sidebarOpen } = useMediaStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div
        className="transition-all duration-200"
        style={{
          marginLeft:
            typeof window !== "undefined" && window.innerWidth >= 1024
              ? sidebarOpen
                ? 240
                : 64
              : 0,
        }}
      >
        <TopHeader />
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TabContent tab={activeTab} />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
