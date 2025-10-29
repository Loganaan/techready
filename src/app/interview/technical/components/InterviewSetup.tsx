'use client';

import { useState } from 'react';

interface InterviewSetupProps {
  onSubmit: (data: {
    company: string;
    role: string;
    seniority: string;
    difficulty: string;
    jobDescription: string;
    count: number;
    format: string;
  }) => void;
  loading: boolean;
  error: string | null;
}

export default function InterviewSetup({ onSubmit, loading, error }: InterviewSetupProps) {
  const [company, setCompany] = useState('Google');
  const [role, setRole] = useState('Software Engineer');
  const [seniority, setSeniority] = useState('mid');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(3);
  const [format, setFormat] = useState('coding');
  const [jobDescription, setJobDescription] = useState(
    'We are looking for a software engineer with strong problem-solving skills and experience in data structures and algorithms. The ideal candidate will have experience with system design and can write clean, efficient code.'
  );
  const [jobDescriptionUrl, setJobDescriptionUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [parseError, setParseError] = useState('');

  const handleParseUrl = async () => {
    if (!jobDescriptionUrl.trim()) {
      setParseError('Please enter a job posting URL');
      return;
    }

    setParseError('');
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
      if (result.data.seniority) {
        // Map seniority values to match the form options
        const seniorityMap: Record<string, string> = {
          'intern': 'intern',
          'junior': 'junior',
          'mid': 'mid',
          'senior': 'senior'
        };
        setSeniority(seniorityMap[result.data.seniority] || 'mid');
      }
      if (result.data.jobDescription) setJobDescription(result.data.jobDescription);

      // Show confirmation view
      setShowConfirmation(true);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse job posting. Please try manual input.');
      console.error('Parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      company,
      role,
      seniority,
      difficulty,
      jobDescription,
      count,
      format,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Technical Interview Setup
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Configure your interview parameters to generate personalized coding questions
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Posting URL - Optional Auto-Fill */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Job Posting URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={jobDescriptionUrl}
                  onChange={(e) => {
                    setJobDescriptionUrl(e.target.value);
                    setShowConfirmation(false);
                  }}
                  placeholder="https://example.com/careers/job-posting"
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 dark:bg-gray-700 text-black dark:text-white transition-all"
                  disabled={isParsing || loading}
                />
                <button
                  type="button"
                  onClick={handleParseUrl}
                  disabled={isParsing || loading || !jobDescriptionUrl.trim()}
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

              {/* Parse Error Message */}
              {parseError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {parseError}
                </p>
              )}
            </div>

            {/* Company & Role Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  placeholder="e.g., Google, Meta, Amazon"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(76,166,38,1)] dark:bg-gray-700 text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  placeholder="e.g., Software Engineer, SDE"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(76,166,38,1)] dark:bg-gray-700 text-black dark:text-white"
                />
              </div>
            </div>

            {/* Seniority & Difficulty Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Seniority Level
                </label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(76,166,38,1)] dark:bg-gray-700 text-black dark:text-white"
                >
                  <option value="intern">Intern</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid-Level</option>
                  <option value="senior">Senior</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(76,166,38,1)] dark:bg-gray-700 text-black dark:text-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Question Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(76,166,38,1)] dark:bg-gray-700 text-black dark:text-white"
                />
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Question Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(76,166,38,1)] dark:bg-gray-700 text-black dark:text-white"
              >
                <option value="coding">Coding Only</option>
                <option value="multiple-choice">Multiple Choice Only</option>
                <option value="free-response">System Design / Free Response</option>
                <option value="mixed">Mixed (All Types)</option>
              </select>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                required
                rows={5}
                minLength={50}
                placeholder="Describe the role, required skills, and technical areas to focus on..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(76,166,38,1)] dark:bg-gray-700 text-black dark:text-white resize-none"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Minimum 50 characters. Be specific about technologies and skills.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[rgba(76,166,38,1)] hover:bg-[rgba(76,166,38,0.9)] text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating Questions with AI...
                </span>
              ) : (
                'Start Technical Interview'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Questions will be generated using Gemini AI based on your parameters
        </p>
      </div>
    </div>
  );
}
