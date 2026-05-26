"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Ghost,
  Brain,
  ShieldCheck,
  Video,
  Flame,
  Bot,
  Globe,
  Database,
  Zap,
  Send,
  CalendarClock,
  ChevronRight,
  Menu,
  X,
  Play,
  ArrowRight,
  Star,
  Check,
  Sparkles,
  Signal,
  PenTool,
  Rocket,
  TrendingUp,
  Github,
  Twitter,
  Youtube,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/* ─── Data ────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Brain,
    title: "Content DNA Engine",
    description: "Memory-driven voice analysis that learns your brand's unique tone, style, and patterns from every piece of content you create.",
    gradient: "from-red-500/20 to-red-600/5",
  },
  {
    icon: ShieldCheck,
    title: "Humanic Rewrite",
    description: "Anti-AI detection rewriting that makes every piece of content sound authentically human. Beat AI detectors every time.",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  {
    icon: Video,
    title: "Video Generation Pipeline",
    description: "Transform any topic into a fully produced video with scripts, voiceovers, visuals, and editing — all autonomous.",
    gradient: "from-violet-500/20 to-violet-600/5",
  },
  {
    icon: Flame,
    title: "YouTube Heatmap Clipper",
    description: "Detect viral moments in your videos using engagement heatmaps. Auto-clip the best segments for Shorts and Reels.",
    gradient: "from-orange-500/20 to-orange-600/5",
  },
  {
    icon: Bot,
    title: "Multi-Agent Orchestration",
    description: "15+ specialized AI agents working in concert — strategy, scripting, editing, SEO, publishing, and more.",
    gradient: "from-cyan-500/20 to-cyan-600/5",
  },
  {
    icon: Globe,
    title: "Browser Automation",
    description: "Puppeteer-powered auto-posting to every platform. Schedule and publish without touching a single button.",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  {
    icon: Database,
    title: "Memory System",
    description: "Reinforcement learning memory that improves with every content cycle. Your OS gets smarter the more you use it.",
    gradient: "from-pink-500/20 to-pink-600/5",
  },
  {
    icon: Zap,
    title: "Energy System",
    description: "Fatigue tracking and resource management that prevents burnout and optimizes your content production schedule.",
    gradient: "from-yellow-500/20 to-yellow-600/5",
  },
  {
    icon: Send,
    title: "Multi-Platform Publishing",
    description: "One-click publish to 9+ platforms: YouTube, TikTok, Instagram, Twitter, LinkedIn, Medium, WordPress, and more.",
    gradient: "from-indigo-500/20 to-indigo-600/5",
  },
  {
    icon: CalendarClock,
    title: "Smart Scheduling",
    description: "Daily autonomous content cycle that plans, creates, publishes, and analyzes — while you sleep.",
    gradient: "from-teal-500/20 to-teal-600/5",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Signal,
    title: "Signal",
    description: "Your OS scans trends, analyzes your niche, and identifies high-value content opportunities in real-time.",
    color: "text-red-400",
  },
  {
    step: "02",
    icon: PenTool,
    title: "Create",
    description: "15+ AI agents collaborate to produce articles, scripts, videos, and graphics — all in your unique brand voice.",
    color: "text-amber-400",
  },
  {
    step: "03",
    icon: Rocket,
    title: "Publish",
    description: "Browser automation posts to 9+ platforms simultaneously. Zero manual effort required.",
    color: "text-emerald-400",
  },
  {
    step: "04",
    icon: TrendingUp,
    title: "Compound",
    description: "Memory system learns from every cycle. Content gets better, engagement grows, your empire compounds.",
    color: "text-violet-400",
  },
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: 0,
    description: "Get started with basic content creation",
    features: [
      "3 video projects",
      "10 content items",
      "5 publish jobs",
      "10 scheduler jobs",
      "5 video templates",
      "2 heatmap clips",
      "1 browser session",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Creator",
    price: 29,
    description: "For serious content creators",
    features: [
      "25 video projects",
      "100 content items",
      "50 publish jobs",
      "100 scheduler jobs",
      "25 video templates",
      "20 heatmap clips",
      "5 browser sessions",
      "Humanic Rewrite",
    ],
    cta: "Start Creating",
    popular: false,
  },
  {
    name: "Pro",
    price: 49,
    description: "Full autonomous media intelligence",
    features: [
      "Unlimited video projects",
      "Unlimited content items",
      "Unlimited publish jobs",
      "Unlimited scheduler jobs",
      "Unlimited video templates",
      "100 heatmap clips",
      "20 browser sessions",
      "Humanic Rewrite",
      "Priority support",
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Agency",
    price: 199,
    description: "For teams and agencies at scale",
    features: [
      "Everything unlimited",
      "Unlimited heatmap clips",
      "Unlimited browser sessions",
      "Team collaboration",
      "Custom AI agents",
      "White-label option",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Alex Rivera",
    role: "YouTuber, 1.2M subs",
    content: "GhostStudio turned my channel from weekly uploads to daily. My audience grew 300% in 3 months. The heatmap clipper alone is worth the price.",
    avatar: "AR",
  },
  {
    name: "Sarah Chen",
    role: "Content Agency CEO",
    content: "We manage 50+ client accounts. GhostStudio's multi-agent orchestration lets us do the work of 10 people with a team of 2. Game-changer.",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "TikTok Creator, 800K",
    content: "The Humanic Rewrite feature is insane. Every piece sounds like me. Zero AI detection flags. My engagement actually went UP.",
    avatar: "MJ",
  },
  {
    name: "Priya Sharma",
    role: "LinkedIn Top Voice",
    content: "I went from posting once a week to 5x daily across 4 platforms. The memory system really does learn my voice better over time.",
    avatar: "PS",
  },
  {
    name: "Jake Morrison",
    role: "Faceless Channel Owner",
    content: "Built a 6-figure faceless empire in 6 months. The video pipeline + auto-publish combo is lethal. This is the future of content.",
    avatar: "JM",
  },
  {
    name: "Elena Volkov",
    role: "Digital Marketing Director",
    content: "The energy system prevents the content treadmill burnout. Smart scheduling means our team produces more while working less. Revolutionary.",
    avatar: "EV",
  },
];

/* ─── Navbar ──────────────────────────────────────────── */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg gradient-red flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow">
              <Ghost className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Ghost<span className="text-primary">Studio</span>
              <span className="text-xs text-muted-foreground ml-1">v2.0</span>
            </span>
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/auth/signin">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </a>
            <a href="/auth/signup">
              <Button size="sm" className="gradient-red text-white glow-red-sm">
                Sign Up Free
              </Button>
            </a>
            <a href="/dashboard">
              <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                Launch OS
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </a>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm text-muted-foreground hover:text-foreground py-2"
                >
                  {link.label}
                </a>
              ))}
              <Separator className="bg-border/50" />
              <div className="flex flex-col gap-2 pt-2">
                <a href="/auth/signin">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    Sign In
                  </Button>
                </a>
                <a href="/auth/signup">
                  <Button size="sm" className="w-full gradient-red text-white">
                    Sign Up Free
                  </Button>
                </a>
                <a href="/dashboard">
                  <Button size="sm" variant="outline" className="w-full border-primary/30 text-primary">
                    Launch OS
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ─── Hero Section ────────────────────────────────────── */

