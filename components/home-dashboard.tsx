"use client"

import {
  Plus,
  MoreHorizontal,
  Zap,
  ArrowUpRight,
  Trash2,
  Calendar,
  Flame,
  ChevronDown,
  Maximize2,
  Menu,
  ArrowDownLeft,
  PenSquare,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import Link from "next/link"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { delaGothic, montserrat } from "@/app/layout"
import { format, isToday } from 'date-fns'
import AddTaskDialog from "@/app/(pages)/plan/components/add-task-modal"
import { apiClient } from "@/client/client"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { capitalizeFirstLetter } from '@/utils/capitalize-first-letter'
import moment from 'moment-timezone'
import useApi from '@/hooks/use-api'
import { useRouter } from 'next/navigation'

interface ContentCardProps {
  setIsOpen: any
  contentId: string
  setViewContent: any
}

// Define Task interface for proper typing
interface Task {
  _id: string;
  title: string;
  description?: string;
  completed?: boolean;
  date: string;
  priority?: string;
}

// Update or add this interface near your Task interface
interface ContentItem {
  _id: string;
  hook: string;
  // Add other properties that might be in your content items
}

interface ContentFormProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refetch: () => void;
  content: any;
}

const weekDays = [
  { date: "2025-02-17", day: "Mon" },
  { date: "2025-02-18", day: "Tue" },
  { date: "2025-02-19", day: "Wed" },
  { date: "2025-02-20", day: "Thu" },
  { date: "2025-02-21", day: "Fri" },
  { date: "2025-02-22", day: "Sat" },
  { date: "2025-02-23", day: "Sun" },
];

