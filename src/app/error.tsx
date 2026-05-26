"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Ghost } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen relative">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="relative z-10 text-center space-y-6 max-w-md p-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20 mb-2">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {error.message ?? "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="gradient-red text-white glow-red-sm"
          >
            Try Again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")} className="border-border/50">
            Go Home
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Ghost className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">GhostStudio AI v2.0</span>
        </div>
      </div>
    </div>
  );
}
