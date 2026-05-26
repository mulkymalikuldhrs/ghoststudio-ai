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
  title: "AI Media Intelligence OS — Autonomous Media Operating System",
  description:
    "Memory-driven autonomous media operating system. Authority compounding engine with AI-powered content pipeline, scheduling, analytics, and energy management.",
  keywords: [
    "AI Media OS",
    "Content Intelligence",
    "Autonomous Publishing",
    "Content Strategy",
    "Media Operating System",
    "Memory-Driven Content",
  ],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AI Media Intelligence OS — Autonomous Media Operating System",
    description:
      "Memory-driven autonomous media operating system. Authority compounding engine with AI-powered content pipeline, scheduling, analytics, and energy management.",
    type: "website",
    siteName: "AI Media Intelligence OS",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Media Intelligence OS — Autonomous Media Operating System",
    description:
      "Memory-driven autonomous media operating system. Authority compounding engine with AI-powered content pipeline, scheduling, analytics, and energy management.",
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
