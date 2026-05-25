"use client";

import { motion } from "framer-motion";
import { Play, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute inset-0 scanline opacity-20" />

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.71 0.14 192), transparent)",
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.75 0.15 80), transparent)",
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          AI-Powered Faceless Content Engine
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight mb-6"
        >
          <span className="block text-foreground">One Prompt.</span>
          <span className="block bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
            Infinite Content.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Generate viral faceless videos for TikTok, YouTube Shorts & Instagram
          Reels. Script, visuals, voiceover, subtitles — all from a single
          prompt.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            size="lg"
            className="gradient-cyber text-primary-foreground px-8 py-6 text-lg font-semibold glow-cyber hover:scale-105 transition-transform"
            asChild
          >
            <a href="/auth/signup">
              Start Creating Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-primary/30 text-primary hover:bg-primary/10 px-8 py-6 text-lg"
            asChild
          >
            <a href="#demo">
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </a>
          </Button>
        </motion.div>

        {/* Mock Video Preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden glow-cyber">
            {/* Top bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-card/80">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                ghoststudio.ai/editor
              </span>
            </div>
            {/* Video preview mock */}
            <div className="aspect-video flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
              <div className="grid grid-cols-3 gap-4 p-8 w-full">
                <div className="col-span-2 space-y-4">
                  <div className="h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center px-4">
                    <span className="text-sm text-primary font-mono">
                      &gt; Generating script for: &quot;Why 90% of people never
                      escape the matrix...&quot;
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="aspect-[9/16] rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + i * 0.15 }}
                      >
                        <div className="text-center px-2">
                          <div className="w-8 h-8 mx-auto rounded-full gradient-cyber flex items-center justify-center mb-1">
                            <Play className="w-3 h-3 text-primary-foreground" />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            Scene {i}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-2">
                    <div className="text-xs text-muted-foreground font-medium">
                      Script
                    </div>
                    <div className="h-2 rounded bg-primary/30 w-full" />
                    <div className="h-2 rounded bg-primary/20 w-3/4" />
                    <div className="h-2 rounded bg-primary/10 w-1/2" />
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-2">
                    <div className="text-xs text-muted-foreground font-medium">
                      Voice
                    </div>
                    <div className="flex gap-1 items-end h-6">
                      {[3, 5, 2, 7, 4, 6, 3, 5, 2, 8].map((h, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-primary/50 rounded-full"
                          animate={{ height: [h, h + 3, h] }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            delay: i * 0.05,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                    <div className="text-xs text-muted-foreground font-medium mb-2">
                      Progress
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full gradient-cyber"
                        initial={{ width: "0%" }}
                        animate={{ width: "73%" }}
                        transition={{ duration: 2, delay: 1 }}
                      />
                    </div>
                    <div className="text-xs text-primary mt-1 font-mono">
                      73%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-12 flex flex-col items-center gap-3"
        >
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-background gradient-cyber"
                style={{ opacity: 0.5 + i * 0.1 }}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Trusted by <span className="text-primary font-semibold">12,000+</span>{" "}
            creators worldwide
          </p>
        </motion.div>
      </div>
    </section>
  );
}
