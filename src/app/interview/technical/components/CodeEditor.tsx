'use client';

import { Code2, Play, Lightbulb, RotateCcw } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';

interface CodeEditorProps {
  code: string;
  onCodeChange: (value: string) => void;
  onRunCode: () => void;
  onRequestFeedback: () => void;
  onReset: () => void;
  isRunning: boolean;
  isFetchingFeedback: boolean;
}

export default function CodeEditor({
  code,
  onCodeChange,
  onRunCode,
  onRequestFeedback,
  onReset,
  isRunning,
  isFetchingFeedback,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="h-full lg:flex-1 flex flex-col min-h-0 border-b border-gray-300 dark:border-gray-700">
      {/* Editor Toolbar with Actions */}
      <div className="bg-gray-800 dark:bg-gray-950 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm font-mono">
              solution.py
            </span>
          </div>
          <div className="bg-gray-700 dark:bg-gray-900 text-gray-300 text-sm rounded px-3 py-1">
            Python
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onRunCode}
            disabled={isRunning}
            className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg font-medium text-white bg-[rgba(76,166,38,1)] hover:bg-[rgba(76,166,38,0.9)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={onRequestFeedback}
            disabled={isFetchingFeedback}
            className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-md disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            <Lightbulb className="w-4 h-4" />
            {isFetchingFeedback ? 'Loading...' : 'Feedback'}
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language="python"
          value={code}
          onChange={(value) => onCodeChange(value || '')}
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
