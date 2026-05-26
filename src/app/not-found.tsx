"use client";

import { Button } from "@/components/ui/button";
import { Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen relative">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="relative z-10 text-center space-y-6 max-w-md p-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl gradient-red glow-red mb-2">
          <Ghost className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-6xl font-bold text-primary text-glow-red">404</h2>
          <h3 className="text-2xl font-bold mt-2">Page Not Found</h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The page you are looking for does not exist or has been moved.
          Perhaps the ghosts took it?
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => (window.location.href = "/dashboard")}
            className="gradient-red text-white glow-red-sm"
          >
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")} className="border-border/50">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
