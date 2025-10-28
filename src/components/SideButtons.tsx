'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useTheme } from "next-themes";

// Create context for mobile menu state
const MobileMenuContext = createContext<{
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}>({
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: () => {},
});

export const useMobileMenu = () => useContext(MobileMenuContext);

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <MobileMenuContext.Provider value={{ isMobileMenuOpen, setIsMobileMenuOpen }}>
      {children}
    </MobileMenuContext.Provider>
  );
}

export default function SideButtons() {
  const pathname = usePathname();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();

  // Popup modal state
  const [showPopup, setShowPopup] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubmitError("Please enter a valid email address.");
      return;
    }
    try {
      await addDoc(collection(db, "WaitListEmails"), {
        email,
        timestamp: Timestamp.now(),
      });
      setSubmitted(true);
      // Only set don't show again on successful submit
      if (typeof window !== 'undefined') {
        localStorage.setItem('tr_waitlist_dont_show', 'true');
      }
    } catch (err) {
      setSubmitError("Failed to join waitlist. Please try again later.");
    }
  };

  // Show popup after splash (simulate with a short delay on mount)
  useEffect(() => {
    // Check localStorage for don't show again
    if (typeof window !== 'undefined') {
      const dontShow = localStorage.getItem('tr_waitlist_dont_show');
      if (dontShow === 'true') return;
    }
    const timer = setTimeout(() => setShowPopup(true), 1200);
    return () => clearTimeout(timer);
  }, []);
  const { resolvedTheme } = useTheme();
  
  // Prevent hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Use light mode colors during SSR to prevent hydration mismatch
  const getThemeColors = () => {
    if (!mounted) {
      return {
        background: 'linear-gradient(to bottom right, rgb(243, 244, 246), rgb(249, 250, 251))',
        border: 'rgb(229, 231, 235)',
        icon: 'rgb(55, 65, 81)'
      };
    }
    const isDark = resolvedTheme === 'dark';
    return isDark ? {
      background: 'linear-gradient(to bottom right, rgb(31, 41, 55), rgb(17, 24, 39))',
      border: 'rgb(55, 65, 81)',
      icon: 'rgb(209, 213, 219)'
    } : {
      background: 'linear-gradient(to bottom right, rgb(243, 244, 246), rgb(249, 250, 251))',
      border: 'rgb(229, 231, 235)',
      icon: 'rgb(55, 65, 81)'
    };
  };

  const colors = getThemeColors();
  
  // Safe theme check that works after hydration
  const isDarkMode = () => mounted && resolvedTheme === 'dark';
  
  const isActive = (path: string) => {
    // Special-case root so it doesn't match every path (startsWith('/'))
    if (path === '/') return pathname === '/' || pathname === '';
    if (path === '/dashboard') return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center relative animate-fade-in">
            {/* Top right close button */}
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl font-bold cursor-pointer"
              onClick={() => setShowPopup(false)}
              aria-label="Close popup"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-2 text-center">Welcome, join the waitlist!</h2>
            <p className="text-gray-700 dark:text-gray-200 text-center mb-4">
              Thanks for visiting TechReady, this application is still under development. Join our waitlist to get the latest updates!
            </p>
            {submitted ? (
              <div className="font-medium text-center mb-2" style={{ color: '#4CA626' }}>Thank you for joining the waitlist!</div>
            ) : (
              <>
                {submitError && (
                  <div className="text-red-600 text-center mb-2">{submitError}</div>
                )}
                <form className="w-full flex flex-col items-center" onSubmit={handleEmailSubmit}>
                  <input
                    type="email"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none mb-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    style={{ boxShadow: '0 0 0 2px #4CA62633' }}
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="w-full px-6 py-2 text-white rounded-lg font-medium transition hover:bg-green-700 hover:scale-[1.03] active:scale-95 focus:ring-2 focus:ring-green-400 cursor-pointer"
                    style={{ background: '#4CA626' }}
                    disabled={!email}
                  >
                    Join Waitlist
                  </button>
                  <button
                    type="button"
                    className="w-full mt-2 px-6 py-2 text-white rounded-lg font-medium transition shadow-lg hover:bg-green-700 hover:scale-[1.03] active:scale-95 focus:ring-2 focus:ring-green-400 cursor-pointer"
                    style={{ background: '#4CA626' }}
                    onClick={() => setShowPopup(false)}
                    aria-label="Close popup (below join waitlist)"
                  >
                    Close
                  </button>
                </form>
              </>
            )}
            {/* Only show the don't show again checkbox if not submitted */}
            {!submitted && (
              <div className="flex items-center mt-4 w-full">
                <input
                  id="dont-show-again"
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={e => {
                    setDontShowAgain(e.target.checked);
                    if (e.target.checked) {
                      localStorage.setItem('tr_waitlist_dont_show', 'true');
                      setShowPopup(false);
                    } else {
                      localStorage.removeItem('tr_waitlist_dont_show');
                    }
                  }}
                  className="mr-2"
                  style={{ accentColor: '#4CA626' }}
                />
                <label htmlFor="dont-show-again" className="text-gray-700 dark:text-gray-200 text-sm cursor-pointer select-none">
                  Don&#39;t show again
                </label>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-24 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 shadow-xl z-50 flex flex-col items-center pt-28 pb-8 gap-6 transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>

      {/* Navigation Buttons */}
      <nav className="flex flex-col items-center gap-4 flex-1">
        {/* Home Button */}
        <Link
          href="/"
          onMouseEnter={() => setHoveredButton('home')}
          onMouseLeave={() => setHoveredButton(null)}
          className="group relative w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer"
          style={{
            background: isActive('/')
              ? 'linear-gradient(to bottom right, #4CA62640, #4CA62626)'
              : hoveredButton === 'home'
              ? 'linear-gradient(to bottom right, #4CA62626, #4CA6260D)'
              : colors.background,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: isActive('/')
              ? '#4CA62680'
              : hoveredButton === 'home'
              ? '#4CA62666'
              : colors.border,
            transform: hoveredButton === 'home' ? 'scale(1.1) rotate(-3deg)' : 'scale(1)',
            transition: 'all 300ms ease-out',
            boxShadow: isActive('/')
              ? '0 0 20px #4CA6264D'
              : hoveredButton === 'home'
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          title="Home"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-7 h-7"
            style={{
              color: isActive('/') || hoveredButton === 'home'
                ? '#4CA626'
                : colors.icon,
              transform: hoveredButton === 'home' ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 300ms ease-out'
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.25L12 4.5l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V11.25z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 21V12h4.5v9" />
          </svg>
          {/* Tooltip */}
          <span 
            className="absolute left-full ml-4 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg whitespace-nowrap pointer-events-none shadow-lg"
            style={{
              opacity: hoveredButton === 'home' ? 1 : 0,
              transform: hoveredButton === 'home' ? 'translateX(4px)' : 'translateX(0)',
              transition: 'all 300ms ease-out'
            }}
          >
            Home
          </span>
        </Link>

        {/* Behavioral Interview Button */}
        <Link
          href="/interview/behavioral"
          onMouseEnter={() => setHoveredButton('behavioral')}
          onMouseLeave={() => setHoveredButton(null)}
          className="group relative w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer"
          style={{
            background: isActive('/interview/behavioral')
              ? 'linear-gradient(to bottom right, #4CA62640, #4CA62626)'
              : hoveredButton === 'behavioral'
              ? 'linear-gradient(to bottom right, #4CA62626, #4CA6260D)'
              : isDarkMode()
              ? 'linear-gradient(to bottom right, rgb(31, 41, 55), rgb(17, 24, 39))'
              : 'linear-gradient(to bottom right, rgb(243, 244, 246), rgb(249, 250, 251))',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: isActive('/interview/behavioral')
              ? '#4CA62680'
              : hoveredButton === 'behavioral'
              ? '#4CA62666'
              : isDarkMode()
              ? 'rgb(55, 65, 81)'
              : 'rgb(229, 231, 235)',
            transform: hoveredButton === 'behavioral' ? 'scale(1.1) rotate(-3deg)' : 'scale(1)',
            transition: 'all 300ms ease-out',
            boxShadow: isActive('/interview/behavioral')
              ? '0 0 20px #4CA6264D'
              : hoveredButton === 'behavioral'
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          title="Behavioral Interview Practice"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-7 h-7"
            style={{
              color: isActive('/interview/behavioral') || hoveredButton === 'behavioral'
                ? '#4CA626'
                : isDarkMode()
                ? 'rgb(209, 213, 219)'
                : 'rgb(55, 65, 81)',
              transform: hoveredButton === 'behavioral' ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 300ms ease-out'
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
            />
          </svg>
          {/* Tooltip */}
          <span 
            className="absolute left-full ml-4 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg whitespace-nowrap pointer-events-none shadow-lg"
            style={{
              opacity: hoveredButton === 'behavioral' ? 1 : 0,
              transform: hoveredButton === 'behavioral' ? 'translateX(4px)' : 'translateX(0)',
              transition: 'all 300ms ease-out'
            }}
          >
            Behavioral
          </span>
        </Link>

        {/* Technical Interview Button */}
        <Link
          href="/interview/technical"
          onMouseEnter={() => setHoveredButton('technical')}
          onMouseLeave={() => setHoveredButton(null)}
          className="group relative w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer"
          style={{
            background: isActive('/interview/technical')
              ? 'linear-gradient(to bottom right, #4CA62640, #4CA62626)'
              : hoveredButton === 'technical'
              ? 'linear-gradient(to bottom right, #4CA62626, #4CA6260D)'
              : isDarkMode()
              ? 'linear-gradient(to bottom right, rgb(31, 41, 55), rgb(17, 24, 39))'
              : 'linear-gradient(to bottom right, rgb(243, 244, 246), rgb(249, 250, 251))',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: isActive('/interview/technical')
              ? '#4CA62680'
              : hoveredButton === 'technical'
              ? '#4CA62666'
              : isDarkMode()
              ? 'rgb(55, 65, 81)'
              : 'rgb(229, 231, 235)',
            transform: hoveredButton === 'technical' ? 'scale(1.1) rotate(-3deg)' : 'scale(1)',
            transition: 'all 300ms ease-out',
            boxShadow: isActive('/interview/technical')
              ? '0 0 20px #4CA6264D'
              : hoveredButton === 'technical'
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          title="Technical Interview Practice"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-7 h-7"
            style={{
              color: isActive('/interview/technical') || hoveredButton === 'technical'
                ? '#4CA626'
                : isDarkMode()
                ? 'rgb(209, 213, 219)'
                : 'rgb(55, 65, 81)',
              transform: hoveredButton === 'technical' ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 300ms ease-out'
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
            />
          </svg>
          {/* Tooltip */}
          <span 
            className="absolute left-full ml-4 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg whitespace-nowrap pointer-events-none shadow-lg"
            style={{
              opacity: hoveredButton === 'technical' ? 1 : 0,
              transform: hoveredButton === 'technical' ? 'translateX(4px)' : 'translateX(0)',
              transition: 'all 300ms ease-out'
            }}
          >
            Technical
          </span>
        </Link>

        {/* About Button */}
        <Link
          href="/about"
          onMouseEnter={() => setHoveredButton('about')}
          onMouseLeave={() => setHoveredButton(null)}
          className="group relative w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer"
          style={{
            background: isActive('/about')
              ? 'linear-gradient(to bottom right, #4CA62633, #4CA6260D)'
              : hoveredButton === 'about'
              ? 'linear-gradient(to bottom right, #4CA62626, #4CA6260D)'
              : colors.background,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: isActive('/about')
              ? '#4CA62699'
              : hoveredButton === 'about' 
              ? '#4CA62666' 
              : colors.border,
            transform: hoveredButton === 'about' ? 'scale(1.1) rotate(-3deg)' : 'scale(1)',
            transition: 'all 300ms ease-out',
            boxShadow: isActive('/about')
              ? '0 0 20px #4CA6264D'
              : hoveredButton === 'about'
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          title="About"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-7 h-7"
            style={{
              color: isActive('/about') || hoveredButton === 'about' 
                ? '#4CA626' 
                : colors.icon,
              transform: hoveredButton === 'about' ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 300ms ease-out'
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          {/* Tooltip */}
          <span 
            className="absolute left-full ml-4 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg whitespace-nowrap pointer-events-none shadow-lg"
            style={{
              opacity: hoveredButton === 'about' ? 1 : 0,
              transform: hoveredButton === 'about' ? 'translateX(4px)' : 'translateX(0)',
              transition: 'all 300ms ease-out'
            }}
          >
            About
          </span>
        </Link>
      </nav>

      {/* Theme Toggle at Bottom */}
      <div className="mt-auto">
        <ThemeToggle />
      </div>
    </div>
    </>
  );
}
