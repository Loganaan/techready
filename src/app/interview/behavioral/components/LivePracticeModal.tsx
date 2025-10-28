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
          {/* Session Parameters */}
          <div className="space-y-4">
            {/* Company */}
            <div>
              <label
                htmlFor="live-company"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Company (Optional)
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
                Role (Optional)
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
                Seniority Level (Optional)
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
                Job Description (Optional)
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

