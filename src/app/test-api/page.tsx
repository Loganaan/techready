'use client';

import { useState } from 'react';

interface Choice {
  text: string;
  isCorrect: boolean;
}

interface TestCase {
  input: string;
  output: string;
  explanation?: string;
}

interface Question {
  id: string;
  company: string;
  role: string;
  seniority: string;
  difficulty: string;
  topicTags: string[];
  format: string;
  prompt: string;
  starterCode?: string;
  solutionOutline?: string;
  testCases?: TestCase[];
  choices?: Choice[];
  explanation?: string;
  createdAt: string;
  updatedAt: string;
}

interface GenerateResponse {
  questions: Question[];
}

interface GetQuestionsResponse {
  items: Question[];
  total: number;
  limit: number;
  offset: number;
}

export default function TestAPIPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Form state for generating questions
  const [company, setCompany] = useState('Google');
  const [role, setRole] = useState('Software Engineer');
  const [seniority, setSeniority] = useState('mid');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(2);
  const [jobDescription, setJobDescription] = useState(
    'We are looking for a software engineer with strong problem-solving skills and experience in data structures and algorithms.'
  );

  // Form state for querying questions
  const [queryCompany, setQueryCompany] = useState('');
  const [queryRole, setQueryRole] = useState('');
  const [queryDifficulty, setQueryDifficulty] = useState('');
  const [queryTopic, setQueryTopic] = useState('');
  const [queryLimit, setQueryLimit] = useState(10);
  const [queryOffset, setQueryOffset] = useState(0);

  const handleGenerateQuestions = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setSelectedQuestion(null);

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company,
          role,
          seniority,
          difficulty,
          count,
          jobDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate questions');
      }

      const data: GenerateResponse = await response.json();
      setQuestions(data.questions);
      if (data.questions.length > 0) {
        setSelectedQuestion(data.questions[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQueryQuestions = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setSelectedQuestion(null);

    try {
      const params = new URLSearchParams();
      if (queryCompany) params.append('company', queryCompany);
      if (queryRole) params.append('role', queryRole);
      if (queryDifficulty) params.append('difficulty', queryDifficulty);
      if (queryTopic) params.append('topic', queryTopic);
      params.append('limit', queryLimit.toString());
      params.append('offset', queryOffset.toString());

      const response = await fetch(`/api/questions?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to query questions');
      }

      const data: GetQuestionsResponse = await response.json();
      setQuestions(data.items);
      if (data.items.length > 0) {
        setSelectedQuestion(data.items[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Technical Interview API Test Console
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Forms */}
          <div className="lg:col-span-1 space-y-6">
            {/* Generate Questions Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Generate Questions
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seniority
                  </label>
                  <select
                    value={seniority}
                    onChange={(e) => setSeniority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="intern">Intern</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid-Level</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Count (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <button
                  onClick={handleGenerateQuestions}
                  disabled={loading}
                  className="w-full bg-[rgba(76,166,38,1)] hover:bg-[rgba(76,166,38,0.9)] text-white py-2 px-4 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-none"
                >
                  {loading ? 'Generating...' : 'Generate Questions'}
                </button>
              </div>
            </div>

            {/* Query Questions Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Query Questions
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={queryCompany}
                    onChange={(e) => setQueryCompany(e.target.value)}
                    placeholder="e.g., Google"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={queryRole}
                    onChange={(e) => setQueryRole(e.target.value)}
                    placeholder="e.g., Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={queryDifficulty}
                    onChange={(e) => setQueryDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  >
                    <option value="">All</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={queryTopic}
                    onChange={(e) => setQueryTopic(e.target.value)}
                    placeholder="e.g., Arrays"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={queryLimit}
                    onChange={(e) => setQueryLimit(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Offset
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={queryOffset}
                    onChange={(e) => setQueryOffset(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <button
                  onClick={handleQueryQuestions}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-none"
                >
                  {loading ? 'Querying...' : 'Query Questions'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            )}

            {questions.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Results ({questions.length} questions)
                  </h2>
                </div>

                {/* Question Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Question:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {questions.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={() => setSelectedQuestion(q)}
                        className={`px-4 py-2 rounded-md font-medium cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                          selectedQuestion?.id === q.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Question {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Display */}
                {selectedQuestion && (
                  <div className="space-y-6">
                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                      <div>
                        <p className="text-sm text-gray-600">Company</p>
                        <p className="font-semibold text-gray-900">{selectedQuestion.company}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <p className="font-semibold text-gray-900">{selectedQuestion.role}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Seniority</p>
                        <p className="font-semibold text-gray-900 capitalize">{selectedQuestion.seniority}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Difficulty</p>
                        <p className="font-semibold">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              selectedQuestion.difficulty === 'easy'
                                ? 'bg-green-200 text-green-900'
                                : selectedQuestion.difficulty === 'medium'
                                ? 'bg-yellow-200 text-yellow-900'
                                : 'bg-red-200 text-red-900'
                            }`}
                          >
                            {selectedQuestion.difficulty.toUpperCase()}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Format</p>
                        <p className="font-semibold text-gray-900">{selectedQuestion.format}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ID</p>
                        <p className="font-mono text-xs text-gray-900">{selectedQuestion.id}</p>
                      </div>
                    </div>

                    {/* Topic Tags */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Topics
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedQuestion.topicTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-sm font-semibold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Prompt */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Problem Statement
                      </h3>
                      <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap text-gray-900">
                        {selectedQuestion.prompt}
                      </div>
                    </div>

                    {/* Starter Code */}
                    {selectedQuestion.starterCode && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Starter Code
                        </h3>
                        <pre className="p-4 bg-gray-900 text-gray-100 rounded-md overflow-x-auto">
                          <code>{selectedQuestion.starterCode}</code>
                        </pre>
                      </div>
                    )}

                    {/* Test Cases */}
                    {selectedQuestion.testCases && selectedQuestion.testCases.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Test Cases
                        </h3>
                        <div className="space-y-3">
                          {selectedQuestion.testCases.map((tc, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-md">
                              <p className="font-semibold text-sm text-gray-700 mb-2">
                                Test Case {idx + 1}
                              </p>
                              <div className="space-y-1 text-sm text-gray-900">
                                <p>
                                  <span className="font-medium">Input:</span>{' '}
                                  <code className="bg-white px-2 py-1 rounded text-gray-900">
                                    {tc.input}
                                  </code>
                                </p>
                                <p>
                                  <span className="font-medium">Expected Output:</span>{' '}
                                  <code className="bg-white px-2 py-1 rounded text-gray-900">
                                    {tc.output}
                                  </code>
                                </p>
                                {tc.explanation && (
                                  <p>
                                    <span className="font-medium">Explanation:</span>{' '}
                                    {tc.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Multiple Choice Options */}
                    {selectedQuestion.choices && selectedQuestion.choices.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Answer Choices
                        </h3>
                        <div className="space-y-2">
                          {selectedQuestion.choices.map((choice, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-md border-2 ${
                                choice.isCorrect
                                  ? 'border-green-600 bg-green-100'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-gray-900">
                                  {String.fromCharCode(65 + idx)}.
                                </span>
                                <span className="flex-1 text-gray-900">{choice.text}</span>
                                {choice.isCorrect && (
                                  <span className="text-green-700 font-bold text-sm">
                                    ✓ Correct
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Solution Outline */}
                    {selectedQuestion.solutionOutline && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Solution Outline
                        </h3>
                        <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap text-gray-900">
                          {selectedQuestion.solutionOutline}
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {selectedQuestion.explanation && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Explanation
                        </h3>
                        <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap text-gray-900">
                          {selectedQuestion.explanation}
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="text-xs text-gray-500 pt-4 border-t">
                      <p>Created: {new Date(selectedQuestion.createdAt).toLocaleString()}</p>
                      <p>Updated: {new Date(selectedQuestion.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && questions.length === 0 && !error && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">
                  No questions yet. Use the forms on the left to generate or query questions.
                </p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-4">Processing...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
