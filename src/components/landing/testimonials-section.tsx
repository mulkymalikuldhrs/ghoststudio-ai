"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Marcus Chen",
    handle: "@marcuscreates",
    avatar: "MC",
    quote:
      "Went from 0 to 500K followers in 3 months. GhostStudio generates my entire content calendar in minutes.",
    niche: "Motivation",
    color: "gradient-cyber",
  },
  {
    name: "Sarah K.",
    handle: "@darkhistories",
    avatar: "SK",
    quote:
      "The horror content it generates is genuinely unsettling. My audience can't tell it's AI. Revenue went 10x.",
    niche: "Horror",
    color: "gradient-gold",
  },
  {
    name: "Alex Rivera",
    handle: "@cryptosignals",
    avatar: "AR",
    quote:
      "I post 3 videos daily now instead of 1 per week. My crypto channel is dominating the algorithm.",
    niche: "Crypto",
    color: "gradient-cyber",
  },
  {
    name: "Yuki Tanaka",
    handle: "@animerecap",
    avatar: "YT",
    quote:
      "Perfect for anime recaps. The auto-subtitles and scene generation save me hours every single day.",
    niche: "Anime",
    color: "gradient-gold",
  },
  {
    name: "David Osei",
    handle: "@brainfuel",
    avatar: "DO",
    quote:
      "GhostStudio turned my teaching side hustle into a full-time income. The education niche templates are incredible.",
    niche: "Education",
    color: "gradient-cyber",
  },
  {
    name: "Luna M.",
    handle: "@nighttimefacts",
    avatar: "LM",
    quote:
      "$29/mo for unlimited viral content? This is the best ROI I've ever gotten on any tool. Period.",
    niche: "Facts",
    color: "gradient-gold",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 relative">
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
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Creators Are{" "}
            <span className="text-glow-gold text-secondary">Winning</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Real results from real creators building faceless empires with
            GhostStudio AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.handle}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="p-6 rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-300"
            >
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-4 h-4 fill-secondary text-secondary"
                  />
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${testimonial.color} flex items-center justify-center text-xs font-bold text-primary-foreground`}
                >
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.handle} · {testimonial.niche}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
