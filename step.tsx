"use client"

import { apiClient } from "@/client/client";
import { Button } from "@/components/ui/button";
import { formatTimestampForMessage } from "@/utils/format-date";
import Cookies from "js-cookie";
import { FileText, Plus, Send, Calendar, ChevronDown, ClipboardList } from 'lucide-react';
import moment from "moment";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown';
import DotsSpinner from "./common/dots-spinner";
import TypingDotSpinner from "./common/typing-dot-spinner";
import { useToast } from "./ui/use-toast";
import { montserrat } from "@/app/layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format } from 'date-fns';
import useApi from '@/hooks/use-api';
import { Checkbox } from "@/components/ui/checkbox";

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
  id: string;
  title: string;
  timestamp: string;
  discarded?: boolean;
  discardedAt?: string;
  context?: string; // Add context field to store the original AI message
}

export function ChatInterface() {

  const messageListRef: any = useRef(null);
  const conversationRef: any = useRef(null);
  const newSlotFirstMessageRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const historyId = searchParams.get('chat') || "";
  const [loginUser, setLoginUser] = useState<any>(null);
  const [userId, setUserId] = useState("");

  const [conversation, setConversation] = useState<any>([]);
  const [conversationCount, setConversationCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [historyList, setNewHistoryList] = useState<any[]>([]);
  const [historyListTimeWise, setHistoryListTimeWise] = useState({});
  const [historyListYearWise, setHistoryListYearWise] = useState({});
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [showingIdeaContext, setShowingIdeaContext] = useState<string | null>(null);
  const [activeIdeaContext, setActiveIdeaContext] = useState<string | null>(null);
  const [initialPromptSent, setInitialPromptSent] = useState(false);

  // Calendar states - Use current date instead of hardcoded values
  const todayDate = new Date();
  const currentDay = todayDate.getDate().toString();
  const [activeDay, setActiveDay] = useState(currentDay);
  const [isWeeklyScheduleOpen, setIsWeeklyScheduleOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'todos'>('schedule');
  const [showInProgress, setShowInProgress] = useState(true);
  const [showTodo, setShowTodo] = useState(true);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Array<{ day: string, date: string }>>([]);

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
  const {
    data: allContent,
    loading: allContentLoading,
    error: allContentError,
    refetch: allContentRefetch,
  } = useApi(`/api/get-contents?type=content`);

  const {
    data: allTasks,
    loading: tasksLoading,
    error: tasksError,
    refetch: tasksRefetch,
  } = useApi("/api/fetch-all-task");

  // Helper function to safely handle content data
  const getContentItems = () => {
    if (content === null || content === undefined) return [];
    if (!Array.isArray(content)) return [];
    return content;
  };

  // Helper function to get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    const tasks = Array.isArray(allTasks) ? allTasks as Task[] : [];
    return tasks.filter((task: Task) => {
      const taskDate = new Date(task.date);
      return taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear();
    });
  };

  // Helper function to get content for a specific date
  const getContentForDate = (date: Date): any[] => {
    const contentArray = Array.isArray(allContent) ? allContent as any[] : [];
    return contentArray.filter((c: any) => {
      try {
        const contentDateStr = c.scheduledFor || c.date || c.createdAt;
        if (!contentDateStr) return false;

        const contentDate = new Date(contentDateStr);
        return contentDate.getDate() === date.getDate() &&
          contentDate.getMonth() === date.getMonth() &&
          contentDate.getFullYear() === date.getFullYear();
      } catch (e) {
        return false;
      }
    });
  };

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
      await apiClient("/api/delete-task", {
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

  const inProgressTasks = typedAllTasks.filter((t) => {
    const taskDate = new Date(t.date);
    const utcTaskDate = new Date(
      Date.UTC(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
    );
    const utcToday = new Date(
      Date.UTC(td.getFullYear(), td.getMonth(), td.getDate())
    );
    return utcTaskDate.getTime() <= utcToday.getTime();
  });

  const todoTasksList = typedAllTasks.filter((t) => {
    const taskDate = new Date(t.date);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() > td.getTime(); // Future dates
  });

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
    if (loginUser) {
      const textarea = document.getElementById('messageInput');
      if (textarea) {
        textarea.focus();
      }

      // Check for pending prompt in localStorage
      const pendingPrompt = localStorage.getItem('pendingChatPrompt');
      if (pendingPrompt) {
        // Clear the storage item first to prevent multiple sends
        localStorage.removeItem('pendingChatPrompt');
        // Wait a short time for the component to fully initialize
        setTimeout(() => {
          handleSendMessage(pendingPrompt);
        }, 500);
        return; // Don't send initial prompt if we have a pending one
      }

      // Also check URL parameters for initialPrompt
      const initialPrompt = searchParams.get('initialPrompt');
      if (initialPrompt) {
        setTimeout(() => {
          handleSendMessage(initialPrompt);
        }, 500);
        return; // Don't send initial prompt if we have a URL prompt
      }

      // Only send initial prompt for new chats (no historyId)
      if (!historyId) {
        handleSendInitialPrompt("Based on my information, give me some first steps and how you can help me");
      }
    }
  }, [loginUser, historyId]);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation])

  useEffect(() => {
    if (loginUser) {
      getChatHistory(0);
      getChatHistoryList(0);
    }
  }, [loginUser, historyId]);

  useEffect(() => {
    const messageList = messageListRef.current;

    // Scroll to the bottom initially
    if (messageList && conversation?.length <= 20) {
      messageList.scrollTop = messageList.scrollHeight;
    }

    const handleScroll = async () => {
      if (messageList && messageList.scrollTop === 0 && conversation.length < conversationCount) {
        setConversationCount(conversation.length);
        getChatHistory(conversation.length);
      }
    };
    messageList?.addEventListener("scroll", handleScroll);
    if (newSlotFirstMessageRef.current) {
      const firstMessage = newSlotFirstMessageRef.current;
      firstMessage.scrollIntoView({ block: "start", behavior: "instant" });
    }
    return () => messageList?.removeEventListener("scroll", handleScroll);
  }, [conversation, conversationCount, newSlotFirstMessageRef, messageListRef]);

  const getChatHistory = async (skipCount: number) => {
    try {
      setLoading(true);
      // Call the API using the utility
      const response = await apiClient(`/api/get-user-chat-history?userId=${loginUser?._id}&historyId=${historyId}&limit=20&skip=${skipCount}`, {
        method: "GET",
      });

      if (response?.chatHistory) {
        const { data: conversations, count } = response?.chatHistory;
        const reversedData = [...conversations].reverse();
        setConversation((prevConversation: any) => {
          const mergedConversations = [...reversedData, ...prevConversation];
          // Filter out duplicate conversations based on _id
          const uniqueConversations = mergedConversations.reduce((acc, current) => {
            if (!acc.some((con: any) => con._id === current._id)) {
              acc.push(current);
            }
            return acc;
          }, []);
          return uniqueConversations;
        });
        setConversationCount(count);
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
        const uniqueHistory = mergedHistory.reduce((acc, current) => {
          if (!acc.some((con: any) => con?._id === current?._id)) {
            acc.push(current);
          }
          return acc;
        }, []);

        // Group chats into time-based categories
        const groupedChatsByPeriod: any = {}; // For Today, Yesterday, etc.
        const groupedChatsByYear: any = {};

        uniqueHistory?.forEach((chat: any) => {
          const chatDate = moment(chat.timestamp);
          const today = moment().startOf("day");
          const yesterday = moment().subtract(1, "days").startOf("day");
          const sevenDaysAgo = moment().subtract(7, "days").startOf("day");
          const thirtyDaysAgo = moment().subtract(30, "days").startOf("day");
          const chatYear = chatDate.year();

          let key = "";

          if (chatDate.isSame(today, "day")) {
            key = "Today";
          } else if (chatDate.isSame(yesterday, "day")) {
            key = "Yesterday";
          } else if (chatDate.isAfter(sevenDaysAgo)) {
            key = "Previous 7 Days";
          } else if (chatDate.isAfter(thirtyDaysAgo)) {
            key = "Previous 30 Days";
          } else {
            key = chatYear.toString();
          }

          if (["Today", "Yesterday", "Previous 7 Days", "Previous 30 Days"].includes(key)) {
            if (!groupedChatsByPeriod[key]) groupedChatsByPeriod[key] = [];
            groupedChatsByPeriod[key].push(chat);
          } else {
            if (!groupedChatsByYear[key]) groupedChatsByYear[key] = [];
            groupedChatsByYear[key].push(chat);
          }
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

  // More sophisticated function to extract idea titles
  const saveIdeaToCollection = (message: string) => {
    // Look for a title pattern that clearly indicates it's an idea list
    const titleMatch = message.match(/^.*(\d+\s+(ideas?|suggestions?|tips|strategies|concepts|ways)).*/i);
    const hasListTitle = !!titleMatch;

    // Extract all potential idea titles - using various formats
    const extractedIdeas: string[] = [];

    // Pattern 1: Numbered ideas (1. Idea title)
    const numberedIdeas = message.match(/\d+\.\s*([^\n.]+)/g);
    if (numberedIdeas) {
      numberedIdeas.forEach(idea => {
        const title = idea.replace(/^\d+\.\s*/, '').trim();
        if (title.length > 0 && title.length < 100) {
          extractedIdeas.push(title);
        }
      });
    }

    // Pattern 2: Bullet point ideas (• Idea title or - Idea title)
    if (extractedIdeas.length === 0) {
      const bulletLines = message.split(/[\n\r]+/).filter(line =>
        line.trim().startsWith('•') ||
        line.trim().startsWith('-') ||
        line.trim().startsWith('*')
      );

      bulletLines.forEach(line => {
        const title = line.replace(/^[•\-*]\s*/, '').trim();
        if (title.length > 0 && title.length < 100) {
          extractedIdeas.push(title);
        }
      });
    }

    // Pattern 3: Bold or emphasized text that might be titles
    if (extractedIdeas.length === 0) {
      const boldPatterns = message.match(/\*\*(.*?)\*\*|__(.*?)__/g);
      if (boldPatterns) {
        boldPatterns.forEach(pattern => {
          const title = pattern.replace(/^\*\*|\*\*$|^__|__$/g, '').trim();
          if (title.length > 0 && title.length < 100) {
            extractedIdeas.push(title);
          }
        });
      }
    }

    // Pattern 4: Section headers with colons (Topic: details)
    if (extractedIdeas.length === 0) {
      const sectionHeaders = message.match(/^([^:\n]+):.*$/gm);
      if (sectionHeaders) {
        sectionHeaders.forEach(header => {
          const title = header.split(':')[0].trim();
          if (title.length > 0 && title.length < 100) {
            extractedIdeas.push(title);
          }
        });
      }
    }

    // Pattern 5: First lines of consecutive paragraphs (if they look like titles)
    if (extractedIdeas.length === 0) {
      const paragraphs = message.split(/[\n\r]+/).filter(p => p.trim().length > 0);

      // Check for potential paragraph titles
      const paragraphTitles: string[] = [];
      paragraphs.forEach(p => {
        const firstLine = p.split('.')[0].trim();
        if (firstLine.length > 0 &&
          firstLine.length < 60 &&
          firstLine[0] === firstLine[0].toUpperCase() && // Starts with uppercase
          !firstLine.endsWith('.')) { // Not a full sentence
          paragraphTitles.push(firstLine);
        }
      });

      // Only use paragraph titles if we have multiple that look like titles
      if (paragraphTitles.length >= 2) {
        extractedIdeas.push(...paragraphTitles);
      }
    }

    // Save the extracted ideas if we found any
    if (extractedIdeas.length > 0) {
      const ideasToSave = extractedIdeas.map(title => {
        // Extract relevant context for this idea - try to find just the section about this idea
        let contextParagraphs = "";

        // First look for a clean paragraph break
        const paragraphs = message.split(/\n\s*\n/);
        const paragraphIndex = paragraphs.findIndex(p => p.includes(title));

        if (paragraphIndex !== -1) {
          // If this is a clearly separated paragraph, just use it
          contextParagraphs = paragraphs[paragraphIndex];
        } else {
          // Otherwise, try to find where the section for this idea ends
          const messageLines = message.split('\n');
          const lineIndex = messageLines.findIndex(line => line.includes(title));

          if (lineIndex !== -1) {
            // Look for next heading, blank line, or bullet point as boundary
            const nextBoundaryIndex = messageLines.findIndex((line, index) => {
              if (index <= lineIndex) return false;

              // Check for heading-like patterns (all caps, or starting with #)
              const isHeading = /^[A-Z\s#]+$/.test(line.trim()) || line.trim().startsWith('#');

              // Check for bullet or numbered items
              const isBulletItem = /^\s*[•\-\*]\s/.test(line) || /^\s*\d+\.\s/.test(line);

              // Check for blank line
              const isBlankLine = line.trim() === '';

              return isHeading || isBulletItem || isBlankLine;
            });

            const endIndex = nextBoundaryIndex !== -1 ? nextBoundaryIndex : lineIndex + 5;
            contextParagraphs = messageLines.slice(lineIndex, endIndex).join('\n');
          } else {
            // Fallback to first two paragraphs
            contextParagraphs = paragraphs.slice(0, 2).join('\n\n');
          }
        }

        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          title: title,
          timestamp: new Date().toISOString(),
          context: contextParagraphs,
        };
      });

      const updatedIdeas = [...savedIdeas, ...ideasToSave];
      setSavedIdeas(updatedIdeas);

      // Save to localStorage
      localStorage.setItem('savedIdeas', JSON.stringify(updatedIdeas));

      toast({
        description: `${ideasToSave.length} idea${ideasToSave.length > 1 ? 's' : ''} saved to your collection!`,
        variant: "default",
      });
    } else {
      // Fallback: Save the title or first line if it looks like an idea title
      const firstLine = message.split('\n')[0].trim();

      // Only save if it has idea keywords or appears to be a title
      if (
        /\b(ideas?|suggestions?|tips|strategies|concepts|ways)\b/i.test(firstLine) ||
        (firstLine.length < 70 && !/\.$/.test(firstLine) && firstLine[0] === firstLine[0].toUpperCase())
      ) {
        // Extract relevant context for this idea - try to find just the section about this idea
        let contextParagraphs = "";

        // First look for a clean paragraph break
        const paragraphs = message.split(/\n\s*\n/);
        const paragraphIndex = paragraphs.findIndex(p => p.includes(firstLine));

        if (paragraphIndex !== -1) {
          // If this is a clearly separated paragraph, just use it
          contextParagraphs = paragraphs[paragraphIndex];
        } else {
          // Otherwise, try to find where the section for this idea ends
          const messageLines = message.split('\n');
          const lineIndex = messageLines.findIndex(line => line.includes(firstLine));

          if (lineIndex !== -1) {
            // Look for next heading, blank line, or bullet point as boundary
            const nextBoundaryIndex = messageLines.findIndex((line, index) => {
              if (index <= lineIndex) return false;

              // Check for heading-like patterns (all caps, or starting with #)
              const isHeading = /^[A-Z\s#]+$/.test(line.trim()) || line.trim().startsWith('#');

              // Check for bullet or numbered items
              const isBulletItem = /^\s*[•\-\*]\s/.test(line) || /^\s*\d+\.\s/.test(line);

              // Check for blank line
              const isBlankLine = line.trim() === '';

              return isHeading || isBulletItem || isBlankLine;
            });

            const endIndex = nextBoundaryIndex !== -1 ? nextBoundaryIndex : lineIndex + 5;
            contextParagraphs = messageLines.slice(lineIndex, endIndex).join('\n');
          } else {
            // Fallback to first two paragraphs
            contextParagraphs = paragraphs.slice(0, 2).join('\n\n');
          }
        }

        const newIdea = {
          id: Date.now().toString(),
          title: firstLine,
          timestamp: new Date().toISOString(),
          context: contextParagraphs,
        };

        const updatedIdeas = [...savedIdeas, newIdea];
        setSavedIdeas(updatedIdeas);

        // Save to localStorage
        localStorage.setItem('savedIdeas', JSON.stringify(updatedIdeas));

        toast({
          description: "Idea saved to your collection!",
          variant: "default",
        });
      }
    }
  };

  const deleteIdea = (ideaId: string) => {
    const ideaToDiscard = savedIdeas.find(idea => idea.id === ideaId);
    if (ideaToDiscard) {
      // Add to discarded ideas with current timestamp
      const discardedIdea = {
        ...ideaToDiscard,
        discarded: true,
        discardedAt: new Date().toISOString()
      };

      // Keep the idea but mark as discarded
      const updatedIdeas = savedIdeas.map(idea =>
        idea.id === ideaId ? discardedIdea : idea
      );

      setSavedIdeas(updatedIdeas);
      localStorage.setItem('savedIdeas', JSON.stringify(updatedIdeas));

      toast({
        description: "Idea moved to discarded",
        variant: "default",
      });
    }
  };

  // Function to restore a discarded idea
  const restoreIdea = (ideaId: string) => {
    const ideaToRestore = savedIdeas.find(idea => idea.id === ideaId);
    if (ideaToRestore) {
      // Remove discarded flags
      const restoredIdea = {
        ...ideaToRestore,
        discarded: false,
        discardedAt: undefined
      };

      // Update the idea to remove discarded status
      const updatedIdeas = savedIdeas.map(idea =>
        idea.id === ideaId ? restoredIdea : idea
      );

      setSavedIdeas(updatedIdeas);
      localStorage.setItem('savedIdeas', JSON.stringify(updatedIdeas));

      toast({
        description: "Idea restored to selected",
        variant: "default",
      });
    }
  };

  // Function to permanently delete an idea
  const permanentlyDeleteIdea = (ideaId: string) => {
    const updatedIdeas = savedIdeas.filter(idea => idea.id !== ideaId);
    setSavedIdeas(updatedIdeas);
    localStorage.setItem('savedIdeas', JSON.stringify(updatedIdeas));
  };

  // Function to start a new chat with a prompt to improve a specific idea
  const startIdeaImprovement = (ideaTitle: string) => {
    // Clear current conversation
    setConversation([]);
    setConversationCount(0);
    setNewMessage("");

    // Navigate to a new chat
    router.push('/ideate', { scroll: false });

    // Set a timeout to allow the component to re-render before sending the message
    setTimeout(() => {
      // Send a message to start improving the selected idea
      handleSendMessage(`Help me improve this idea piece: ${ideaTitle}`);
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
        if (updatedConversations?.length > 0) {
          updatedConversations[updatedConversations?.length - 1] = {
            ...updatedConversations?.[updatedConversations?.length - 1],
            isAnswered: true
          };
        }
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

      if (response?.messageData) {
        if (!historyId) {
          setNewHistoryList([]);
          setHistoryListTimeWise({});
          setHistoryListYearWise({});
          setConversation([]);
          router.push(`/ideate?chat=${response?.messageData?.historyId}`, { scroll: true });
          router.refresh();
        } else {
          setConversation((preConversations: any) => ([...preConversations, response?.messageData]))
        }
        getChatHistoryList(10);
      }
      setTimeout(() => {
        const messageList: any = messageListRef.current;
        messageList.scrollTop = messageList.scrollHeight;
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
    }
    finally {
      setAILoading(false);
    }
  }

  const handleSendInitialPrompt = async (directMessage?: string) => {
    if (!initialPromptSent) {
      setInitialPromptSent(true);
      // handleSendMessage(directMessage);

      try {
        if (aiLoading || (!newMessage && !directMessage)) return;
        // SEND MESSAGE API
        const messageData: any = {
          userId: loginUser?._id,
          message: newMessage?.trim() || directMessage?.trim(),
          senderId: "human",
          timestamp: new Date().toISOString(),
          historyId: historyId || "",
          isInitialPrompt: true
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
          if (!historyId) {
            setNewHistoryList([]);
            setHistoryListTimeWise({});
            setHistoryListYearWise({});
            setConversation([]);
            router.push(`/ideate?chat=${response?.messageData?.historyId}`, { scroll: true });
            router.refresh();
          } else {
            setConversation((preConversations: any) => ([...preConversations, response?.messageData]))
          }
          getChatHistoryList(10);
        }
        setTimeout(() => {
          const messageList: any = messageListRef.current;
          messageList.scrollTop = messageList.scrollHeight;
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
      }
      finally {
        setAILoading(false);
      }
    }


  }

  // Add a calendar modal component
  const CalendarModal = () => {
    if (!isCalendarModalOpen) return null;

    const closeCalendarModal = () => {
      setIsCalendarModalOpen(false);
    };

    // New state for day view and task editing
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [dayView, setDayView] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState("Medium");
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [selectedTaskFilter, setSelectedTaskFilter] = useState<'all' | 'today'>('all');

    const handleAddTask = async () => {
      if (!newTaskTitle.trim()) return;

      try {
        // Format date for the selected day or current day if none selected
        const taskDate = selectedDay || calendarDate;
        const formattedTaskDate = new Date(
          Date.UTC(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
        ).toISOString();

        await apiClient("/api/add-task", {
          method: "POST",
          body: JSON.stringify({
            title: newTaskTitle,
            date: formattedTaskDate,
            priority: newTaskPriority,
            completed: false
          }),
        });

        // Reset form and refresh tasks
        setNewTaskTitle("");
        setShowAddTaskForm(false);
        if (typeof tasksRefetch === "function") {
          tasksRefetch();
        }

        toast({
          description: "Task added successfully",
          variant: "default",
        });
      } catch (error) {
        console.error("Error adding task:", error);
        toast({
          description: "Failed to add task",
          variant: "destructive",
        });
      }
    };

    const handleViewContent = (contentId: string) => {
      closeCalendarModal();
      navigateToContent(contentId);
    };

    // Helper function to get tasks for a specific date
    const getTasksForDate = (date: Date) => {
      return typedAllTasks.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate.getDate() === date.getDate() &&
          taskDate.getMonth() === date.getMonth() &&
          taskDate.getFullYear() === date.getFullYear();
      });
    };

    // Helper function to get content for a specific date
    const getContentForDate = (date: Date) => {
      // This should match the application's existing pattern to get content
      if (!Array.isArray(content)) return [];

      return getContentItems().filter((c: any) => {
        try {
          // Handle different date field names that might exist in the content objects
          const contentDateStr = c.scheduledFor || c.date || c.createdAt;
          if (!contentDateStr) return false;

          const contentDate = new Date(contentDateStr);
          return contentDate.getDate() === date.getDate() &&
            contentDate.getMonth() === date.getMonth() &&
            contentDate.getFullYear() === date.getFullYear();
        } catch (e) {
          return false;
        }
      });
    };

    // Get filtered tasks based on the selected filter
    const getFilteredTasks = () => {
      if (selectedTaskFilter === 'today') {
        const today = new Date();
        return typedAllTasks.filter(task => {
          const taskDate = new Date(task.date);
          return taskDate.getDate() === today.getDate() &&
            taskDate.getMonth() === today.getMonth() &&
            taskDate.getFullYear() === today.getFullYear();
        });
      }

      return typedAllTasks;
    };

    // Get days in the month for calendar
    const getDaysInMonth = () => {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();

      // Get the first day of the month
      const firstDay = new Date(year, month, 1);
      const firstDayOfWeek = firstDay.getDay() || 7; // 0 for Sunday, but we want Monday as 1
      const adjustedFirstDayOfWeek = firstDayOfWeek === 1 ? 7 : firstDayOfWeek - 1;

      // Get the last day of the month
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();

      // Get the last day of the previous month
      const lastDayPrevMonth = new Date(year, month, 0).getDate();

      // Calculate days from previous month to display
      const prevMonthDays = [];
      for (let i = adjustedFirstDayOfWeek - 1; i >= 0; i--) {
        prevMonthDays.push({
          date: lastDayPrevMonth - i,
          currentMonth: false,
          day: new Date(year, month - 1, lastDayPrevMonth - i)
        });
      }

      // Current month days
      const currentMonthDays = [];
      for (let i = 1; i <= daysInMonth; i++) {
        currentMonthDays.push({
          date: i,
          currentMonth: true,
          day: new Date(year, month, i)
        });
      }

      // Calculate days from next month to display
      const totalDaysDisplayed = 42; // 6 rows of 7 days
      const nextMonthDays = [];
      const daysNeeded = totalDaysDisplayed - prevMonthDays.length - currentMonthDays.length;

      for (let i = 1; i <= daysNeeded; i++) {
        nextMonthDays.push({
          date: i,
          currentMonth: false,
          day: new Date(year, month + 1, i)
        });
      }

      return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    };

    // Get week dates for week view
    const getWeekDates = () => {
      // Start from Monday of the current week
      const startOfWeek = getWeekStart(selectedMonth);

      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        weekDates.push(date);
      }

      return weekDates;
    };

    // Render function for the calendar grid
    const renderCalendarGrid = () => {
      const today = new Date();
      const days = getDaysInMonth();
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      return (
        <div className="bg-white rounded-lg p-4">
          {/* Header with view buttons on left, centered date with arrows */}
          <div className="flex items-center justify-between mb-4">
            {/* Left side: View toggle buttons */}
            <div className="flex space-x-1">
              <button
                onClick={() => setCalendarView('month')}
                className={`px-3 py-1 text-sm rounded-sm ${calendarView === 'month'
                  ? "bg-[#6366F1] text-white"
                  : "bg-gray-200 text-gray-600"
                  }`}
              >
                Months
              </button>
              <button
                onClick={() => setCalendarView('week')}
                className={`px-3 py-1 text-sm rounded-sm ${calendarView === 'week'
                  ? "bg-[#6366F1] text-white"
                  : "bg-gray-200 text-gray-600"
                  }`}
              >
                Week
              </button>
            </div>

            {/* Center: Navigation arrows and date range */}
            <div className="flex items-center">
              <button
                className="p-1 hover:bg-gray-100 rounded-full text-[#54577A]"
                onClick={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(selectedMonth.getMonth() - 1);
                  setSelectedMonth(newDate);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <h3 className="text-lg font-medium min-w-[240px] text-center">
                {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                className="p-1 hover:bg-gray-100 rounded-full text-[#54577A]"
                onClick={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(selectedMonth.getMonth() + 1);
                  setSelectedMonth(newDate);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Right side: Empty spacer to center the date */}
            <div className="w-[100px]"></div>
          </div>

          {/* Day names header */}
          <div className="grid grid-cols-7 text-center mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-xs text-gray-500 font-medium">{day}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isToday = day.day.getDate() === today.getDate() &&
                day.day.getMonth() === today.getMonth() &&
                day.day.getFullYear() === today.getFullYear();

              const isActiveDay = day.day.getDate().toString() === activeDay &&
                day.day.getMonth() === selectedMonth.getMonth() &&
                day.day.getFullYear() === selectedMonth.getFullYear() &&
                day.currentMonth;

              const hasContent = getContentForDate(day.day).length > 0;
              const hasTasks = getTasksForDate(day.day).length > 0;

              return (
                <div
                  key={index}
                  className={`h-16 text-center p-1 relative rounded-sm
                    ${day.currentMonth ? 'bg-[#F5F5F5]' : 'bg-[#F5F5F5] text-gray-400'}
                    ${isToday ? 'ring-2 ring-blue-400' : ''}
                    ${isActiveDay ? 'bg-blue-50' : ''}
                  `}
                  onClick={() => {
                    setActiveDay(day.day.getDate().toString());
                    // If selecting day from different month, update selected month
                    if (!day.currentMonth) {
                      const newDate = new Date(day.day);
                      setSelectedMonth(newDate);
                    }
                  }}
                >
                  <div className="text-xs font-medium">{day.date}</div>

                  {/* Content indicators */}
                  <div className="mt-2 flex justify-center items-center gap-1">
                    {hasContent && (
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div className="w-2 h-2 bg-[#546FFF] rounded-full"></div>
                      </div>
                    )}
                    {hasTasks && (
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div className="w-2 h-2 bg-[#5D60FF] rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    // Render week view with proper navigation
    const renderWeekView = () => {
      const weekDates = getWeekDates();
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date();

      return (
        <div className="bg-white p-2">
          {/* Header with view buttons on left, centered week range with arrows */}
          <div className="flex items-center justify-between mb-4">
            {/* Left side: View toggle buttons */}
            <div className="flex space-x-1">
              <button
                onClick={() => setCalendarView('month')}
                className={`px-3 py-1 text-sm rounded-sm ${calendarView === 'month'
                  ? "bg-[#6366F1] text-white"
                  : "bg-gray-200 text-gray-600"
                  }`}
              >
                Months
              </button>
              <button
                onClick={() => setCalendarView('week')}
                className={`px-3 py-1 text-sm rounded-sm ${calendarView === 'week'
                  ? "bg-[#6366F1] text-white"
                  : "bg-gray-200 text-gray-600"
                  }`}
              >
                Week
              </button>
            </div>

            {/* Center: Navigation arrows and week range */}
            <div className="flex items-center">
              <button
                className="p-1 hover:bg-gray-100 rounded-full text-[#54577A]"
                onClick={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setDate(selectedMonth.getDate() - 7);
                  setSelectedMonth(newDate);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <h3 className="text-lg font-medium min-w-[240px] text-center">
                {formatWeekDateRange(weekDates)}
              </h3>
              <button
                className="p-1 hover:bg-gray-100 rounded-full text-[#54577A]"
                onClick={() => {
                  const newDate = new Date(selectedMonth);
                  newDate.setDate(selectedMonth.getDate() + 7);
                  setSelectedMonth(newDate);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Right side: Empty spacer to center the date */}
            <div className="w-[100px]"></div>
          </div>

          {/* Week grid layout */}
          <div className="mt-2">
            {/* Day headers */}
            <div className="grid grid-cols-7 text-center pb-2">
              {dayNames.map((day, index) => (
                <div key={index} className="px-2 pb-2 text-sm text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-7 text-center pb-4">
              {weekDates.map((date, index) => {
                const isToday = date.toDateString() === today.toDateString();
                const isActiveDay = date.getDate().toString() === activeDay &&
                  date.getMonth() === todayDate.getMonth() &&
                  date.getFullYear() === todayDate.getFullYear();
                return (
                  <div
                    key={index}
                    className={`text-sm cursor-pointer ${isToday ? 'text-[#6366F1] font-bold' : 'text-gray-400'} ${isActiveDay ? 'bg-blue-50 rounded-full' : ''}`}
                    onClick={() => {
                      setActiveDay(date.getDate().toString());
                      // Update todayDate reference to match selected date's month/year
                      const newDate = new Date(todayDate);
                      newDate.setFullYear(date.getFullYear());
                      newDate.setMonth(date.getMonth());
                      newDate.setDate(date.getDate());
                      setCalendarDate(newDate);
                    }}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>

            {/* Calendar cells - empty cells with task indicators */}
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((date, index) => {
                // Get tasks for this date
                const tasksForDay = getTasksForDate(date);
                const hasContent = getContentForDate(date).length > 0;
                const isActiveDay = date.getDate().toString() === activeDay &&
                  date.getMonth() === todayDate.getMonth() &&
                  date.getFullYear() === todayDate.getFullYear();

                return (
                  <div
                    key={index}
                    className={`h-72 bg-[#F5F5F5] relative rounded-sm ${isActiveDay ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      setActiveDay(date.getDate().toString());
                      // Update todayDate reference to match selected date's month/year
                      const newDate = new Date(todayDate);
                      newDate.setFullYear(date.getFullYear());
                      newDate.setMonth(date.getMonth());
                      newDate.setDate(date.getDate());
                      setCalendarDate(newDate);
                    }}
                  >
                    {/* Task indicators */}
                    {tasksForDay.length > 0 && (
                      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-[#6366F1] text-sm">
                        <div className="inline-flex items-center justify-center">
                          <div className="text-[#6366F1] text-xs border border-[#6366F1] px-2 py-1 rounded-sm bg-white">
                            {tasksForDay.length}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    };

    // Helper function to format the date range for the week view header
    const formatWeekDateRange = (weekDates: Date[]) => {
      if (weekDates.length === 0) return '';

      const firstDate = weekDates[0];
      const lastDate = weekDates[weekDates.length - 1];

      // If week spans two months
      if (firstDate.getMonth() !== lastDate.getMonth()) {
        return `${format(firstDate, 'MMM d')} - ${format(lastDate, 'MMM d, yyyy')}`;
      }

      // If week spans two years
      if (firstDate.getFullYear() !== lastDate.getFullYear()) {
        return `${format(firstDate, 'MMM d, yyyy')} - ${format(lastDate, 'MMM d, yyyy')}`;
      }

      // Standard format within same month and year
      return `${format(firstDate, 'MMM d')} - ${format(lastDate, 'd, yyyy')}`;
    };

    // New split view UI as shown in the image
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white shadow-lg w-[95%] max-w-6xl h-[90%] flex flex-col overflow-hidden relative">
          {/* Close button - positioned absolutely at top right */}
          <button
            onClick={closeCalendarModal}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-2 z-10"
          >
            ✕
          </button>

          {/* Main content area - Grid layout like the image */}
          <div className="flex-grow flex overflow-hidden pt-4">
            {/* Left side - Calendar */}
            <div className="w-7/12 p-10 overflow-y-auto">
              {calendarView === 'month' ? renderCalendarGrid() : renderWeekView()}
            </div>

            {/* Right side - Tasks list */}
            <div className="w-5/12 flex flex-col overflow-hidden">
              {/* Content/Todo toggle tabs */}
              <div className="flex justify-start px-4 pt-4">
                <div className="flex">
                  <div
                    className={`cursor-pointer px-4 py-2 text-sm ${activeTab === 'schedule'
                      ? 'text-black border-b-2 border-black font-xs'
                      : 'text-[#727070]'}`}
                    onClick={() => setActiveTab('schedule')}
                  >
                    Your content line up
                  </div>
                  <div
                    className={`cursor-pointer px-4 py-2 text-sm ${activeTab === 'todos'
                      ? 'text-black border-b-2 border-black font-xs'
                      : 'text-[#727070]'}`}
                    onClick={() => setActiveTab('todos')}
                  >
                    To-do's
                  </div>
                </div>
              </div>

              {/* Today/All filter */}
              <div className="p-4 flex justify-start">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setSelectedTaskFilter('today')}
                    className={`px-3 py-1 text-xs rounded-md ${selectedTaskFilter === 'today'
                      ? 'bg-[#6366F1] text-white'
                      : 'bg-gray-200 text-gray-600'}`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setSelectedTaskFilter('all')}
                    className={`px-3 py-1 text-xs rounded-md ${selectedTaskFilter === 'all'
                      ? 'bg-[#6366F1] text-white'
                      : 'bg-gray-200 text-gray-600'}`}
                  >
                    All
                  </button>
                </div>
              </div>

              {/* Content/Tasks list based on active tab */}
              <div className="flex-grow overflow-y-auto px-4 pt-4">
                {activeTab === 'schedule' ? (
                  // Content items view
                  <div className="space-y-4">
                    {contentLoading ? (
                      <div className="text-gray-500 text-sm mt-1">Loading content...</div>
                    ) : contentError ? (
                      <div className="text-red-500 text-sm mt-1">
                        Failed to fetch content
                      </div>
                    ) : content !== null && Array.isArray(content) ? (
                      getContentItems().length > 0 ? (
                        <div className="space-y-2">
                          {getContentItems().map((c: any) => (
                            <div
                              key={c._id}
                              className="bg-[#546FFF20] rounded-lg p-3 text-sm text-gray-800 cursor-pointer hover:bg-[#546FFF30] border border-[#546FFF40] transition-colors duration-200"
                              onClick={() => navigateToContent(c._id)}
                            >
                              {c.hook}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-[#546FFF10] rounded-lg p-3 text-sm text-gray-800 border border-[#546FFF20]">
                          <div>No content available</div>
                        </div>
                      )
                    ) : (
                      <div className="text-gray-500 text-sm mt-1">
                        No Content for this date
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {tasksLoading ? (
                      <div className="text-gray-500 text-sm mt-1">Loading tasks...</div>
                    ) : tasksError ? (
                      <div className="text-red-500 text-sm mt-1">
                        Failed to fetch tasks
                      </div>
                    ) : typedAllTasks?.length > 0 ? (
                      <div className="space-y-2">
                        {/* Get tasks for the selected date */}
                        {typedAllTasks.filter(task => {
                          const taskDate = new Date(task.date);
                          // Create date from the active day using calendarDate for month/year
                          const selectedDate = new Date(
                            calendarDate.getFullYear(),
                            calendarDate.getMonth(),
                            Number(activeDay)
                          );
                          return taskDate.getDate() === selectedDate.getDate() &&
                            taskDate.getMonth() === selectedDate.getMonth() &&
                            taskDate.getFullYear() === selectedDate.getFullYear();
                        }).map((task) => (
                          <div
                            key={task._id}
                            className={`rounded-lg p-3 text-sm text-gray-800 cursor-pointer flex items-center gap-2 bg-[#FCF7E4]`}
                          >
                            <Checkbox
                              checked={task.completed}
                              className="rounded-full w-4 h-4"
                              onCheckedChange={(checked: boolean) =>
                                onCheckedChange(task._id, checked as boolean)
                              }
                              disabled={tasksLoading}
                            />
                            <div className="flex flex-1 justify-between items-center">
                              <span>{task.title}</span>
                              <span className="px-2 py-0.5 text-xs rounded-full bg-[#5D60FF] text-white">
                                {task.priority || 'Low'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#FCF7E4] rounded-lg p-3 text-sm text-gray-800">
                        <div>No tasks for this date</div>
                      </div>
                    )}
                  </>
                )}
              </div>


            </div>
          </div>

          {/* Task form modal */}
          {showAddTaskForm && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl">
                <h3 className="text-lg font-medium mb-4">Add New Task</h3>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title"
                  className="w-full p-2 mb-4 border border-gray-200 rounded-md"
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded-md">
                    {selectedDay ? selectedDay.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Today'}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowAddTaskForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="px-4 py-2 bg-[#5D60FF] text-white rounded-md"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Add this at the component level
  const [activeIdeaTab, setActiveIdeaTab] = useState<'selected' | 'discarded'>('selected');

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

  // Add the calendar update effect
  useEffect(() => {
    // Update calendar date once per minute to ensure it stays current
    const intervalId = setInterval(() => {
      setCalendarDate(new Date());
    }, 60000); // 60,000 ms = 1 minute

    return () => clearInterval(intervalId);
  }, []);

  // Refetch all content when needed
  useEffect(() => {
    if (typeof allContentRefetch === 'function') {
      allContentRefetch();
    }
  }, [calendarDate.getMonth(), calendarDate.getFullYear()]);

  return (
    <div className={`flex flex-col ${montserrat.className} bg-[#FCF7E4] h-screen overflow-hidden p-4`}>
      <div className="flex h-full gap-4">
        {/* CONVERSATION AREA */}
        <div className={"w-[35%] flex flex-col h-full bg-white rounded-none shadow-sm"}>
          {/* Title & New Chat inside conversation area */}
          <div className="flex justify-between items-center lg:px-9 px-4 py-4">
            <div className="flex items-center gap-6">
              <h1 className="text-xl bg-black text-transparent bg-clip-text font-semibold">
                Ideate with Ina
              </h1>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setConversation([]);
                    setConversationCount(0)
                    setNewMessage("")
                    setInitialPromptSent(false)
                    router.push(`/ideate`);
                    router.refresh();
                  }}
                  className="bg-gradient-to-r from-[#2A1C8F] to-[#8FA0D8] rounded-full px-0.5 py-0.5 text-center font-medium text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-200"
                >
                  <div className="rounded-full bg-white px-3 md:px-5 py-2 md:py-2.5 text-black text-xs md:text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200">
                    <Plus className="h-3 md:h-4 w-3 md:w-4" strokeWidth={2.5} />
                    New
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Messages container - scrollable */}
          <div ref={messageListRef} className="flex-1 overflow-y-auto scrollbar-thin lg:px-9 px-4 py-4">
            {loading && <div className="flex justify-center"><DotsSpinner w={2} h={2} /></div>}

            <div className="space-y-6">
              {conversation?.map((item: any, i: number) => (
                <>
                  {item?.senderId === "aibot" ?
                    <div key={i} className="w-fit max-w-[80%]" ref={conversation?.length >= 20 && i === 20 ? newSlotFirstMessageRef : undefined}>
                      <div className="bg-[#FCF7E4] text-black p-3 rounded-lg w-fit text-[12px]">
                        <ReactMarkdown
                          className="prose prose-sm"
                          components={{
                            ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '1.2em' }} {...props} />,
                            ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.2em' }} {...props} />,
                            a: ({ node, ...props }) => <a style={{ textDecoration: 'underline' }} target="_blank" {...props} />,
                            pre: ({ node, ...props }) => <pre style={{ backgroundColor: '#f0f0f0', padding: '0.8em', borderRadius: '4px', overflowX: 'auto' }} {...props} />,
                          }}
                        >
                          {item?.message}
                        </ReactMarkdown>
                      </div>
                      <div className="flex justify-between">
                        <p className={`text-muted-foreground text-xs ml-1`} style={{ marginTop: "4px" }}>
                          {item?.timestamp && <TimestampDisplay timestamp={item.timestamp} />}
                        </p>
                        <div className="flex items-center gap-2">
                          {(item?.isQuestion && !item?.isAnswered) &&
                            <div className="flex gap-2 justify-center" style={{ marginTop: "6px" }}>
                              <Button variant="outline" className="rounded-none border-[#EB7A52] text-[#EB7A52] hover:bg-[#EB7A5220] text-xs px-3 py-1" onClick={() => handleSendMessage("Yes, Add it to my plan")}>Yes</Button>
                              <Button variant="outline" className="rounded-none border-[#EB7A52] text-[#EB7A52] hover:bg-[#EB7A5220] text-xs px-3 py-1" onClick={() => handleSendMessage("No")}>No</Button>
                            </div>
                          }
                          {messageContainsIdeas(item?.message) &&
                            <Button
                              variant="outline"
                              className="rounded border-[#5D60FF] text-[#5D60FF] hover:bg-[#5D60FF20] text-xs px-3 py-1 ml-2"
                              onClick={() => saveIdeaToCollection(item?.message)}
                            >
                              Save Ideas
                            </Button>
                          }
                        </div>
                      </div>
                    </div>
                    :
                    <div key={i} className="w-fit max-w-[80%] ml-auto" ref={conversation?.length >= 20 && i === 20 ? newSlotFirstMessageRef : undefined}>
                      <div className="bg-[#5D60FF] text-white p-3 rounded-lg w-fit text-[12px] ml-auto">
                        <ReactMarkdown
                          className="prose prose-sm"
                          components={{
                            ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '1.2em' }} {...props} />,
                            ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.2em' }} {...props} />,
                            a: ({ node, ...props }) => <a style={{ textDecoration: 'underline' }} target="_blank" {...props} />,
                            pre: ({ node, ...props }) => <pre style={{ backgroundColor: '#f0f0f0', padding: '0.8em', borderRadius: '4px', overflowX: 'auto' }} {...props} />,
                          }}
                        >
                          {item?.message}
                        </ReactMarkdown>
                      </div>
                      <p className={`text-muted-foreground text-xs flex justify-end mr-1`} style={{ marginTop: "4px" }}>
                        {item?.timestamp && <TimestampDisplay timestamp={item.timestamp} />}
                      </p>
                    </div>
                  }
                </>
              ))}
              {aiLoading && (
                <div className="max-w-[80%]">
                  <span className="px-[6px] py-[10px] rounded-lg ltr:rounded-tl-none rtl:rounded-tr-none text-xs block w-fit bg-[#FCF7E4]">
                    <TypingDotSpinner />
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Fixed input area at bottom */}
          <div className="px-6 py-4 pb-6" >
            <div className="relative">
              <textarea
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
                placeholder="I want content for valentine's celebration"
                className="w-full p-4 pr-20 rounded-2xl bg-[#FFFDF8] focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-sm border border-gray-100 text-sm resize-none min-h-[52px] max-h-32 overflow-y-auto"
                id="messageInput"
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '52px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
              <button
                className={`absolute right-2 top-[60%] transform -translate-y-1/2 rounded-full bg-[#6C63FF] hover:bg-[#5D56E8] text-white px-5 py-2 text-sm ${(!newMessage?.trim() || aiLoading) && "opacity-70 cursor-not-allowed"}`}
                onClick={() => { (newMessage?.trim() && !aiLoading) && handleSendMessage() }}
                disabled={!newMessage?.trim() || aiLoading}
              >
                ask ina
              </button>
            </div>
          </div>
        </div>

        {/* IDEA BOX - Replacing chat history */}
        <div className="w-[33%] h-full flex flex-col bg-[#FCF7E4] rounded-none">
          <div className="px-4 py-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xl ">your idea board</h2>
              <button
                className="text-[#5D60FF] px-4 py-1 rounded-lg border border-[#5D60FF] hover:bg-[#5D60FF10] transition-colors"
                onClick={() => router.push('/plan')}
              >
                go to plan
              </button>
            </div>
          </div>

          <div className="mx-4 bg-white rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
            {/* Tabs - grey box with white active tab */}
            <div className="flex justify-center py-2 pt-4">
              <div className="bg-gray-200 rounded-lg flex overflow-hidden border border-gray-300 mx-auto text-sm">
                <div
                  className={`flex items-center gap-1 cursor-pointer px-6 py-1.5 ${activeIdeaTab === 'selected' ? 'bg-white' : 'text-gray-600'}`}
                  onClick={() => setActiveIdeaTab('selected')}
                >
                  <div className="h-4 w-4 flex items-center justify-center mr-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  </div>
                  <span>liked</span>
                </div>
                <div
                  className={`flex items-center gap-1 cursor-pointer px-6 py-1.5 ${activeIdeaTab === 'discarded' ? 'bg-white' : 'text-gray-600'}`}
                  onClick={() => setActiveIdeaTab('discarded')}
                >
                  <span>disliked</span>
                  <div className="h-4 w-4 flex items-center justify-center ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 pb-6">
              {activeIdeaTab === 'selected' ? (
                // Selected ideas
                savedIdeas.filter(idea => !idea.discarded).length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">No saved ideas yet</p>
                    {/* <p className="text-sm text-gray-400 mt-2">Use the "Save Idea" button on AI responses to add them here</p> */}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedIdeas.filter(idea => !idea.discarded).map((idea) => (
                      <div key={idea.id} className="p-3 rounded-md bg-[#F7F9FF]">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            <TimestampDisplay timestamp={idea.timestamp} />
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowingIdeaContext(idea.id);
                                setActiveIdeaContext(idea.context || "No additional context available");
                              }}
                              className="text-gray-400 hover:text-blue-500"
                              title="Show more context"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteIdea(idea.id);
                              }}
                              className="text-gray-400 hover:text-red-500"
                              title="Move to discarded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div
                          className="text-sm font-medium mt-2 cursor-pointer hover:text-[#5D60FF] transition-colors"
                          onClick={() => startIdeaImprovement(idea.title)}
                        >
                          {idea.title || "Untitled Idea"}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Discarded ideas
                savedIdeas.filter(idea => idea.discarded).length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">No discarded ideas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedIdeas.filter(idea => idea.discarded).map((idea) => (
                      <div key={idea.id} className="p-3 rounded-md bg-[#F7F9FF] opacity-80">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            <TimestampDisplay timestamp={idea.discardedAt || idea.timestamp} />
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => restoreIdea(idea.id)}
                              className="text-gray-400 hover:text-green-500"
                              title="Restore idea"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <path d="M3 3v5h5"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => permanentlyDeleteIdea(idea.id)}
                              className="text-gray-400 hover:text-red-500"
                              title="Permanently delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="text-sm font-medium mt-2 line-through text-gray-500">
                          {idea.title || "Untitled Idea"}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* CALENDAR CARD */}
        <div className="w-[32%] h-full">
          <Card className="h-full bg-white shadow-sm">
            <CardHeader className="flex flex-col space-y-0 pb-0">
              {/* Month display at top with navigation */}
              <div className="flex justify-between items-center w-full pb-2">
                <div className="flex items-center">
                  <button
                    className="p-1 hover:bg-gray-100 rounded-full mr-2"
                    onClick={() => {
                      const newDate = new Date(calendarDate);
                      newDate.setDate(calendarDate.getDate() - 7);
                      setCalendarDate(newDate);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <h3 className="text-xl">
                    {format(calendarDate, 'MMMM yyyy')}
                  </h3>
                  <button
                    className="p-1 hover:bg-gray-100 rounded-full ml-2"
                    onClick={() => {
                      const newDate = new Date(calendarDate);
                      newDate.setDate(calendarDate.getDate() + 7);
                      setCalendarDate(newDate);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded-none transition-colors" onClick={() => setIsCalendarModalOpen(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-expand">
                    <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8" />
                    <path d="M3 16.2V21m0 0h4.8M3 21l6-6" />
                    <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6" />
                    <path d="M3 7.8V3m0 0h4.8M3 3l6 6" />
                  </svg>
                </button>
              </div>
              {/* Day of week headers */}
              <div className="grid grid-cols-7 gap-1 text-center py-2">

                <div className="text-gray-500 text-xs">M</div>
                <div className="text-gray-500 text-xs">T</div>
                <div className="text-gray-500 text-xs">W</div>
                <div className="text-gray-500 text-xs">T</div>
                <div className="text-gray-500 text-xs">F</div>
                <div className="text-gray-500 text-xs">S</div>
                <div className="text-gray-500 text-xs">S</div>
              </div>
            </CardHeader>

            <CardContent className="p-0 h-[calc(100%-8rem)] overflow-y-auto">
              {/* Calendar days */}
              <div className="px-4 pt-1 pb-2">
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {weekDays.map((day) => {
                    // Find the corresponding date object from the current week for this day
                    const weekStart = getWeekStart(calendarDate);
                    const dayIndex = weekDays.findIndex(d => d.date === day.date);
                    const dayDate = new Date(weekStart);
                    if (dayIndex >= 0) {
                      dayDate.setDate(weekStart.getDate() + dayIndex);
                    }

                    // Check if this day is today
                    const today = new Date();
                    const isToday = dayDate.getDate() === today.getDate() &&
                      dayDate.getMonth() === today.getMonth() &&
                      dayDate.getFullYear() === today.getFullYear();

                    // Check for content and tasks on this date
                    const hasContent = getContentForDate(dayDate).length > 0;
                    const hasTasks = getTasksForDate(dayDate).length > 0;

                    return (
                      <div
                        key={day.date}
                        onClick={() => {
                          setActiveDay(day.date);
                          if (dayIndex >= 0) {
                            // Update calendarDate to reflect the selected day
                            setCalendarDate(dayDate);
                          }
                        }}
                        className="text-center cursor-pointer p-1 relative"
                      >
                        <div
                          className={`rounded-full w-10 h-10 mx-auto flex items-center justify-center 
                            ${day.date === activeDay ? "bg-[#5D60FF] text-white" : "hover:bg-gray-50"}
                          `}
                        >
                          <div className="text-medium font-medium">
                            {day.date}
                          </div>
                        </div>

                        {/* Content and task indicators - hidden for today's date */}
                        {(hasContent || hasTasks) && !isToday && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-1">
                            {hasContent && (
                              <div className="w-1.5 h-1.5 bg-[#546FFF] rounded-full"></div>
                            )}
                            {hasTasks && (
                              <div className="w-1.5 h-1.5 bg-[#5D60FF] rounded-full"></div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content/Tasks toggle */}
              <div className="mb-2">
                <div className="flex w-full">
                  <div
                    className={`cursor-pointer py-1 px-4 text-sm font-medium flex-1 text-center ${activeTab === 'schedule' ? 'border-b-3 border-[#546FFF] text-[#546FFF]' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('schedule')}
                  >
                    Your Content Line up
                  </div>
                  <div
                    className={`cursor-pointer py-1 px-4 text-sm font-medium flex-1 text-center ${activeTab === 'todos' ? 'border-b-3 border-[#5D60FF] text-[#5D60FF]' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('todos')}
                  >
                    To-Do's
                  </div>
                </div>
              </div>

              {/* Content or Tasks based on active tab */}
              <div className="px-4 pt-2 pb-4">
                {activeTab === 'schedule' ? (
                  contentLoading ? (
                    <div className="text-gray-500 text-sm mt-1">Loading content...</div>
                  ) : contentError ? (
                    <div className="text-red-500 text-sm mt-1">
                      Failed to fetch content
                    </div>
                  ) : content !== null && Array.isArray(content) ? (
                    getContentItems().length > 0 ? (
                      <div className="space-y-2">
                        {getContentItems().map((c: any) => (
                          <div
                            key={c._id}
                            className="bg-[#546FFF20] rounded-lg p-3 text-sm text-gray-800 cursor-pointer hover:bg-[#546FFF30] border border-[#546FFF40] transition-colors duration-200"
                            onClick={() => navigateToContent(c._id)}
                          >
                            {c.hook || c.title || 'Content Item'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#F8F9FC] rounded-lg p-4 text-center text-gray-500">
                        No content available
                      </div>
                    )
                  ) : (
                    <div className="bg-[#F8F9FC] rounded-lg p-4 text-center text-gray-500">
                      No content for this date
                    </div>
                  )
                ) : (
                  <>
                    {tasksLoading ? (
                      <div className="text-gray-500 text-sm mt-1">Loading tasks...</div>
                    ) : tasksError ? (
                      <div className="text-red-500 text-sm mt-1">
                        Failed to fetch tasks
                      </div>
                    ) : typedAllTasks?.length > 0 ? (
                      <div className="space-y-2">
                        {/* Get tasks for the selected date */}
                        {typedAllTasks.filter(task => {
                          const taskDate = new Date(task.date);
                          // Create date from the active day using calendarDate for month/year
                          const selectedDate = new Date(
                            calendarDate.getFullYear(),
                            calendarDate.getMonth(),
                            Number(activeDay)
                          );
                          return taskDate.getDate() === selectedDate.getDate() &&
                            taskDate.getMonth() === selectedDate.getMonth() &&
                            taskDate.getFullYear() === selectedDate.getFullYear();
                        }).map((task) => (
                          <div
                            key={task._id}
                            className={`rounded-lg p-3 text-sm text-gray-800 cursor-pointer flex items-center gap-2 bg-[#FCF7E4]`}
                          >
                            <Checkbox
                              checked={task.completed}
                              className="rounded-full w-4 h-4"
                              onCheckedChange={(checked: boolean) =>
                                onCheckedChange(task._id, checked as boolean)
                              }
                              disabled={tasksLoading}
                            />
                            <div className="flex flex-1 justify-between items-center">
                              <span>{task.title}</span>
                              <span className="px-2 py-0.5 text-xs rounded-full bg-[#5D60FF] text-white">
                                {task.priority || 'Low'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#FCF7E4] rounded-lg p-3 text-sm text-gray-800">
                        <div>No tasks for this date</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Modal */}
        <CalendarModal />

        {/* Idea Context Modal */}
        {showingIdeaContext && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-[80%] max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Idea Context</h3>
                <button
                  onClick={() => {
                    setShowingIdeaContext(null);
                    setActiveIdeaContext(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <div className="bg-[#FCF7E4] p-4 rounded-lg">
                  <ReactMarkdown
                    className="prose prose-sm max-w-none"
                    components={{
                      ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '1.2em' }} {...props} />,
                      ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.2em' }} {...props} />,
                      a: ({ node, ...props }) => <a style={{ textDecoration: 'underline' }} target="_blank" {...props} />,
                      pre: ({ node, ...props }) => <pre style={{ backgroundColor: '#f0f0f0', padding: '0.8em', borderRadius: '4px', overflowX: 'auto' }} {...props} />,
                    }}
                  >
                    {activeIdeaContext || "No additional context available"}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="p-4 border-t flex justify-end">
                <button
                  onClick={() => {
                    setShowingIdeaContext(null);
                    setActiveIdeaContext(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
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