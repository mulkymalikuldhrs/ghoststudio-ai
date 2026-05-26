"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Plus,
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSchedulerStatus } from "@/lib/hooks";

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  locked: Clock,
  running: Play,
  completed: CheckCircle2,
  failed: XCircle,
  dead_letter: AlertCircle,
};

const statusColors: Record<string, string> = {
  pending: "text-yellow-600",
  locked: "text-yellow-600",
  running: "text-blue-600",
  completed: "text-green-600",
  failed: "text-red-600",
  dead_letter: "text-red-600",
};

export function SchedulerTab() {
  const { data, isLoading } = useSchedulerStatus("demo-workspace");
  const jobs = data?.jobs ?? [];
  const queueStatus = data?.queueStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Scheduler</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage background jobs and scheduled tasks
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Enqueue Job
        </Button>
      </div>

      {/* Queue Status */}
      {queueStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(queueStatus).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold">{value as number}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {key.replace("_", " ")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Jobs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Clock className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No scheduled jobs
            </h3>
            <p className="text-sm text-muted-foreground">
              Jobs will appear here when content is scheduled
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => {
            const Icon = statusIcons[job.status] || Clock;
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 ${
                          statusColors[job.status] || "text-muted-foreground"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium">{job.jobType}</p>
                        <p className="text-xs text-muted-foreground">
                          Priority: {job.priority} · Retry: {job.retryCount}/
                          {job.maxRetries}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {job.status}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
