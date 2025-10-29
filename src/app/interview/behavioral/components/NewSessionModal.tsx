'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/Button';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (params: SessionParams) => void;
  initialParams?: Partial<SessionParams>;
}

export interface SessionParams {
  company: string;
  role: string;
  seniority: string;
  jobDescription: string;
}

export default function NewSessionModal({ isOpen, onClose, onStart, initialParams }: NewSessionModalProps) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [seniority, setSeniority] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form with initial params if provided
  useEffect(() => {
    if (isOpen && initialParams) {
      setCompany(initialParams.company || '');
      setRole(initialParams.role || '');
      setSeniority(initialParams.seniority || '');
      setJobDescription(initialParams.jobDescription || '');
    }
  }, [isOpen, initialParams]);

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
    // All fields are optional, so we can start even with empty values
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
              New Interview Session
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize your behavioral interview practice
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
                onMouseEnter={(e) => {
                  if (!isParsing && jobDescriptionUrl.trim()) {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.background = 'linear-gradient(to bottom right, #4CA62626, #4CA6260D)';
                    e.currentTarget.style.borderColor = '#4CA62666';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                    const textSpan = e.currentTarget.querySelector('span');
                    if (textSpan) textSpan.style.color = 'rgba(76,166,38,1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isParsing && jobDescriptionUrl.trim()) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'linear-gradient(to bottom right, rgb(107, 114, 128), rgb(75, 85, 99))';
                    e.currentTarget.style.borderColor = 'rgb(75, 85, 99)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    const textSpan = e.currentTarget.querySelector('span');
                    if (textSpan) textSpan.style.color = 'white';
                  }
                }}
                className={`px-6 py-2.5 rounded-lg font-semibold whitespace-nowrap ${
                  isParsing || !jobDescriptionUrl.trim() 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer'
                }`}
                style={{
                  background: 'linear-gradient(to bottom right, rgb(107, 114, 128), rgb(75, 85, 99))',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'rgb(75, 85, 99)',
                  transition: 'all 300ms ease-out',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                {isParsing ? (
                  <span className="flex items-center gap-2 text-white">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Parsing...
                  </span>
                ) : showConfirmation ? (
                  <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <span>✓</span>
                    Parsed
                  </span>
                ) : (
                  <span className="text-white" style={{ transition: 'color 300ms ease-out' }}>
                    Parse
                  </span>
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

          {/* Company */}
          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Company
            </label>
            <input
              id="company"
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
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Role
            </label>
            <input
              id="role"
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
              htmlFor="seniority"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Seniority Level
            </label>
            <select
              id="seniority"
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
              htmlFor="jobDescription"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Job Description
            </label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to get more tailored questions..."
              rows={4}
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[rgba(76,166,38,1)] focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-[rgba(76,166,38,0.1)] dark:bg-[rgba(76,166,38,0.2)] rounded-lg p-4 border border-[rgba(76,166,38,0.3)] dark:border-[rgba(76,166,38,0.4)]">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Tip:</strong> Providing more details helps the AI generate more relevant and targeted behavioral interview questions for your specific situation.
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
            className="bg-[rgba(76,166,38,1)] hover:bg-[rgba(76,166,38,0.9)]"
            onClick={handleStart}
          >
            Start Interview
          </Button>
        </div>
      </div>
    </div>
  );
}
