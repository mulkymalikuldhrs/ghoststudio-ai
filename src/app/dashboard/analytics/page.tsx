"use client";

import { motion } from "framer-motion";
import {
  Eye,
  Clock,
  MousePointerClick,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const overviewStats = [
  { title: "Total Views", value: "2.4M", change: "+28.3%", changeType: "positive" as const, icon: Eye },
  { title: "Avg Watch Time", value: "0:42", change: "+5.1%", changeType: "positive" as const, icon: Clock },
  { title: "Click-Through Rate", value: "8.7%", change: "+2.3%", changeType: "positive" as const, icon: MousePointerClick },
  { title: "Subscriber Growth", value: "+12.4K", change: "+18%", changeType: "positive" as const, icon: TrendingUp },
];

const viewsData = [
  { day: "Mon", views: 34000, shorts: 28000 },
  { day: "Tue", views: 42000, shorts: 35000 },
  { day: "Wed", views: 38000, shorts: 31000 },
  { day: "Thu", views: 51000, shorts: 42000 },
  { day: "Fri", views: 47000, shorts: 39000 },
  { day: "Sat", views: 62000, shorts: 51000 },
  { day: "Sun", views: 55000, shorts: 45000 },
];

const topVideos = [
  { title: "Why 90% of People Never Escape the Matrix", views: "842K", ctr: "12.3%", watchTime: "0:48", platform: "TikTok" },
  { title: "The Haunted Room 301", views: "534K", ctr: "9.8%", watchTime: "0:42", platform: "YouTube" },
  { title: "Bitcoin Will Hit $500K", views: "421K", ctr: "8.5%", watchTime: "0:55", platform: "TikTok" },
  { title: "5 Anime Plot Twists", views: "312K", ctr: "11.2%", watchTime: "0:39", platform: "Reels" },
  { title: "How Your Brain Tricks You", views: "287K", ctr: "7.9%", watchTime: "0:44", platform: "YouTube" },
];

const performanceData = [
  { niche: "Motivation", videos: 18, views: "1.2M", avgCTR: "10.8%" },
  { niche: "Horror", videos: 12, views: "890K", avgCTR: "9.4%" },
  { niche: "Crypto", videos: 8, views: "620K", avgCTR: "8.1%" },
  { niche: "Anime", videos: 6, views: "410K", avgCTR: "11.5%" },
  { niche: "Education", videos: 3, views: "180K", avgCTR: "7.2%" },
];

const maxViews = Math.max(...viewsData.map((d) => d.views));

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track performance and optimize your content strategy
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewStats.map((stat, i) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Views chart (custom bar chart) */}
          <Card className="border-border/30 bg-card/30">
            <CardHeader>
              <CardTitle className="text-lg">Views Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {viewsData.map((d, i) => (
                  <motion.div
                    key={d.day}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs text-muted-foreground w-8 font-mono">
                      {d.day}
                    </span>
                    <div className="flex-1 flex gap-1">
                      <div className="flex-1 h-6 bg-muted/20 rounded-sm overflow-hidden relative">
                        <motion.div
                          className="absolute inset-y-0 left-0 gradient-cyber rounded-sm"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(d.views / maxViews) * 100}%`,
                          }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                        />
                        <span className="absolute left-2 top-0.5 text-[10px] text-primary-foreground font-mono z-10">
                          {(d.views / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content performance */}
          <Card className="border-border/30 bg-card/30">
            <CardHeader>
              <CardTitle className="text-lg">Content Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceData.map((item, i) => (
                  <motion.div
                    key={item.niche}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-background/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div>
                        <span className="text-sm font-medium">
                          {item.niche}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {item.videos} videos
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{item.views}</div>
                      <div className="text-xs text-muted-foreground">
                        CTR: {item.avgCTR}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top videos table */}
        <Card className="border-border/30 bg-card/30">
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30">
                    <TableHead>Video</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Watch Time</TableHead>
                    <TableHead>Platform</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topVideos.map((video, i) => (
                    <motion.tr
                      key={video.title}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-border/20 hover:bg-muted/10"
                    >
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">
                        {video.title}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {video.views}
                      </TableCell>
                      <TableCell className="text-right text-sm flex items-center justify-end gap-1">
                        <ArrowUpRight className="w-3 h-3 text-primary" />
                        {video.ctr}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        {video.watchTime}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs border-border/30"
                        >
                          {video.platform}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
