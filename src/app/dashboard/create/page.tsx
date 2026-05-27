"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileText,
  Palette,
  Rocket,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useProjectStore, type CreationStep } from "@/store/project-store";
import { useCreateProject, useGenerateScript } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const steps: { id: CreationStep; label: string; icon: React.ElementType }[] = [
  { id: "prompt", label: "Prompt", icon: Sparkles },
  { id: "script", label: "Script", icon: FileText },
  { id: "style", label: "Style", icon: Palette },
  { id: "generate", label: "Generate", icon: Rocket },
];

const niches = [
  { id: "horror", label: "Horror", emoji: "👻" },
  { id: "motivation", label: "Motivation", emoji: "🔥" },
  { id: "crypto", label: "Crypto", emoji: "₿" },
  { id: "anime", label: "Anime", emoji: "⛩️" },
  { id: "education", label: "Education", emoji: "📚" },
  { id: "facts", label: "Facts", emoji: "🧠" },
  { id: "story", label: "Story", emoji: "📖" },
  { id: "fitness", label: "Fitness", emoji: "💪" },
];

const voices = [
  { id: "alloy", label: "Alloy", desc: "Balanced & professional" },
  { id: "echo", label: "Echo", desc: "Deep & authoritative" },
  { id: "fable", label: "Fable", desc: "Warm & storytelling" },
  { id: "onyx", label: "Onyx", desc: "Dark & mysterious" },
  { id: "nova", label: "Nova", desc: "Energetic & youthful" },
  { id: "shimmer", label: "Shimmer", desc: "Soft & calming" },
];

const subtitleStyles = [
  { id: "default", label: "Default", desc: "Clean white text" },
  { id: "karaoke", label: "Karaoke", desc: "Word-by-word highlight" },
  { id: "glow", label: "Glow", desc: "Neon glow effect" },
  { id: "typewriter", label: "Typewriter", desc: "Typing animation" },
];

const templates = [
  { id: "dark-horror", name: "Dark Horror", category: "horror", premium: false },
  { id: "motivational-dark", name: "Motivational Dark", category: "motivation", premium: false },
  { id: "crypto-pulse", name: "Crypto Pulse", category: "crypto", premium: false },
  { id: "anime-recap", name: "Anime Recap", category: "anime", premium: true },
  { id: "minimal-education", name: "Minimal Education", category: "education", premium: false },
  { id: "cinematic-story", name: "Cinematic Story", category: "story", premium: true },
];

