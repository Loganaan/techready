'use client';

import { Terminal, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
}

interface ConsoleOutputProps {
  testResults: TestResult[];
  output: string;
}

export default function ConsoleOutput({ testResults, output }: ConsoleOutputProps) {
  return (
    <div className="h-full lg:flex-1 flex flex-col min-h-0">
      <div className="bg-gray-800 dark:bg-gray-950 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
        <Terminal className="w-4 h-4 text-gray-400" />
        <span className="text-gray-300 text-sm font-semibold">Test Cases & Console</span>
      </div>

      <div className="flex-1 bg-gray-900 dark:bg-black p-4 overflow-y-auto font-mono text-sm">
        {testResults.length > 0 ? (
          <div className="space-y-3">
            {testResults.map((result, idx) => (
              <div key={idx} className="flex items-start gap-3">
                {result.passed ? (
                  <CheckCircle className="w-5 h-5 text-[rgba(76,166,38,1)] flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div
                    className={result.passed ? 'text-[rgba(76,166,38,1)]' : 'text-red-500'}
                  >
                    Test {idx + 1}: {result.passed ? 'Passed' : 'Failed'}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">Input: {result.input}</div>
                  {!result.passed && (
                    <>
                      <div className="text-gray-400 text-xs">Expected: {result.expected}</div>
                      <div className="text-gray-400 text-xs">Actual: {result.actual}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">
            {output || '// Test results will appear here when you run your code'}
          </div>
        )}
      </div>
    </div>
  );
}
