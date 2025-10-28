'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut } from 'lucide-react';

export default function AuthButtons() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-2.5 py-2.5 lg:px-6 lg:py-3 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-md"
        title="Sign Out"
      >
        <LogOut className="w-5 h-5" />
        <span className="hidden lg:inline">Sign Out</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="flex items-center gap-2 px-2.5 py-2.5 lg:px-6 lg:py-3 rounded-lg bg-[rgba(76,166,38,1)] hover:bg-[rgba(76,166,38,0.9)] text-white font-semibold transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-lg shadow-sm"
      title="Sign In"
    >
      <LogIn className="w-5 h-5" />
      <span className="hidden lg:inline">Sign In</span>
    </button>
  );
}
