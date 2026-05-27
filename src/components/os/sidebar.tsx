"use client";

import React from "react";
import { useMediaStore, type OSTab } from "@/store/media-store";
import {
  FileText,
  Video,
  Share2,
  Clock,
  Brain,
  BarChart3,
  Zap,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const tabs: { id: OSTab; label: string; icon: React.ElementType }[] = [
  { id: "content", label: "Content Pipeline", icon: FileText },
  { id: "video", label: "Video Studio", icon: Video },
  { id: "publish", label: "Viral Lab", icon: Share2 },
  { id: "scheduler", label: "Scheduler", icon: Clock },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "energy", label: "Energy", icon: Zap },
  { id: "browser", label: "Browser Lab", icon: Globe },
];

export function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, toggleSidebar } = useMediaStore();

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-background border-r border-border transition-all duration-200 flex flex-col ${
        sidebarOpen ? "w-60" : "w-16"
      }`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        {sidebarOpen && (
          <span className="font-bold text-lg tracking-tight">
            Ghost<span className="text-primary">Studio</span>
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="shrink-0"
        >
          {sidebarOpen ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary border-r-2 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <tab.icon className="size-4 shrink-0" />
                    {sidebarOpen && <span className="truncate">{tab.label}</span>}
                  </button>
                </TooltipTrigger>
                {!sidebarOpen && (
                  <TooltipContent side="right">{tab.label}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            GhostStudio AI v2.0
          </div>
        </div>
      )}
    </aside>
  );
}
