'use client';

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useWaitlist } from "@/contexts/WaitlistContext";

export default function WaitlistPopup() {
  const { isWaitlistOpen, closeWaitlist } = useWaitlist();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
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
      // Reset after a delay
      setTimeout(() => {
        setSubmitted(false);
        setEmail("");
        closeWaitlist();
      }, 2000);
    } catch (err) {
      setSubmitError("Failed to join waitlist. Please try again later.");
    }
  };

  if (!isWaitlistOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center relative animate-fade-in">
        {/* Top right close button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl font-bold cursor-pointer"
          onClick={closeWaitlist}
          aria-label="Close popup"
        >
          ×
        </button>
        <h2 className="text-xl font-semibold mb-2 text-center">Join the Waitlist!</h2>
        <p className="text-gray-700 dark:text-gray-200 text-center mb-4">
          This feature is currently under development. Join our waitlist to get notified when it&apos;s ready!
        </p>
        {submitted ? (
          <div className="font-medium text-center mb-2" style={{ color: '#4CA626' }}>
            Thank you for joining the waitlist!
          </div>
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
                onClick={closeWaitlist}
                aria-label="Close popup"
              >
                Close
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
