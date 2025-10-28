import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SideButtons, { MobileMenuProvider } from "../components/SideButtons";
import Header from "../components/Header";
import AuthButtons from "../components/AuthButtons";
import MobileMenuButton from "../components/MobileMenuButton";
import GoogleAnalytics from "../components/GoogleAnalytics";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SplashProvider } from "@/components/SplashProvider";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Interview Coach - Master Your Interview Skills",
  description: "Practice behavioral and technical interviews with AI-powered feedback",
  icons: {
    icon: '/images/TechReady_letters.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <GoogleAnalytics />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SplashProvider>
              <MobileMenuProvider>
                <SideButtons />
                <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors lg:ml-24">
                  <div className="relative">
                    <Header />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <MobileMenuButton />
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <AuthButtons />
                    </div>
                  </div>
                </div>
                <main className="lg:ml-24">
                  {children}
                </main>
              </MobileMenuProvider>
            </SplashProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
