"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Loader2,
  Eye,
  TrendingUp,
  MousePointerClick,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from "@/lib/hooks";

export function AnalyticsTab() {
  const { data, isLoading } = useAnalytics("demo-workspace");

  const summary = data?.summary;

  const statsCards = [
    {
      title: "Total Events",
      value: summary ? Object.keys(summary).length : 0,
      icon: BarChart3,
    },
    { title: "Content Items", value: summary?.content?.total ?? 0, icon: Eye },
    {
      title: "Published",
      value: summary?.content?.published ?? 0,
      icon: TrendingUp,
    },
    {
      title: "Publish Jobs",
      value: summary?.publishing?.totalJobs ?? 0,
      icon: MousePointerClick,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Track performance and optimize your content strategy
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-2xl font-bold">{stat.value}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Placeholder chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Analytics data will appear as you publish content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
