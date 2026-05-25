"use client";

import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STRIPE_PLANS, type PlanType } from "@/lib/stripe";

const planOrder: PlanType[] = ["free", "creator", "pro", "agency"];

const planHighlights: Record<string, string> = {
  free: "",
  creator: "Popular",
  pro: "Best Value",
  agency: "Enterprise",
};

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative">
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
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Choose Your{" "}
            <span className="text-glow-cyber text-primary">Empire</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Start free, scale as you grow. No hidden fees. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {planOrder.map((planId, index) => {
            const plan = STRIPE_PLANS[planId];
            const highlight = planHighlights[planId];
            const isPro = planId === "pro";

            return (
              <motion.div
                key={planId}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] ${
                  isPro
                    ? "border-primary/50 bg-card/80 glow-cyber"
                    : "border-border/30 bg-card/30 hover:bg-card/50"
                }`}
              >
                {highlight && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
                      isPro
                        ? "gradient-cyber text-primary-foreground"
                        : "gradient-gold text-gold-foreground"
                    }`}
                  >
                    {highlight}
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground text-sm">
                        /mo
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          isPro ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    isPro
                      ? "gradient-cyber text-primary-foreground glow-cyber-sm"
                      : planId === "agency"
                        ? "gradient-gold text-gold-foreground"
                        : ""
                  }`}
                  variant={isPro ? "default" : "outline"}
                  asChild
                >
                  <a href="/auth/signup">
                    {plan.price === 0 ? (
                      "Get Started"
                    ) : (
                      <>
                        <Zap className="mr-2 w-4 h-4" />
                        Subscribe
                      </>
                    )}
                  </a>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
