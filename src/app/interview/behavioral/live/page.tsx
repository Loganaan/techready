'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, Suspense, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, AlertCircle } from 'lucide-react';
import Button from '@/components/Button';
import { useDeepgram } from '@/hooks/useDeepgram';
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

interface SessionParams {
  company?: string;
  role?: string;
  seniority?: string;
  jobDescription?: string;
}

function LiveInterviewSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [fillerWordCount, setFillerWordCount] = useState(0);
  const [fillerWordDetectionEnabled, setFillerWordDetectionEnabled] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if this is part of full interview flow
  const isFullInterview = searchParams.get('fullInterview') === 'true';

  // Track progress for full interview mode
  const totalQuestions = 4;
  const answeredQuestions = Math.floor(messages.filter(m => m.role === 'user').length);
  const progressPercentage = (answeredQuestions / totalQuestions) * 100;

  // Deepgram hook for speech recognition
  const { startRecording, stopRecording, isRecording } = useDeepgram({
    onTranscript: (text) => {
      setTranscript(prev => {
        const newTranscript = prev ? prev + ' ' + text : text;
        return newTranscript.trim();
      });
    },
    onError: (error) => {
      console.error('Deepgram error:', error);
    },
    onFillerWord: (word) => {
      // Only count filler words if detection is enabled
      if (fillerWordDetectionEnabled) {
        console.log('Filler word detected:', word);
        setFillerWordCount(prev => prev + 1);
      }
    },
  });

  // Get session params from URL
  const sessionParams: SessionParams = {
    company: searchParams.get('company') || undefined,
    role: searchParams.get('role') || undefined,
    seniority: searchParams.get('seniority') || undefined,
    jobDescription: searchParams.get('jobDescription') || undefined,
  };

  // Start the interview
  const startInterview = async () => {
    setInterviewStarted(true);
    setIsProcessing(true);

    try {
      // Get first question from AI
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are starting a behavioral interview. Generate ONE concise behavioral interview question about a past experience. Only output the question itself, nothing else. Make it specific and actionable.'
            }
          ],
          params: sessionParams,
        }),
      });

      const data = await response.json();
      const questionText = data.response || 'Tell me about a time when you faced a significant challenge. How did you handle it?';

      setCurrentQuestion(questionText);
      
      const firstMessage: Message = {
        id: '1',
        role: 'assistant',
        content: questionText,
        timestamp: new Date(),
      };
      
      setMessages([firstMessage]);

      // Create a Firebase session if user is logged in
      if (user) {
        try {
          // Create a title based on the parameters
          let title = 'Live Practice Session';
          if (sessionParams.role && sessionParams.company) {
            title = `Live: ${sessionParams.role} at ${sessionParams.company}`;
          } else if (sessionParams.role) {
            title = `Live: ${sessionParams.role}`;
          } else if (sessionParams.company) {
            title = `Live: ${sessionParams.company}`;
          }

          // Filter out undefined values from params for Firebase
          const cleanParams: SessionParams = {};
          if (sessionParams.company) cleanParams.company = sessionParams.company;
          if (sessionParams.role) cleanParams.role = sessionParams.role;
          if (sessionParams.seniority) cleanParams.seniority = sessionParams.seniority;
          if (sessionParams.jobDescription) cleanParams.jobDescription = sessionParams.jobDescription;

          const firebaseSessionId = await firebaseUtils.saveChatSession({
            title,
            lastMessage: questionText,
            timestamp: Timestamp.fromDate(firstMessage.timestamp),
            messageCount: 1,
            messages: [{
              id: firstMessage.id,
              role: firstMessage.role,
              content: firstMessage.content,
              timestamp: Timestamp.fromDate(firstMessage.timestamp)
            }],
            ...(Object.keys(cleanParams).length > 0 ? { params: cleanParams } : {}),
            userId: user.uid,
            type: 'behavioral'
          });
          
          setSessionId(firebaseSessionId);
        } catch (error) {
          console.error('Error saving session to Firebase:', error);
        }
      }

      // Speak the question using ElevenLabs
      await speakText(questionText);
      
      // Start listening after question is asked
      setTimeout(() => {
        startListening();
      }, 500);
    } catch (error) {
      console.error('Error starting interview:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Text-to-speech using ElevenLabs
  const speakText = async (text: string) => {
    try {
      const response = await fetch('/api/elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          // reset previous audio to start to avoid resuming in the middle
          audioRef.current.currentTime = 0;
        } catch (e) {}
      }
      const audio = new Audio(audioUrl);
      audio.preload = 'auto';
      // ensure playback starts from the beginning
      audio.currentTime = 0;
      audioRef.current = audio;

      return new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        // try to play after ensuring metadata is loaded; if muted, resolve immediately
        if (!isMuted) {
          // attempt to play and catch any promise rejection
          audio.play().catch(err => {
            // If playback fails, still resolve to avoid blocking
            console.error('Audio play failed:', err);
            resolve();
          });
        } else {
          resolve();
        }
      });
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };

  // Start listening to user
  const startListening = () => {
    setTranscript('');
    startRecording();
  };

  // Stop listening and process response
  const stopListening = async () => {
    stopRecording();

    const currentTranscript = transcript.trim();
    if (currentTranscript) {
      setTranscript(''); // Clear immediately to prevent reuse
      await processUserResponse(currentTranscript);
    }
  };

  // Process user's response and get next question
  const processUserResponse = async (userResponse: string) => {
    setIsProcessing(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userResponse,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Save user message to Firebase
    if (user && sessionId) {
      try {
        await firebaseUtils.addMessageToSession(
          sessionId,
          {
            id: userMessage.id,
            role: userMessage.role,
            content: userMessage.content,
            timestamp: Timestamp.fromDate(userMessage.timestamp)
          },
          userMessage.content
        );
      } catch (error) {
        console.error('Error saving user message to Firebase:', error);
      }
    }

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          interviewType: 'behavioral',
          params: sessionParams,
          sessionId: sessionId,
          userId: user?.uid,
        }),
      });

      const data = await response.json();
      const aiResponse = data.response || 'Thank you for sharing that.';
      const isInterviewComplete = data.interviewComplete || false;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        isCompletion: data.interviewComplete || false,
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentQuestion(aiResponse);

      // Check if interview is complete
      if (data.interviewComplete) {
        setIsComplete(true);
        stopRecording(); // Stop recording when complete
      }

      // Save AI message to Firebase
      if (user && sessionId) {
        try {
          await firebaseUtils.addMessageToSession(
            sessionId,
            {
              id: aiMessage.id,
              role: aiMessage.role,
              content: aiMessage.content,
              timestamp: Timestamp.fromDate(aiMessage.timestamp)
            },
            aiMessage.content
          );
        } catch (error) {
          console.error('Error saving AI message to Firebase:', error);
        }
      }

      // Only speak the AI response if it's NOT the final summary
      if (!isInterviewComplete) {
        await speakText(aiResponse);
        
        // Start listening again for next answer
        setTimeout(() => {
          setTranscript('');
          startListening();
        }, 500);
      } else {
        // Interview is complete - show the summary text but don't speak it
        console.log('Interview complete - displaying summary without voice');
        
        // Stop recording and audio
        stopRecording();
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setInterviewComplete(true);
      }
    } catch (error) {
      console.error('Error processing response:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // End interview (for early termination)
  const endInterview = async () => {
    stopRecording();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Save or update the complete conversation in Firebase before navigating
    if (user && sessionId && messages.length > 0) {
      try {
        // Update the session with all messages to ensure everything is saved
        const firebaseMessages = messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: Timestamp.fromDate(msg.timestamp)
        }));

        const lastMsg = messages[messages.length - 1];
        
        await firebaseUtils.updateChatSession(sessionId, {
          messages: firebaseMessages,
          messageCount: messages.length,
          lastMessage: lastMsg.content,
          timestamp: Timestamp.fromDate(lastMsg.timestamp)
        });
      } catch (error) {
        console.error('Error updating session in Firebase:', error);
      }
    }
    
    // Navigate back to behavioral home (not results, since interview was incomplete)
    router.push('/interview/behavioral');
  };

  // Ensure we stop recording and persist session when the component unmounts
  useEffect(() => {
    // Synchronous handler for unload events
    const handleBeforeUnload = () => {
      try {
        stopRecording();
      } catch (e) {
        // swallow errors
      }
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (e) {}
      }
      // Note: we avoid awaiting network calls here since unload may cancel them.
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // On unmount, stop recording and save session data (fire-and-forget)
      try {
        stopRecording();
      } catch (e) {
        // ignore
      }
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (e) {}
      }

      // Persist the session without navigating (similar to endInterview save logic)
      (async () => {
        if (user && sessionId && messages.length > 0) {
          try {
            const firebaseMessages = messages.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: Timestamp.fromDate(msg.timestamp)
            }));

            const lastMsg = messages[messages.length - 1];

            await firebaseUtils.updateChatSession(sessionId, {
              messages: firebaseMessages,
              messageCount: messages.length,
              lastMessage: lastMsg.content,
              timestamp: Timestamp.fromDate(lastMsg.timestamp)
            });
          } catch (error) {
            console.error('Error saving session on unmount:', error);
          }
        }
      })();
    };
  }, [stopRecording, sessionId, messages, user]);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (audioRef.current) {
      if (newMutedState) {
        // Muting - pause the audio
        audioRef.current.pause();
      } else {
        // Unmuting - resume the audio if it was paused
        if (audioRef.current.paused) {
          audioRef.current.play().catch(error => {
            console.error('Error resuming audio:', error);
          });
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 pl-20">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[rgba(76,166,38,1)] to-[rgba(76,166,38,0.8)] p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Live Practice Interview</h1>
              <p className="text-sm text-white/80 mt-1">
                Behavioral Interview Session
                {sessionParams.role && sessionParams.company && (
                  <span> - {sessionParams.role} at {sessionParams.company}</span>
                )}
              </p>
            </div>
            
            
            
            <button
              onClick={endInterview}
              className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 cursor-pointer hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar - Only show in full interview mode */}
        {isFullInterview && interviewStarted && (
          <div className="bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Behavioral Interview Progress
              </span>
              <span className="text-sm font-semibold text-[rgba(76,166,38,1)]">
                {interviewComplete ? 'Complete!' : `${answeredQuestions}/${totalQuestions} Questions`}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[rgba(76,166,38,1)] to-[rgba(76,166,38,0.8)] transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className={answeredQuestions >= 0 ? 'text-[rgba(76,166,38,1)] font-semibold' : ''}>Start</span>
              <span className={answeredQuestions >= 1 ? 'text-[rgba(76,166,38,1)] font-semibold' : ''}>Q1</span>
              <span className={answeredQuestions >= 2 ? 'text-[rgba(76,166,38,1)] font-semibold' : ''}>Q2</span>
              <span className={answeredQuestions >= 3 ? 'text-[rgba(76,166,38,1)] font-semibold' : ''}>Q3</span>
              <span className={answeredQuestions >= 4 ? 'text-[rgba(76,166,38,1)] font-semibold' : ''}>Q4</span>
              <span className={interviewComplete ? 'text-[rgba(76,166,38,1)] font-semibold' : ''}>Technical →</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-8">
          {!interviewStarted ? (
            <div className="text-center py-12">
              {/* Not signed in warning */}
              {!user && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ You&apos;re not signed in. Your session won&apos;t be saved. <button onClick={() => router.push('/login')} className="underline font-medium hover:text-yellow-900 dark:hover:text-yellow-100 cursor-pointer">Sign in</button> to save your progress and view results.
                  </p>
                </div>
              )}
              <div className="mb-8">
                <div className="w-24 h-24 bg-[rgba(76,166,38,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-12 h-12 text-[rgba(76,166,38,1)]" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Ready to Begin?
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Click start when you&apos;re ready to begin your live interview practice
                </p>
              </div>
              {/* Pre-interview filler word toggle */}
              <div className="flex justify-center mb-6">
                <label
                  role="switch"
                  aria-checked={fillerWordDetectionEnabled}
                  title={fillerWordDetectionEnabled ? 'Disable Filler Word Detection' : 'Enable Filler Word Detection'}
                  className="flex items-center gap-3 bg-white/5 dark:bg-white/5 px-3 py-2 rounded-lg transition-all duration-200 justify-center mx-auto"
                >
                  <input
                    type="checkbox"
                    checked={fillerWordDetectionEnabled}
                    onChange={(e) => setFillerWordDetectionEnabled(e.target.checked)}
                    className="sr-only"
                    aria-label="Toggle filler word detection"
                  />

                  <span
                    className={`relative inline-block w-11 h-6 rounded-full transition-colors flex-shrink-0 ${fillerWordDetectionEnabled ? 'bg-[rgba(76,166,38,1)]' : 'bg-gray-300 dark:bg-gray-600'}`}
                    aria-hidden="true"
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${fillerWordDetectionEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </span>

                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {fillerWordDetectionEnabled ? 'Filler Detection: On' : 'Filler Detection: Off'}
                  </span>
                </label>
              </div>
              <Button
                variant="primary"
                className="bg-[rgba(76,166,38,1)] hover:bg-[rgba(76,166,38,0.9)] px-8 py-3 text-lg"
                onClick={startInterview}
              >
                Start Interview
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Question */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Current Question:
                </h3>
                <p className="text-lg text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {currentQuestion}
                </p>
              </div>

              {/* Live Transcript */}
              {isRecording && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Live Transcript:
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {transcript || 'Listening...'}
                  </p>
                </div>
              )}

              {/* Filler Word Counter */}
              {fillerWordDetectionEnabled && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-500/20 rounded-full p-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                          Filler Words Detected
                        </h3>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 opacity-80">
                          Try to minimize usage for better delivery
                        </p>
                      </div>
                    </div>
                    <div className="text-center bg-yellow-100 dark:bg-yellow-900/30 px-4 py-2 rounded-lg">
                      <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Count</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{fillerWordCount}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={toggleMute}
                  className="p-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-all duration-200 cursor-pointer hover:scale-105"
                  title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
                  disabled={isComplete}
                >
                  {isMuted ? (
                    <VolumeX className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <Volume2 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  )}
                </button>

                {!isRecording && !isProcessing && !isComplete ? (
                  <button
                    onClick={startListening}
                    className="p-6 bg-[rgba(76,166,38,1)] hover:bg-[rgba(76,166,38,0.9)] rounded-full transition-all duration-200 cursor-pointer hover:scale-105 shadow-lg"
                    title="Start Recording Your Answer"
                  >
                    <Mic className="w-8 h-8 text-white" />
                  </button>
                ) : isRecording && !isComplete ? (
                  <button
                    onClick={stopListening}
                    className="p-6 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200 cursor-pointer hover:scale-105 shadow-lg animate-pulse"
                    title="Stop Recording"
                  >
                    <MicOff className="w-8 h-8 text-white" />
                  </button>
                ) : isProcessing ? (
                  <div className="p-6 bg-gray-300 dark:bg-gray-700 rounded-full">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : null}
              </div>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                {isComplete ? (
                  <div className="space-y-4">
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Interview Complete!
                    </p>
                    {sessionId ? (
                      <Button
                        variant="primary"
                        className="bg-[rgba(76,166,38,1)] hover:bg-[rgba(76,166,38,0.9)]"
                        onClick={() => {
                          // Pass fullInterview parameter to results page
                          const resultsUrl = isFullInterview 
                            ? `/interview/behavioral/results/${sessionId}?fullInterview=true`
                            : `/interview/behavioral/results/${sessionId}`;
                          router.push(resultsUrl);
                        }}
                      >
                        View Results & Feedback
                      </Button>
                    ) : (
                      <p className="text-yellow-600 dark:text-yellow-400">
                        Sign in to save your results
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {isRecording && 'Click the microphone to stop and submit your answer'}
                    {!isRecording && !isProcessing && 'Click the microphone to start answering'}
                    {isProcessing && 'Processing your response...'}
                  </>
                )}
              </div>

              {/* Messages History */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                  Conversation History:
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-[rgba(76,166,38,0.1)] ml-8'
                          : 'bg-gray-100 dark:bg-gray-800 mr-8'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {message.role === 'user' ? 'You' : 'Interviewer'}
                      </p>
                      <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue to Technical Round Button - Only show when interview is complete and in full interview mode */}
              {interviewComplete && isFullInterview && (
                <div className="mt-8 p-6 bg-gradient-to-br from-[rgba(76,166,38,0.1)] to-[rgba(76,166,38,0.05)] dark:from-[rgba(76,166,38,0.2)] dark:to-[rgba(76,166,38,0.1)] rounded-2xl border-2 border-[rgba(76,166,38,0.3)] dark:border-[rgba(76,166,38,0.4)] shadow-lg">
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-[rgba(76,166,38,1)] to-[rgba(76,166,38,0.8)] rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <svg 
                          className="w-10 h-10 text-white" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2.5} 
                            d="M5 13l4 4L19 7" 
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Behavioral Round Complete! 🎉
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                      Great job! Ready to showcase your technical skills?
                    </p>
                    <button
                      onClick={() => {
                        sessionStorage.setItem('behavioralComplete', 'true');
                        const urlParams = new URLSearchParams(window.location.search);
                        router.push(`/interview/technical?${urlParams.toString()}`);
                      }}
                      className="bg-gradient-to-r from-[rgba(76,166,38,1)] to-[rgba(76,166,38,0.8)] hover:from-[rgba(76,166,38,0.9)] hover:to-[rgba(76,166,38,0.7)] text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold inline-flex items-center gap-2 hover:scale-105"
                    >
                      Continue to Technical Round
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M13 7l5 5m0 0l-5 5m5-5H6" 
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* End Interview Button */}
              <div className="flex justify-center mt-6">
                <Button
                  variant="secondary"
                  onClick={endInterview}
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  End Interview
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LiveInterviewSession() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LiveInterviewSessionContent />
    </Suspense>
  );
}
