"use client";

import { motion } from "framer-motion";
import {
  Play,
  Download,
  Share2,
  Settings,
  Edit3,
  Clock,
  Eye,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Progress } from "@/components/ui/progress";

const demoScenes = [
  { id: 1, narration: "In a world where most people sleepwalk through life...", visual: "Dark cityscape at night with neon lights", duration: 5, subtitle: "Most people sleepwalk through life" },
  { id: 2, narration: "Only a few dare to question the system.", visual: "Silhouette figure standing before a massive screen", duration: 5, subtitle: "Only a few dare to question" },
  { id: 3, narration: "The truth is uncomfortable, but it sets you free.", visual: "Breaking chains animation with light rays", duration: 5, subtitle: "The truth sets you free" },
  { id: 4, narration: "Are you one of the few? Or part of the machine?", visual: "Split screen: crowd vs lone figure on mountain", duration: 5, subtitle: "Are you one of the few?" },
  { id: 5, narration: "Follow for more content that awakens your mind.", visual: "Channel logo with subscribe animation", duration: 5, subtitle: "Follow for more" },
];

const exportFormats = [
  { id: "tiktok", label: "TikTok", ratio: "9:16", icon: "🎵" },
  { id: "youtube", label: "YouTube Shorts", ratio: "9:16", icon: "▶️" },
  { id: "reels", label: "Instagram Reels", ratio: "9:16", icon: "📸" },
  { id: "landscape", label: "Landscape 16:9", ratio: "16:9", icon: "🖥️" },
];

export default function ProjectDetailPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold">
                Why 90% of People Never Escape the Matrix
              </h1>
              <Badge className="bg-primary/10 text-primary">Completed</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> 0:58
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> 142K views
              </span>
              <span>Created Mar 4, 2026</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              size="sm"
              className="gradient-cyber text-primary-foreground glow-cyber-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video preview */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/30 bg-card/30 overflow-hidden">
              {/* Video player mock */}
              <div className="aspect-video relative bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                <div className="absolute inset-0 grid-pattern opacity-30" />
                <Button
                  size="lg"
                  variant="outline"
                  className="relative z-10 w-16 h-16 rounded-full border-primary/50 hover:bg-primary/10"
                >
                  <Play className="w-8 h-8 text-primary ml-1" />
                </Button>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                  <div className="h-full gradient-cyber w-1/3" />
                </div>
                <div className="absolute bottom-3 right-3 text-xs font-mono text-muted-foreground bg-background/80 px-2 py-0.5 rounded">
                  0:19 / 0:58
                </div>
              </div>
            </Card>

            {/* Script Editor */}
            <Card className="border-border/30 bg-card/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-primary" />
                    Script Editor
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="script">
                  <TabsList className="mb-4">
                    <TabsTrigger value="script">Script</TabsTrigger>
                    <TabsTrigger value="scenes">Scenes</TabsTrigger>
                  </TabsList>
                  <TabsContent value="script">
                    <Textarea
                      defaultValue={`HOOK: This will change everything you thought you knew...

SCENE 1: In a world where most people sleepwalk through life...
SCENE 2: Only a few dare to question the system.
SCENE 3: The truth is uncomfortable, but it sets you free.
SCENE 4: Are you one of the few? Or part of the machine?

CTA: Follow for more content that awakens your mind.`}
                      className="min-h-48 font-mono text-sm bg-background/50 border-border/30 resize-none"
                    />
                  </TabsContent>
                  <TabsContent value="scenes">
                    <div className="space-y-3">
                      {demoScenes.map((scene, i) => (
                        <motion.div
                          key={scene.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-background/30"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {scene.id}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {scene.narration}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Visual: {scene.visual}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {scene.duration}s
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card className="border-border/30 bg-card/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {demoScenes.map((scene) => (
                  <div
                    key={scene.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">
                        {scene.id}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-2 rounded-full bg-primary/20">
                        <div
                          className="h-full rounded-full gradient-cyber"
                          style={{
                            width: `${(scene.duration / 5) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      0:{((scene.id - 1) * 5).toString().padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Export options */}
            <Card className="border-border/30 bg-card/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {exportFormats.map((format) => (
                  <button
                    key={format.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-background/30 hover:bg-background/50 transition-all"
                  >
                    <span className="text-lg">{format.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{format.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {format.ratio}
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Project info */}
            <Card className="border-border/30 bg-card/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MoreHorizontal className="w-4 h-4" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-primary/10 text-primary">Completed</Badge>
                </div>
                <Separator className="bg-border/30" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>0:58</span>
                </div>
                <Separator className="bg-border/30" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Niche</span>
                  <span>Motivation</span>
                </div>
                <Separator className="bg-border/30" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voice</span>
                  <span>Onyx</span>
                </div>
                <Separator className="bg-border/30" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtitles</span>
                  <span>Karaoke</span>
                </div>
                <Separator className="bg-border/30" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Render</span>
                  <div className="flex items-center gap-2">
                    <Progress value={100} className="w-16 h-1.5" />
                    <span className="text-primary text-xs">100%</span>
                  </div>
                </div>
                <Separator className="bg-border/30" />
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Auto-Post to Platforms
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
