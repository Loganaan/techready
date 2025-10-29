'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface FullInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (params: InterviewParams) => void;
}

export interface InterviewParams {
  company: string;
  role: string;
  seniority: 'intern' | 'junior' | 'mid' | 'senior';
  jobDescriptionUrl?: string;
  jobDescription?: string;
  companyInfo?: string;
}

export default function FullInterviewModal({ isOpen, onClose, onStart }: FullInterviewModalProps) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [seniority, setSeniority] = useState<InterviewParams['seniority']>('junior');
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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
      if (result.data.companyInfo) setCompanyInfo(result.data.companyInfo);

      // Show confirmation view
      setShowConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse job posting. Please try manual input.');
      console.error('Parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const params: InterviewParams = {
        company: company.trim() || 'Unknown Company',
        role: role.trim() || 'Unknown Role',
        seniority,
        jobDescription: jobDescription.trim() || undefined,
        companyInfo: companyInfo.trim() || undefined,
        jobDescriptionUrl: jobDescriptionUrl.trim() || undefined,
      };

      onStart(params);
    } catch (err) {
      setError('Failed to start interview. Please try again.');
      console.error('Interview start error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !isParsing) {
      onClose();
      // Reset form
      setCompany('');
      setRole('');
      setSeniority('junior');
      setJobDescriptionUrl('');
      setJobDescription('');
      setCompanyInfo('');
      setError('');
      setShowConfirmation(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Start Full Interview
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Complete a behavioral interview followed by a technical interview
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Job Posting URL - Optional Auto-Fill */}
          <div>
            <label htmlFor="jobUrl" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 transition-all"
                disabled={isLoading || isParsing}
              />
              <button
                type="button"
                onClick={handleParseUrl}
                disabled={isLoading || isParsing || !jobDescriptionUrl.trim()}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap ${
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
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="company" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Company Name
            </label>
            <input
              type="text"
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Google, Amazon, Microsoft"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Role / Position
            </label>
            <input
              type="text"
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Software Engineer, Product Manager"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
          </div>

          {/* Seniority Level */}
          <div>
            <label htmlFor="seniority" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Seniority Level
            </label>
            <select
              id="seniority"
              value={seniority}
              onChange={(e) => setSeniority(e.target.value as InterviewParams['seniority'])}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isLoading}
            >
              <option value="intern">Intern</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior</option>
            </select>
          </div>

          {/* Job Description */}
          <div>
            <label htmlFor="jobDescription" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Job Description
            </label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
              disabled={isLoading}
            />
          </div>

          {/* Company Information */}
          <div>
            <label htmlFor="companyInfo" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Company Information
            </label>
            <textarea
              id="companyInfo"
              value={companyInfo}
              onChange={(e) => setCompanyInfo(e.target.value)}
              placeholder="Add information about company values, culture, mission, or any relevant context..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading || isParsing}
              className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isParsing}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[rgba(76,166,38,1)] to-[rgba(76,166,38,0.8)] text-white font-semibold hover:from-[rgba(76,166,38,0.9)] hover:to-[rgba(76,166,38,0.7)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Starting...
                </span>
              ) : (
                'Start Interview'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
