"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEnergyReport } from "@/lib/hooks";

const categoryLabels: Record<string, string> = {
  topic_fatigue: "Topic Fatigue",
  tone_fatigue: "Tone Fatigue",
  publish_saturation: "Publish Saturation",
  audience_exhaustion: "Audience Exhaustion",
  hook_repetition: "Hook Repetition",
  visual_fatigue: "Visual Fatigue",
};

function getEnergyStatus(score: number) {
  if (score < 40) return { icon: CheckCircle2, color: "text-green-600", label: "Fresh" };
  if (score < 70) return { icon: AlertTriangle, color: "text-yellow-600", label: "Warning" };
  return { icon: XCircle, color: "text-red-600", label: "Exhausted" };
}

export function EnergyTab() {
  const { data, isLoading } = useEnergyReport("demo-workspace");

  const entries = data?.entries ?? [];
  const warnings = data?.summary?.warnings ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Energy System</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor fatigue, saturation, and content exhaustion
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Overall Energy */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {data?.summary?.overallEnergy ?? 100}%
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Energy</p>
                </div>
                <div className="ml-auto">
                  {data?.summary?.canPublish ? (
                    <Badge className="bg-green-500/10 text-green-600">
                      Can Publish
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-600">
                      Publishing Blocked
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {warnings.length > 0 && (
            <Card className="border-yellow-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {warnings.map((warning, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      · {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Energy Entries */}
          {entries.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Zap className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  No energy data yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Energy entries build up as you publish content
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map((entry, i) => {
                const status = getEnergyStatus(entry.fatigueScore);
                const StatusIcon = status.icon;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium">
                            {categoryLabels[entry.category] || entry.category}
                          </span>
                          <StatusIcon className={`w-5 h-5 ${status.color}`} />
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-2xl font-bold">
                              {Math.round(entry.fatigueScore)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {status.label}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <RefreshCw className="w-3 h-3" />
                            Reset
                          </Button>
                        </div>
                        {entry.topic && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Topic: {entry.topic}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