export default function CreatePage() {
  const store = useProjectStore();
  const router = useRouter();
  const [scriptOutput, setScriptOutput] = useState("");
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const currentStepIndex = steps.findIndex((s) => s.id === store.currentStep);

  const generateScriptMutation = useGenerateScript();
  const createProjectMutation = useCreateProject();

  const handleGenerateScript = async () => {
    store.setIsGeneratingScript(true);
    try {
      const data = await generateScriptMutation.mutateAsync({
        prompt: store.prompt,
        niche: store.niche,
        duration: store.duration,
      });
      if (data.script) {
        setScriptOutput(data.script);
        store.setRawScript(data.script);
        toast.success("Script generated successfully!");
      }
    } catch {
      // Fallback demo script if AI fails
      const demoScript = JSON.stringify({
        title: store.prompt,
        hook: "This will change everything you thought you knew...",
        scenes: [
          { id: 1, narration: "In a world where most people sleepwalk through life...", visual: "Dark cityscape at night with neon lights", duration: 5, subtitle: "Most people sleepwalk through life" },
          { id: 2, narration: "Only a few dare to question the system.", visual: "Silhouette figure standing before a massive screen", duration: 5, subtitle: "Only a few dare to question" },
          { id: 3, narration: "The truth is uncomfortable, but it sets you free.", visual: "Breaking chains animation with light rays", duration: 5, subtitle: "The truth sets you free" },
        ],
        cta: "Follow for more content that awakens your mind.",
        hashtags: ["#motivation", "#truth", "#mindset", "#viral"],
      }, null, 2);
      setScriptOutput(demoScript);
      store.setRawScript(demoScript);
      toast.info("Using demo script. AI service unavailable.");
    }
    store.setIsGeneratingScript(false);
  };

  const handleStartRender = async () => {
    try {
      // Create the project in the database
      const result = await createProjectMutation.mutateAsync({
        title: store.prompt.slice(0, 100),
        prompt: store.prompt,
        niche: store.niche,
      });

      if (result?.id) {
        setCreatedProjectId(result.id);
      }

      store.setIsRendering(true);
      store.setRenderProgress(0);

      // Simulate rendering progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          store.setIsRendering(false);
          toast.success("Video generated successfully!");
        }
        store.setRenderProgress(Math.min(Math.round(progress), 100));
      }, 500);
    } catch {
      toast.error("Failed to create project. Please try again.");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Create New Video</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Transform your idea into viral content in minutes
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  i <= currentStepIndex
                    ? "bg-primary/10 text-primary"
                    : "bg-muted/30 text-muted-foreground"
                }`}
              >
                <step.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`hidden sm:block h-px flex-1 ${
                    i < currentStepIndex ? "bg-primary/50" : "bg-border/30"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {/* PROMPT STEP */}
          {store.currentStep === "prompt" && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Video Topic / Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., Why 90% of people never escape the matrix..."
                    value={store.prompt}
                    onChange={(e) => store.setPrompt(e.target.value)}
                    className="min-h-32 bg-background/50 border-border/50 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Select Niche</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {niches.map((niche) => (
                      <button
                        key={niche.id}
                        onClick={() => store.setNiche(niche.id)}
                        className={`p-3 rounded-lg border text-sm text-left transition-all ${
                          store.niche === niche.id
                            ? "border-primary/50 bg-primary/10 text-primary glow-cyber-sm"
                            : "border-border/30 bg-card/30 hover:bg-card/50 text-muted-foreground"
                        }`}
                      >
                        <span className="text-lg">{niche.emoji}</span>
                        <div className="mt-1 font-medium">{niche.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Duration (seconds)</Label>
                  <Select
                    value={String(store.duration)}
                    onValueChange={(v) => store.setDuration(Number(v))}
                  >
                    <SelectTrigger className="w-full sm:w-48 bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="45">45 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    store.setCurrentStep("script");
                    if (!scriptOutput && !store.rawScript) {
                      handleGenerateScript();
                    }
                  }}
                  disabled={!store.prompt}
                  className="gradient-cyber text-primary-foreground glow-cyber-sm"
                >
                  Generate Script
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* SCRIPT STEP */}
          {store.currentStep === "script" && (
            <motion.div
              key="script"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="border-border/30 bg-card/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">AI Generated Script</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateScript}
                      disabled={store.isGeneratingScript}
                    >
                      {store.isGeneratingScript ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Regenerate
                    </Button>
                  </div>
                  {scriptOutput || store.rawScript ? (
                    <Textarea
                      value={scriptOutput || store.rawScript}
                      onChange={(e) => {
                        setScriptOutput(e.target.value);
                        store.setRawScript(e.target.value);
                      }}
                      className="min-h-64 font-mono text-sm bg-background/50 border-border/30 resize-none"
                    />
                  ) : (
                    <div className="min-h-64 flex items-center justify-center text-muted-foreground">
                      <Button
                        variant="outline"
                        onClick={handleGenerateScript}
                        disabled={store.isGeneratingScript}
                      >
                        {store.isGeneratingScript ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Generate Script with AI
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => store.setCurrentStep("prompt")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => store.setCurrentStep("style")}
                  disabled={!scriptOutput && !store.rawScript}
                  className="gradient-cyber text-primary-foreground glow-cyber-sm"
                >
                  Customize Style
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STYLE STEP */}
          {store.currentStep === "style" && (
            <motion.div
              key="style"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label>Template</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {templates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => store.setTemplateId(tmpl.id)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        store.templateId === tmpl.id
                          ? "border-primary/50 bg-primary/10 glow-cyber-sm"
                          : "border-border/30 bg-card/30 hover:bg-card/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{tmpl.name}</span>
                        {tmpl.premium && (
                          <Badge variant="outline" className="text-xs border-secondary/50 text-secondary">
                            Pro
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {tmpl.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Voice</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {voices.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => store.setVoiceId(voice.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        store.voiceId === voice.id
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/30 bg-card/30 hover:bg-card/50"
                      }`}
                    >
                      <div className="font-medium text-sm">{voice.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {voice.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subtitle Style</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {subtitleStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => store.setSubtitleStyle(style.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        store.subtitleStyle === style.id
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/30 bg-card/30 hover:bg-card/50"
                      }`}
                    >
                      <div className="font-medium text-sm">{style.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {style.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pacing</Label>
                <Select value={store.pacing} onValueChange={store.setPacing}>
                  <SelectTrigger className="w-full sm:w-48 bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow & Dramatic</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="fast">Fast & Energetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => store.setCurrentStep("script")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => store.setCurrentStep("generate")}
                  className="gradient-cyber text-primary-foreground glow-cyber-sm"
                >
                  Generate Video
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* GENERATE STEP */}
          {store.currentStep === "generate" && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="border-border/30 bg-card/30">
                <CardContent className="p-8 text-center space-y-6">
                  {!store.isRendering && store.renderProgress === 0 && (
                    <>
                      <div className="w-20 h-20 rounded-full gradient-cyber flex items-center justify-center mx-auto glow-cyber">
                        <Rocket className="w-10 h-10 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">
                          Ready to Generate
                        </h3>
                        <p className="text-muted-foreground">
                          Your video will be created with the selected settings.
                          This may take a few minutes.
                        </p>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                          <span className="text-foreground font-medium">Prompt:</span>{" "}
                          {store.prompt}
                        </p>
                        <p>
                          <span className="text-foreground font-medium">Voice:</span>{" "}
                          {store.voiceId}
                        </p>
                        <p>
                          <span className="text-foreground font-medium">Style:</span>{" "}
                          {store.subtitleStyle}
                        </p>
                      </div>
                      <Button
                        size="lg"
                        onClick={handleStartRender}
                        disabled={createProjectMutation.isPending}
                        className="gradient-cyber text-primary-foreground glow-cyber"
                      >
                        {createProjectMutation.isPending ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <Rocket className="w-5 h-5 mr-2" />
                        )}
                        Start Rendering
                      </Button>
                    </>
                  )}

                  {store.isRendering && (
                    <>
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Rendering...</h3>
                        <p className="text-muted-foreground">
                          AI is generating your video
                        </p>
                      </div>
                      <div className="max-w-md mx-auto">
                        <Progress
                          value={store.renderProgress}
                          className="h-3"
                        />
                        <p className="text-sm text-primary font-mono mt-2">
                          {store.renderProgress}%
                        </p>
                      </div>
                    </>
                  )}

                  {!store.isRendering && store.renderProgress === 100 && (
                    <>
                      <div className="w-20 h-20 rounded-full gradient-cyber flex items-center justify-center mx-auto glow-cyber">
                        <Check className="w-10 h-10 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">
                          Video Generated!
                        </h3>
                        <p className="text-muted-foreground">
                          Your faceless video is ready for download and posting.
                        </p>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Button
                          className="gradient-cyber text-primary-foreground glow-cyber-sm"
                          onClick={() => {
                            if (createdProjectId) {
                              router.push(`/dashboard/project/${createdProjectId}`);
                            }
                          }}
                        >
                          View Video
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => store.reset()}
                        >
                          Create Another
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {store.renderProgress === 0 && (
                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    onClick={() => store.setCurrentStep("style")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
