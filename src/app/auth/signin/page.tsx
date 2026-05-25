"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Ghost, Github, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full opacity-10 blur-3xl gradient-cyber" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg gradient-cyber flex items-center justify-center">
              <Ghost className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl">
              Ghost<span className="text-primary">Studio</span>
            </span>
          </a>
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to continue creating
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-8">
          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-11 border-border/50"
              onClick={() => {
                window.location.href = "/api/auth/signin/github";
              }}
            >
              <Github className="w-4 h-4" />
              Continue with GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-11 border-border/50"
              onClick={() => {
                window.location.href = "/api/auth/signin/google";
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="relative mb-6">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>

          {/* Email form */}
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              // Handle credentials sign in
              fetch("/api/auth/signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-background/50 border-border/50"
              />
            </div>
            <Button
              type="submit"
              className="w-full gradient-cyber text-primary-foreground h-11 glow-cyber-sm"
            >
              <Mail className="mr-2 w-4 h-4" />
              Sign In with Email
            </Button>
          </form>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <a
            href="/auth/signup"
            className="text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            Sign Up <ArrowRight className="w-3 h-3" />
          </a>
        </p>
      </motion.div>
    </div>
  );
}
