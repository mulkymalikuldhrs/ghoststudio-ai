"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Layers,
  Clapperboard,
  Subtitles,
  Mic,
  Send,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Script Engine",
    description:
      "AI writes viral scripts with hooks, narrations, and CTAs optimized for maximum retention.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: Layers,
    title: "Scene Generator",
    description:
      "Auto-generate cinematic visuals for each scene with AI-powered image generation.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
  {
    icon: Clapperboard,
    title: "Auto Motion",
    description:
      "Add dynamic camera movements, transitions, and effects to keep viewers engaged.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: Subtitles,
    title: "Subtitle Engine",
    description:
      "Animated captions with custom styles, word-by-word highlighting, and multi-language support.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
  {
    icon: Mic,
    title: "AI Voice",
    description:
      "Natural-sounding AI voiceovers in 20+ voices. Clone your own voice for brand consistency.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    icon: Send,
    title: "Auto Posting",
    description:
      "Schedule and auto-publish to TikTok, YouTube Shorts, and Instagram Reels simultaneously.",
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
  },
  {
    icon: BarChart3,
    title: "Analytics Loop",
    description:
      "Track performance, learn from data, and auto-optimize future content for better results.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="text-glow-cyber text-primary">
              Dominate
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Seven powerful AI engines working together to create faceless video
            content that converts.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className={`group relative p-6 rounded-xl border ${feature.border} bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
            >
              <div
                className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
