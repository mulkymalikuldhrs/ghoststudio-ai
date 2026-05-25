"use client";

import { Button } from "@/components/ui/button";
import { Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-20 h-20 rounded-full gradient-cyber flex items-center justify-center mx-auto glow-cyber">
          <Ghost className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-muted-foreground text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => (window.location.href = "/dashboard")}
            className="gradient-cyber text-primary-foreground"
          >
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
