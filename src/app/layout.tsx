import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { DataProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ColorProvider } from "@/components/providers/color-provider";
import { NotificationManager } from "@/components/features/NotificationManager";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zynorvia | Your Life OS",
  description: "A comprehensive Zynorvia system for tracking and improving your life.",
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <DataProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ColorProvider>
                <TooltipProvider>
                  <NotificationManager />
                  <AnalyticsTracker />
                  <div vaul-drawer-wrapper="">
                    {children}
                  </div>
                  <Toaster position="bottom-right" className="rounded-2xl" />
                </TooltipProvider>
              </ColorProvider>
            </ThemeProvider>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
