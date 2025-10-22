import type { Metadata } from "next";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "NAOS - 레시피 공유 플랫폼",
  description: "맛있는 레시피를 공유하고 발견하세요",
  authors: [{ name: "moni" }],
  openGraph: {
    title: "NAOS - 레시피 공유 플랫폼",
    description: "맛있는 레시피를 공유하고 발견하세요",
    images: ["/naos-thumbnail.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              {children}
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
