'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import SessionHeader from './components/SessionHeader';
import ProblemPanel from './components/ProblemPanel';
import CodeEditor from './components/CodeEditor';
import ConsoleOutput from './components/ConsoleOutput';
import ProctorModal from './components/ProctorModal';
import ProctorHintBox from './components/ProctorHintBox';
import StatusBar from './components/StatusBar';
import InterviewSetup from './components/InterviewSetup';
import MultipleChoiceQuestion from './components/MultipleChoiceQuestion';
import FreeResponseQuestion from './components/FreeResponseQuestion';
import InterviewSummary from './components/InterviewSummary';

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognitionInstance;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognitionInstance;
    };
  }
}

// Type for SpeechRecognition instance
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

// Type for SpeechRecognition events
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface TestCase {
  input: string;
  output: string;
  explanation?: string;
}

interface Choice {
  label: string;
  text: string;
  correct?: boolean;
}

interface ApiQuestion {
  id: string;
  company: string;
  role: string;
  seniority?: string;
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
}

// Mock problem data (fallback)
const MOCK_PROBLEM = {
  title: 'Two Sum',
  difficulty: 'Easy',
  description:
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
  examples: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      input: 'nums = [3,2,4], target = 6',
      output: '[1,2]',
      explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
    },
  ],
  constraints: [
    '2 ≤ nums.length ≤ 10⁴',
    '-10⁹ ≤ nums[i] ≤ 10⁹',
    '-10⁹ ≤ target ≤ 10⁹',
    'Only one valid answer exists',
  ],
  starterCode: {
    javascript: `function twoSum(nums, target) {\n    // TODO: Write your solution here\n    \n}`,
    python: `def two_sum(nums, target):\n    # TODO: Write your solution here\n    pass`,
    java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // TODO: Write your solution here\n        \n    }\n}`,
  },
};

interface QuestionResult {
  questionNumber: number;
  format: string;
  difficulty: string;
  topicTags: string[];
  status: 'correct' | 'partial' | 'incorrect' | 'submitted';
  score?: number;
  details?: string;
}

/**
 * Determines the best question format based on company and role
 * Returns 'coding', 'multiple-choice', or 'free-response'
 */
function determineQuestionFormat(company: string, role: string, jobDescription: string): string {
  const companyLower = company.toLowerCase();
  const roleLower = role.toLowerCase();
  const descLower = jobDescription.toLowerCase();
  
  // Companies known for system design questions (for senior+ roles)
  const systemDesignCompanies = [
    'google', 'meta', 'facebook', 'amazon', 'microsoft', 'netflix', 'uber', 
    'airbnb', 'linkedin', 'twitter', 'stripe', 'salesforce', 'oracle'
  ];
  
  // Companies/roles known for leetcode-style coding
  const leetcodeCompanies = [
    'google', 'meta', 'facebook', 'amazon', 'apple', 'microsoft', 'netflix',
    'adobe', 'nvidia', 'intel', 'twitter', 'snap', 'pinterest', 'reddit'
  ];
  
  // Check if job description mentions specific interview types
  const mentionsSystemDesign = descLower.includes('system design') || 
                                descLower.includes('architecture') ||
                                descLower.includes('scalability') ||
                                descLower.includes('distributed systems');
  
  const mentionsAlgorithms = descLower.includes('algorithm') ||
                             descLower.includes('data structure') ||
                             descLower.includes('leetcode') ||
                             descLower.includes('coding challenge');
  
  const isSenior = roleLower.includes('senior') || 
                   roleLower.includes('lead') || 
                   roleLower.includes('principal') ||
                   roleLower.includes('staff') ||
                   roleLower.includes('architect');
  
  // Decision logic
  // 1. If explicitly mentioned in description, use that
  if (mentionsSystemDesign && isSenior) {
    return 'free-response'; // System design
  }
  
  if (mentionsAlgorithms) {
    return 'coding'; // Leetcode-style
  }
  
  // 2. Check company patterns
  const isSystemDesignCompany = systemDesignCompanies.some(c => companyLower.includes(c));
  const isLeetcodeCompany = leetcodeCompanies.some(c => companyLower.includes(c));
  
  // Senior roles at FAANG-like companies often get system design
  if (isSenior && isSystemDesignCompany) {
    return 'free-response';
  }
  
  // Most tech companies use leetcode-style for coding rounds
  if (isLeetcodeCompany) {
    return 'coding';
  }
  
  // 3. Role-based defaults
  if (roleLower.includes('frontend') || roleLower.includes('front-end')) {
    return 'coding'; // Frontend usually gets coding challenges
  }
  
  if (roleLower.includes('backend') || roleLower.includes('back-end')) {
    return isSenior ? 'free-response' : 'coding';
  }
  
  if (roleLower.includes('full stack') || roleLower.includes('fullstack')) {
    return 'coding'; // Full stack usually coding
  }
  
  if (roleLower.includes('architect') || roleLower.includes('engineering manager')) {
    return 'free-response'; // System design for architects/managers
  }
  
  // 4. Default to coding for most software engineering roles
  return 'coding';
}

