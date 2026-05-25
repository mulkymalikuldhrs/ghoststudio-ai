"use client";

import { Bell, Search, Menu, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function DashboardHeader() {
  const { toggleSidebar, notifications } = useAppStore();

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-cyber flex items-center justify-center">
              <Ghost className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>

          {/* Search */}
          <div className="hidden sm:flex items-center relative">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9 w-64 bg-muted/30 border-border/30 h-9 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="w-4 h-4" />
            {notifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="gradient-cyber text-primary-foreground text-xs">
                    GS
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm">Creator</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <a href="/dashboard/settings">Settings</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/auth/signin">Sign Out</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
