"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Youtube,
  Plus,
  Loader2,
  Scissors,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHeatmapJobs } from "@/lib/hooks";

export function ViralLabTab() {
  const { data, isLoading } = useHeatmapJobs("demo-user");
  const jobs = data?.jobs ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Viral Lab</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Extract viral clips from YouTube heatmaps
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Heatmap Job
        </Button>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Flame className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No heatmap jobs yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Paste a YouTube URL to analyze viral segments
            </p>
            <Button className="gap-2">
              <Youtube className="w-4 h-4" />
              Analyze Video
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Scissors className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {job.videoUrl}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {job.status}
                        </Badge>
                        <span>{job.resolution}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
