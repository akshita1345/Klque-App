"use client"

import { apiClient } from "@/client/client";
import { Button } from "@/components/ui/button";
import { formatTimestampForMessage } from "@/utils/format-date";
import Cookies from "js-cookie";
import { FileText, Plus, Send, Calendar, ChevronDown, ClipboardList, Search, RefreshCcw, Trash, RotateCcw, ExpandIcon, ListCollapseIcon, Maximize2, Minimize2 } from 'lucide-react';
import moment from "moment-timezone";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MemoizedChatMessage } from "./chat/chat-message";
import ReactMarkdown from 'react-markdown';
import DotsSpinner from "./common/dots-spinner";
import TypingDotSpinner from "./common/typing-dot-spinner";
import { useToast } from "./ui/use-toast";
import { montserrat } from "@/app/layout";
import useApi from '@/hooks/use-api';
import Image from "next/image";

// Define Task interface for proper typing
interface Task {
  _id: string;
  title: string;
  description?: string;
  completed?: boolean;
  date: string;
  priority?: string;
}

// At the top of the file, add this interface
interface SavedIdea {
  _id: string;
  title: string;
  timestamp: string;
  context: string;
  discarded: boolean;
  isDeleted?: boolean;
  discardedAt?: string;
}

// Add TypewriterMessage component
const TypewriterMessage = ({
  message,
  onComplete,
  timestamp,
  isQuestion,
  isAnswered,
  isTaskScript,
  handleSendMessage,
  messageContainsIdeas,
  saveIdeaToCollection
}: {
  message: string;
  onComplete: () => void;
  timestamp: string;
  isQuestion?: boolean;
  isAnswered?: boolean;
  isTaskScript?: boolean;
  handleSendMessage: (msg: string) => void;
  messageContainsIdeas: (msg: string) => boolean;
  saveIdeaToCollection: (msg: string) => void;
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const messageListRef = useRef(null);
  const userHasScrolled = useRef(false);
  const isTypingActive = useRef(true); // Track if we're currently typing

  useEffect(() => {
    const words = message.split(" ");

    if (currentIndex < words?.length) {
      isTypingActive.current = true;
      const timer = setTimeout(() => {
        setDisplayedText(prev =>
          prev.length === 0 ? words[currentIndex] : `${prev} ${words[currentIndex]}`
        );
        setCurrentIndex(prev => prev + 1);

        // Auto-scroll only if user hasn't manually scrolled up and we're still typing
        if (!userHasScrolled.current && isTypingActive.current) {
          requestAnimationFrame(() => {
            const messageListElement = messageListRef.current || document.querySelector('[data-message-list]');
            if (messageListElement) {
              const isAtBottom =
                messageListElement.scrollHeight - messageListElement.scrollTop <=
                messageListElement.clientHeight + 50;

              if (isAtBottom) {
                messageListElement.scrollTo({
                  top: messageListElement.scrollHeight,
                  behavior: 'smooth'
                });
              }
            }
          });
        }
      }, 30);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      isTypingActive.current = false; // Mark typing as complete
      setIsComplete(true);
      onComplete();
    }
  }, [currentIndex, message, isComplete, onComplete]);

  useEffect(() => {
    const messageListElement = messageListRef.current || document.querySelector('[data-message-list]');
    if (!messageListElement) return;

    const handleScroll = () => {
      if (isTypingActive.current) { // Only track during typing
        const isAtBottom =
          messageListElement.scrollHeight - messageListElement.scrollTop <=
          messageListElement.clientHeight + 50;

        userHasScrolled.current = !isAtBottom;
      }
    };

    messageListElement.addEventListener('scroll', handleScroll);
    return () => messageListElement.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Reset tracking when new message starts
    userHasScrolled.current = false;
    isTypingActive.current = true;
  }, [message]);

  return (
    <div className="lg:max-w-[60%]">
      <div ref={messageListRef} className="bg-[#FCF7E4] text-black p-3 rounded-lg w-full md:text-sm text-[12px]">
        <ReactMarkdown
          className="prose prose-sm break-words"
          components={{
            ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '2.2em' }} {...props} />,
            ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '2.2em' }} {...props} />,
            a: ({ node, ...props }) => <a style={{ textDecoration: 'underline' }} target="_blank" {...props} />,
            pre: ({ node, ...props }) => <pre style={{ backgroundColor: '#f0f0f0', padding: '0.8em', borderRadius: '4px', overflowX: 'auto' }} {...props} />,
            p: ({ node, ...props }) => <p style={{ whiteSpace: 'pre-line', marginTop: '0.1em', marginBottom: '0.1em', color: '#494848', fontWeight: '400' }} {...props} />,
            strong: ({ node, ...props }) => <strong style={{ color: 'black' }} {...props} />,
            hr: ({ node, ...props }) => <hr style={{ margin: '1em 0' }} {...props} />,
            br: () => null, // Remove <br/> tags entirely
          }}
        >
          {displayedText}
        </ReactMarkdown>
        {!isComplete && <span className="animate-pulse">|</span>}
      </div>
      <div className="flex justify-between mt-3">
        {/* <p className={`text-muted-foreground text-xs ml-1`} style={{ marginTop: "4px" }}>
          {timestamp && <TimestampDisplay timestamp={timestamp} />}
        </p> */}
        {isComplete && (
          <div className="flex items-center gap-2">
            {/* {(isQuestion && !isAnswered) &&
              <div className="flex gap-2 justify-center" style={{ marginTop: "6px" }}>
                <Button variant="outline" className="rounded-none border-[#EB7A52] text-[#EB7A52] hover:bg-[#EB7A5220] text-xs px-3 py-1" onClick={() => handleSendMessage(isTaskScript ? "Yes" : "Yes, Add it to my plan")}>Yes</Button>
                <Button variant="outline" className="rounded-none border-[#EB7A52] text-[#EB7A52] hover:bg-[#EB7A5220] text-xs px-3 py-1" onClick={() => handleSendMessage("No")}>No</Button>
              </div>
            } */}
            {messageContainsIdeas(displayedText) &&
              <Button
                id="tour-save-response-btn"
                variant="outline"
                className="rounded border-[#5D60FF] text-[#5D60FF] hover:bg-[#5D60FF20] text-xs px-3 py-1 ml-2"
                onClick={() => saveIdeaToCollection(displayedText)}
              >
                Save Response
              </Button>
            }
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for timestamp display
const TimestampDisplay = ({ timestamp }: { timestamp: string }) => {
  if (!timestamp) return null;
  try {
    const date = new Date(timestamp);
    return <>{formatTimestampForMessage(date)}</>;
  } catch (e) {
    return <>{timestamp}</>;
  }
};

export function ChatInterface() {

  const messageListRef: any = useRef(null);
  const conversationRef: any = useRef(null);
  const newSlotFirstMessageRef = useRef<HTMLDivElement>(null);
  const [showMoreMap, setShowMoreMap] = useState<Record<string, boolean>>({});

  const handleShowMore = (itemId: string) => {
    setShowMoreMap(prev => ({
      ...prev,
      [itemId]: true
    }));
  };

  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const historyId = searchParams.get('chat') || "";
  const scriptId = searchParams.get('scriptId') || "";
  const [loginUser, setLoginUser] = useState<any>(null);
  const [userId, setUserId] = useState("");

  const [conversation, setConversation] = useState<any>([]);
  const [conversationCount, setConversationCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [historyList, setNewHistoryList] = useState<any[]>([]);
  const [historyListTimeWise, setHistoryListTimeWise] = useState<any>({});
  const [historyListYearWise, setHistoryListYearWise] = useState<any>({});
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [showingIdeaContext, setShowingIdeaContext] = useState<string | null>(null);
  const [activeIdeaContext, setActiveIdeaContext] = useState<string | null>(null);
  const [initialPromptSent, setInitialPromptSent] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<SavedIdea | null>(null);
  const [createLimitError, setCreateLimitError] = useState(false);
  const [createScriptLimitError, setCreateScriptLimitError] = useState(false);
  const [isExpand, setIsExpand] = useState(false);

  // Add state for typewriter effect
  const [typingMessage, setTypingMessage] = useState<any>(null);
  const [typingComplete, setTypingComplete] = useState(false);


  // Handle typewriter completion
  const handleTypingComplete = () => {
    if (typingMessage) {
      // Add the complete message to conversation
      setConversation((prevConversations: any) => [...prevConversations, typingMessage]);

      // Handle navigation if needed
      if (typingMessage.onComplete) {
        typingMessage.onComplete();
      }

      // Clear typing state
      setTypingMessage(null);
      setTypingComplete(true);
    }
  };

  // Calendar states - Use current date instead of hardcoded values
  const todayDate = new Date();
  const currentDay = todayDate.getDate().toString();
  const [activeDay, setActiveDay] = useState(currentDay);
  const [activeTab, setActiveTab] = useState<'schedule' | 'todos'>('schedule');
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Array<{ day: string, date: string }>>([]);
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<'all' | 'today'>('all');

  // Find the current week's start (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1; // Adjust to make Monday the first day
    d.setDate(d.getDate() - diff);
    return d;
  };

  // Get current week's Monday for any formatting needed
  const getMonday = (): Date => {
    return getWeekStart(todayDate);
  };

  // Generate week days dynamically from current date
  const generateWeekDays = (date: Date): Array<{ day: string, date: string }> => {
    const weekStart = getWeekStart(date);

    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + index);
      return {
        day: day.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        date: day.getDate().toString()
      };
    });
  };

  // Update week days when calendar date changes
  useEffect(() => {
    setWeekDays(generateWeekDays(calendarDate));
  }, [calendarDate]);

  // Initialize weekDays
  useEffect(() => {
    setWeekDays(generateWeekDays(calendarDate));
  }, []);

  // Remove hardcoded weekdays
  useEffect(() => {
    // Generate weekdays based on current date
    setWeekDays(generateWeekDays(calendarDate));
  }, []);

  const formattedDate = new Date(
    Date.UTC(todayDate.getFullYear(), todayDate.getMonth(), Number(activeDay))
  ).toISOString();

  // Fetch content for the active day
  const {
    data: content,
    loading: contentLoading,
    error: contentError,
    refetch: contentRefetch,
  } = useApi(`/api/get-content-by-date?date=${formattedDate}`);

  // Fetch all content to show indicators on calendar
  // const {
  //   data: allContent,
  //   loading: allContentLoading,
  //   error: allContentError,
  //   refetch: allContentRefetch,
  // } = useApi(`/api/get-contents?type=content`);

  const {
    data: allTasks,
    loading: tasksLoading,
    error: tasksError,
    refetch: tasksRefetch,
  } = useApi("/api/fetch-all-task");

  // // Helper function to safely handle content data
  // const getContentItems = () => {
  //   if (content === null || content === undefined) return [];
  //   if (!Array.isArray(content)) return [];
  //   return content;
  // };

  // // Helper function to get tasks for a specific date
  // const getTasksForDate = (date: Date): Task[] => {
  //   const tasks = Array.isArray(allTasks) ? allTasks as Task[] : [];
  //   return tasks.filter((task: Task) => {
  //     const taskDate = new Date(task.date);
  //     return taskDate.getDate() === date.getDate() &&
  //       taskDate.getMonth() === date.getMonth() &&
  //       taskDate.getFullYear() === date.getFullYear();
  //   });
  // };

  // // Helper function to get content for a specific date
  // const getContentForDate = (date: Date): any[] => {
  //   const contentArray = Array.isArray(allContent) ? allContent as any[] : [];
  //   return contentArray.filter((c: any) => {
  //     try {
  //       const contentDateStr = c.scheduledFor || c.date || c.createdAt;
  //       if (!contentDateStr) return false;

  //       const contentDate = new Date(contentDateStr);
  //       return contentDate.getDate() === date.getDate() &&
  //         contentDate.getMonth() === date.getMonth() &&
  //         contentDate.getFullYear() === date.getFullYear();
  //     } catch (e) {
  //       return false;
  //     }
  //   });
  // };

  // Function to navigate to content on plan page
  const navigateToContent = (contentId: string) => {
    router.push(`/plan?contentId=${contentId}`);
  };

  const onCheckedChange = (taskId: string, checked: boolean) => {
    if (checked) {
      handleDeleteTask(taskId);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiClient("/api/delete-task?timezone=" + moment.tz.guess(), {
        method: "DELETE",
        body: JSON.stringify({ taskId }),
      });

      if (typeof tasksRefetch === "function") {
        tasksRefetch();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const td = new Date();
  td.setHours(0, 0, 0, 0);

  // Type assertion to help TypeScript understand allTasks
  const typedAllTasks = Array.isArray(allTasks) ? allTasks as Task[] : [];

  // const inProgressTasks = typedAllTasks.filter((t) => {
  //   const taskDate = new Date(t.date);
  //   const utcTaskDate = new Date(
  //     Date.UTC(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
  //   );
  //   const utcToday = new Date(
  //     Date.UTC(td.getFullYear(), td.getMonth(), td.getDate())
  //   );
  //   return utcTaskDate.getTime() <= utcToday.getTime();
  // });

  // const todoTasksList = typedAllTasks.filter((t) => {
  //   const taskDate = new Date(t.date);
  //   taskDate.setHours(0, 0, 0, 0);
  //   return taskDate.getTime() > td.getTime(); // Future dates
  // });

  // Get user data on client-side only to avoid hydration mismatch
  useEffect(() => {
    // Parse user from cookies only on client-side
    try {
      const userCookie = localStorage.getItem("user");
      if (userCookie) {
        setLoginUser(JSON.parse(userCookie));
        setUserId(JSON.parse(userCookie)?._id);
      }

      // Load saved ideas from localStorage if any
      const savedIdeasFromStorage = localStorage.getItem('savedIdeas');
      if (savedIdeasFromStorage) {
        setSavedIdeas(JSON.parse(savedIdeasFromStorage));
      }
    } catch (e) {
      console.error("Error parsing user cookie:", e);
    }
  }, []);

  useEffect(() => {
    if (!loginUser) return;

    document.getElementById('messageInput')?.focus();

    const sendAfterDelay = (message: any) => setTimeout(() => handleSendMessage(message), 500);

    const initialPrompt = searchParams.get('initialPrompt');
    if (initialPrompt) {
      sendAfterDelay(initialPrompt);
      return;
    }

    if (historyId) return;

    const hasUsedAppBefore = localStorage.getItem('hasUsedAppBefore') || "false";
    const isFirstTime = !JSON.parse(hasUsedAppBefore !== "undefined" ? hasUsedAppBefore : "false");
    const pendingPrompt = localStorage.getItem('pendingChatPrompt');
    const newParamExists = searchParams?.get("new");
    if (isFirstTime && !pendingPrompt) {
      localStorage.setItem('hasUsedAppBefore', 'true');
      if (loginUser?.onboarding) {
        handleSendInitialPrompt(
          "Say that Based on your responses here are some quick content ideas I generated for you; and then generate 3 one sentence ideas and then say Let me know which one resonated with you", true
        );
      }
    } else if (newParamExists) {
      handleSendInitialPrompt(
        "Summarize the previous conversations and give one exact things we should work on next in terms of content ideas, don't go over 2 sentences. don't include the pending things in previous chats. don't suggest visulas recommendations.", false
      );
    }
  }, [loginUser, historyId]);


  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation])

  useEffect(() => {
    if (loginUser) {
      getChatHistory(0);
      // getChatHistoryList(0);
    }
  }, [loginUser, historyId]);

  const onlyInitialScrollDown = useRef(true);

  useEffect(() => {
    const messageList = messageListRef.current;

    // Scroll to the bottom initially
    if (messageList && conversation?.length <= 20 && onlyInitialScrollDown.current) {
      messageList.scrollTop = messageList.scrollHeight;
    }

    const handleScroll = async () => {
      if (messageList && messageList.scrollTop === 0 && conversation.length < conversationCount) {
        setConversationCount(conversation.length);
        getChatHistory(conversation.length);
      }
    };
    messageList?.addEventListener("scroll", handleScroll);
    // if (newSlotFirstMessageRef.current) {
    //   const firstMessage = newSlotFirstMessageRef.current;
    //   firstMessage.scrollIntoView({ block: "start", behavior: "instant" });
    // }
    return () => messageList?.removeEventListener("scroll", handleScroll);
  }, [conversation, conversationCount, newSlotFirstMessageRef, messageListRef]);

  const getChatHistory = async (skipCount: number) => {
    if (skipCount > 0) onlyInitialScrollDown.current = false;
    try {
      if (!historyId) return;
      setLoading(true);
      // Call the API using the utility
      const response = await apiClient(`/api/get-user-chat-history?userId=${loginUser?._id}&historyId=${historyId}&limit=20&skip=${skipCount}`, {
        method: "GET",
      });

      if (response?.chatHistory) {
        const { data: conversations, count } = response?.chatHistory;
        const reversedData = [...conversations].reverse();
        setConversation((prevConversation: any) => {
          if (skipCount > 0) {
            const mergedConversations = [...reversedData, ...prevConversation];
            // Filter out duplicate conversations based on _id
            const uniqueConversations = mergedConversations.reduce((acc, current) => {
              if (!acc.some((con: any) => (current._id && con._id === current._id))) {
                acc.push(current);
              }
              return acc;
            }, []);
            return uniqueConversations;
          } else {
            return reversedData
          }
        });
        setConversationCount(count);

        const sendAfterDelay = (message: any) => setTimeout(() => handleSendMessage(message), 500);

        const pendingPrompt = localStorage.getItem('pendingChatPrompt');
        if (pendingPrompt) {
          localStorage.removeItem('pendingChatPrompt');
          sendAfterDelay(pendingPrompt);
          return;
        }
      }
    } catch (err: any) {
      toast({
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getChatHistoryList = useCallback(async (skipCount: number) => {
    try {
      setHistoryLoading(true)
      const response = await apiClient(`/api/get-chat-history-list?userId=${loginUser?._id}&limit=20&skip=${skipCount}`, {
        method: "GET",
      });

      const { data, count } = response;

      setNewHistoryList((prevHistory: any) => {
        const mergedHistory = [...prevHistory, ...data];

        // Remove duplicate conversations based on _id
        const uniqueHistory = mergedHistory?.reduce((acc, current) => {
          if (!acc.some((con: any) => con?._id === current?._id)) {
            acc.push(current);
          }
          return acc;
        }, []);

        const groupedChatsByPeriod: any = {
          Today: [],
          Yesterday: [],
          "Previous 7 Days": [],
          "Previous 30 Days": [],
        };
        const groupedChatsByYear: any = {};

        uniqueHistory.forEach((chat: any) => {
          const chatDate = moment(chat.timestamp);
          const today = moment().startOf("day");
          const yesterday = moment().subtract(1, "days").startOf("day");
          const sevenDaysAgo = moment().subtract(7, "days").startOf("day");
          const thirtyDaysAgo = moment().subtract(30, "days").startOf("day");

          if (chatDate.isSame(today, "day")) {
            groupedChatsByPeriod.Today.push(chat);
          } else if (chatDate.isSame(yesterday, "day")) {
            groupedChatsByPeriod.Yesterday.push(chat);
          } else if (chatDate.isAfter(sevenDaysAgo)) {
            groupedChatsByPeriod["Previous 7 Days"].push(chat);
          } else if (chatDate.isAfter(thirtyDaysAgo)) {
            groupedChatsByPeriod["Previous 30 Days"].push(chat);
          } else {
            const chatYear = chatDate.year().toString();
            if (!groupedChatsByYear[chatYear]) groupedChatsByYear[chatYear] = [];
            groupedChatsByYear[chatYear].push(chat);
          }
        });

        // ✅ Sort each group by timestamp DESC
        Object.keys(groupedChatsByPeriod)?.forEach((key) => {
          groupedChatsByPeriod[key].sort(
            (a: any, b: any) => new Date(b?.timestamp).getTime() - new Date(a?.timestamp).getTime()
          );
        });
        Object.keys(groupedChatsByYear)?.forEach((year) => {
          groupedChatsByYear[year].sort(
            (a: any, b: any) => new Date(b?.timestamp).getTime() - new Date(a?.timestamp).getTime()
          );
        });

        setHistoryListTimeWise(groupedChatsByPeriod);
        setHistoryListYearWise(groupedChatsByYear);

        return uniqueHistory;
      });
      setHistoryCount(count);
      setHistoryLoading(false)
    } catch (err: any) {
      toast({
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setHistoryLoading(false)
    }
  }, [loginUser, historyId, conversation]);

  // Function to detect if a message likely contains ideas based on semantic analysis
  const messageContainsIdeas = (message: string) => {
    if (!message || typeof message !== 'string') return false;

    // Analyze if the message is likely an "idea script" by checking for specific patterns
    // similar to how the ideate-to-plan tool handles idea identification

    // Check if the message starts with a clear indication of ideas
    const hasIdeaIntroduction = /^(here\s+(are|is)|presenting|introducing|check out these|I've.+prepared|Let me share|I've created)/i.test(message);

    // Check for common idea content descriptors
    const hasContentTerms = /(content ideas?|content suggestions?|ideas? for|campaign ideas?|marketing ideas?|creative concepts?)/i.test(message);

    // Check for clear numbered/titled ideas with substantive descriptions
    const hasNumberedIdeas = message.split('\n').filter(line => /^\d+\..*[A-Z]/.test(line.trim())).length > 0;

    // Check for narrative flow that suggests presenting multiple options
    const hasIdeaFlow = /(First|1\.|Option \d|Idea \d|Approach \d|Strategy \d|Concept \d)/i.test(message) &&
      /(Second|2\.|Another|Next)/i.test(message);

    // Check for substantive content that's likely to be ideas
    const messageLength = message.length > 300; // Ideas are typically detailed
    const hasParagraphBreaks = message.split('\n\n').length > 2; // Multiple paragraph blocks

    // Combine indicators to determine if this is an idea message
    // Prioritize strong indicators of idea content

    // Strong indicators - need only one of these
    if (
      (hasIdeaIntroduction && hasContentTerms) ||
      (hasNumberedIdeas && hasContentTerms) ||
      (hasIdeaFlow && messageLength)
    ) {
      return true;
    }

    // Medium strength indicators - need multiple of these
    const mediumIndicators = [
      hasIdeaIntroduction,
      hasContentTerms,
      hasNumberedIdeas,
      hasIdeaFlow,
      hasParagraphBreaks && messageLength
    ];

    const mediumIndicatorCount = mediumIndicators.filter(Boolean).length;

    return mediumIndicatorCount >= 2;
  };

  // Function to generate a summary title from the response
  const generateResponseSummary = (message: string): string => {
    // Remove markdown formatting for analysis
    const cleanMessage = message.replace(/\*\*(.*?)\*\*/g, '$1').replace(/__(.*?)__/g, '$1').replace(/\*\*/g, '').replace(/__/g, '').trim();

    // Split into sentences and get meaningful content
    const sentences = cleanMessage.split(/[.!?]+/).filter(s => s.trim().length > 5);

    // Look for key patterns that indicate the main topic (shorter matches)
    const topicIndicators = [
      /here\s+(?:are|is)\s+(.{5,30})/i,
      /let me\s+(?:share|explain|tell|show)\s+(.{5,30})/i,
      /(?:tips|ideas|strategies|ways|methods)\s+(?:for|to)\s+(.{5,30})/i,
      /(?:about|regarding|concerning)\s+(.{5,30})/i,
      /you\s+(?:can|should|might)\s+(.{5,30})/i,
      /consider\s+(.{5,30})/i,
      /focus\s+on\s+(.{5,30})/i
    ];

    // Try to find a topic from patterns
    for (const pattern of topicIndicators) {
      const match = cleanMessage.match(pattern);
      if (match && match[1]) {
        let topic = match[1].trim();
        // Clean up and limit length
        topic = topic.replace(/[,;:].*$/, '').trim();
        if (topic.length > 35) {
          topic = topic.substring(0, 32) + '...';
        }
        return topic.charAt(0).toUpperCase() + topic.slice(1);
      }
    }

    // Look for numbered lists or bullet points to summarize
    const listItems = cleanMessage.match(/(?:^\d+\.|^[•\-\*])\s*(.{5,40})/gm);
    if (listItems && listItems.length >= 2) {
      const firstItem = listItems[0].replace(/^(?:\d+\.|[•\-\*])\s*/, '').trim();
      return `${firstItem.substring(0, 20)}...`;
    }

    // Extract main concepts from the first few sentences
    const firstSentences = sentences.slice(0, 1).join('. ');
    if (firstSentences.length > 0) {
      // Look for key nouns and phrases
      const keyWords = firstSentences.match(/\b(?:content|marketing|strategy|ideas|tips|audience|engagement|social|brand|campaign|post|video|story|growth|success|creative)\b/gi);

      if (keyWords && keyWords.length > 0) {
        // Create a summary based on key concepts
        const uniqueKeywords = Array.from(new Set(keyWords.map(w => w.toLowerCase())));
        const conceptSummary = uniqueKeywords.slice(0, 2).join(' & ');
        return conceptSummary.charAt(0).toUpperCase() + conceptSummary.slice(1);
      }
    }

    // Fallback: use first sentence if reasonable length
    if (sentences.length > 0 && sentences[0].length <= 30) {
      return sentences[0].trim();
    }

    // Final fallback: use first line but with much shorter truncation
    const firstLine = message.split('\n')[0].trim();
    if (firstLine.length <= 35) {
      return firstLine;
    }

    // Smart truncation at word boundary
    const truncated = firstLine.substring(0, 22);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 20) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  };

  // Function to save entire chat response
  const saveIdeaToCollection = async (message: string) => {
    let title = generateResponseSummary(message);
    if (!title) title = 'Chat Response';
    try {
      const res = await apiClient('/api/response/create', {
        method: 'POST',
        body: JSON.stringify({
          userId: loginUser._id,
          title,
          context: message,
        }),
      });

      if (res?.type === "LIMIT_REACHED") {
        toast({ description: res?.message, variant: "destructive" });
        return;
      }

      if (res.success) {
        await fetchSavedIdeas();
      }
      toast({ description: "Response saved to your collection!", variant: "default" });
    } catch (e) {
      toast({ description: "Failed to save response", variant: "destructive" });
    }
  };

  // Discard a response (set discarded: true)
  const discardIdea = async (ideaId: string) => {
    try {
      await apiClient('/api/response/update', {
        method: 'PATCH',
        body: JSON.stringify({ id: ideaId, discarded: true, discardedAt: new Date().toISOString() }),
      });
      await fetchSavedIdeas();
      toast({ description: "Response moved to archive", variant: "default" });
    } catch (e) {
      toast({ description: "Failed to archive response", variant: "destructive" });
    }
  };

  // Restore a response (set discarded: false)
  const restoreIdea = async (ideaId: string) => {
    try {
      await apiClient('/api/response/update', {
        method: 'PATCH',
        body: JSON.stringify({ id: ideaId, discarded: false, discardedAt: null }),
      });
      await fetchSavedIdeas();
      toast({ description: "Response restored to selected", variant: "default" });
    } catch (e) {
      toast({ description: "Failed to restore response", variant: "destructive" });
    }
  };

  // Permanently delete a response
  const permanentlyDeleteIdea = async (ideaId: string) => {
    console.log('deleted idea', ideaId)
    try {
      await apiClient(`/api/response/update`, {
        method: "PATCH",
        body: JSON.stringify({ id: ideaId, isDeleted: true }),
      })
      await fetchSavedIdeas();
      toast({ description: "Response deleted from the archive!", variant: "default" });
    } catch (e) {
      toast({ description: "Failed to delete response", variant: "destructive" });
    }
  };

  // Function to start a new chat with a prompt to improve a specific saved response
  const startIdeaImprovement = (ideaTitle: string) => {
    // Clear current conversation
    setConversation([]);
    setConversationCount(0);
    setNewMessage("");

    // Navigate to a new chat
    router.push('/ideate', { scroll: false });

    // Set a timeout to allow the component to re-render before sending the message
    setTimeout(() => {
      // Send a message to start improving the selected response
      handleSendMessage(`Help me expand on this response: ${ideaTitle}`);
    }, 300);
  };

  const handleSendMessage = async (directMessage?: string) => {
    try {
      if (aiLoading || (!newMessage && !directMessage)) return;

      // SEND MESSAGE API
      const messageData: any = {
        userId: loginUser?._id,
        message: newMessage?.trim() || directMessage?.trim(),
        senderId: "human",
        timestamp: new Date().toISOString(),
        historyId: historyId || "",
      }
      setConversation((prevConversations: any) => {
        const updatedConversations = [...prevConversations];
        // if (updatedConversations?.length > 0) {
        //   updatedConversations[updatedConversations?.length - 1] = {
        //     ...updatedConversations?.[updatedConversations?.length - 1],
        //     isAnswered: true
        //   };
        // }
        updatedConversations?.push(messageData);
        return updatedConversations;
      });

      setTimeout(() => {
        if (messageListRef.current) {
          const messageList = messageListRef.current;
          messageList.scrollTop = messageList.scrollHeight;
        }
      }, 500);

      setAILoading(true);
      setNewMessage("");

      const response = await apiClient("/api/ai-assist", {
        method: "POST",
        body: JSON.stringify(messageData),
      });

      if (response?.type === "LIMIT_REACHED") {
        setAILoading(false);
        // toast({ description: response?.message, variant: "destructive" });
        setCreateLimitError(true);
        return;
      }

      if (response?.messageData) {
        setAILoading(false);
        // Start typewriter effect
        setTypingMessage(response.messageData);
        setTypingComplete(false);

        if (!historyId) {
          // Handle new chat navigation after typing is complete
          const handleNewChatNavigation = () => {
            setNewHistoryList([]);
            setHistoryListTimeWise({});
            setHistoryListYearWise({});
            setConversation([]);
            router.push(`/ideate?chat=${response?.messageData?.historyId}`, { scroll: true });
            router.refresh();
          };

          // Store the navigation function to call after typing
          setTypingMessage({
            ...response.messageData,
            onComplete: handleNewChatNavigation
          });
        }

        // getChatHistoryList(10);
      }
      setTimeout(() => {
        if (messageListRef.current) {
          const messageList: any = messageListRef.current;
          messageList.scrollTop = messageList.scrollHeight;
        }
      }, 500);

    } catch (err) {
      const lastMessage: any = conversationRef.current?.[conversationRef.current.length - 1];
      if (lastMessage?._id) {
        // await updateChatConversation({ messageId: lastMessage?._id, isFailed: true });
      }
      if (lastMessage) {
        lastMessage.isFailed = true;
        setConversation([...conversationRef.current]);
      }
      setTimeout(() => {
        if (messageListRef.current) {
          const messageList = messageListRef.current;
          messageList.scrollTop = messageList.scrollHeight;
        }
      }, 10);
      setAILoading(false);
    }
  }

  const handleSendInitialPrompt = async (directMessage?: string, isFirstOnboardingQuery?: boolean) => {
    if (!initialPromptSent) {
      setInitialPromptSent(true);

      try {
        if (aiLoading || (!newMessage && !directMessage)) return;
        // SEND MESSAGE API
        const messageData: any = {
          userId: loginUser?._id,
          message: newMessage?.trim() || directMessage?.trim(),
          senderId: "human",
          timestamp: new Date().toISOString(),
          historyId: historyId || "",
          isInitialPrompt: true,
          isFirstOnboardingQuery: isFirstOnboardingQuery || false
        }
        setConversation((prevConversations: any) => {
          const updatedConversations = [...prevConversations];
          if (updatedConversations?.length > 0) {
            updatedConversations[updatedConversations?.length - 1] = {
              ...updatedConversations?.[updatedConversations?.length - 1],
              isAnswered: true
            };
          }
          return updatedConversations;
        });

        setTimeout(() => {
          if (messageListRef.current) {
            const messageList = messageListRef.current;
            messageList.scrollTop = messageList.scrollHeight;
          }
        }, 500);

        setAILoading(true);
        setNewMessage("");

        const response = await apiClient("/api/ai-assist", {
          method: "POST",
          body: JSON.stringify(messageData),
        });

        if (response?.messageData) {
          setAILoading(false);
          // Start typewriter effect
          setTypingMessage(response.messageData);
          setTypingComplete(false);

          if (!historyId) {
            // Handle new chat navigation after typing is complete
            const handleNewChatNavigation = () => {
              setNewHistoryList([]);
              setHistoryListTimeWise({});
              setHistoryListYearWise({});
              setConversation([]);
              const currentParams = new URLSearchParams(searchParams?.toString());
              currentParams.delete('chat');
              currentParams.append('chat', response?.messageData?.historyId);
              router.replace(`${window.location.pathname}?${currentParams.toString()}`);
            };

            // Store the navigation function to call after typing
            setTypingMessage({
              ...response.messageData,
              onComplete: handleNewChatNavigation
            });
          }

          // getChatHistoryList(10);
        }
        setTimeout(() => {
          if (messageListRef.current) {
            const messageList: any = messageListRef.current;
            messageList.scrollTop = messageList.scrollHeight;
          }
        }, 500);

      } catch (err) {
        const lastMessage: any = conversationRef.current?.[conversationRef.current.length - 1];
        if (lastMessage?._id) {
          // await updateChatConversation({ messageId: lastMessage?._id, isFailed: true });
        }
        if (lastMessage) {
          lastMessage.isFailed = true;
          setConversation([...conversationRef.current]);
        }
        setTimeout(() => {
          if (messageListRef.current) {
            const messageList = messageListRef.current;
            messageList.scrollTop = messageList.scrollHeight;
          }
        }, 10);
        setAILoading(false);
      }
    }
  }

  // const CalendarModal = () => {
  //   if (!isCalendarModalOpen) return null;

  //   const closeCalendarModal = () => {
  //     setIsCalendarModalOpen(false);
  //   };

  //   // New state for day view and task editing
  //   const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  //   const [dayView, setDayView] = useState(false);
  //   const [editingTask, setEditingTask] = useState<Task | null>(null);
  //   const [newTaskTitle, setNewTaskTitle] = useState("");
  //   const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  //   const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  //   const [selectedMonth, setSelectedMonth] = useState(new Date());

  //   const handleAddTask = async () => {
  //     if (!newTaskTitle.trim()) return;

  //     try {
  //       // Format date for the selected day or current day if none selected
  //       const taskDate = selectedDay || calendarDate;
  //       const formattedTaskDate = new Date(
  //         Date.UTC(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
  //       ).toISOString();

  //       await apiClient("/api/add-task", {
  //         method: "POST",
  //         body: JSON.stringify({
  //           title: newTaskTitle,
  //           date: formattedTaskDate,
  //           priority: newTaskPriority,
  //           completed: false
  //         }),
  //       });

  //       // Reset form and refresh tasks
  //       setNewTaskTitle("");
  //       setShowAddTaskForm(false);
  //       if (typeof tasksRefetch === "function") {
  //         tasksRefetch();
  //       }

  //       toast({
  //         description: "Task added successfully",
  //         variant: "default",
  //       });
  //     } catch (error) {
  //       console.error("Error adding task:", error);
  //       toast({
  //         description: "Failed to add task",
  //         variant: "destructive",
  //       });
  //     }
  //   };

  //   const handleViewContent = (contentId: string) => {
  //     closeCalendarModal();
  //     navigateToContent(contentId);
  //   };

  //   // Helper function to get tasks for a specific date
  //   const getTasksForDate = (date: Date) => {
  //     return typedAllTasks.filter(task => {
  //       const taskDate = new Date(task.date);
  //       return taskDate.getDate() === date.getDate() &&
  //         taskDate.getMonth() === date.getMonth() &&
  //         taskDate.getFullYear() === date.getFullYear();
  //     });
  //   };

  //   // Helper function to get content for a specific date
  //   const getContentForDate = (date: Date) => {
  //     // Use allContent instead of content to get content for any date
  //     const contentArray = Array.isArray(allContent) ? allContent as any[] : [];

  //     return contentArray.filter((c: any) => {
  //       try {
  //         // Handle different date field names that might exist in the content objects
  //         const contentDateStr = c.scheduledFor || c.date || c.createdAt;
  //         if (!contentDateStr) return false;

  //         const contentDate = new Date(contentDateStr);
  //         return contentDate.getDate() === date.getDate() &&
  //           contentDate.getMonth() === date.getMonth() &&
  //           contentDate.getFullYear() === date.getFullYear();
  //       } catch (e) {
  //         return false;
  //       }
  //     });
  //   };

  //   // Get filtered tasks based on the selected filter
  //   const getFilteredTasks = () => {
  //     if (selectedTaskFilter === 'today') {
  //       // Show tasks for the actual current date only (not the selected calendar date)
  //       const actualToday = new Date();
  //       // Create UTC date for consistent comparison
  //       const todayUTC = new Date(Date.UTC(actualToday.getFullYear(), actualToday.getMonth(), actualToday.getDate()));

  //       return typedAllTasks.filter(task => {
  //         try {
  //           const taskDate = new Date(task.date);
  //           // Create UTC date for task for consistent comparison
  //           const taskUTC = new Date(Date.UTC(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()));

  //           return taskUTC.getTime() === todayUTC.getTime();
  //         } catch (e) {
  //           console.error('Error filtering task:', task, e);
  //           return false;
  //         }
  //       });
  //     }

  //     return typedAllTasks;
  //   };

  //   // Get days in the month for calendar
  //   const getDaysInMonth = () => {
  //     const year = selectedMonth.getFullYear();
  //     const month = selectedMonth.getMonth();

  //     // Get the first day of the month
  //     const firstDay = new Date(year, month, 1);
  //     const firstDayOfWeek = firstDay.getDay() || 7; // 0 for Sunday, but we want Monday as 1
  //     const adjustedFirstDayOfWeek = firstDayOfWeek === 1 ? 7 : firstDayOfWeek - 1;

  //     // Get the last day of the month
  //     const lastDay = new Date(year, month + 1, 0);
  //     const daysInMonth = lastDay.getDate();

  //     // Get the last day of the previous month
  //     const lastDayPrevMonth = new Date(year, month, 0).getDate();

  //     // Calculate days from previous month to display
  //     const prevMonthDays = [];
  //     for (let i = adjustedFirstDayOfWeek - 1; i >= 0; i--) {
  //       prevMonthDays.push({
  //         date: lastDayPrevMonth - i,
  //         currentMonth: false,
  //         day: new Date(year, month - 1, lastDayPrevMonth - i)
  //       });
  //     }

  //     // Current month days
  //     const currentMonthDays = [];
  //     for (let i = 1; i <= daysInMonth; i++) {
  //       currentMonthDays.push({
  //         date: i,
  //         currentMonth: true,
  //         day: new Date(year, month, i)
  //       });
  //     }

  //     // Calculate days from next month to display
  //     const totalDaysDisplayed = 42; // 6 rows of 7 days
  //     const nextMonthDays = [];
  //     const daysNeeded = totalDaysDisplayed - prevMonthDays.length - currentMonthDays.length;

  //     for (let i = 1; i <= daysNeeded; i++) {
  //       nextMonthDays.push({
  //         date: i,
  //         currentMonth: false,
  //         day: new Date(year, month + 1, i)
  //       });
  //     }

  //     return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  //   };

  //   // Get week dates for week view
  //   const getWeekDates = () => {
  //     // Start from Monday of the current week
  //     const startOfWeek = getWeekStart(selectedMonth);

  //     const weekDates = [];
  //     for (let i = 0; i < 7; i++) {
  //       const date = new Date(startOfWeek);
  //       date.setDate(startOfWeek.getDate() + i);
  //       weekDates.push(date);
  //     }

  //     return weekDates;
  //   };

  //   // Render function for the calendar grid
  //   const renderCalendarGrid = () => {
  //     const today = new Date();
  //     const days = getDaysInMonth();
  //     const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  //     return (
  //       <div className="bg-white rounded-lg p-4">
  //         {/* Header with month navigation */}

  //         {/* Day names header */}
  //         <div className="grid grid-cols-7 text-center mb-4">
  //           {dayNames.map(day => (
  //             <div key={day} className="text-sm text-gray-500 font-medium py-2">{day}</div>
  //           ))}
  //         </div>

  //         {/* Calendar grid */}
  //         <div className="grid grid-cols-7 gap-3">
  //           {days.map((day, index) => {
  //             const isToday = day.day.getDate() === today.getDate() &&
  //               day.day.getMonth() === today.getMonth() &&
  //               day.day.getFullYear() === today.getFullYear();

  //             const isActiveDay = day.day.getDate().toString() === activeDay &&
  //               day.day.getMonth() === selectedMonth.getMonth() &&
  //               day.day.getFullYear() === selectedMonth.getFullYear() &&
  //               day.currentMonth;

  //             const hasContent = getContentForDate(day.day).length > 0;
  //             const hasTasks = getTasksForDate(day.day).length > 0;

  //             return (
  //               <div
  //                 key={index}
  //                 className={`h-32 p-3 border border-gray-100 relative transition-colors rounded-lg
  //                       ${day.currentMonth ? '' : 'text-gray-400'}
  //                       ${isToday ? 'ring-2 ring-blue-400' : ''}
  //                       ${isActiveDay ? '!bg-blue-50' : ''}
  //                     `}
  //                 style={{ backgroundColor: isActiveDay ? '#dbeafe' : '#F5F5F5' }}
  //                 onClick={() => {
  //                   setActiveDay(day.day.getDate().toString());
  //                   if (!day.currentMonth) {
  //                     const newDate = new Date(day.day);
  //                     setSelectedMonth(newDate);
  //                   }
  //                 }}
  //               >
  //                 <div className="text-sm font-medium mb-2">{day.date}</div>

  //                 {/* Content indicators */}
  //                 <div className="mt-2 flex flex-col gap-2">
  //                   {hasContent && (
  //                     <div className="flex items-center justify-center">
  //                       <div className="w-2.5 h-2.5 bg-[#546FFF] rounded-full"></div>
  //                     </div>
  //                   )}
  //                   {hasTasks && (
  //                     <div className="flex items-center justify-center">
  //                       <div className="w-2.5 h-2.5 bg-[#5D60FF] rounded-full"></div>
  //                     </div>
  //                   )}
  //                 </div>
  //               </div>
  //             );
  //           })}
  //         </div>
  //       </div>
  //     );
  //   };

  //   // Render week view with proper navigation
  //   const renderWeekView = () => {
  //     const weekDates = getWeekDates();
  //     const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  //     const today = new Date();

  //     return (
  //       <div className="bg-white p-2">
  //         {/* Header with month/year and navigation */}

  //         {/* Week grid layout */}
  //         <div className="mt-2">
  //           {/* Day headers */}
  //           <div className="grid grid-cols-7 text-center pb-2">
  //             {dayNames.map((day, index) => (
  //               <div key={index} className="px-2 pb-2 text-sm text-gray-600">
  //                 {day}
  //               </div>
  //             ))}
  //           </div>

  //           {/* Dates row */}
  //           <div className="grid grid-cols-7 text-center pb-4">
  //             {weekDates.map((date, index) => {
  //               const isToday = date.toDateString() === today.toDateString();
  //               const isActiveDay = date.getDate().toString() === activeDay &&
  //                 date.getMonth() === todayDate.getMonth() &&
  //                 date.getFullYear() === todayDate.getFullYear();
  //               return (
  //                 <div
  //                   key={index}
  //                   className={`text-sm cursor-pointer ${isToday ? 'text-[#6366F1] font-bold' : 'text-gray-400'} ${isActiveDay ? 'bg-blue-50 rounded-full' : ''}`}
  //                   onClick={() => {
  //                     setActiveDay(date.getDate().toString());
  //                     // Update todayDate reference to match selected date's month/year
  //                     const newDate = new Date(todayDate);
  //                     newDate.setFullYear(date.getFullYear());
  //                     newDate.setMonth(date.getMonth());
  //                     newDate.setDate(date.getDate());
  //                     setCalendarDate(newDate);
  //                   }}
  //                 >
  //                   {date.getDate()}
  //                 </div>
  //               );
  //             })}
  //           </div>

  //           {/* Calendar cells - empty cells with task indicators */}
  //           <div className="grid grid-cols-7 gap-1">
  //             {weekDates.map((date, index) => {
  //               // Get tasks for this date
  //               const tasksForDay = getTasksForDate(date);
  //               const hasContent = getContentForDate(date).length > 0;
  //               const isActiveDay = date.getDate().toString() === activeDay &&
  //                 date.getMonth() === todayDate.getMonth() &&
  //                 date.getFullYear() === todayDate.getFullYear();

  //               return (
  //                 <div
  //                   key={index}
  //                   className={`h-72 bg-gray-50 relative ${isActiveDay ? 'bg-blue-50' : ''}`}
  //                   onClick={() => {
  //                     setActiveDay(date.getDate().toString());
  //                     // Update todayDate reference to match selected date's month/year
  //                     const newDate = new Date(todayDate);
  //                     newDate.setFullYear(date.getFullYear());
  //                     newDate.setMonth(date.getMonth());
  //                     newDate.setDate(date.getDate());
  //                     setCalendarDate(newDate);
  //                   }}
  //                 >
  //                   {/* Task indicators */}
  //                   {tasksForDay.length > 0 && (
  //                     <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-[#6366F1] text-sm">
  //                       <div className="inline-flex items-center justify-center">
  //                         <div className="text-[#6366F1] text-xs border border-[#6366F1] px-2 py-1 rounded-sm bg-white">
  //                           {tasksForDay.length}
  //                         </div>
  //                       </div>
  //                     </div>
  //                   )}
  //                 </div>
  //               );
  //             })}
  //           </div>
  //         </div>
  //       </div>
  //     );
  //   };

  //   // Helper function to format the date range for the week view header
  //   const formatWeekDateRange = (weekDates: Date[]) => {
  //     if (weekDates.length === 0) return '';

  //     const firstDate = weekDates[0];
  //     const lastDate = weekDates[weekDates.length - 1];

  //     // If week spans two months
  //     if (firstDate.getMonth() !== lastDate.getMonth()) {
  //       return `${format(firstDate, 'MMM d')} - ${format(lastDate, 'MMM d, yyyy')}`;
  //     }

  //     // If week spans two years
  //     if (firstDate.getFullYear() !== lastDate.getFullYear()) {
  //       return `${format(firstDate, 'MMM d, yyyy')} - ${format(lastDate, 'MMM d, yyyy')}`;
  //     }

  //     // Standard format within same month and year
  //     return `${format(firstDate, 'MMM d')} - ${format(lastDate, 'd, yyyy')}`;
  //   };

  //   // New split view UI as shown in the image
  //   return (
  //     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  //       <div className="bg-white rounded-lg shadow-lg w-[98%] max-w-[90%] h-[90%] flex flex-col overflow-hidden">
  //         {/* Modal header */}
  //         <div className="flex justify-end p-4">
  //           <button
  //             onClick={closeCalendarModal}
  //             className="text-gray-500 hover:text-gray-700 p-2"
  //           >
  //             ✕
  //           </button>
  //         </div>

  //         {/* Content/Todo toggle tabs */}
  //         <div className="flex w-full">
  //           <div className="w-2/3 ml-[3%] mr-[3%]"></div>
  //           <div className="w-1/3 flex">
  //             <div
  //               className={`cursor-pointer px-4 py-2 text-sm ${activeTab === 'schedule'
  //                 ? 'border-b-2 border-black text-black font-medium'
  //                 : 'text-gray-500'}`}
  //               onClick={() => setActiveTab('schedule')}
  //             >
  //               Your Content Line up
  //             </div>
  //             <div
  //               className={`cursor-pointer px-4 py-2 text-sm ${activeTab === 'todos'
  //                 ? 'border-b-2 border-[#5D60FF] text-[#5D60FF] font-medium'
  //                 : 'text-gray-500'}`}
  //               onClick={() => setActiveTab('todos')}
  //             >
  //               To-do&apos;s
  //             </div>
  //           </div>
  //         </div>

  //         {/* Main content area - Grid layout like the image */}
  //         <div className="flex-grow flex overflow-hidden">
  //           {/* Left side - Calendar */}
  //           <div className="w-2/3 ml-[3%] mr-[3%] overflow-y-auto">
  //             <div className="flex items-center p-4">
  //               <div className="grid grid-cols-3 w-full items-center">
  //                 {/* Left column - Month/Week buttons */}
  //                 <div className="flex space-x-1">
  //                   <button
  //                     onClick={() => setCalendarView('month')}
  //                     className={`px-4 py-1 rounded-sm ${calendarView === 'month'
  //                       ? "bg-[#6366F1] text-white"
  //                       : "bg-gray-200 text-gray-600"
  //                       }`}
  //                   >
  //                     Months
  //                   </button>
  //                   <button
  //                     onClick={() => setCalendarView('week')}
  //                     className={`px-4 py-1 rounded-sm ${calendarView === 'week'
  //                       ? "bg-[#6366F1] text-white"
  //                       : "bg-gray-200 text-gray-600"
  //                       }`}
  //                   >
  //                     Week
  //                   </button>
  //                 </div>

  //                 {/* Center column - Month navigation */}
  //                 <div className="flex items-center justify-center">
  //                   <button
  //                     className="p-1 text-gray-400"
  //                     onClick={() => {
  //                       const newDate = new Date(selectedMonth);
  //                       if (calendarView === "week") {
  //                         newDate.setDate(selectedMonth.getDate() - 7);
  //                       } else {
  //                         newDate.setMonth(selectedMonth.getMonth() - 1);
  //                       }
  //                       setSelectedMonth(newDate);
  //                     }}
  //                   >
  //                     &lt;
  //                   </button>
  //                   <h3 className="text-lg font-medium mx-4">
  //                     {calendarView === 'week'
  //                       ? formatWeekDateRange(getWeekDates())
  //                       : selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
  //                   </h3>
  //                   <button
  //                     className="p-1 text-gray-400"
  //                     onClick={() => {
  //                       const newDate = new Date(selectedMonth);
  //                       if (calendarView === "week") {
  //                         newDate.setDate(selectedMonth.getDate() + 7);
  //                       } else {
  //                         newDate.setMonth(selectedMonth.getMonth() + 1);
  //                       }
  //                       setSelectedMonth(newDate);
  //                     }}
  //                   >
  //                     &gt;
  //                   </button>
  //                 </div>

  //                 {/* Right column - Empty for balance */}
  //                 <div></div>
  //               </div>
  //             </div>
  //             {calendarView === 'month' ? renderCalendarGrid() : renderWeekView()}
  //           </div>

  //           {/* Right side - Tasks list */}
  //           <div className="w-1/3 flex flex-col overflow-hidden">
  //             {/* Today/All filter */}
  //             <div className="p-4"></div>
  //             <div className="p-4 flex">
  //               <div className="flex space-x-1">
  //                 <button
  //                   onClick={() => setSelectedTaskFilter('today')}
  //                   className={`px-3 py-1 text-xs rounded-md ${selectedTaskFilter === 'today'
  //                     ? 'bg-[#6366F1] text-white'
  //                     : 'bg-white text-[#6366F1] border border-[#6366F1]'}`}
  //                 >
  //                   Today
  //                 </button>
  //                 <button
  //                   onClick={() => setSelectedTaskFilter('all')}
  //                   className={`px-3 py-1 text-xs rounded-md ${selectedTaskFilter === 'all'
  //                     ? 'bg-[#6366F1] text-white'
  //                     : 'bg-gray-200 text-gray-600'}`}
  //                 >
  //                   All
  //                 </button>
  //               </div>
  //             </div>

  //             {/* Content/Tasks list based on active tab */}
  //             <div className="flex-grow overflow-y-auto p-4">
  //               {activeTab === 'schedule' ? (
  //                 // Content items view
  //                 <div className="space-y-4">
  //                   {contentLoading || allContentLoading ? (
  //                     <div className="text-gray-500 text-sm mt-1">Loading content...</div>
  //                   ) : contentError || allContentError ? (
  //                     <div className="text-red-500 text-sm mt-1">
  //                       Failed to fetch content
  //                     </div>
  //                   ) : (() => {
  //                     // Get filtered content based on selectedTaskFilter
  //                     let filteredContent = [];

  //                     if (selectedTaskFilter === 'today') {
  //                       // Show content for the actual current date only (not the selected calendar date)
  //                       const actualToday = new Date();
  //                       // Create UTC date for consistent comparison
  //                       const todayUTC = new Date(Date.UTC(actualToday.getFullYear(), actualToday.getMonth(), actualToday.getDate()));

  //                       const contentArray = Array.isArray(allContent) ? allContent as any[] : [];
  //                       filteredContent = contentArray.filter((c: any) => {
  //                         try {
  //                           // Handle different date field names that might exist in the content objects
  //                           const contentDateStr = c.postingDate || c.scheduledFor || c.date || c.createdAt;
  //                           if (!contentDateStr) return false;

  //                           const contentDate = new Date(contentDateStr);
  //                           // Create UTC date for content for consistent comparison
  //                           const contentUTC = new Date(Date.UTC(contentDate.getFullYear(), contentDate.getMonth(), contentDate.getDate()));

  //                           return contentUTC.getTime() === todayUTC.getTime();
  //                         } catch (e) {
  //                           console.error('Error filtering content:', c, e);
  //                           return false;
  //                         }
  //                       });
  //                     } else {
  //                       // Show all content
  //                       filteredContent = Array.isArray(allContent) ? allContent : [];
  //                     }

  //                     return filteredContent.length > 0 ? (
  //                       <div className="space-y-2">
  //                         {filteredContent.map((c: any) => (
  //                           <div
  //                             key={c._id}
  //                             className="bg-[#546FFF20] rounded-lg p-3 text-sm text-gray-800 cursor-pointer hover:bg-[#546FFF30] border border-[#546FFF40] transition-colors duration-200"
  //                             onClick={() => navigateToContent(c._id)}
  //                           >
  //                             {c.hook || c.title || 'Content Item'}
  //                           </div>
  //                         ))}
  //                       </div>
  //                     ) : (
  //                       <div className="bg-[#546FFF10] rounded-lg p-3 text-sm text-gray-800 border border-[#546FFF20]">
  //                         <div>{selectedTaskFilter === 'today' ? 'No content for today' : 'No content available'}</div>
  //                       </div>
  //                     );
  //                   })()}
  //                 </div>
  //               ) : (
  //                 <>
  //                   {tasksLoading ? (
  //                     <div className="text-gray-500 text-sm mt-1">Loading tasks...</div>
  //                   ) : tasksError ? (
  //                     <div className="text-red-500 text-sm mt-1">
  //                       Failed to fetch tasks
  //                     </div>
  //                   ) : typedAllTasks?.length > 0 ? (
  //                     <div className="space-y-2">
  //                       {/* Get filtered tasks based on the Today/All filter */}
  //                       {getFilteredTasks().map((task) => (
  //                         <div
  //                           key={task._id}
  //                           className={`rounded-lg p-3 text-sm text-gray-800 cursor-pointer flex items-center gap-2 bg-[#FCF7E4]`}
  //                         >
  //                           <Checkbox
  //                             checked={task.completed}
  //                             className="rounded-full w-4 h-4"
  //                             onCheckedChange={(checked: boolean) =>
  //                               onCheckedChange(task._id, checked as boolean)
  //                             }
  //                             disabled={tasksLoading}
  //                           />
  //                           <div className="flex flex-1 justify-between items-center">
  //                             <span>{task.title}</span>
  //                             <span className="px-2 py-0.5 text-xs rounded-full bg-[#5D60FF] text-white">
  //                               {task.priority || 'Low'}
  //                             </span>
  //                           </div>
  //                         </div>
  //                       ))}
  //                     </div>
  //                   ) : (
  //                     <div className="bg-[#FCF7E4] rounded-lg p-3 text-sm text-gray-800">
  //                       <div>{selectedTaskFilter === 'today' ? 'No tasks for today' : 'No tasks available'}</div>
  //                     </div>
  //                   )}
  //                 </>
  //               )}
  //             </div>

  //             {/* Add button - changes based on active tab */}
  //             {/* <div className="p-4 border-t">
  //                   <button
  //                     onClick={() => {
  //                       if (activeTab === 'todos') {
  //                         setShowAddTaskForm(true);
  //                       } else {
  //                         // Navigate to content creation
  //                         router.push('/plan');
  //                       }
  //                     }}
  //                     className={`w-full py-2 text-white rounded-md hover:opacity-90 flex items-center justify-center ${activeTab === 'todos' ? 'bg-[#5D60FF]' : 'bg-[#546FFF]'
  //                       }`}
  //                   >
  //                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
  //                       <line x1="12" y1="5" x2="12" y2="19"></line>
  //                       <line x1="5" y1="12" x2="19" y2="12"></line>
  //                     </svg>
  //                     {activeTab === 'todos' ? 'Add Task' : 'Add Content'}
  //                   </button>
  //                 </div> */}
  //           </div>
  //         </div>

  //         {/* Task form modal */}
  //         {showAddTaskForm && (
  //           <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
  //             <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl">
  //               <h3 className="text-lg font-medium mb-4">Add New Task</h3>
  //               <input
  //                 type="text"
  //                 value={newTaskTitle}
  //                 onChange={(e) => setNewTaskTitle(e.target.value)}
  //                 placeholder="Task title"
  //                 className="w-full p-2 mb-4 border border-gray-200 rounded-md"
  //               />
  //               <div className="mb-4">
  //                 <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
  //                 <select
  //                   value={newTaskPriority}
  //                   onChange={(e) => setNewTaskPriority(e.target.value)}
  //                   className="w-full p-2 border border-gray-200 rounded-md"
  //                 >
  //                   <option value="Low">Low Priority</option>
  //                   <option value="Medium">Medium Priority</option>
  //                   <option value="High">High Priority</option>
  //                 </select>
  //               </div>
  //               <div className="mb-4">
  //                 <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
  //                 <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded-md">
  //                   {selectedDay ? selectedDay.toLocaleDateString('en-US', {
  //                     weekday: 'long',
  //                     month: 'long',
  //                     day: 'numeric',
  //                     year: 'numeric'
  //                   }) : 'Today'}
  //                 </div>
  //               </div>
  //               <div className="flex justify-end space-x-2">
  //                 <button
  //                   onClick={() => setShowAddTaskForm(false)}
  //                   className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md"
  //                 >
  //                   Cancel
  //                 </button>
  //                 <button
  //                   onClick={handleAddTask}
  //                   className="px-4 py-2 bg-[#5D60FF] text-white rounded-md"
  //                 >
  //                   Add Task
  //                 </button>
  //               </div>
  //             </div>
  //           </div>
  //         )}
  //       </div>
  //     </div>
  //   );
  // };



  // Add this at the component level
  const [activeIdeaTab, setActiveIdeaTab] = useState<'selected' | 'discarded'>('selected');
  const [searchTerm, setSearchTerm] = useState("");

  // Add the calendar update effect
  useEffect(() => {
    // Update calendar date once per minute to ensure it stays current
    const intervalId = setInterval(() => {
      setCalendarDate(new Date());
    }, 60000); // 60,000 ms = 1 minute

    return () => clearInterval(intervalId);
  }, []);

  // Refetch all content when needed
  // useEffect(() => {
  //   if (typeof allContentRefetch === 'function') {
  //     allContentRefetch();
  //   }
  // }, [calendarDate.getMonth(), calendarDate.getFullYear()]);

  // Fetch savedIdeas from backend on loginUser change
  useEffect(() => {
    if (loginUser?._id) {
      fetchSavedIdeas();
    }
  }, [loginUser]);

  const fetchSavedIdeas = async () => {
    if (!loginUser?._id) return;
    try {
      const res = await apiClient(`/api/response/list?userId=${loginUser?._id}`);
      setSavedIdeas(res.success || []);
    } catch (e) {
      setSavedIdeas([]);
    }
  };

  const insertSctiptIdAtCursor = useCallback((scriptId: string) => {
    const textarea = document.getElementById('messageInput') as HTMLTextAreaElement;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentValue = textarea.value;

    const scriptIdWithSpace = `${scriptId} `
    const newValue = currentValue.substring(0, startPos) + scriptIdWithSpace + currentValue.substring(endPos);
    setNewMessage(newValue);

    // Set focus back to textarea and place cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + scriptIdWithSpace.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, []);

  useEffect(() => {
    if (scriptId) {
      insertSctiptIdAtCursor(scriptId);
      router.push(`/ideate?chat=${historyId}`);
    }
  }, [scriptId])

  return (
    <div className="bg-[#FCF7E4] h-screen overflow-auto  px-[20px] xl:py-[40px] py-[20px]">
      <div className={`flex flex-col  ${montserrat.className} `}>


        <div className="lg:flex  gap-[20px] 2xl:h-[calc(100vh-80px)] xl:h-[calc(100vh-80px)] h-[calc(100vh-40px)]">

          {/* CONVERSATION AREA */}
          <div className={`relative transition-all duration-500 ease-in-out ${isExpand ? 'w-full' : '2xl:w-[80%] xl:w-[70%] lg:w-[65%] w-full'}`}>

            <h1 className="text-[22px] bg-black text-transparent bg-clip-text font-semibold md:mb-[18px] mb-2">
              Ideate with Ina
            </h1>
            <div
              id="tour-chat-interface"
              className={`flex flex-col rounded-[18px] !bg-white border border-[#E5E8F6] lg:px-[20px] px-4 py-[13.72px] xl:h-[calc(100vh-130px)] md:h-[calc(100vh-90px)] h-[calc(100vh-80px)] relative`}>
              <div
                className="hover:bg-[#ebebeb] px-2 py-2 text-[16px] font-medium rounded-[8px] transition-colors absolute top-4 right-4 z-50 cursor-pointer border-none"
                onClick={() => setIsExpand(!isExpand)}
              >
                {isExpand ? <Minimize2 className="text-[12px] w-5 h-5" /> : <Maximize2 className="text-[12px] w-5 h-5" />}
              </div>

              {/* Messages container - scrollable */}
              <div
                className="flex-1 overflow-y-auto scrollbar-thin pb-2 pr-1"
                data-message-list
                ref={(ref) => {
                  messageListRef.current = ref;
                }}
              >
                <div className="space-y-6">
                  {loading && <div className="flex justify-center"><DotsSpinner w={2} h={2} /></div>}

                  <div className="space-y-6">
                    {conversation?.map((item: any, i: number) => (
                      <Fragment key={i}>
                        <MemoizedChatMessage
                          item={item}
                          index={i}
                          showMoreMap={showMoreMap}
                          newSlotFirstMessageRef={conversation?.length >= 20 && i === 20 ? newSlotFirstMessageRef : null}
                          conversationLength={conversation?.length}
                          handleShowMore={(id) => handleShowMore(typeof id === 'number' ? id.toString() : id)}
                          insertScriptIdAtCursor={insertSctiptIdAtCursor}
                          messageContainsIdeas={messageContainsIdeas}
                          saveIdeaToCollection={saveIdeaToCollection}
                          handleSendMessage={handleSendMessage}
                          getChatHistory={getChatHistory}
                          setConversation={setConversation}
                          setCreateScriptLimitError={setCreateScriptLimitError}
                          insertSctiptIdAtCursor={insertSctiptIdAtCursor}
                        />
                      </Fragment>
                    ))}

                    {/* Show typewriter effect for new AI message */}
                    {typingMessage && (
                      <TypewriterMessage
                        key={`typing-${typingMessage._id}`}
                        message={typingMessage.message?.content || typingMessage.message}
                        timestamp={typingMessage.timestamp}
                        isQuestion={typingMessage.isQuestion}
                        isAnswered={typingMessage.isAnswered}
                        isTaskScript={typingMessage.isTaskScript}
                        onComplete={handleTypingComplete}
                        handleSendMessage={handleSendMessage}
                        messageContainsIdeas={messageContainsIdeas}
                        saveIdeaToCollection={saveIdeaToCollection}
                      />
                    )}

                    {/* Show loading dots only when waiting for API response */}
                    {aiLoading && !typingMessage && (
                      <div className="max-w-[80%]">
                        <span className="px-[6px] py-[10px] rounded-lg ltr:rounded-tl-none rtl:rounded-tr-none text-xs block w-fit bg-[#FCF7E4]">
                          <TypingDotSpinner />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {createLimitError &&
                <div className="md:px-[20px] px-[20px] py-[12px] bg-[#FFFDF8]-100 rounded-[12px] border border-[#E5E8F6] mx-[20px] shadow-figma-complex flex items-center gap-[12px] justify-between animate-slideUp" >
                  <div className="flex items-start gap-[12px]">
                    <Image width={20} height={20} className='z-[2] object-contain' alt="login-illustration" src="/images/pages/red-warning.svg" />
                    <div className="flex items-start gap-2 flex-col">
                      <p className="text-[12px] text-[#141522] font-[600]">
                        Looks like you&apos;re on a roll! To keep the creativity flowing, consider upgrading for unlimited access.
                      </p>
                      <p className="text-[12px] text-[#141522] font-[500]">
                        We&apos;ll refresh your credits in 24 hours.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start justify-end gap-[12px]">
                    <Button
                      variant="default"
                      className="rounded-[6px] bg-[#5D60FF] text-white hover:bg-[#5D60FF] text-[12px] px-[10px] py-[8px] font-[500]"
                      onClick={() => router.push('/settings?tab=subscription')}
                    >
                      Upgrade
                    </Button>
                    <Image width={14} height={14} className='z-[2] object-contain cursor-pointer' alt="login-illustration" src="/images/pages/cross.svg" onClick={() => setCreateLimitError(false)} />
                  </div>
                </div>
              }
              {createScriptLimitError &&
                <div className="md:px-[20px] px-[20px] py-[12px] bg-[#FFFDF8]-100 rounded-[12px] border border-[#E5E8F6] mx-[20px] shadow-figma-complex flex items-center gap-[12px] justify-between animate-slideUp" >
                  <div className="flex items-start gap-[12px]">
                    <Image width={20} height={20} className='z-[2] object-contain' alt="login-illustration" src="/images/pages/red-warning.svg" />
                    <div className="flex items-start gap-2 flex-col">
                      <p className="text-[12px] text-[#141522] font-[600]">
                        Looks like you&apos;re used free script limit! To keep the creativity flowing, consider upgrading for unlimited access.
                      </p>
                      {/* <p className="text-[12px] text-[#141522] font-[500]">
                        We&apos;ll refresh your credits in 24 hours.
                      </p> */}
                    </div>
                  </div>

                  <div className="flex items-start justify-end gap-[12px]">
                    <Button
                      variant="default"
                      className="rounded-[6px] bg-[#5D60FF] text-white hover:bg-[#5D60FF] text-[12px] px-[10px] py-[8px] font-[500]"
                      onClick={() => router.push('/settings?tab=subscription')}
                    >
                      Upgrade
                    </Button>
                    <Image width={14} height={14} className='z-[2] object-contain cursor-pointer' alt="login-illustration" src="/images/pages/cross.svg" onClick={() => setCreateScriptLimitError(false)} />
                  </div>
                </div>
              }

              {/* Fixed input area at bottom */}
              <div className="py-0 pt-[22px]" >
                <div className="relative">
                  <textarea
                    id="tour-chat-input"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e?.target?.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage?.trim() && !aiLoading) {
                          handleSendMessage();
                        }
                      }
                    }}
                    placeholder="Ask ina..."
                    className="font-[500] w-full px-[20px] py-4 pr-20 rounded-[11px] bg-[#FFFDF8] focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-none border border-[#D9D9D9] md:text-[16px] text-[14px] resize-none min-h-[52px] max-h-32"
                    rows={1}
                    style={{
                      height: 'auto',
                      minHeight: '52px',
                      overflowY: newMessage.split("\n").length > 5 ? "auto" : "hidden"
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                    }}
                  />
                  <button
                    className={`absolute right-[20px] top-[50%] transform -translate-y-[60%] rounded-full text-white py-2 text-sm ${(!newMessage?.trim() || aiLoading) && "opacity-70 cursor-not-allowed"}`}
                    onClick={() => { (newMessage?.trim() && !aiLoading) && handleSendMessage() }}
                    disabled={!newMessage?.trim() || aiLoading}
                  >
                    <Image width={32.44} height={32} className='z-[2] object-contain' alt="login-illustration" src="/images/pages/send-icon.svg" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* IDEA BOX - Now on the right side */}
          <div className={`2xl:w-[20%] xl:w-[30%] lg:w-[35%] w-full h-full flex flex-col bg-[#FCF7E4] lg:mt-0 mt-[20px] lg:pb-0 pb-4 transition-all duration-500 ease-in-out ${isExpand ? 'opacity-0 !w-0 !h-0 scale-95 overflow-hidden d-none pointer-events-none' : 'opacity-100 w-full scale-100'}`}>
            <div className="flex xl:justify-start lg:justify-between md:justify-start justify-between md:mb-[28px] mb-2 2xl:min-w-[250px]">
              <div className="flex items-center gap-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setConversation([]);
                    setConversationCount(0);
                    setNewMessage("");
                    setInitialPromptSent(false);
                    router.push(`/ideate?new=1`);
                    router.refresh();
                  }}
                  className="whitespace-wrap bg-gradient-to-r from-[#4C00FF] to-[#FF00A1] !rounded-[12px] px-0.5 py-0.5 text-center font-medium text-white shadow-[3px_12px_20px_rgba(255,0,150,0.2)] hover:shadow-[3px_12px_20px_rgba(255,0,150,0.2)] transition-all duration-200"
                >
                  <div className=" !rounded-[10px] bg-white px-[12px] py-[8px] text-black xl:text-[16px] text-[14px] flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200">
                    <Plus className="h-[18px] md:h-4 w-[18px] md:w-4" strokeWidth={2.5} />
                    New Chat
                  </div>
                </button>
              </div>
              <div className="ms-[10px] mt-0">
                <div className="flex lg:justify-between justify-end items-center">
                  <div className="justify-end flex">
                    <Button
                      className="bg-[#5D60FF] hover:bg-[#5D60FF] text-white xl:px-8 lg:px-[24px] px-6 xl:py-[12px] lg:py-[9px] md:py-[10px] xl:text-[16px] text-[14px] font-medium rounded-[12px]  transition-colors mt-0 flex items-center h-full"
                      onClick={() => router.push('/plan')}
                      variant="destructive">
                      <Image src="/images/pages/go-to-plan.svg" width={14} height={18} alt="Go to Plan icon" />
                      Go to Plan
                    </Button>
                  </div>
                </div>
              </div>

            </div>
            <div id="tour-response-board" className="bg-white flex-1 overflow-hidden flex flex-col rounded-[18px] border border-[#E5E8F6] pb-[20px]">
              <h2 className="text-[14px] md:mb-0 mb-3 md:mt-0 mt-3 font-semibold text-center pt-[16px]">RESPONSE BOARD</h2>
              <div className="flex justify-center py-[8px] pt-[8px] mx-auto w-full">
                <div className="rounded-[13.86px] flex overflow-hidden border border-[#E5E8F6] text-[14px] lg:max-w-[80%] md:max-w-[50%] max-w-[80%] 
              
              w-full ">
                  <div
                    className={`rounded-tr-[13.86px] rounded-br-[13.86px] flex-1 flex items-center justify-center gap-1 cursor-pointer px-[18.31px] py-[6.84px] text-[14px] ${activeIdeaTab === 'selected' ? 'bg-[#E5E8F6] text-[#5D60FF]' : 'text-black'}`}
                    onClick={() => setActiveIdeaTab('selected')}
                  >
                    <div className="h-4 w-4 flex items-center justify-center mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 2a2 2 0 0 0-2 2v18l8-5.333L20 22V4a2 2 0 0 0-2-2H6z" />
                      </svg>
                    </div>
                    <span>Saved</span>
                  </div>
                  <div
                    className={`rounded-tl-[13.86px] rounded-bl-[13.86px] flex-1 flex items-center justify-center gap-1 cursor-pointer px-[18.31px] py-[6.84px] text-[14px] ${activeIdeaTab === 'discarded' ? 'bg-[#E5E8F6]  !text-[#5D60FF]' : 'text-black'}`}
                    onClick={() => setActiveIdeaTab('discarded')}
                  >
                    <div className="h-4 w-4 flex items-center justify-center">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.65496 5.18519C6.46796 5.18519 6.31132 5.24855 6.18504 5.37527C6.05876 5.50199 5.9954 5.65863 5.99496 5.84519V7.95719L5.40096 7.36319C5.27996 7.24219 5.12596 7.18169 4.93896 7.18169C4.75196 7.18169 4.59796 7.24219 4.47696 7.36319C4.35596 7.48419 4.29546 7.63819 4.29546 7.82519C4.29546 8.01219 4.35596 8.16619 4.47696 8.28719L6.19296 10.0032C6.32496 10.1352 6.47896 10.2012 6.65496 10.2012C6.83096 10.2012 6.98496 10.1352 7.11696 10.0032L8.83296 8.28719C8.95396 8.16619 9.01446 8.01219 9.01446 7.82519C9.01446 7.63819 8.95396 7.48419 8.83296 7.36319C8.71196 7.24219 8.55796 7.18169 8.37096 7.18169C8.18396 7.18169 8.02996 7.24219 7.90896 7.36319L7.31496 7.95719V5.84519C7.31496 5.65819 7.2516 5.50155 7.12488 5.37527C6.99816 5.24899 6.84152 5.18563 6.65496 5.18519ZM2.03497 3.86519V11.1252H11.275V3.86519H2.03497ZM2.03497 12.4452C1.67197 12.4452 1.36133 12.316 1.10305 12.0578C0.844766 11.7995 0.715406 11.4886 0.714966 11.1252V2.89169C0.714966 2.73769 0.739826 2.58919 0.789546 2.44619C0.839266 2.30319 0.913406 2.17119 1.01197 2.05019L1.83697 1.04369C1.95797 0.889689 2.10911 0.771329 2.29039 0.688609C2.47167 0.605889 2.66152 0.564749 2.85996 0.565189H10.45C10.648 0.565189 10.8378 0.606549 11.0195 0.689269C11.2013 0.771989 11.3524 0.890129 11.473 1.04369L12.298 2.05019C12.397 2.17119 12.4713 2.30319 12.521 2.44619C12.5708 2.58919 12.5954 2.73769 12.595 2.89169V11.1252C12.595 11.4882 12.4658 11.799 12.2075 12.0578C11.9493 12.3165 11.6384 12.4456 11.275 12.4452H2.03497ZM2.29897 2.54519H11.011L10.45 1.88519H2.85996L2.29897 2.54519Z" />
                      </svg>


                      {/* <Image width={12} height={12} className='z-[2] object-contain' alt="login-illustration" src="/images/pages/archive-icon.svg" /> */}
                    </div>
                    <span className="text-[14px] font-medium">Archived</span>
                  </div>
                </div>


              </div>
              <div className="px-[16px]">
                <div className="flex items-center w-full bg-white border border-[#E5E8F6] rounded-[10px] p-[10px] my-[10px]">
                  <Search className="text-[#656565] font-[600] size-4" />

                  <input type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-[14px] ml-[10px] w-full outline-none text-black placeholder-[#999999]" />
                </div>
              </div>
              <div className="px-[16px] overflow-auto">

                <div className="overflow-y-auto flex-1">
                  {activeIdeaTab === 'selected' ? (
                    savedIdeas.filter(idea => !idea.discarded).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No saved responses yet</h3>
                        <p className="text-sm text-gray-500 text-center max-w-xs">Your saved responses will appear here. Start by saving some responses from your conversations.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(() => {
                          const filteredIdeas = savedIdeas
                            .filter(idea => !idea.discarded)
                            .filter(idea =>
                              searchTerm === "" ||
                              idea.title?.toLowerCase().includes(searchTerm.toLowerCase())
                            );

                          if (filteredIdeas.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center py-12 px-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                                <p className="text-sm text-gray-500 text-center max-w-xs">No responses match your search for &ldquo;{searchTerm}&rdquo;. Try a different search term.</p>
                              </div>
                            );
                          }

                          return filteredIdeas.map((idea) => (
                            <div key={idea._id} className="px-[14px] py-[12px] bg-[#E5E8F6] border border-[#E5E8F6] rounded-[12px] flex items-center justify-between">

                              <div
                                className="2xl:text-[13px] text-[12px] font-medium me-2 text-black"
                              >
                                {idea.title || "Untitled Response"}
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-[10px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedResponse(idea);
                                      setResponseModalOpen(true);
                                    }}
                                    className="rounded-[12.5px] w-[35.2px] h-[35.2px] border border-[#E5E8F6] bg-white flex items-center justify-center"
                                    title="Show full response"
                                  >
                                    <Image width={12} height={12} className='z-[2] object-contain' alt="login-illustration" src="/images/pages/gg-expand.svg" />

                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      discardIdea(idea?._id);
                                    }}
                                    className="rounded-[12.5px] w-[35.2px] h-[35.2px] border border-[#E5E8F6] bg-white flex items-center justify-center"
                                    title="Move to archive"
                                  >
                                    <Image width={16} height={16} className='z-[2] object-contain' alt="login-illustration" src="/images/pages/archive-delete.svg" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )
                  ) : (
                    savedIdeas.filter(idea => idea.discarded).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No archived responses</h3>
                        <p className="text-sm text-gray-500 text-center max-w-xs">Your archived responses will appear here. You can restore them if needed.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(() => {
                          const filteredDiscardedIdeas = savedIdeas
                            .filter(idea => idea.discarded)
                            .filter(idea =>
                              searchTerm === "" ||
                              idea.title?.toLowerCase().includes(searchTerm.toLowerCase())
                            );

                          if (filteredDiscardedIdeas.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center py-12 px-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                                <p className="text-sm text-gray-500 text-center max-w-xs">No archived responses match your search for &quot;{searchTerm}&quot;. Try a different search term.</p>
                              </div>
                            );
                          }

                          return filteredDiscardedIdeas.map((idea) => (
                            <div key={idea._id} className="px-[14px] py-[12px] bg-[#E5E8F6] border border-[#E5E8F6] rounded-[12px] flex items-center  justify-between">

                              <div className="line-through !text-[12px] font-medium me-2 text-black">
                                {idea.title || "Untitled Response"}
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex gap-[10px]">
                                  <button
                                    onClick={() => restoreIdea(idea._id)}
                                    className="rounded-[12px] w-[35.2px] h-[35.2px] border bg-white border-[#E5E8F6] flex items-center justify-center"

                                    title="Restore response"
                                  >
                                    {/* <Image width={12} height={12} className='z-[2] object-contain' alt="login-illustration" src="/images/pages/gg-expand.svg" /> */}
                                    <RotateCcw className="size-4 text-[#00AA58]" />

                                  </button>
                                  <button
                                    onClick={() => permanentlyDeleteIdea(idea._id)}
                                    className="rounded-[12px] w-[35.2px] h-[35.2px] border bg-white border-[#E5E8F6] flex items-center justify-center"
                                    title="Permanently delete"
                                  >
                                    {/* <Image width={16} height={16} className='z-[2] object-contain' alt="login-illustration" src="/images/pages/archive-delete.svg" /> */}
                                    <Trash className="size-4 text-[#FF4D4F]" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* CHAT HISTORY - Fixed sidebar */}
          {/* <div className="w-[33%] h-full flex flex-col bg-white rounded-none shadow-sm">
            <div className="bg-[#FCF7E4] rounded-none h-[calc(100%-20px)] overflow-y-auto scrollbar-thin p-4 pb-6 mt-3 mx-3">

              {["Today", "Yesterday", "Previous 7 Days", "Previous 30 Days"].map((key) => (
                historyListTimeWise[key]?.length > 0 && (
                  <div key={key} className="mb-5">
                    <span className="font-bold text-xs block mb-2">{key}</span>
                    {historyListTimeWise[key].map((item: any) => (
                      <div
                        key={item?._id}
                        className={`flex items-center justify-between gap-2 p-2 pl-3 pr-3 mb-3 rounded-xl cursor-pointer 
                  ${item?._id === historyId ? "bg-[#6C63FF] text-white" : "bg-white"}`}
                        onClick={() => {
                          setConversation([]);
                          setConversationCount(0);
                          setNewMessage("");
                          router.push(`/ideate?chat=${item?._id}`, { scroll: false });
                          router.refresh();
                        }}
                      >
                        <span className="truncate w-full text-xs">
                          {item?.title || "Untitled Chat"}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              ))}

              {Object.keys(historyListYearWise)
                .sort((a, b) => parseInt(b) - parseInt(a))
                .map((year) => (
                  historyListYearWise[year]?.length > 0 && (
                    <div key={year} className="mb-5">
                      <span className="font-bold text-xs block mb-2">{year}</span>
                      {historyListYearWise[year].map((item: any) => (
                        <div
                          key={item?._id}
                          className={`flex items-center justify-between gap-2 p-2 pl-3 pr-3 mb-3 rounded-xl cursor-pointer 
                    ${item?._id === historyId ? "bg-[#EB7A5254]" : "bg-white"}`}
                          onClick={() => {
                            setConversation([]);
                            setConversationCount(0);
                            setNewMessage("");
                            router.push(`/ideate?chat=${item?._id}`, { scroll: false });
                            router.refresh();
                          }}
                        >
                          <span className="truncate w-full text-xs">
                            {item?.title || "Untitled Chat"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                ))}

              {(historyCount > 20 && historyCount > historyList?.length && !historyLoading) && (
                <div className="flex justify-center mt-4 mb-4">
                  <Button
                    variant="outline"
                    className="rounded-full border-gray-200 text-gray-600 hover:bg-gray-50 text-xs px-3 py-1.5"
                    onClick={() => getChatHistoryList(historyList?.length)}
                  >
                    Load More
                  </Button>
                </div>
              )}

              {historyLoading && (
                <div className="flex justify-center mt-4 mb-4">
                  <DotsSpinner w={2} h={2} />
                </div>
              )}

            </div>
          </div> */}

        </div>

        {/* Response Modal */}
        {responseModalOpen && selectedResponse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-4xl max-h-[80%] flex flex-col overflow-hidden">
              {/* Modal header */}
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium">
                  {selectedResponse.title || "Untitled Response"}
                </h3>
                <button
                  onClick={() => {
                    setResponseModalOpen(false);
                    setSelectedResponse(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  ✕
                </button>
              </div>

              {/* Modal content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="text-sm text-gray-600 mb-4">
                  Saved on {selectedResponse.timestamp ? new Date(selectedResponse.timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Unknown date'}
                </div>

                <div className="bg-[#FCF7E4] p-4 rounded-lg md:text-[16px] text-[13px]">
                  <ReactMarkdown
                    className="prose prose-sm max-w-none break-words"
                    components={{
                      ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '1.2em' }} {...props} />,
                      ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.2em' }} {...props} />,
                      a: ({ node, ...props }) => <a style={{ textDecoration: 'underline' }} target="_blank" {...props} />,
                      pre: ({ node, ...props }) => <pre style={{ backgroundColor: '#f0f0f0', padding: '0.8em', borderRadius: '4px', overflowX: 'auto' }} {...props} />,
                      p: ({ node, ...props }) => <p style={{ whiteSpace: 'pre-line', marginTop: '0.1em', marginBottom: '0.1em' }} {...props} />,
                    }}
                  >
                    {selectedResponse.context || "No content available"}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => {
                    setResponseModalOpen(false);
                    setSelectedResponse(null);
                    startIdeaImprovement(selectedResponse.context || "this response");
                  }}
                  className="px-4 py-2 bg-[#5D60FF] text-white rounded-md hover:bg-[#4C51E6] transition-colors"
                >
                  Expand on this
                </button>
                <button
                  onClick={() => {
                    setResponseModalOpen(false);
                    setSelectedResponse(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

  );
}