export function HomeDashboard() {
  const today = format(new Date(), 'EEE, MMM d')

  const todayDate = new Date();
  const currentDay = new Date().getDate().toString().padStart(2, '0');
  const [activeDay, setActiveDay] = useState(currentDay);

  // Find Monday (start of week)
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() - todayDate.getDay() + 1); // 1 = Monday

  // Generate week days dynamically
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3),
      date: date.getDate().toString().padStart(2, '0')
    };
  });




  const activeDate = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    Number(activeDay)
  );
  const formattedDate = new Date(
    Date.UTC(todayDate.getFullYear(), todayDate.getMonth(), Number(activeDay))
  ).toISOString();

  const {
    data: task,
    loading,
    error,
    refetch,
  } = useApi(`/api/fetch-task?date=${formattedDate}`);

  const {
    data: content,
    loading: contentLoading,
    error: contentError,
    refetch: contentRefetch,
  } = useApi(`/api/get-content-by-date?date=${formattedDate}`);

  const {
    data: allTasks,
    loading: tasksLoading,
    error: tasksError,
    refetch: tasksRefetch,
  } = useApi("/api/fetch-all-task");

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [loginUser, setLoginUser] = useState<any>(null);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [experiences, setExperiences] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newExperience, setNewExperience] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  // Update from string[] to Task[]
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showInProgress, setShowInProgress] = useState(true);
  const [showTodo, setShowTodo] = useState(true);
  // Update from string[] to Task[]
  const [todoTasks, setTodoTasks] = useState<Task[]>([]);
  const [isEditingTodoTask, setIsEditingTodoTask] = useState(false);
  const [newTodoTaskTitle, setNewTodoTaskTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [taskIdToDelete, setTaskIdToDelete] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [ideaInput, setIdeaInput] = useState('');
  const [isWeeklyScheduleOpen, setIsWeeklyScheduleOpen] = useState(true);

  const router = useRouter();

  const {
    data,
    loading: deleteLoading,
    error: deleteError,
    refetch: deleteRefetch
  } = useApi(
    taskIdToDelete ? "/api/delete-task?timezone=" + moment.tz.guess() : "",
    taskIdToDelete
      ? {
        method: "DELETE",
        body: JSON.stringify({ taskId: taskIdToDelete }),
      }
      : null
  );

  useEffect(() => {
    if (allTasks) {
      setTasks(allTasks);
    }
  }, [allTasks]);

  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));

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

  const onCheckedChange = (taskId: string, checked: boolean) => {
    if (checked) {
      handleDeleteTask(taskId);
    }
  };

  useEffect(() => {
    try {
      const userCookie = localStorage.getItem("user");
      console.log("Cookie raw:", userCookie);

      if (!userCookie) {
        console.log("No user cookie found");
        return;
      }

      // Safely parse the cookie
      let user;
      try {
        user = JSON.parse(userCookie);
        console.log("Parsed user from cookie:", user);
      } catch (error) {
        console.error("Error parsing user cookie:", error);
        return;
      }

      setLoginUser(user);

      // Log the structure of the user object to debug different account structures
      console.log("User structure:", {
        hasId: !!user?._id,
        hasOnboarding: !!user?.onboarding,
        onboardingKeys: user?.onboarding ? Object.keys(user.onboarding) : [],
        fullOnboarding: user?.onboarding
      });

      // Set onboarding data directly from the user cookie
      if (user?.onboarding) {
        console.log("Found onboarding data in cookie:", user.onboarding);
        setOnboardingData(user.onboarding);

        // Pre-populate the ideation input with subContent[0]
        if (user.onboarding.subContent &&
          Array.isArray(user.onboarding.subContent) &&
          user.onboarding.subContent.length > 0) {
          setIdeaInput(user.onboarding.subContent[0]);
        }
      } else {
        console.log("No onboarding data found in cookie");
      }
    } catch (error) {
      console.error("Error in user cookie processing:", error);
    }
  }, []);

  /* ---- This is the old API-based method, kept for reference ---- 
  const fetchOnboardingData = async (userId: string) => {
    try {
      console.log("Fetching onboarding data for user:", userId);
      const response = await apiClient(`/api/user?userId=${userId}`, {
        method: "GET",
      });
      console.log("Full API response:", JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        console.log("User data:", response.data);
        console.log("Onboarding data:", response.data.onboarding);
        setOnboardingData(response.data.onboarding || null);
      } else {
        console.log("No data or unsuccessful response");
      }
    } catch (error) {
      console.error("Error fetching onboarding data:", error);
    }
  };
  */

  // Generate personalized placeholder based on onboarding data
  const getPersonalizedPlaceholder = () => {
    try {
      console.log("Current onboarding data in getPersonalizedPlaceholder:", onboardingData);

      if (!onboardingData) {
        console.log("No onboarding data available, using default placeholder");
        return "I want to launch my candle brand give me ideas for reaching book readers.";
      }

      // Checking against MongoDB schema definition: 
      // onboarding: {
      //   subContent: {
      //     type: [String],
      //     index: true,
      //   },
      // }

      // Debug: Print detailed structure of the onboarding data
      console.log("Onboarding data type:", typeof onboardingData);
      console.log("Onboarding data keys:", Object.keys(onboardingData));
      console.log("subContent property:", onboardingData.subContent);

      if (onboardingData.subContent) {
        console.log("subContent type:", typeof onboardingData.subContent);
        console.log("Is subContent an array:", Array.isArray(onboardingData.subContent));
        if (Array.isArray(onboardingData.subContent)) {
          console.log("subContent length:", onboardingData.subContent.length);
          console.log("subContent[0]:", onboardingData.subContent[0]);
        }
      }

      // According to the MongoDB schema, subContent is defined as an array of strings:
      // subContent: {
      //   type: [String],
      //   index: true,
      // }
      if (onboardingData.subContent &&
        Array.isArray(onboardingData.subContent) &&
        onboardingData.subContent.length > 0) {

        const subContentText = onboardingData.subContent[0];
        console.log("Using subContent from database:", subContentText);
        console.log("Final placeholder will be:", subContentText);
        return subContentText;
      }

      // If there's no valid subContent, use a default placeholder
      console.log("No valid subContent found, using default placeholder");
      return "Tell me what you would like to create content about...";
    } catch (error) {
      console.error("Error generating placeholder:", error);
      return "Tell me what you would like to create content about...";
    }
  };

  // Load goal from localStorage on component mount
  useEffect(() => {
    const savedGoal = localStorage.getItem('userGoal');
    if (savedGoal) {
      setGoal(savedGoal);
    }
  }, []);

  // Save goal to localStorage whenever it changes
  const handleGoalChange = (newGoal: string) => {
    setGoal(newGoal);
    localStorage.setItem('userGoal', newGoal);
  };

  const handleAddExperience = () => {
    if (newExperience.trim()) {
      setExperiences([...experiences, newExperience]);
      setNewExperience('');
      setIsEditing(false);
    }
  };

  const handleAddTask = async () => {
    try {
      if (newTaskTitle.trim()) {
        // Create a new task object instead of just adding a string
        const newTask: Task = {
          _id: Date.now().toString(), // Temporary ID until server assigns one
          title: newTaskTitle,
          date: formattedDate,
          completed: false
        };
        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
        setIsEditingTask(false);
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleAddTodoTask = () => {
    if (newTodoTaskTitle.trim()) {
      // Create a new task object instead of just adding a string
      const newTask: Task = {
        _id: Date.now().toString(), // Temporary ID until server assigns one
        title: newTodoTaskTitle,
        date: new Date(td.getTime() + 86400000).toISOString(), // Tomorrow
        completed: false
      };
      setTodoTasks([...todoTasks, newTask]);
      setNewTodoTaskTitle('');
      setIsEditingTodoTask(false);
    }
  };

  const td = new Date();
  td.setHours(0, 0, 0, 0);
  //  console.log(task)
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

    console.log("Task Date (UTC):", utcTaskDate);
    console.log("Today (UTC):", utcToday);

    return utcTaskDate.getTime() <= utcToday.getTime();
  });

  console.log("Progessing Tasks", inProgressTasks);

  const todoTaskss = typedAllTasks.filter((t) => {
    const taskDate = new Date(t.date);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() > td.getTime(); // Future dates
  });

  // Helper function to safely handle content data
  const getContentItems = (): ContentItem[] => {
    if (content === null || content === undefined) return [];
    if (!Array.isArray(content)) return [];
    return content as ContentItem[];
  };

  // Function to navigate to content on plan page
  const navigateToContent = (contentId: string) => {
    router.push(`/plan?contentId=${contentId}`);
  };

  const handleSendIdea = () => {
    if (ideaInput.trim()) {
      console.log("Sending idea to chat:", ideaInput);

      // First check if we can create a new chat
      if (loginUser?._id) {
        // Create a direct message object that will be sent to the chat interface
        const messageData = {
          userId: loginUser._id,
          message: ideaInput.trim(),
          senderId: "human",
          timestamp: new Date().toISOString(),
          historyId: "", // Empty for new chat
        };

        // Use window.localStorage to temporarily store the prompt
        localStorage.setItem('pendingChatPrompt', ideaInput.trim());

        // Navigate to ideate page
        router.push('/ideate');
      } else {
        // Fallback to simple URL parameter approach
        router.push(`/ideate?initialPrompt=${encodeURIComponent(ideaInput.trim())}`);
      }

      setIdeaInput('');
    }
  };

  return (
    <div className="bg-[#FFFDF8] min-h-screen">
      <div className={`p-4 md:p-9 relative flex gap-6 max-w-[1400px] mx-auto ${montserrat.className}`}>
        {/* Main Content Area */}
        <div className="flex-1">
          {/* Header Section */}
          <div className="mb-8">
            <div className="text-gray-500 mb-2">{today}</div>
            {/* <h1 className={`text-4xl font-bold mb-3 ${delaGothic.className}`}>
              Hi, {loginUser?.name?.split(' ')[0] || 'there'}
            </h1> */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
              <h2 className="text-2xl md:text-4xl font-semibold bg-gradient-to-r from-[#2A1C8F] via-[#8FA0D8] to-[#FF6400] text-transparent bg-clip-text">
                What are we creating today?
              </h2>

              {/* <div className="flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-6">
                <Button
                  onClick={() => router.push('/ideate')}
                  className="inline-block bg-gradient-to-r from-[#2146F6] to-[#F085B9] text-white rounded-full px-4 md:px-6 py-6 md:py-7 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:opacity-95 text-sm md:text-base"
                >
                  <Zap className="h-4 md:h-5 w-4 md:w-5" strokeWidth={2.5} />
                  Ask AI
                </Button>

                <button
                  type="button"
                  onClick={() => router.push('/plan')}
                  className="bg-gradient-to-r from-pink-400 to-blue-600 rounded-full px-0.5 py-0.5 text-center font-medium text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-200"
                >
                  <div className="rounded-full bg-white px-4 md:px-6 py-3 md:py-3.5 text-black text-sm md:text-base flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200">
                    <Plus className="h-4 md:h-5 w-4 md:w-5" strokeWidth={2.5} />
                    Start new content
                  </div>
                </button>
              </div> */}
            </div>
          </div>

          {/* Ideation Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-2">Let&apos;s ideate</h3>
            <div className="w-full bg-white rounded-lg border border-gray-200 p-4 flex items-center">
              <textarea
                placeholder={getPersonalizedPlaceholder()}
                className={`w-full text-gray-800 placeholder-gray-400 focus:outline-none min-h-[100px] resize-none ${ideaInput ? 'bg-gray-50' : ''}`}
                onFocus={() => console.log("Input focused, current placeholder:", getPersonalizedPlaceholder())}
                value={ideaInput}
                onChange={(e) => setIdeaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendIdea();
                  }
                }}
              />
              <Button
                onClick={handleSendIdea}
                className={`ml-2 rounded-full ${ideaInput ? 'bg-blue-600 hover:bg-blue-700 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'} p-2`}
              >
                <ArrowUpRight className="h-5 w-5 text-white" />
              </Button>
            </div>
            {ideaInput && (
              <p className="text-sm text-gray-500 mt-2">Press Enter or click the arrow to start a chat with this content idea</p>
            )}
          </div>

          {/* Tasks Card */}
          <Card className="border-gray-100 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-[#E97451]" />
                My Tasks
              </CardTitle>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1"
                  onClick={() => setIsAddTaskOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Maximize2 className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* In Progress Section */}
                <div className="space-y-4">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setShowInProgress(!showInProgress)}
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${!showInProgress ? "-rotate-90" : ""
                        }`}
                    />
                    <div className="bg-[#D0D6FA] text-xs px-3 py-1 rounded-full text-purple-600 font-medium">
                      IN PROGRESS
                    </div>
                    <div className="text-xs text-gray-500">
                      • {inProgressTasks?.length} tasks
                    </div>
                  </div>

                  {showInProgress && (
                    <>
                      <div className="space-y-2">
                        {/* Header Row */}
                        <div className="grid grid-cols-[40px_1fr_120px_120px] items-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
                          <span className="text-left">✓</span>
                          <span>Name</span>
                          <span className="text-center">Priority</span>
                          <span className="text-center">Due Date</span>
                        </div>

                        {/* Task List */}
                        {inProgressTasks?.map((task: any) => (
                          <div
                            key={task._id}
                            className="grid grid-cols-[40px_1fr_120px_120px] items-center px-4 py-2 border rounded-lg hover:bg-gray-50 group"
                          >
                            {/* Checkbox */}
                            <Checkbox
                              checked={task.completed}
                              className="rounded-full w-4 h-4"
                              onCheckedChange={(checked: boolean) =>
                                onCheckedChange(task._id, checked as boolean)
                              }
                              disabled={tasksLoading}
                            />

                            {/* Task Title */}
                            <span className="text-sm text-gray-900">
                              {task.title}
                            </span>

                            {/* Priority */}
                            <span className="text-center text-sm font-medium">
                              {task.priority}
                            </span>

                            {/* Due Date */}
                            <span className="text-center text-sm text-gray-600">
                              {moment(task.date).tz(moment.tz.guess()).format("MM/DD/YYYY")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* To Do Section */}
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setShowTodo(!showTodo)}
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${!showTodo ? "-rotate-90" : ""
                        }`}
                    />
                    <div className="bg-gray-100 text-xs px-3 py-1 rounded-full text-gray-600 font-medium">
                      TO DO
                    </div>
                    <div className="text-xs text-gray-500">
                      • {todoTaskss?.length} tasks
                    </div>
                  </div>

                  {showTodo && (
                    <>
                      <div className="space-y-2">
                        <div className="grid grid-cols-[40px_1fr_120px_120px] items-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
                          <span className="text-left">✓</span>
                          <span>Name</span>
                          <span className="text-center">Priority</span>
                          <span className="text-center">Due Date</span>
                        </div>

                        {/* Tasks List */}
                        {todoTaskss?.map((task: any) => (
                          <div
                            key={task._id}
                            className="grid grid-cols-[40px_1fr_120px_120px] items-center px-4 py-2 border rounded-lg hover:bg-gray-50 group"
                          >
                            {/* Checkbox */}
                            <Checkbox
                              checked={task.completed}
                              className="rounded-full w-4 h-4"
                              onCheckedChange={(checked: boolean) =>
                                onCheckedChange(task._id, checked as boolean)
                              }
                              disabled={tasksLoading}
                            />

                            {/* Task Title */}
                            <span className="text-sm text-gray-900">
                              {task.title}
                            </span>

                            {/* Priority */}
                            <span className="text-center text-sm font-medium">
                              {task.priority}
                            </span>

                            {/* Due Date */}
                            <span className="text-center text-sm text-gray-600">
                              {moment(task.date).tz(moment.tz.guess()).format("MM/DD/YYYY")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Card - Fixed on the right */}
        <div className="w-[400px] sticky top-4 h-[calc(100vh-2rem)]">
          <Card className="border-gray-100 shadow-sm rounded-2xl bg-[#FCF7E4] h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-[#FFEDD8]">
              <div className="flex w-full">
                <div className="pb-2 border-b-2 border-[#E97451] px-4 text-base font-medium">
                  Weekly Schedule
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="mt-1"
                onClick={() => setIsWeeklyScheduleOpen(!isWeeklyScheduleOpen)}
              >
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${!isWeeklyScheduleOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CardHeader>

            {isWeeklyScheduleOpen && (
              <CardContent className="p-4 h-[calc(100%-4rem)] overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-[#E97451]" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    This week&apos;s content
                  </h3>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-5">
                  {weekDays.map((day) => (
                    <div
                      key={day.date}
                      onClick={() => {
                        setActiveDay(day.date);
                      }}
                      className="text-center cursor-pointer"
                    >
                      <div
                        className={`rounded-lg inline-block px-2 py-1 ${day.date === activeDay
                          ? "bg-[#E97451] text-white"
                          : "hover:bg-gray-50"
                          }`}
                      >
                        <div
                          className={`text-[10px] ${day.date === activeDay ? "text-white" : "text-gray-600"
                            }`}
                        >
                          {day.day}
                        </div>
                        <div className="font-medium text-xs">
                          {day.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {contentLoading ? (
                  <div className="text-gray-500 text-sm mt-1">Loading content...</div>
                ) : contentError ? (
                  <div className="text-red-500 text-sm mt-1">
                    Failed to fetch content
                  </div>
                ) : content !== null && Array.isArray(content) ? (
                  getContentItems().length > 0 ? (
                    <div className="space-y-2">
                      {getContentItems().map((c) => (
                        <div
                          key={c._id}
                          className="bg-[#FAE8D2] rounded-lg p-3 text-sm text-gray-800 cursor-pointer hover:bg-[#F7DDBB] transition-colors duration-200"
                          onClick={() => navigateToContent(c._id)}
                        >
                          {c.hook}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#FAE8D2] rounded-lg p-3 text-sm text-gray-800">
                      <div>No content available</div>
                    </div>
                  )
                ) : (
                  <div className="text-gray-500 text-sm mt-1">
                    No Content for this date
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* My Ideas Card - Commented out
          <Card className="border-gray-100 shadow-sm overflow-hidden rounded-2xl">
            <div className="absolute top-0 left-0 w-8 h-8  rounded-br-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
              <CardTitle className="flex items-center gap-3">
                <div className="text-[#E97451]">
                  <PenSquare className="h-4 md:h-5 w-4 md:w-5" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">My Ideas</h3>
              </CardTitle>
              <Button
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsModalOpen(true)}
              >
                <Maximize2 className="w-4 h-4 text-gray-500" />
              </Button>
            </CardHeader>
            <CardContent>
              <div>
                {experiences.map((experience, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"
                  >
                    <span className="text-sm text-gray-900">{experience}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
                      onClick={() => {
                        const newExperiences = experiences.filter((_, i) => i !== index);
                        setExperiences(newExperiences);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {isEditing ? (
                  <input
                    type="text"
                    value={newExperience}
                    onChange={(e) => setNewExperience(e.target.value)}
                    placeholder="Add new experience"
                    className="w-full px-4 py-2 text-sm text-gray-500 bg-transparent focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddExperience();
                      }
                      if (e.key === 'Escape') {
                        setIsEditing(false);
                        setNewExperience('');
                      }
                    }}
                    autoFocus
                    onBlur={() => {
                      if (!newExperience.trim()) {
                        setIsEditing(false);
                      }
                    }}
                  />
                ) : (
                  <div
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 w-full text-gray-500 hover:text-gray-600 text-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add new experience
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          */}
        </div>

        {/* Content Streak Card - Commented out
        <div className="grid grid-cols-1 md:grid-cols-[369px,933px] gap-4">
          <Card className="border-gray-100 shadow-sm p-6 rounded-2xl h-[184px]">
            <div className="flex items-center gap-2 mb-6">
              <div className="text-orange-400">
                <Flame className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Content Streak</h3>
              <div className="ml-auto flex items-center gap-1 text-gray-500 text-sm">
                Past 7 days
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center justify-center font-montserrat">
                {isEditingGoal ? (
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => handleGoalChange(e.target.value)}
                    onBlur={() => setIsEditingGoal(false)}
                    className="text-3xl font-bold text-center w-full outline-none border-b border-gray-300 focus:border-blue-500 tabular-nums font-montserrat"
                    style={{
                      background: 'transparent',
                      color: '#EB7A52',
                      caretColor: '#EB7A52',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                    autoFocus
                  />
                ) : (
                  <h3
                    className={`text-4xl cursor-pointer tabular-nums font-montserrat ${goal
                      ? "font-bold bg-gradient-to-r from-[#EB7A52] via-[#ED8085] to-[#2146F6] text-transparent bg-clip-text"
                      : "text-gray-500 font-normal"
                      } mb-1`}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                    onClick={() => setIsEditingGoal(true)}
                  >
                    {goal || 'Set Goal'}
                  </h3>
                )}
                <p className="text-gray-600 text-sm font-montserrat">Goal</p>
              </div>

              <div className="flex flex-col items-center justify-center">
                <h3 className="text-4xl font-bold inline-block bg-gradient-to-r from-[#EB7A52] via-[#ED8085] to-[#2146F6] text-transparent bg-clip-text mb-1">
                  0
                </h3>
                <p className="text-gray-600 text-sm">Posted</p>
              </div>

              <div className="flex flex-col items-center justify-center">
                <h3 className="text-4xl font-bold inline-block bg-gradient-to-r from-[#EB7A52] via-[#ED8085] to-[#2146F6] text-transparent bg-clip-text mb-1">
                  0
                </h3>
                <p className="text-gray-600 text-sm">Planned</p>
              </div>
            </div>
          </Card>
        </div>
        */}

        <Dialog open={isEnlarged} onOpenChange={setIsEnlarged}>
          <DialogContent className="max-w-4xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    This week&apos;s content
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-6">
                {weekDays.map((day) => (
                  <div
                    key={day.date}
                    onClick={() => setActiveDay(day.date)}
                    className="text-center cursor-pointer"
                  >
                    <div
                      className={`rounded-lg inline-block px-4 py-2 ${day.date === activeDay
                        ? "bg-[#E97451] text-white"
                        : "hover:bg-gray-50"
                        }`}
                    >
                      <div
                        className={`text-sm ${day.date === activeDay ? "text-white" : "text-gray-600"
                          }`}
                      >
                        {day.day}
                      </div>
                      <div className="font-medium text-base">{day.date}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-rose-50 rounded-lg p-6">
                <p className="text-gray-900">
                  Fix studio location for dance reel
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-[#E97451]">
                  <PenSquare className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold">My Ideas</h2>
              </div>
              {experiences.map((experience, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"
                >
                  <span className="text-sm text-gray-900">{experience}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
                    onClick={() => {
                      const newExperiences = experiences.filter(
                        (_, i) => i !== index
                      );
                      setExperiences(newExperiences);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        <AddTaskDialog
          isOpen={isAddTaskOpen}
          setIsOpen={setIsAddTaskOpen}
          refetch={tasksRefetch}
          content={content}
        />
      </div>
    </div>
  );
}
