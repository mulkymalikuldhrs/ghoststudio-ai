"use client";

import { motion } from "framer-motion";
import { MessageSquare, Cpu, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Enter Your Prompt",
    description:
      "Type your video idea, select a niche, and choose your target platform. Our AI understands context and trends.",
    accent: "from-primary to-primary/60",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI Generates",
    description:
      "GhostStudio AI crafts the script, generates visuals, adds voiceover, creates subtitles, and assembles everything.",
    accent: "from-secondary to-secondary/60",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Export & Post",
    description:
      "Download your video in any format or auto-publish directly to TikTok, YouTube Shorts, and Instagram Reels.",
    accent: "from-primary to-secondary",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-secondary/10 text-secondary border border-secondary/20 mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Three Steps to{" "}
            <span className="text-glow-gold text-secondary">
              Viral Content
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From idea to published video in under 2 minutes. No editing skills
            required.
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-primary/0 via-primary/30 to-secondary/0" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                {/* Step connector dot */}
                <div className="hidden lg:flex absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${step.accent} flex items-center justify-center glow-cyber-sm`}
                  >
                    <step.icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>

                <div className="text-center p-8 rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300">
                  {/* Step number */}
                  <div
                    className={`text-6xl font-bold bg-gradient-to-br ${step.accent} bg-clip-text text-transparent mb-4`}
                  >
                    {step.number}
                  </div>

                  {/* Mobile icon */}
                  <div className="lg:hidden mb-4">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.accent} flex items-center justify-center mx-auto glow-cyber-sm`}
                    >
                      <step.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
