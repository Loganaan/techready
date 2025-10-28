'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Video, ArrowRight } from 'lucide-react';
import Button from '@/components/Button';
import ChatMessage from './components/ChatMessage';
import SessionCard from './components/SessionCard';
import LivePracticeModal from './components/LivePracticeModal';
import NewSessionModal, { SessionParams } from './components/NewSessionModal';
import ChatInput from './components/ChatInput';
import { firebaseUtils } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isCompletion?: boolean;
}

interface ChatSession {
  id: string;
  firebaseId?: string; // Firebase document ID
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  messages: Message[];
  params?: SessionParams;
  isComplete?: boolean;
}

function BehavioralInterviewContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [inputMessage, setInputMessage] = useState('');
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullInterview, setIsFullInterview] = useState(false);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [showSessionsSidebar, setShowSessionsSidebar] = useState(false);
  const [showChatView, setShowChatView] = useState(false); // New state to control view
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionCreationInitiatedRef = useRef(false);

  // Load sessions from Firebase on mount
  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;
      
      try {
        const firebaseSessions = await firebaseUtils.getChatSessions(user.uid, 'behavioral');
        const convertedSessions: ChatSession[] = firebaseSessions.map(session => {
          const sessionMessages: Message[] = session.messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toDate(),
            isCompletion: false
          }));

          // Detect if session is complete by checking if last message is the completion message
          const lastMessage = sessionMessages[sessionMessages.length - 1];
          const isComplete = lastMessage?.role === 'assistant' && 
                            lastMessage?.content.includes('Congratulations on completing the behavioral interview');
          
          // If complete, mark the last message with isCompletion flag
          if (isComplete && lastMessage) {
            lastMessage.isCompletion = true;
          }

          return {
            id: session.id,
            firebaseId: session.id,
            title: session.title,
            lastMessage: session.lastMessage,
            timestamp: session.timestamp.toDate(),
            messageCount: session.messageCount,
            messages: sessionMessages,
            params: session.params ? {
              company: session.params.company || '',
              role: session.params.role || '',
              seniority: session.params.seniority || '',
              jobDescription: session.params.jobDescription || ''
            } : undefined,
            isComplete
          };
        });
        setSessions(convertedSessions);
      } catch (error) {
        console.error('Error loading sessions from Firebase:', error);
      }
    };

    loadSessions();
  }, [user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId]);

  // Get current session messages
  const currentSession = useMemo(() => 
    sessions.find(s => s.id === activeSessionId),
    [sessions, activeSessionId]
  );
  const messages = useMemo(() => 
    currentSession?.messages || [],
    [currentSession]
  );

  // Count main questions (excluding follow-ups)
  const countMainQuestions = useCallback(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    let mainQuestions = 0;
    assistantMessages.forEach((msg, index) => {
      const content = msg.content.toLowerCase().trim();
      const length = msg.content.length;
      
      // Characteristics of follow-ups:
      // 1. Short messages (under 120 chars)
      // 2. Asking for clarification/more detail
      const followUpPatterns = [
        /^can you (tell me more|elaborate|explain|describe)/,
        /^what (was|were|did|about|specific)/,
        /^how (did|was|were)/,
        /^could you (provide|explain|describe|elaborate)/,
        /^tell me more/,
        /^which/,
      ];
      
      const isShortQuestion = length < 120 && content.includes('?');
      const matchesFollowUpPattern = followUpPatterns.some(pattern => {
        return pattern.test(content);
      });
      
      // It's a follow-up if it's short AND matches a follow-up pattern
      const isFollowUp = isShortQuestion && matchesFollowUpPattern;
      
      // Also check: if previous assistant message was within last 2 messages and was long,
      // this short one is likely a follow-up
      if (index > 0 && length < 120 && content.includes('?')) {
        const prevAssistantMsg = assistantMessages[index - 1];
        if (prevAssistantMsg && prevAssistantMsg.content.length > 200) {
          // Previous was a long main question, this short one is a follow-up
          return; // Don't count as main question
        }
      }
      
      // Count as main question if it's NOT a follow-up
      if (!isFollowUp) {
        mainQuestions++;
      }
    });
    
    return mainQuestions;
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId]);

  // Detect if this is part of a full interview flow
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isFullInterviewMode = urlParams.get('fullInterview') === 'true';
    setIsFullInterview(isFullInterviewMode);

    // Check if we have full interview params in sessionStorage
    const fullInterviewParamsStr = sessionStorage.getItem('fullInterviewParams');
    let fullInterviewParams = null;
    if (fullInterviewParamsStr) {
      try {
        fullInterviewParams = JSON.parse(fullInterviewParamsStr);
      } catch (e) {
        console.error('Error parsing full interview params:', e);
      }
    }

    // Prevent duplicate session creation (especially in React Strict Mode)
    if (isFullInterviewMode && sessions.length === 0 && !sessionCreationInitiatedRef.current) {
      sessionCreationInitiatedRef.current = true;
      
      // Auto-create session with params from URL or sessionStorage
      const company = urlParams.get('company') || fullInterviewParams?.company;
      const role = urlParams.get('role') || fullInterviewParams?.role;
      const seniority = urlParams.get('seniority') || fullInterviewParams?.seniority;
      const jobDescription = urlParams.get('jobDescription') || fullInterviewParams?.jobDescription;
      
      const params: SessionParams | undefined = (company || role || seniority || jobDescription) ? {
        company: company || '',
        role: role || '',
        seniority: seniority || '',
        jobDescription: jobDescription || '',
      } : undefined;
      
      createNewSession(params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if behavioral interview is complete (4 main questions answered)
  useEffect(() => {
    if (isFullInterview && currentSession && messages.length > 0) {
      const mainQuestionsCount = countMainQuestions();
      
      // Check if we've completed 4 questions - but DON'T auto-show modal
      // User will manually trigger it with the button
      if (mainQuestionsCount >= 4 && messages[messages.length - 1].role === 'user') {
        // Modal will be triggered manually via button click
      }
    }
  }, [messages, isFullInterview, currentSession, countMainQuestions]);

  // Generate first question for a new session
  const generateFirstQuestion = async (params?: SessionParams): Promise<Message> => {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are starting a behavioral interview. First, greet the user warmly and introduce yourself as their behavioral interview coach. Then, generate ONE concise behavioral interview question about a past experience (teamwork, leadership, challenges, or problem-solving). Make it specific and actionable.'
            }
          ],
          params,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate first question');
      }

      const data = await response.json();
      
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response || 'Tell me about a time when you faced a significant challenge. How did you handle it?',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error generating first question:', error);
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Tell me about a time when you faced a significant challenge at work. How did you approach it, and what was the outcome?',
        timestamp: new Date(),
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentSession) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Update session with user message
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === activeSessionId
          ? {
              ...session,
              messages: [...session.messages, newUserMessage],
              lastMessage: newUserMessage.content,
              messageCount: session.messageCount + 1,
              timestamp: new Date()
            }
          : session
      )
    );

    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          interviewType: 'behavioral',
          params: currentSession.params,
          sessionId: currentSession.firebaseId,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an error. Could you please try again?',
        timestamp: new Date(),
        isCompletion: data.interviewComplete || false,
      };

      // If interview is complete, mark the session as complete
      if (data.interviewComplete && currentSession) {
        setSessions(prevSessions => 
          prevSessions.map(session => 
            session.id === activeSessionId
              ? { ...session, isComplete: true }
              : session
          )
        );
      }

      // Save both user and assistant messages to Firebase only if user is logged in
      if (user && currentSession?.firebaseId) {
        try {
          // Add user message
          await firebaseUtils.addMessageToSession(
            currentSession.firebaseId,
            {
              id: newUserMessage.id,
              role: newUserMessage.role,
              content: newUserMessage.content,
              timestamp: Timestamp.fromDate(newUserMessage.timestamp)
            },
            newUserMessage.content
          );

          // Add assistant message
          await firebaseUtils.addMessageToSession(
            currentSession.firebaseId,
            {
              id: assistantMessage.id,
              role: assistantMessage.role,
              content: assistantMessage.content,
              timestamp: Timestamp.fromDate(assistantMessage.timestamp)
            },
            assistantMessage.content
          );
        } catch (error) {
          console.error('Error saving messages to Firebase:', error);
        }
      }

      // Update session with assistant message
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === activeSessionId
            ? {
                ...session,
                messages: [...session.messages, assistantMessage],
                lastMessage: assistantMessage.content,
                messageCount: session.messageCount + 1,
                timestamp: new Date()
              }
            : session
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again.',
        timestamp: new Date(),
      };

      // Update session with error message
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === activeSessionId
            ? {
                ...session,
                messages: [...session.messages, errorMessage],
                lastMessage: errorMessage.content,
                messageCount: session.messageCount + 1
              }
            : session
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = async (params?: SessionParams) => {
    // Prevent concurrent session creation
    if (isLoading) {
      console.log('Session creation already in progress, skipping...');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Generate first question with parameters
      const firstQuestion = await generateFirstQuestion(params);
      
      // Create a title based on the parameters
      let title = `Session ${sessions.length + 1}`;
      if (params?.role && params?.company) {
        title = `${params.role} at ${params.company}`;
      } else if (params?.role) {
        title = params.role;
      } else if (params?.company) {
        title = params.company;
      }
      
      const timestamp = new Date();
      const localId = Date.now().toString();
      
      // Save to Firebase only if user is logged in
      let firebaseId = undefined;
      if (user) {
        firebaseId = await firebaseUtils.saveChatSession({
          title,
          lastMessage: firstQuestion.content,
          timestamp: Timestamp.fromDate(timestamp),
          messageCount: 1,
          messages: [{
            id: firstQuestion.id,
            role: firstQuestion.role,
            content: firstQuestion.content,
            timestamp: Timestamp.fromDate(firstQuestion.timestamp)
          }],
          params,
          userId: user.uid,
          type: 'behavioral'
        });
      }
      
      const newSession: ChatSession = {
        id: localId,
        firebaseId,
        title,
        lastMessage: firstQuestion.content,
        timestamp,
        messageCount: 1,
        messages: [firstQuestion],
        params
      };
      
      setSessions(prevSessions => [newSession, ...prevSessions]);
      setActiveSessionId(newSession.id);
      setShowChatView(true); // Show chat view on mobile after creating session
    } catch (error) {
      console.error('Error creating new session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    
    // Delete from Firebase if it has a firebaseId
    if (session?.firebaseId) {
      try {
        await firebaseUtils.deleteChatSession(session.firebaseId);
      } catch (error) {
        console.error('Error deleting session from Firebase:', error);
        // Continue with local deletion even if Firebase deletion fails
      }
    }
    
    // Remove from local state
    setSessions(sessions.filter(s => s.id !== sessionId));
    
    // If deleting the active session, switch to another one
    if (activeSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        setActiveSessionId(remainingSessions[0].id);
      } else {
        setActiveSessionId('');
      }
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-[calc(100vh-8rem)]">
      <div className="bg-gray-50 dark:bg-gray-950">
      <div className="flex h-[calc(100vh-8rem)] relative">
        
        {/* Mobile: Show sessions list first, then chat. Desktop: show sidebar + chat */}
        {!showChatView ? (
          // MOBILE SESSIONS LIST VIEW (Full screen on mobile, hidden on desktop)
          <div className="lg:hidden w-full bg-white dark:bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Behavioral Interview</h2>
                <Button
                  variant="primary"
                  className="flex items-center gap-2 text-sm bg-[rgba(76,166,38,1)] hover:bg-[rgba(76,166,38,0.9)]"
                  onClick={() => setShowNewSessionModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  New Session
                </Button>
              </div>
            </div>

            {/* Sessions Grid/List */}
            <div className="flex-1 overflow-y-auto p-4">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="max-w-md">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Welcome to Behavioral Interview Practice
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Start a new session to practice behavioral interview questions with AI-powered feedback. Click the &quot;New Session&quot; button above to get started.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        setActiveSessionId(session.id);
                        setShowChatView(true);
                      }}
                      className="cursor-pointer"
                    >
                      <SessionCard
                        id={session.id}
                        title={session.title}
                        lastMessage={session.lastMessage}
                        timestamp={session.timestamp}
                        messageCount={session.messageCount}
                        isActive={false}
                        onSelect={() => {}}
                        onDelete={deleteSession}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
        
        {/* Mobile Overlay */}
        {showSessionsSidebar && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowSessionsSidebar(false)}
          />
        )}
        
        {/* Left Sidebar - Sessions List (Desktop only or mobile when in chat view with toggle) */}
        <div className={`w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col transition-transform duration-300 lg:flex ${showChatView ? 'hidden lg:flex' : 'hidden'}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Chat Sessions</h2>
              <Button
                variant="primary"
                className="flex items-center gap-2 text-sm bg-[rgba(76,166,38,1)] hover:bg-[rgba(76,166,38,0.9)]"
                onClick={() => setShowNewSessionModal(true)}
              >
                <Plus className="w-4 h-4" />
                New
              </Button>
            </div>
            
            {/* Live Practice Button */}
            <Button
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 border-[rgba(76,166,38,1)] text-[rgba(76,166,38,1)] hover:bg-[rgba(76,166,38,0.1)]"
              onClick={() => {
                // If in full interview mode, bypass modal and auto-pass parameters
                if (isFullInterview) {
                  const fullInterviewParamsStr = sessionStorage.getItem('fullInterviewParams');
                  let params: SessionParams | undefined = undefined;
                  
                  if (fullInterviewParamsStr) {
                    try {
                      const fullInterviewParams = JSON.parse(fullInterviewParamsStr);
                      params = {
                        company: fullInterviewParams.company || '',
                        role: fullInterviewParams.role || '',
                        seniority: fullInterviewParams.seniority || '',
                        jobDescription: fullInterviewParams.jobDescription || ''
                      };
                    } catch (e) {
                      console.error('Error parsing full interview params:', e);
                    }
                  }
                  
                  // Navigate directly to live practice with stored params
                  const searchParams = new URLSearchParams();
                  searchParams.append('fullInterview', 'true'); // Include full interview flag for progress bar
                  if (params?.company) searchParams.append('company', params.company);
                  if (params?.role) searchParams.append('role', params.role);
                  if (params?.seniority) searchParams.append('seniority', params.seniority);
                  if (params?.jobDescription) searchParams.append('jobDescription', params.jobDescription);
                  router.push(`/interview/behavioral/live?${searchParams.toString()}`);
                } else {
                  // Normal mode: show modal for manual input
                  setShowLiveModal(true);
                }
              }}
            >
              <Video className="w-5 h-5" />
              Start Live Practice
            </Button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                id={session.id}
                title={session.title}
                lastMessage={session.lastMessage}
                timestamp={session.timestamp}
                messageCount={session.messageCount}
                isActive={activeSessionId === session.id}
                onSelect={(id) => {
                  setActiveSessionId(id);
                  setShowSessionsSidebar(false); // Close sidebar on mobile when session is selected
                }}
                onDelete={deleteSession}
              />
            ))}
          </div>
        </div>

        {/* Main Chat Area - Show on desktop always, on mobile only when showChatView is true */}
        <div className={`flex-1 flex-col bg-white dark:bg-gray-900 ${showChatView || 'hidden lg:flex'} flex`}>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setShowChatView(false)}
                  className="lg:hidden w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                  aria-label="Back to sessions"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-700 dark:text-gray-300"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Behavioral Interview Coach
                </h1>
              </div>
              {currentSession && messages.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Question {Math.min(countMainQuestions(), 4)} of 4
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Answer to continue
                    </div>
                  </div>
                  {/* Continue button - shows when 4 questions complete in full interview mode */}
                  {isFullInterview && countMainQuestions() >= 4 && (
                    <button
                      onClick={() => setShowTransitionModal(true)}
                      className="bg-gradient-to-r from-[rgba(76,166,38,1)] to-[rgba(76,166,38,0.8)] hover:from-[rgba(76,166,38,0.9)] hover:to-[rgba(76,166,38,0.7)] text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* Not signed in warning */}
            {!user && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ You&apos;re not signed in. Your session won&apos;t be saved. <button onClick={() => router.push('/login')} className="underline font-medium hover:text-yellow-900 dark:hover:text-yellow-100 cursor-pointer">Sign in</button> to save your progress.
                </p>
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-950">
            {!currentSession ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="max-w-md">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Welcome to Behavioral Interview Practice
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Start a new session to practice behavioral interview questions with AI-powered feedback. 
                    Create your first session by clicking the &quot;New&quot; button in the sidebar.
                  </p>
                  <Button
                    variant="primary"
                    className="bg-[rgba(76,166,38,1)] hover:bg-[rgba(76,166,38,0.9)] flex items-center gap-2 mx-auto"
                    onClick={() => setShowNewSessionModal(true)}
                  >
                    <Plus className="w-5 h-5" />
                    Create New Session
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                    isCompletion={message.isCompletion}
                    sessionId={currentSession?.firebaseId || currentSession?.id}
                    isFullInterview={isFullInterview}
                  />
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <ChatInput
            value={inputMessage}
            onChange={setInputMessage}
            onSend={handleSendMessage}
            disabled={isLoading || !currentSession || currentSession.isComplete}
          />
        </div>
      </div>
      </div>

      {/* Live Practice Modal */}
      <LivePracticeModal
        isOpen={showLiveModal}
        onClose={() => setShowLiveModal(false)}
        onStart={(params) => {
          setShowLiveModal(false);
          // Navigate to live practice session with params
          const searchParams = new URLSearchParams();
          // Pass fullInterview flag if we're in full interview mode
          if (isFullInterview) {
            searchParams.append('fullInterview', 'true');
          }
          if (params?.company) searchParams.append('company', params.company);
          if (params?.role) searchParams.append('role', params.role);
          if (params?.seniority) searchParams.append('seniority', params.seniority);
          if (params?.jobDescription) searchParams.append('jobDescription', params.jobDescription);
          router.push(`/interview/behavioral/live?${searchParams.toString()}`);
        }}
      />

      {/* New Session Modal */}
      <NewSessionModal
        isOpen={showNewSessionModal}
        onClose={() => setShowNewSessionModal(false)}
        onStart={(params) => {
        setShowNewSessionModal(false);
        createNewSession(params);
      }}
      initialParams={(() => {
        // Try to get full interview params from sessionStorage to pre-fill the form
        // Check if we're in the browser (not SSR)
        if (typeof window !== 'undefined') {
          const fullInterviewParamsStr = sessionStorage.getItem('fullInterviewParams');
          if (fullInterviewParamsStr) {
            try {
              return JSON.parse(fullInterviewParamsStr);
            } catch (e) {
              console.error('Error parsing full interview params:', e);
            }
          }
        }
        return undefined;
      })()}
    />

      {/* Transition Modal - Full Interview Flow */}
      {showTransitionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full p-8">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <svg 
                    className="w-12 h-12 text-green-600 dark:text-green-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Behavioral Round Complete!
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Great job! You&apos;ve completed the behavioral interview. Now let&apos;s move on to the technical round 
                to assess your coding skills.
              </p>

              {/* Transition Button */}
              <Button
                variant="primary"
                className="bg-gradient-to-r from-[rgba(76,166,38,1)] to-[rgba(76,166,38,0.8)] hover:from-[rgba(76,166,38,0.9)] hover:to-[rgba(76,166,38,0.7)] text-white px-8 py-4 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 mx-auto hover:scale-105"
                onClick={() => {
                  // Store stage completion
                  sessionStorage.setItem('behavioralComplete', 'true');
                  
                  // Navigate to technical interview with proper params
                  const params = new URLSearchParams();
                  params.append('fullInterview', 'true');
                  
                  // Get params from current session or sessionStorage
                  if (currentSession?.params) {
                    if (currentSession.params.company) params.append('company', currentSession.params.company);
                    if (currentSession.params.role) params.append('role', currentSession.params.role);
                    if (currentSession.params.seniority) params.append('seniority', currentSession.params.seniority);
                    if (currentSession.params.jobDescription) params.append('jobDescription', currentSession.params.jobDescription);
                  } else {
                    // Fallback to sessionStorage
                    const fullInterviewParamsStr = sessionStorage.getItem('fullInterviewParams');
                    if (fullInterviewParamsStr) {
                      try {
                        const fullInterviewParams = JSON.parse(fullInterviewParamsStr);
                        if (fullInterviewParams.company) params.append('company', fullInterviewParams.company);
                        if (fullInterviewParams.role) params.append('role', fullInterviewParams.role);
                        if (fullInterviewParams.seniority) params.append('seniority', fullInterviewParams.seniority);
                        if (fullInterviewParams.jobDescription) params.append('jobDescription', fullInterviewParams.jobDescription);
                      } catch (e) {
                        console.error('Error parsing full interview params:', e);
                      }
                    }
                  }
                  
                  console.log('Navigating to technical with params:', params.toString());
                  router.push(`/interview/technical?${params.toString()}`);
                }}
              >
                Continue to Technical Round
                <ArrowRight className="w-6 h-6" />
              </Button>

              {/* Optional: Skip/Cancel */}
              <button
                onClick={() => {
                  setShowTransitionModal(false);
                  // Clean up and return to dashboard
                  sessionStorage.removeItem('fullInterviewParams');
                  router.push('/dashboard');
                }}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
              >
                Exit Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BehavioralInterviewPage() {
  return <BehavioralInterviewContent />;
}
