"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Plus,
  Loader2,
  Monitor,
  Smartphone,
  ExternalLink,
  X,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrowserStatus, useBrowserSessions } from "@/lib/hooks";

export function BrowserLabTab() {
  const { data: statusData, isLoading: statusLoading } = useBrowserStatus();
  const { data: sessionsData, isLoading: sessionsLoading } = useBrowserSessions();

  const sessions = sessionsData?.sessions ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Browser Lab</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Automate browser interactions and platform actions
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Session
        </Button>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Browser Engine Status</p>
              <p className="text-sm text-muted-foreground">
                {statusLoading
                  ? "Checking..."
                  : statusData
                  ? "Active"
                  : "Not configured"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions */}
      {sessionsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Monitor className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No browser sessions
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a new browser session to automate platform actions
            </p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Start Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{session.url || "New Session"}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {session.status}
                        </Badge>
                        <span>{0} pages</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <X className="w-4 h-4" />
                    </Button>
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
