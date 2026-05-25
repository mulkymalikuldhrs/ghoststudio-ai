import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { QueryClientProviderWrapper } from "@/components/providers/query-provider";
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
  title: "GhostStudio AI - One Prompt. Infinite Content.",
  description:
    "AI-powered faceless content empire generator. Create viral videos for TikTok, YouTube Shorts, and Instagram Reels with a single prompt.",
  keywords: [
    "GhostStudio",
    "AI",
    "Content Generator",
    "Faceless",
    "Video",
    "TikTok",
    "YouTube Shorts",
    "Instagram Reels",
  ],
  icons: {
    icon: "/logo.svg",
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
      </body>
    </html>
  );
}