function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-red-950/20" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-red-500/10 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-red-600/8 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-amber-500/5 blur-[150px]"
        />
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-primary/40 bg-primary/5 text-primary gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            v2.0 — Now with 15+ AI Agents
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight"
        >
          One OS.
          <br />
          <span className="text-primary text-glow-red">Infinite Media</span>
          <br />
          Intelligence.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Autonomous content creation + video generation powered by memory-driven AI agents.
          Create, publish, and compound your media empire — while you sleep.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a href="/auth/signup">
            <Button size="lg" className="gradient-red text-white glow-red text-base px-8 h-12">
              Start Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>
          <Button size="lg" variant="outline" className="border-border/50 text-base px-8 h-12 group">
            <Play className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
            Watch Demo
          </Button>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-16 relative max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
            {/* Window Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-card/80">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground font-mono">
                  ghoststudio.ai/os
                </div>
              </div>
            </div>
            {/* Dashboard Content */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Agent Status */}
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Active Agents</div>
                {["Strategy Agent", "Script Agent", "Video Agent", "Publish Agent"].map((agent, i) => (
                  <div key={agent} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/20">
                    <span className="text-sm">{agent}</span>
                    <span className={`w-2 h-2 rounded-full ${i < 3 ? "bg-green-500 signal-pulse" : "bg-yellow-500"}`} />
                  </div>
                ))}
              </div>
              {/* Content Pipeline */}
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Content Pipeline</div>
                {["Draft: AI Trends 2026", "Video: Editing", "SEO: Optimizing", "Ready: Publish"].map((item, i) => (
                  <div key={item} className="py-2 px-3 rounded-lg bg-muted/30 border border-border/20">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${i === 3 ? "bg-green-500" : i === 0 ? "bg-blue-500" : "bg-amber-500"}`} />
                      <span className="text-sm">{item}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${i === 3 ? "w-full bg-green-500" : i === 0 ? "w-1/4 bg-blue-500" : "w-3/4 bg-amber-500"}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Platform Status */}
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Platforms</div>
                {[
                  { name: "YouTube", status: "Published" },
                  { name: "TikTok", status: "Scheduled" },
                  { name: "Twitter", status: "Queued" },
                  { name: "LinkedIn", status: "Draft" },
                ].map((p) => (
                  <div key={p.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/20">
                    <span className="text-sm">{p.name}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 ${
                      p.status === "Published" ? "border-green-500/50 text-green-400" :
                      p.status === "Scheduled" ? "border-blue-500/50 text-blue-400" :
                      p.status === "Queued" ? "border-amber-500/50 text-amber-400" :
                      "border-muted text-muted-foreground"
                    }`}>
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow under dashboard */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary/20 blur-3xl rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── Features Section ────────────────────────────────── */

function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 grid-pattern opacity-10" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="px-4 py-1.5 text-sm border-primary/40 bg-primary/5 text-primary mb-4">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mt-4">
            Everything You Need to
            <span className="text-primary"> Dominate</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            10 integrated systems working as one autonomous media intelligence platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Card className="group h-full border-border/30 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works Section ────────────────────────────── */

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-red-950/5 to-background" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="px-4 py-1.5 text-sm border-primary/40 bg-primary/5 text-primary mb-4">
            Process
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mt-4">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Four stages. Zero effort. Maximum compound growth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px border-t border-dashed border-border/50" />
              )}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-border/30 mb-4 relative">
                  <step.icon className={`w-8 h-8 ${step.color}`} />
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full gradient-red flex items-center justify-center text-[10px] font-bold text-white">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing Section ─────────────────────────────────── */

