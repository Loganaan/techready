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

  // Pre-fill form with initial params if provided
  useEffect(() => {
    if (isOpen && initialParams) {
      setCompany(initialParams.company || '');
      setRole(initialParams.role || '');
      setSeniority(initialParams.seniority || '');
      setJobDescription(initialParams.jobDescription || '');
    }
  }, [isOpen, initialParams]);

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
          {/* Company */}
          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Company (Optional)
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
              Role (Optional)
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
              Seniority Level (Optional)
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
              Job Description (Optional)
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
