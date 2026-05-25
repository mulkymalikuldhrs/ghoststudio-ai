"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Ghost,
  FolderKanban,
  LayoutTemplate,
  BarChart3,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  {
    label: "Projects",
    href: "/dashboard",
    icon: FolderKanban,
  },
  {
    label: "Templates",
    href: "/dashboard/templates",
    icon: LayoutTemplate,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border/30 bg-sidebar transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border/30">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-cyber flex items-center justify-center shrink-0">
            <Ghost className="w-5 h-5 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-lg">
              Ghost<span className="text-primary">Studio</span>
            </span>
          )}
        </Link>
      </div>

      {/* Create button */}
      <div className="p-3">
        <Button
          className={cn(
            "gradient-cyber text-primary-foreground glow-cyber-sm",
            sidebarOpen ? "w-full" : "w-10 px-0"
          )}
          size={sidebarOpen ? "default" : "icon"}
          asChild
        >
          <Link href="/dashboard/create">
            <Plus className="w-4 h-4" />
            {sidebarOpen && <span className="ml-2">New Project</span>}
          </Link>
        </Button>
      </div>

      <Separator className="bg-border/30" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary glow-cyber-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary")} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button */}
      <div className="p-3 border-t border-border/30">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
