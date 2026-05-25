"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Star, Lock, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

const categories = [
  { id: "all", label: "All" },
  { id: "horror", label: "Horror" },
  { id: "motivation", label: "Motivation" },
  { id: "crypto", label: "Crypto" },
  { id: "anime", label: "Anime" },
  { id: "education", label: "Education" },
];

const templates = [
  { id: "1", name: "Dark Horror Stories", category: "horror", description: "Creepy narrations with dark visuals and atmospheric sounds", isPremium: false, usageCount: 12400, rating: 4.8 },
  { id: "2", name: "Jumpscare Compilation", category: "horror", description: "Quick cuts with intense jump scares and eerie music", isPremium: true, usageCount: 8900, rating: 4.7 },
  { id: "3", name: "Motivational Dark", category: "motivation", description: "Inspiring quotes over dramatic dark visuals with bass music", isPremium: false, usageCount: 18200, rating: 4.9 },
  { id: "4", name: "Hustle Grind", category: "motivation", description: "Fast-paced motivation with urban aesthetics and trap beats", isPremium: false, usageCount: 15600, rating: 4.6 },
  { id: "5", name: "Crypto Pulse", category: "crypto", description: "Market analysis style with charts, alerts, and commentary", isPremium: false, usageCount: 9800, rating: 4.5 },
  { id: "6", name: "DeFi Deep Dive", category: "crypto", description: "Technical breakdowns with animated diagrams", isPremium: true, usageCount: 5400, rating: 4.4 },
  { id: "7", name: "Anime Recap", category: "anime", description: "Episode recaps with dynamic transitions and dramatic narration", isPremium: true, usageCount: 22100, rating: 4.9 },
  { id: "8", name: "Anime Power Scaling", category: "anime", description: "Character comparison with tier lists and battle stats", isPremium: false, usageCount: 11700, rating: 4.6 },
  { id: "9", name: "Minimal Education", category: "education", description: "Clean whiteboard style with clear diagrams and explanations", isPremium: false, usageCount: 14300, rating: 4.7 },
  { id: "10", name: "Science Explained", category: "education", description: "Complex topics broken down with 3D animations", isPremium: true, usageCount: 7800, rating: 4.8 },
  { id: "11", name: "True Crime Files", category: "horror", description: "Documentary style crime stories with evidence overlays", isPremium: true, usageCount: 16200, rating: 4.9 },
  { id: "12", name: "Success Blueprint", category: "motivation", description: "Step-by-step success framework with blueprint visuals", isPremium: false, usageCount: 10100, rating: 4.5 },
];

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = templates.filter((t) => {
    const matchesCategory =
      activeCategory === "all" || t.category === activeCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Professional templates to kickstart your content
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className={
                  activeCategory === cat.id
                    ? "gradient-cyber text-primary-foreground"
                    : "border-border/50"
                }
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-border/30 bg-card/30 hover:bg-card/60 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg overflow-hidden"
            >
              {/* Thumbnail mock */}
              <div className="aspect-video relative bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                <div className="absolute inset-0 grid-pattern opacity-30" />
                <Eye className="w-8 h-8 text-muted-foreground/20 group-hover:text-primary/30 transition-colors" />
                {template.isPremium && (
                  <div className="absolute top-2 right-2">
                    <Badge className="gradient-gold text-gold-foreground text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      Pro
                    </Badge>
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  <Badge
                    variant="outline"
                    className="text-xs border-border/30 bg-background/80 backdrop-blur-sm capitalize"
                  >
                    {template.category}
                  </Badge>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {template.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-secondary text-secondary" />
                    {template.rating}
                  </span>
                  <span>{(template.usageCount / 1000).toFixed(1)}K uses</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
