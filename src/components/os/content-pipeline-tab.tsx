"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Sparkles,
  Loader2,
  Eye,
  Edit3,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContentItems, useCreateContent } from "@/lib/hooks";
import { useMediaStore } from "@/store/media-store";

const statusColors: Record<string, string> = {
  idea: "bg-muted text-muted-foreground",
  draft: "bg-blue-500/10 text-blue-600",
  editing: "bg-yellow-500/10 text-yellow-600",
  seo_review: "bg-purple-500/10 text-purple-600",
  ready: "bg-green-500/10 text-green-600",
  scheduled: "bg-orange-500/10 text-orange-600",
  published: "bg-primary/10 text-primary",
  archived: "bg-muted text-muted-foreground",
  failed: "bg-red-500/10 text-red-600",
};

export function ContentPipelineTab() {
  const { contentFilter, setContentFilter, createContentOpen, setCreateContentOpen } = useMediaStore();
  const { data, isLoading } = useContentItems("demo-workspace", contentFilter);
  const createContent = useCreateContent();

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Content Pipeline</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Create, manage, and publish your content
          </p>
        </div>
        <Button
          onClick={() => setCreateContentOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Content
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search content..." className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "idea", "draft", "editing", "ready", "published"].map(
            (status) => (
              <Button
                key={status}
                variant={contentFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setContentFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No content yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first piece of content to get started
            </p>
            <Button onClick={() => setCreateContentOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {item.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ml-2 ${
                        statusColors[item.status] || ""
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  {item.angle && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {item.angle}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Score: {Math.round(item.qualityScore)}</span>
                    <span>·</span>
                    <span>v{item.version}</span>
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
