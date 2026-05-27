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
import { useProjects } from "@/lib/hooks";
import Link from "next/link";

export default function DashboardPage() {
  const { data: projectsData, isLoading: projectsLoading } = useProjects();

  const projects = projectsData?.projects ?? [];

  const stats = {
    totalProjects: projects.length,
    completedProjects: projects.filter((p: { status: string }) => p.status === "completed").length,
    draftProjects: projects.filter((p: { status: string }) => p.status === "draft").length,
    renderingProjects: projects.filter((p: { status: string }) => p.status === "rendering").length,
  };

  const statsCards = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      change: `${stats.completedProjects} completed`,
      changeType: "positive" as const,
      icon: Video,
    },
    {
      title: "Completed",
      value: stats.completedProjects,
      change: `${stats.draftProjects} drafts`,
      changeType: "neutral" as const,
      icon: Eye,
    },
    {
      title: "Rendering",
      value: stats.renderingProjects,
      change: stats.renderingProjects > 0 ? "Active" : "None",
      changeType: "neutral" as const,
      icon: Loader2,
    },
    {
      title: "Draft",
      value: stats.draftProjects,
      change: "Pending",
      changeType: "neutral" as const,
      icon: TrendingUp,
    },
  ];

  const recentActivity = [
    ...(projects.slice(0, 4).map((p: { title: string; status: string; updatedAt: string }) => ({
      text: `${p.status === "completed" ? "Video exported" : p.status === "rendering" ? "Rendering started" : "Script generated"}: ${p.title}`,
      time: new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      type: p.status === "completed" ? "success" : "info",
    }))),
  ];

  if (projectsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
          {statsCards.map((stat, i) => (
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
            {projects.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Video className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <h3 className="text-lg font-semibold text-muted-foreground">
                  No projects yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create your first video to get started
                </p>
                <Button className="gradient-cyber text-primary-foreground glow-cyber-sm" asChild>
                  <Link href="/dashboard/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Video
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.slice(0, 6).map((project: { id: string; title: string; status: string; duration: number; createdAt: string; niche?: string }, i: number) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                  >
                    <ProjectCard
                      id={project.id}
                      title={project.title}
                      status={project.status}
                      duration={project.duration}
                      createdAt={project.createdAt}
                      niche={project.niche}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <div className="rounded-xl border border-border/30 bg-card/30 p-4 space-y-4 max-h-96 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity yet. Create a project to get started.
                </p>
              ) : (
                recentActivity.map((activity, i) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
