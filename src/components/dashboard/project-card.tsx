"use client";

import { Play, MoreVertical, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProjectCardProps {
  id: string;
  title: string;
  status: string;
  thumbnail?: string;
  duration: number;
  createdAt: string;
  niche?: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: Clock },
  generating: {
    label: "Generating",
    color: "bg-primary/10 text-primary",
    icon: Loader2,
  },
  rendering: {
    label: "Rendering",
    color: "bg-secondary/10 text-secondary",
    icon: Loader2,
  },
  completed: {
    label: "Completed",
    color: "bg-primary/10 text-primary",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    color: "bg-destructive/10 text-destructive",
    icon: AlertCircle,
  },
};

export function ProjectCard({
  id,
  title,
  status,
  duration,
  createdAt,
  niche,
}: ProjectCardProps) {
  const config = statusConfig[status] ?? statusConfig.draft;
  const StatusIcon = config.icon;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="group border-border/30 bg-card/30 hover:bg-card/60 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg overflow-hidden">
      {/* Thumbnail area */}
      <div className="aspect-video relative bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <Play className="w-10 h-10 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className={config.color}>
            <StatusIcon className={`w-3 h-3 mr-1 ${status === "generating" || status === "rendering" ? "animate-spin" : ""}`} />
            {config.label}
          </Badge>
        </div>
        {niche && (
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="text-xs border-border/30">
              {niche}
            </Badge>
          </div>
        )}
        <div className="absolute bottom-3 right-3">
          <Badge variant="outline" className="text-xs border-border/30 bg-background/80 backdrop-blur-sm font-mono">
            {formatDuration(duration)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link href={`/dashboard/project/${id}`}>
              <h3 className="font-semibold text-sm truncate hover:text-primary transition-colors">
                {title}
              </h3>
            </Link>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/project/${id}`}>Open</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
