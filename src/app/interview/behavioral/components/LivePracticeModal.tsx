'use client';

import { useState } from 'react';
import { Mic, Video, X } from 'lucide-react';
import Button from '@/components/Button';

export interface SessionParams {
  company: string;
  role: string;
  seniority: string;
  jobDescription: string;
}

interface LivePracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (params?: SessionParams) => void;
}

export default function LivePracticeModal({ isOpen, onClose, onStart }: LivePracticeModalProps) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [seniority, setSeniority] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');

  const handleParseUrl = async () => {
    if (!jobDescriptionUrl.trim()) {
      setError('Please enter a job posting URL');
      return;
    }

    setError('');
    setIsParsing(true);

    try {
      const response = await fetch('/api/scrape-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobDescriptionUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse job posting');
      }

      // Populate form fields with scraped data
      if (result.data.company) setCompany(result.data.company);
      if (result.data.role) setRole(result.data.role);
      if (result.data.seniority) setSeniority(result.data.seniority);
      if (result.data.jobDescription) setJobDescription(result.data.jobDescription);

      // Show confirmation view
      setShowConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse job posting. Please try manual input.');
      console.error('Parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleStart = () => {
    // Pass parameters to onStart
    onStart({
      company,
      role,
      seniority,
      jobDescription,
    });

    // Reset form
    setCompany('');
    setRole('');
    setSeniority('');
    setJobDescription('');
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setCompany('');
    setRole('');
    setSeniority('');
    setJobDescription('');
    setJobDescriptionUrl('');
    setError('');
    setShowConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 lg:pl-24 overflow-y-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Live Practice Interview
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Get ready for a real-time voice interview session
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 cursor-pointer hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Job Posting URL - Optional Auto-Fill */}
          <div>
            <label htmlFor="jobUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Job Posting URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                id="jobUrl"
                value={jobDescriptionUrl}
                onChange={(e) => {
                  setJobDescriptionUrl(e.target.value);
                  setShowConfirmation(false);
                }}
                placeholder="https://example.com/careers/job-posting"
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 transition-all"
                disabled={isParsing}
              />
              <button
                type="button"
                onClick={handleParseUrl}
                disabled={isParsing || !jobDescriptionUrl.trim()}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap ${
                  showConfirmation
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 hover:bg-green-700 dark:bg-gray-500 dark:hover:bg-green-700 text-white'
                }`}
              >
                {isParsing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Parsing...
                  </span>
                ) : showConfirmation ? (
                  <span className="flex items-center gap-2">
                    <span>✓</span>
                    Parsed
                  </span>
                ) : (
                  'Parse'
                )}
              </button>
            </div>

            {/* Success Message */}
            {showConfirmation && (
              <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                Successfully parsed! Review and edit the fields below.
              </p>
            )}

            {/* Error Message */}
            {error && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Session Parameters */}
          <div className="space-y-4">
            {/* Company */}
            <div>
              <label
                htmlFor="live-company"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Company
              </label>
              <input
                id="live-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Google, Amazon, Microsoft"
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[rgba(76,166,38,1)] focus:border-transparent"
              />
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="live-role"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Role
              </label>
              <input
                id="live-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Software Engineer, Product Manager"
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[rgba(76,166,38,1)] focus:border-transparent"
              />
            </div>

            {/* Seniority */}
            <div>
              <label
                htmlFor="live-seniority"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Seniority Level
              </label>
              <select
                id="live-seniority"
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[rgba(76,166,38,1)] focus:border-transparent"
              >
                <option value="">Select level...</option>
                <option value="Intern">Intern</option>
                <option value="Junior">Junior</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior">Senior</option>
              </select>
            </div>

            {/* Job Description */}
            <div>
              <label
                htmlFor="live-jobDescription"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Job Description
              </label>
              <textarea
                id="live-jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here to get more tailored questions..."
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[rgba(76,166,38,1)] focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="bg-[rgba(76,166,38,0.1)] dark:bg-[rgba(76,166,38,0.2)] rounded-lg p-4 border border-[rgba(76,166,38,0.3)] dark:border-[rgba(76,166,38,0.4)]">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              What to expect:
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <li>• Real-time voice conversation with AI interviewer</li>
              <li>• 4 behavioral questions based on STAR method</li>
              <li>• Live transcription and feedback</li>
              <li>• Session recorded for later review</li>
              <li>• Approximately 15-20 minutes</li>
            </ul>
          </div>

          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Mic className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Please ensure your microphone is enabled and you&apos;re in a quiet environment
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex items-center gap-2 bg-[rgba(76,166,38,1)] hover:bg-[rgba(76,166,38,0.9)]"
            onClick={handleStart}
          >
            <Video className="w-4 h-4" />
            Start Session
          </Button>
        </div>
      </div>
    </div>
  );
}

