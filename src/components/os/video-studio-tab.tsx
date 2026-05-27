"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Video,
  Plus,
  Play,
  Clock,
  Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useVideoProjects } from "@/lib/hooks";
import { useMediaStore } from "@/store/media-store";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scripting: "bg-blue-500/10 text-blue-600",
  generating: "bg-yellow-500/10 text-yellow-600",
  rendering: "bg-orange-500/10 text-orange-600",
  completed: "bg-green-500/10 text-green-600",
  failed: "bg-red-500/10 text-red-600",
};

export function VideoStudioTab() {
  const { videoFilter, setVideoFilter, createVideoOpen, setCreateVideoOpen } = useMediaStore();
  const { data, isLoading } = useVideoProjects("demo-user", videoFilter);

  const projects = data?.projects ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Video Studio</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Create AI-powered faceless videos
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Video
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "draft", "generating", "rendering", "completed"].map(
          (status) => (
            <Button
              key={status}
              variant={videoFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setVideoFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          )
        )}
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Video className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No videos yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first AI video project
            </p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Video
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center relative">
                  <Play className="w-8 h-8 text-muted-foreground/30" />
                  <Badge
                    className={`absolute top-2 right-2 text-xs ${
                      statusColors[project.status] || ""
                    }`}
                  >
                    {project.status}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm line-clamp-1">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{project.duration}s</span>
                    <span>·</span>
                    <span>{project.niche}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