export default function TechnicalInterviewPage() {
  const router = useRouter();
  
  // Full Interview Flow state
  const [isFullInterview, setIsFullInterview] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // API Integration state
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [apiQuestions, setApiQuestions] = useState<ApiQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  
  // Interview completion state
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);

  // Editor state - Python only
  const [language] = useState<'python'>('python');
  const [code, setCode] = useState(MOCK_PROBLEM.starterCode.python);

  // Multiple choice state
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [mcSubmitted, setMcSubmitted] = useState(false);

  // Free response state
  const [freeResponseAnswer, setFreeResponseAnswer] = useState('');
  const [frSubmitted, setFrSubmitted] = useState(false);
  const [frFeedback, setFrFeedback] = useState('');
  const [isFetchingFrFeedback, setIsFetchingFrFeedback] = useState(false);

  // Session state
  const [isRunning, setIsRunning] = useState(false);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [testResults, setTestResults] = useState<
    Array<{ passed: boolean; input: string; expected: string; actual: string }>
  >([]);
  const [activeTab, setActiveTab] = useState<'question' | 'feedback'>('question');

  // AI Proctor mode
  const [liveProctorMode, setLiveProctorMode] = useState(false);
  const [proctorMessages, setProctorMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [showProctorModal, setShowProctorModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingProctor, setIsProcessingProctor] = useState(false);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Timer
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current question (API or mock)
  const currentApiQuestion = apiQuestions[currentQuestionIndex];
  const currentProblem = currentApiQuestion
    ? {
        title: `Q${currentQuestionIndex + 1}: ${currentApiQuestion.prompt.substring(0, 50)}...`,
        difficulty: currentApiQuestion.difficulty,
        description: currentApiQuestion.prompt,
        examples: currentApiQuestion.testCases
          ? currentApiQuestion.testCases.map((tc) => ({
              input: tc.input,
              output: tc.output,
              explanation: tc.explanation || '',
            }))
          : [],
        constraints: currentApiQuestion.explanation ? [currentApiQuestion.explanation] : [],
      }
    : MOCK_PROBLEM;



  // Handle interview setup submission
  const handleSetupSubmit = async (setupData: {
    company: string;
    role: string;
    seniority: string;
    difficulty: string;
    jobDescription: string;
    count: number;
    format: string;
  }) => {
    setLoadingQuestions(true);
    setSetupError(null);

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setupData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate questions');
      }

      const data = await response.json();
      setApiQuestions(data.questions);
      setIsSetupComplete(true);
      setCurrentQuestionIndex(0);
      
      // Set initial code from first question
      if (data.questions[0]?.starterCode) {
        setCode(data.questions[0].starterCode);
      }
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Play text-to-speech
  const playTextToSpeech = useCallback(async (text: string) => {
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error('Text-to-speech failed:', response.status);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.play();
      
      // Clean up the URL after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Error playing text-to-speech:', error);
      // Silently fail - conversation continues without audio
    }
  }, []);

  // Initialize AI Proctor conversation when activated
  const initiateProctorConversation = useCallback(async () => {
    setIsProcessingProctor(true);
    try {
      const response = await fetch('/api/proctor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionTitle: currentProblem.title,
          questionDescription: currentProblem.description,
          solutionOutline: currentApiQuestion?.solutionOutline || '',
          code: code,
          conversationHistory: [],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProctorMessages([{ role: 'assistant', content: data.message }]);
        // Play the initial greeting out loud
        await playTextToSpeech(data.message);
      }
    } catch (error) {
      console.error('Error starting proctor:', error);
      const fallbackMessage = "Hi! I'm your AI Proctor. Can you walk me through how you'd approach this problem?";
      setProctorMessages([
        {
          role: 'assistant',
          content: fallbackMessage,
        },
      ]);
      await playTextToSpeech(fallbackMessage);
    } finally {
      setIsProcessingProctor(false);
    }
  }, [currentProblem.title, currentProblem.description, currentApiQuestion?.solutionOutline, code, playTextToSpeech]);

  // Reset question state when changing questions
  const resetQuestionState = useCallback(() => {
    setSelectedChoice(null);
    setMcSubmitted(false);
    setFreeResponseAnswer('');
    setFrSubmitted(false);
    setFrFeedback('');
    setOutput('');
    setFeedback('');
    setTestResults([]);
    setActiveTab('question');
    
    // Reset AI Proctor conversation for new question
    if (liveProctorMode) {
      setProctorMessages([]);
      setIsRecording(false);
      setIsProcessingProctor(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Restart conversation with new question context
      setTimeout(() => {
        initiateProctorConversation();
      }, 100);
    }
  }, [liveProctorMode, initiateProctorConversation]);

  // Update code when question changes
  useEffect(() => {
    if (currentApiQuestion) {
      // Reset all question state when changing questions
      resetQuestionState();
      
      // Set starter code for coding questions
      if (currentApiQuestion.format === 'coding' && currentApiQuestion.starterCode) {
        const starterCode = currentApiQuestion.starterCode || '# Write your solution here\ndef solution():\n    pass';
        setCode(starterCode);
      }
    }
  }, [currentQuestionIndex, currentApiQuestion]);

  // Start timer on mount or when setup is complete
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Live Proctor Mode simulation
  // Initialize AI Proctor conversation when activated
  useEffect(() => {
    if (liveProctorMode && proctorMessages.length === 0) {
      // Start the conversation by getting AI's first question
      initiateProctorConversation();
    }
  }, [liveProctorMode, proctorMessages.length, initiateProctorConversation]);

  const handleProctorRecord = async () => {
    if (isRecording) {
      // Stop recording
      stopRecording();
    } else {
      // Start recording
      startRecording();
    }
  };

  const startRecording = () => {
    // Use Web Speech API for speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep recording until manually stopped
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let transcriptParts: string[] = [];

    recognition.onstart = () => {
      setIsRecording(true);
      audioChunksRef.current = [];
      transcriptParts = [];
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Collect all transcript parts
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcriptParts.push(event.results[i][0].transcript);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        alert(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = async () => {
      setIsRecording(false);
      
      // Combine all transcript parts
      const fullTranscript = transcriptParts.join(' ').trim();
      
      if (fullTranscript) {
        // Add user message
        const userMessage = { role: 'user' as const, content: fullTranscript };
        setProctorMessages((prev) => [...prev, userMessage]);
        
        // Get AI response
        await getProctorResponse(fullTranscript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const getProctorResponse = async (userResponse: string) => {
    setIsProcessingProctor(true);
    try {
      const response = await fetch('/api/proctor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionTitle: currentProblem.title,
          questionDescription: currentProblem.description,
          solutionOutline: currentApiQuestion?.solutionOutline || '',
          code: code,
          conversationHistory: proctorMessages,
          userResponse: userResponse,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProctorMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
        
        // Play the AI response out loud using text-to-speech
        await playTextToSpeech(data.message);
      }
    } catch (error) {
      console.error('Error getting proctor response:', error);
      const fallbackMessage = 'I understand. Can you tell me more about your approach?';
      setProctorMessages((prev) => [
        ...prev,
        { role: 'assistant', content: fallbackMessage },
      ]);
      await playTextToSpeech(fallbackMessage);
    } finally {
      setIsProcessingProctor(false);
    }
  };

  // Detect if this is part of a full interview flow
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isFullInterviewMode = urlParams.get('fullInterview') === 'true';
    setIsFullInterview(isFullInterviewMode);

    if (isFullInterviewMode && !isSetupComplete) {
      // Auto-setup with params from URL
      const company = urlParams.get('company') || 'Tech Company';
      const role = urlParams.get('role') || 'Software Engineer';
      const seniority = urlParams.get('seniority') || 'mid';
      const jobDescription = urlParams.get('jobDescription') || '';
      
      // Determine question format based on company
      const questionFormat = determineQuestionFormat(company, role, jobDescription);
      
      handleSetupSubmit({
        company,
        role,
        seniority,
        difficulty: 'medium',
        jobDescription,
        count: 2, // Only 2 technical questions for full interview
        format: questionFormat,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if all technical questions are completed
  useEffect(() => {
    if (isFullInterview && apiQuestions.length > 0) {
      // Check if we've reached the last question and all tests pass
      const isLastQuestion = currentQuestionIndex === apiQuestions.length - 1;
      const allTestsPassed = testResults.length > 0 && testResults.every(t => t.passed);
      
      if (isLastQuestion && allTestsPassed) {
        // Wait a moment before showing completion
        setTimeout(() => {
          setShowCompletionModal(true);
        }, 2000);
      }
    }
  }, [isFullInterview, currentQuestionIndex, apiQuestions.length, testResults]);

  // Handle Run Code - Execute Python code against test cases
  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Running code...');

    // Use API test cases if available
    const testCasesToRun = currentApiQuestion?.testCases || [];
    
    if (testCasesToRun.length === 0) {
      setOutput('No test cases available for this problem.');
      setIsRunning(false);
      return;
    }

    try {
      // Call the execute API endpoint
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          testCases: testCasesToRun,
          language: 'python',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute code');
      }

      const data = await response.json();
      const results = data.results;

      setTestResults(results);
      
      const passedCount = results.filter((r: { passed: boolean }) => r.passed).length;
      const totalCount = results.length;
      
      let outputText = '';
      results.forEach((r: { passed: boolean; input: string; expected: string; actual: string; error?: string }, idx: number) => {
        outputText += `${r.passed ? '✓' : '✗'} Test ${idx + 1}: ${r.passed ? 'Passed' : 'Failed'}\n`;
        
        // Always show the details for better feedback
        outputText += `  Input: ${r.input}\n`;
        outputText += `  Expected: ${r.expected}\n`;
        outputText += `  Actual: ${r.actual}\n`;
        
        if (!r.passed && r.error) {
          outputText += `  Error: ${r.error}\n`;
        }
        outputText += '\n';
      });
      
      outputText += `\n${passedCount}/${totalCount} tests passed`;
      
      if (passedCount === totalCount) {
        outputText += '\n\n🎉 All tests passed! Great job!';
      }
      
      setOutput(outputText);
    } catch (error) {
      setOutput(
        `Error executing code:\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your code for syntax errors.`
      );
      setTestResults([]);
    } finally {
      setIsRunning(false);
    }
  };

  // Handle Request Feedback - Call AI API with code and test results
  const handleRequestFeedback = async () => {
    setIsFetchingFeedback(true);
    setActiveTab('feedback'); // Switch to feedback tab
    setFeedback('Fetching AI feedback...');

    try {
      const response = await fetch('/api/coding-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentApiQuestion?.prompt || currentProblem.description,
          code: code,
          testResults: testResults,
          solutionOutline: currentApiQuestion?.solutionOutline,
        }),
      });

      const data = await response.json();
      
      // Check if there's feedback in the response (even on error responses)
      if (data.feedback) {
        setFeedback(data.feedback);
      } else if (!response.ok) {
        setFeedback(`Error: ${data.error || 'Failed to generate feedback. Please try again.'}`);
      } else {
        setFeedback('Unable to generate feedback at this time.');
      }
    } catch (error) {
      console.error('Feedback error:', error);
      setFeedback('Error generating feedback. Please try again.');
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  // Handle Reset
  const handleReset = () => {
    // Reset to the starter code from current question
    const starterCode = currentApiQuestion?.starterCode || MOCK_PROBLEM.starterCode.python;
    setCode(starterCode);
    setOutput('');
    setFeedback('');
    setTestResults([]);
  };

  // Handle Toggle Proctor
  const handleToggleProctor = () => {
    if (liveProctorMode) {
      handleStopProctor();
    } else {
      setShowProctorModal(true);
    }
  };

  // Handle Start Proctor Session
  const handleStartProctor = () => {
    setLiveProctorMode(true);
    setShowProctorModal(false);
  };

  // Handle Stop Proctor Session
  const handleStopProctor = () => {
    setLiveProctorMode(false);
    setProctorMessages([]);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setIsProcessingProctor(false);
  };

  // Handle Next Question
  const handleNextQuestion = () => {
    // Save current question result before moving
    saveQuestionResult();
    
    if (currentQuestionIndex < apiQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Handle Previous Question
  const handlePreviousQuestion = () => {
    // Save current question result before moving
    saveQuestionResult();
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Save current question result
  const saveQuestionResult = () => {
    if (!currentApiQuestion) return;

    const result: QuestionResult = {
      questionNumber: currentQuestionIndex + 1,
      format: currentApiQuestion.format,
      difficulty: currentApiQuestion.difficulty,
      topicTags: currentApiQuestion.topicTags,
      status: 'submitted',
    };

    // Determine status based on question type
    if (currentApiQuestion.format === 'coding') {
      const passedCount = testResults.filter((t) => t.passed).length;
      const totalCount = testResults.length;
      result.score = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
      result.status = passedCount === totalCount ? 'correct' : passedCount > 0 ? 'partial' : 'incorrect';
      result.details = `${passedCount}/${totalCount} tests passed`;
    } else if (currentApiQuestion.format === 'multiple-choice') {
      if (mcSubmitted) {
        const isCorrect = currentApiQuestion.choices?.find((c) => c.label === selectedChoice)?.correct;
        result.status = isCorrect ? 'correct' : 'incorrect';
        result.details = isCorrect ? 'Correct answer selected' : 'Incorrect answer selected';
      } else {
        result.status = 'submitted';
        result.details = 'Not attempted';
      }
    } else if (currentApiQuestion.format === 'free-response') {
      result.status = frSubmitted ? 'submitted' : 'submitted';
      result.details = frSubmitted ? 'Answer submitted and reviewed' : 'Not attempted';
    }

    // Update or add result
    setQuestionResults((prev) => {
      const existing = prev.findIndex((r) => r.questionNumber === result.questionNumber);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = result;
        return updated;
      }
      return [...prev, result];
    });
  };

  // Handle Submit Interview
  const handleSubmitInterview = () => {
    // Save final question result
    saveQuestionResult();
    // Show summary
    setIsInterviewComplete(true);
    
    // Update URL to mark as complete for progress bar
    if (typeof window !== 'undefined') {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('complete', 'true');
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  };

  // Handle Restart Interview
  const handleRestartInterview = () => {
    setIsInterviewComplete(false);
    setIsSetupComplete(false);
    setApiQuestions([]);
    setCurrentQuestionIndex(0);
    setQuestionResults([]);
    resetQuestionState();
    setTimeElapsed(0);
    
    // Remove complete parameter from URL
    if (typeof window !== 'undefined') {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.delete('complete');
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  };

  // Handle Exit to Dashboard
  const handleExitToDashboard = () => {
    window.location.href = '/dashboard';
  };

  // Handle Multiple Choice submission
  const handleMultipleChoiceSubmit = (choice: string) => {
    setSelectedChoice(choice);
    setMcSubmitted(true);
  };

  // Handle Free Response submission
  const handleFreeResponseSubmit = async (answer: string) => {
    setFreeResponseAnswer(answer);
    setFrSubmitted(true);
    setIsFetchingFrFeedback(true);

    // Call Technical Feedback API
    try {
      const response = await fetch('/api/technical-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentApiQuestion?.prompt,
          answer: answer,
          solutionOutline: currentApiQuestion?.solutionOutline,
        }),
      });

      const data = await response.json();
      
      // Check if there's feedback in the response (even on error responses)
      if (data.feedback) {
        setFrFeedback(data.feedback);
      } else if (!response.ok) {
        setFrFeedback(`Error: ${data.error || 'Failed to generate feedback. Please try again.'}`);
      } else {
        setFrFeedback('Unable to generate feedback at this time.');
      }
    } catch (error) {
      console.error('Feedback error:', error);
      setFrFeedback('Error generating feedback. Please try again.');
    } finally {
      setIsFetchingFrFeedback(false);
    }
  };

  // Show setup form if not complete
  if (!isSetupComplete) {
    return (
      <InterviewSetup
        onSubmit={handleSetupSubmit}
        loading={loadingQuestions}
        error={setupError}
      />
    );
  }

  // Show summary if interview is complete
  if (isInterviewComplete) {
    return (
      <InterviewSummary
        results={questionResults}
        timeElapsed={timeElapsed}
        onRestart={handleRestartInterview}
        onExit={handleExitToDashboard}
      />
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <SessionHeader
        title={currentProblem.title}
        difficulty={currentProblem.difficulty}
        timeElapsed={timeElapsed}
        liveProctorMode={liveProctorMode}
        onToggleProctor={handleToggleProctor}
      />

      {/* AI Proctor Floating Box */}
      <ProctorHintBox 
        messages={proctorMessages} 
        isActive={liveProctorMode} 
        onRecord={handleProctorRecord}
        isRecording={isRecording}
        isProcessing={isProcessingProctor}
      />

      {/* AI Proctor Start Modal */}
      <ProctorModal
        isOpen={showProctorModal}
        onClose={() => setShowProctorModal(false)}
        onStart={handleStartProctor}
      />

      {/* Question Navigation Bar (only show if using API questions) */}
      {apiQuestions.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between lg:justify-start gap-2 lg:gap-4">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-3 py-2 lg:px-4 lg:py-2 text-sm lg:text-base bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium transition-all duration-200 hover:shadow-md hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                ← Previous
              </button>
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm lg:text-base">
                Question {currentQuestionIndex + 1} of {apiQuestions.length}
              </span>
              {currentQuestionIndex < apiQuestions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  className="px-3 py-2 lg:px-4 lg:py-2 text-sm lg:text-base bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 font-medium transition-all duration-200 hover:shadow-md hover:scale-105"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmitInterview}
                  className="px-4 py-2 lg:px-6 lg:py-2 text-sm lg:text-base bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold shadow-lg transition-all duration-200 hover:scale-105"
                >
                  ✓ Submit Interview
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {currentApiQuestion?.topicTags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 lg:px-3 lg:py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Layout changes based on question format */}
      <div className="grid lg:grid-cols-2 gap-0" style={{ height: apiQuestions.length > 0 ? 'calc(100vh - 14rem)' : 'calc(100vh - 10rem)' }}>
        {/* Coding Question - 2 panel layout */}
        {currentApiQuestion?.format === 'coding' && (
          <>
            {/* Left Panel - Problem Description with Tabs */}
            <ProblemPanel
              problem={currentProblem}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              feedback={feedback}
              isFetchingFeedback={isFetchingFeedback}
            />

            {/* Right Panel - Code Editor (top) & Console (bottom) */}
            <div className="flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
              {/* Code Editor Section */}
              <div className="h-3/5 lg:flex-1">
                <CodeEditor
                  code={code}
                  onCodeChange={setCode}
                  onRunCode={handleRunCode}
                  onRequestFeedback={handleRequestFeedback}
                  onReset={handleReset}
                  isRunning={isRunning}
                  isFetchingFeedback={isFetchingFeedback}
                />
              </div>

              {/* Console / Test Results Section */}
              <div className="h-2/5 lg:flex-1">
                <ConsoleOutput testResults={testResults} output={output} />
              </div>
            </div>
          </>
        )}

        {/* Multiple Choice Question - Full width */}
        {currentApiQuestion?.format === 'multiple-choice' && (
          <div className="col-span-2">
            <MultipleChoiceQuestion
              prompt={currentApiQuestion.prompt}
              choices={currentApiQuestion.choices || []}
              onSubmit={handleMultipleChoiceSubmit}
              isSubmitted={mcSubmitted}
              selectedAnswer={selectedChoice}
            />
          </div>
        )}

        {/* Free Response Question - Full width */}
        {currentApiQuestion?.format === 'free-response' && (
          <div className="col-span-2">
            <FreeResponseQuestion
              prompt={currentApiQuestion.prompt}
              solutionOutline={currentApiQuestion.solutionOutline}
              onSubmit={handleFreeResponseSubmit}
              isSubmitted={frSubmitted}
              userAnswer={freeResponseAnswer}
              feedback={frFeedback}
              isFetchingFeedback={isFetchingFrFeedback}
            />
          </div>
        )}

        {/* Fallback for no API questions - show mock problem */}
        {!currentApiQuestion && (
          <>
            <ProblemPanel
              problem={currentProblem}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              feedback={feedback}
              isFetchingFeedback={isFetchingFeedback}
            />
            <div className="flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
              <div className="h-3/5 lg:flex-1">
                <CodeEditor
                  code={code}
                  onCodeChange={setCode}
                  onRunCode={handleRunCode}
                  onRequestFeedback={handleRequestFeedback}
                  onReset={handleReset}
                  isRunning={isRunning}
                  isFetchingFeedback={isFetchingFeedback}
                />
              </div>
              <div className="h-2/5 lg:flex-1">
                <ConsoleOutput testResults={testResults} output={output} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        language={currentApiQuestion?.format === 'coding' ? language : undefined}
        testsPassed={currentApiQuestion?.format === 'coding' ? testResults.filter((t) => t.passed).length : undefined}
        totalTests={currentApiQuestion?.format === 'coding' ? (currentApiQuestion?.testCases?.length || testResults.length || 5) : undefined}
        liveProctorMode={liveProctorMode}
      />
      </div>

      {/* Completion Modal - Full Interview Flow */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full p-8">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mb-6">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Congratulations! 🎉
              </h2>

              {/* Description */}
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                You&apos;ve successfully completed the full interview process!
              </p>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
                Both behavioral and technical rounds are done. Head to your dashboard to review your performance.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">✓</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Behavioral Interview</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">✓</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Technical Interview</div>
                </div>
              </div>

              {/* View Dashboard Button */}
              <button
                onClick={() => {
                  // Clean up session storage
                  sessionStorage.removeItem('fullInterviewParams');
                  sessionStorage.removeItem('fullInterviewStage');
                  sessionStorage.removeItem('behavioralSessionId');
                  sessionStorage.removeItem('technicalSessionId');
                  sessionStorage.removeItem('behavioralComplete');
                  // Navigate to dashboard
                  router.push('/dashboard');
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold"
              >
                View Results Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