function PricingSection() {
  return (
    <section id="pricing" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 grid-pattern opacity-10" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="px-4 py-1.5 text-sm border-primary/40 bg-primary/5 text-primary mb-4">
            Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mt-4">
            Scale Your <span className="text-primary">Empire</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            From solo creator to full agency. Pick your tier and start building.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card
                className={`relative h-full flex flex-col border-border/30 bg-card/50 backdrop-blur-sm transition-all duration-300 ${
                  tier.popular
                    ? "border-primary/50 shadow-lg shadow-primary/10 scale-[1.02]"
                    : "hover:border-primary/20"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-red text-white px-3 py-0.5 text-xs">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                  <ul className="space-y-2.5">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <a href={tier.price === 0 ? "/auth/signup" : "/auth/signup"} className="w-full">
                    <Button
                      className={`w-full ${
                        tier.popular
                          ? "gradient-red text-white glow-red-sm"
                          : "border-border/50"
                      }`}
                      variant={tier.popular ? "default" : "outline"}
                    >
                      {tier.cta}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials Section ────────────────────────────── */

function TestimonialsSection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-red-950/5 to-background" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="px-4 py-1.5 text-sm border-primary/40 bg-primary/5 text-primary mb-4">
            Testimonials
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mt-4">
            Creators <span className="text-primary">Love</span> GhostStudio
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Join thousands of creators building their content empires.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Card className="h-full border-border/30 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-red flex items-center justify-center text-sm font-bold text-white">
                      {t.avatar}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{t.name}</CardTitle>
                      <CardDescription className="text-xs">{t.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.content}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Section ─────────────────────────────────────── */

function CTASection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-background to-background" />
        <div className="absolute inset-0 grid-pattern opacity-10" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-red glow-red mb-8">
            <Ghost className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            Ready to Build Your
            <br />
            <span className="text-primary text-glow-red">Content Empire?</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of creators using GhostStudio AI to produce, publish, and compound their media — autonomously.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/auth/signup">
              <Button size="lg" className="gradient-red text-white glow-red text-base px-8 h-12">
                Start Free — No Credit Card
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <a href="/dashboard">
              <Button size="lg" variant="outline" className="border-border/50 text-base px-8 h-12">
                Launch OS Dashboard
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────── */

function Footer() {
  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "Launch OS", href: "/dashboard" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Security", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border/30 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-red flex items-center justify-center">
                <Ghost className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">
                Ghost<span className="text-primary">Studio</span>
              </span>
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Autonomous media intelligence for the next generation of creators.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8 bg-border/30" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} GhostStudio AI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with <span className="text-primary">♥</span> for creators worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Page ───────────────────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
