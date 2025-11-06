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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://techready.tech'),
  title: {
    default: "TechReady - AI Interview Coach | Master Your Interview Skills",
    template: "%s | TechReady - AI Interview Coach"
  },
  description: "Practice behavioral and technical interviews with AI-powered feedback. Get real-time coaching, STAR method analysis, and personalized feedback to ace your next job interview.",
  keywords: [
    "interview practice",
    "AI interview coach",
    "behavioral interview",
    "technical interview",
    "interview preparation",
    "job interview practice",
    "STAR method",
    "coding interview",
    "mock interview",
    "interview feedback",
    "career coaching",
    "interview skills",
    "LeetCode practice",
    "system design interview",
    "AI career coach"
  ],
  authors: [{ name: "TechReady Team" }],
  creator: "TechReady",
  publisher: "TechReady",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/images/TechReady_letters.png',
    apple: '/images/TechReady_letters.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'TechReady - AI Interview Coach',
    title: 'TechReady - AI Interview Coach | Master Your Interview Skills',
    description: 'Practice behavioral and technical interviews with AI-powered feedback. Get real-time coaching, STAR method analysis, and personalized feedback to ace your next job interview.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TechReady - AI Interview Coach',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TechReady - AI Interview Coach | Master Your Interview Skills',
    description: 'Practice behavioral and technical interviews with AI-powered feedback. Ace your next job interview with personalized coaching.',
    images: ['/images/og-image.png'],
    creator: '@techready',
  },
  alternates: {
    canonical: '/',
  },
  category: 'Education',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
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
