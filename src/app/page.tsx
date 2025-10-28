'use client';


import Link from "next/link";
import { useEffect, useState } from "react";
import { useSplash } from "@/components/SplashProvider";
import FullInterviewModal, { InterviewParams } from "@/components/FullInterviewModal";
import { useRouter } from "next/navigation";

export default function Home() {
  const { showSplash, setShowSplash } = useSplash();
  const router = useRouter();
  const [typedText, setTypedText] = useState("");
  const [headerTypedText, setHeaderTypedText] = useState("");
  const [spinCount, setSpinCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const splashText = "Welcome to TechReady";
  const headerText = "Ready to start your interview prep?";

  const handleFlowerClick = () => {
    setSpinCount(prev => prev + 1);
  };

  const handleStartFullInterview = (params: InterviewParams) => {
    // Store interview parameters in sessionStorage
    sessionStorage.setItem('fullInterviewParams', JSON.stringify(params));
    
    // Navigate to full interview session page
    router.push('/interview/full-session');
    
    setIsModalOpen(false);
  };

  useEffect(() => {
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < splashText.length) {
        setTypedText(splashText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => setShowSplash(false), 700); // Wait a bit after typing
      }
    }, 70);
    return () => clearInterval(typingInterval);
  }, [setShowSplash]);

  // Header text typing animation - starts after splash
  useEffect(() => {
    if (showSplash) {
      setHeaderTypedText("");
      return;
    }

    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < headerText.length) {
        setHeaderTypedText(headerText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);
    return () => clearInterval(typingInterval);
  }, [showSplash]);

  // Prevent scrolling on landing page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, []);

  // Handle splash screen
  useEffect(() => {
    if (!showSplash) {
      // Scroll to top when splash finishes
      window.scrollTo(0, 0);
    }
  }, [showSplash]);

  return (
    <div className="h-screen bg-white dark:bg-gray-900 transition-colors relative overflow-hidden flex flex-col items-center justify-center">
      {/* Splash Screen Overlay with typing animation */}
      <div
        className={`fixed inset-0 flex items-center justify-center transition-transform duration-700 ${showSplash ? 'translate-y-0' : '-translate-y-full'}`}
        style={{ backgroundColor: 'white', zIndex: 9999 }}
      >
        <style>{`
          .dark .splash-overlay-bg {
            background-color: lab(8.11897 0.811279 -12.254) !important;
          }
        `}</style>
        <div className="splash-overlay-bg absolute inset-0 -z-10" />
        <span className="text-6xl text-black dark:text-white whitespace-pre">
          {/* Typing animation with 'Ready' bold and colored */}
          {(() => {
            const readyIndex = splashText.indexOf('Ready');
            if (typedText.length <= readyIndex) {
              return typedText;
            }
            const beforeReady = typedText.slice(0, readyIndex);
            const readyTyped = typedText.slice(readyIndex, Math.min(readyIndex + 5, typedText.length));
            const afterReady = typedText.slice(readyIndex + 5);
            return <>
              {beforeReady}
              <b style={{ color: '#4CA626' }}>{readyTyped}</b>
              {afterReady}
            </>;
          })()}
          <span
            className={`inline-block ml-1 animate-pulse align-bottom rounded bg-black dark:bg-white`}
            style={{
              width: '0.5em',
              height: '1em',
              fontSize: '3.75rem',
              verticalAlign: 'bottom',
              display: 'inline-block',
              backgroundColor: typedText.length < splashText.length ? undefined : 'transparent'
            }}
          ></span>
        </span>
      </div>
      
      {/* Centered Content Container */}
      <div className="flex flex-col items-center justify-center w-full px-4">
        {/* Header Text with Typing Animation - Below Logo */}
        <div className="w-full flex justify-center mb-12">
          <p className="text-2xl text-black dark:text-white font-medium whitespace-nowrap">
            {headerTypedText}
            <span
              className={`inline-block ml-1 animate-pulse align-bottom rounded bg-black dark:bg-white`}
              style={{
                width: '0.5em',
                height: '1em',
                fontSize: '1.5rem',
                verticalAlign: 'bottom',
                display: 'inline-block',
                backgroundColor: headerTypedText.length < headerText.length ? undefined : 'transparent'
              }}
            ></span>
          </p>
        </div>

        {/* Main Content Area - Centered */}
        <div className="flex items-center justify-center gap-8 lg:gap-16">
          {/* Left Section - Behavioral Interview */}
          <Link href="/interview/behavioral" className="flex flex-col items-center group relative mt-8">
            <div className="flex items-center mb-8 relative">
              <div className="w-30 h-30 rounded-full bg-black dark:bg-white transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl" />
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-3 h-1 bg-black dark:bg-white -rotate-45 transition-colors" />
                <div className="w-6 h-1 bg-black dark:bg-white ml-6 transition-colors" />
                <div className="w-3 h-1 bg-black dark:bg-white rotate-45 transition-colors" />
              </div>
            </div>
            <div className="w-40 h-40 bg-black dark:bg-white transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl" />
            <span className="mt-4 text-black dark:text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Behavioral
            </span>
          </Link>

          {/* Center Section - Decorative */}
          <div className="hidden lg:flex flex-col items-center mx-10 mt-52">
            {/* Flower above the square and horizontal line */}
            <div className="relative w-60 flex flex-col items-center">
              {/* Flower SVG */}
              <div 
                className="absolute -top-28 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center cursor-pointer"
                onClick={handleFlowerClick}
              >
                <svg 
                  width="40" 
                  height="40" 
                  viewBox="0 0 40 40" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    transform: `rotate(${spinCount * 360}deg)`,
                    transition: 'transform 1s ease-in-out'
                  }}
                >
                  <circle cx="20" cy="20" r="6" fill="#FFD700" />
                  <ellipse cx="20" cy="8" rx="4" ry="7" fill="#4CA626" />
                  <ellipse cx="20" cy="32" rx="4" ry="7" fill="#4CA626" />
                  <ellipse cx="8" cy="20" rx="7" ry="4" fill="#4CA626" />
                  <ellipse cx="32" cy="20" rx="7" ry="4" fill="#4CA626" />
                  <ellipse cx="11.5" cy="11.5" rx="3" ry="5" fill="#4CA626" transform="rotate(-45 11.5 11.5)" />
                  <ellipse cx="28.5" cy="28.5" rx="3" ry="5" fill="#4CA626" transform="rotate(-45 28.5 28.5)" />
                  <ellipse cx="28.5" cy="11.5" rx="5" ry="3" fill="#4CA626" transform="rotate(45 28.5 11.5)" />
                  <ellipse cx="11.5" cy="28.5" rx="5" ry="3" fill="#4CA626" transform="rotate(45 11.5 28.5)" />
                </svg>
              </div>
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-12 h-12 bg-black dark:bg-white rounded-md transition-colors z-10" />
              <div className="flex flex-row items-center">
                <div className="w-60 h-4 bg-black dark:bg-white transition-colors" />
              </div>
              <div className="flex flex-row justify-between w-60 mt-0 items-end">
                <div className="w-4 h-20 bg-black dark:bg-white transition-colors" />
                <div className="w-4 h-20 bg-black dark:bg-white transition-colors" />
              </div>
            </div>
          </div>

          {/* Right Section - Technical Interview */}
          <Link href="/interview/technical" className="flex flex-col items-center group mt-8">
            <div className="flex flex-col items-center mb-8 group relative">
              {/* Circle with line (antenna) above the square, both move up on hover */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 transition-transform duration-300 group-hover:-translate-y-6">
                <div className="w-8 h-8 rounded-full border-4 border-white dark:border-gray-900 group-hover:animate-pulse transition-colors" style={{ backgroundColor: '#4CA626' }} />
                <div className="w-1 h-8 bg-black dark:bg-white transition-colors" />
              </div>
              <div className="w-30 h-30 bg-black dark:bg-white rounded-xl flex items-center justify-between transition-colors duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl relative z-20">
                <div className="w-16 h-16 rounded-full bg-black dark:bg-white ml-[-1rem] transition-colors duration-300" />
                <div className="w-16 h-16 rounded-full bg-black dark:bg-white mr-[-1rem] transition-colors duration-300" />
              </div>
            </div>
            <div className="absolute right-full ml-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-3 h-1 bg-black dark:bg-white -rotate-45 transition-colors" />
              <div className="w-6 h-1 bg-black dark:bg-white ml-6 transition-colors" />
              <div className="w-3 h-1 bg-black dark:bg-white rotate-45 transition-colors" />
            </div>
            <div className="w-40 h-40 bg-black dark:bg-white transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl" />
            <span className="mt-4 text-black dark:text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Technical
            </span>
          </Link>
        </div>

        {/* Full Interview Button */}
        <div className="mt-16 flex justify-center">
          <button
            onClick={() => setIsModalOpen(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05) rotate(-1deg)';
              e.currentTarget.style.background = 'linear-gradient(to bottom right, rgba(76,166,38,0.15), rgba(76,166,38,0.05))';
              e.currentTarget.style.borderColor = 'rgba(76,166,38,0.4)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
              const textSpan = e.currentTarget.querySelector('span');
              if (textSpan) textSpan.style.color = 'rgba(76,166,38,1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'linear-gradient(to bottom right, rgb(107, 114, 128), rgb(75, 85, 99))';
              e.currentTarget.style.borderColor = 'rgb(75, 85, 99)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              const textSpan = e.currentTarget.querySelector('span');
              if (textSpan) textSpan.style.color = 'rgb(243, 244, 246)';
            }}
            className="group relative px-8 py-4 rounded-2xl cursor-pointer"
            style={{
              background: 'linear-gradient(to bottom right, rgb(107, 114, 128), rgb(75, 85, 99))',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgb(75, 85, 99)',
              transition: 'all 300ms ease-out',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <span 
              className="flex items-center gap-3 font-semibold text-lg"
              style={{
                color: 'rgb(243, 244, 246)',
                transition: 'color 300ms ease-out'
              }}
            >
              Start Full Interview Process
            </span>
          </button>
        </div>
      </div>

      {/* Full Interview Modal */}
      <FullInterviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStart={handleStartFullInterview}
      />
    </div>
  );
}
