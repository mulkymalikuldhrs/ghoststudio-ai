"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Plus,
  Search,
  Loader2,
  Tag,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMemories } from "@/lib/hooks";
import { useMediaStore } from "@/store/media-store";

const categoryColors: Record<string, string> = {
  hook: "bg-pink-500/10 text-pink-600",
  topic: "bg-blue-500/10 text-blue-600",
  tone: "bg-purple-500/10 text-purple-600",
  timing: "bg-orange-500/10 text-orange-600",
  cta: "bg-green-500/10 text-green-600",
  format: "bg-cyan-500/10 text-cyan-600",
  platform: "bg-indigo-500/10 text-indigo-600",
  monetization: "bg-yellow-500/10 text-yellow-600",
  audience: "bg-red-500/10 text-red-600",
  style: "bg-teal-500/10 text-teal-600",
};

export function MemoryTab() {
  const { memoryFilter, setMemoryFilter, memorySearch, setMemorySearch, addMemoryOpen, setAddMemoryOpen } = useMediaStore();
  const { data, isLoading } = useMemories("demo-workspace", memoryFilter, memorySearch);

  const entries = data?.entries ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Memory</h2>
          <p className="text-muted-foreground text-sm mt-1">
            The moat — what worked, what failed, your patterns
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddMemoryOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Memory
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={memorySearch}
            onChange={(e) => setMemorySearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "hook", "topic", "tone", "cta", "format", "platform"].map(
            (cat) => (
              <Button
                key={cat}
                variant={memoryFilter === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setMemoryFilter(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Memory entries */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Brain className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No memories yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Memories build up as you create and publish content
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge
                      className={`text-xs ${
                        categoryColors[entry.category] || ""
                      }`}
                    >
                      {entry.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      {Math.round(entry.score)}
                    </div>
                  </div>
                  <p className="text-sm font-medium line-clamp-1">{entry.key}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {entry.value}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
