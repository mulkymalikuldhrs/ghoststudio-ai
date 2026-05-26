import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { QueryClientProviderWrapper } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GhostStudio AI v2.0 — Autonomous Media Intelligence OS",
  description:
    "One OS. Infinite Media Intelligence. Autonomous content + video creation with 15+ AI agents, memory-driven voice, and 9+ platform publishing.",
  keywords: [
    "GhostStudio",
    "AI",
    "Content OS",
    "Media Intelligence",
    "Video Generator",
    "Faceless",
    "YouTube",
    "TikTok",
    "Instagram Reels",
    "Auto Publish",
    "AI Agents",
    "Autonomous",
  ],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "GhostStudio AI v2.0 — Autonomous Media Intelligence OS",
    description:
      "One OS. Infinite Media Intelligence. Autonomous content + video creation with 15+ AI agents, memory-driven voice, and 9+ platform publishing.",
    type: "website",
    siteName: "GhostStudio AI v2.0",
  },
  twitter: {
    card: "summary_large_image",
    title: "GhostStudio AI v2.0 — Autonomous Media Intelligence OS",
    description:
      "One OS. Infinite Media Intelligence. Autonomous content + video creation with 15+ AI agents, memory-driven voice, and 9+ platform publishing.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <QueryClientProviderWrapper>
              {children}
            </QueryClientProviderWrapper>
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: "bg-card text-card-foreground border-border",
              }}
            />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
