"use client";

import { motion } from "framer-motion";
import {
  Video,
  Eye,
  Loader2,
  TrendingUp,
  Plus,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ProjectCard } from "@/components/dashboard/project-card";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import Link from "next/link";

// Demo data
const stats = [
  {
    title: "Videos Created",
    value: 47,
    change: "+12%",
    changeType: "positive" as const,
    icon: Video,
  },
  {
    title: "Total Views",
    value: "2.4M",
    change: "+28%",
    changeType: "positive" as const,
    icon: Eye,
  },
  {
    title: "Rendering Queue",
    value: 3,
    change: "Active",
    changeType: "neutral" as const,
    icon: Loader2,
  },
  {
    title: "Avg. Watch Time",
    value: "0:42",
    change: "+5%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
];

const projects = [
  {
    id: "1",
    title: "Why 90% of People Never Escape the Matrix",
    status: "completed",
    duration: 58,
    createdAt: new Date().toISOString(),
    niche: "Motivation",
  },
  {
    id: "2",
    title: "The Haunted Room 301 - True Story",
    status: "rendering",
    duration: 45,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    niche: "Horror",
  },
  {
    id: "3",
    title: "Bitcoin Will Hit $500K - Here's Why",
    status: "completed",
    duration: 60,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    niche: "Crypto",
  },
  {
    id: "4",
    title: "5 Anime Plot Twists That Broke the Internet",
    status: "generating",
    duration: 52,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    niche: "Anime",
  },
  {
    id: "5",
    title: "How Your Brain Tricks You Every Day",
    status: "completed",
    duration: 47,
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    niche: "Education",
  },
  {
    id: "6",
    title: "The Creepiest Abandoned Places on Earth",
    status: "draft",
    duration: 0,
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    niche: "Horror",
  },
];

const recentActivity = [
  { text: "Video exported: Why 90% of People Never Escape the Matrix", time: "5 min ago", type: "success" },
  { text: "Rendering started: The Haunted Room 301", time: "23 min ago", type: "info" },
  { text: "Script generated: 5 Anime Plot Twists", time: "1 hour ago", type: "info" },
  { text: "New subscriber milestone: 100K followers", time: "3 hours ago", type: "success" },
];

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Welcome back, Creator. Your content empire awaits.
            </p>
          </div>
          <Button className="gradient-cyber text-primary-foreground glow-cyber-sm" asChild>
            <Link href="/dashboard/create">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <StatsCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Projects & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Projects</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                View All <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <ProjectCard {...project} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <div className="rounded-xl border border-border/30 bg-card/30 p-4 space-y-4 max-h-96 overflow-y-auto">
              {recentActivity.map((activity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      activity.type === "success"
                        ? "bg-primary"
                        : "bg-secondary"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{activity.text}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
