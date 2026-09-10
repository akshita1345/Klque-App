"use client"

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { apiClient } from "@/client/client";
import moment from "moment-timezone";

// Define interfaces for our data types
interface Content {
  _id: string;
  postingDate?: string | Date;
  ideaTitle?: string;
  hook?: string;
  contentType?: string;
  contentPillar?: string;
  platform?: string;
  script?: string;
  cta?: string;
  targetAudience?: string;
  focus?: string;
  isCompleted?: boolean;
}

interface Task {
  _id: string;
  date?: string | Date;
  title?: string;
  priority?: string;
  contentId?: string;
}

export default function CalendarPage() {
  const onlyFirstCallRef = useRef(true);

  const router = useRouter();
  const savedView = typeof window !== 'undefined' ? window.localStorage.getItem('calendarView') : null;
  const savedDate = typeof window !== 'undefined' ? window.localStorage.getItem('calendarDate') : null;
  const [view, setView] = useState(savedView || "week");
  const [currentDate, setCurrentDate] = useState(savedDate ? new Date(savedDate) : new Date());
  const [contents, setContents] = useState<Content[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal close handler
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Content click handler - Navigate to plan page with the content ID
  const handleContentClick = (content: Content) => {
    let tab = "content";
    const isHistory = content?.postingDate && moment(content.postingDate).isSameOrBefore(moment().startOf('day'));
    if (content?.isCompleted) tab = "completed"
    else if (isHistory) tab = "history"

    // Store the current view and date in localStorage to restore when coming back
    localStorage.setItem('calendarView', view);
    localStorage.setItem('calendarDate', currentDate.toISOString());

    // Navigate to the plan page with query parameters to open the content detail
    router.push(`/plan?contentId=${content._id}&selectedTab=${tab}`);
  };

  // Task click handler
  const handleTaskClick = (task: Task) => {
    setSelectedItem(task);
    setIsModalOpen(true);
  };

  // Fetch data when calendar date or view changes
  useEffect(() => {
    if (!currentDate || !view) return;
    if (onlyFirstCallRef.current) {
      fetchData();
    }
  }, [currentDate, view, onlyFirstCallRef?.current]);

  // Format dates for API in a standardized way to ensure consistency
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      onlyFirstCallRef.current = false;

      // Determine date range based on view
      let startDate: Date, endDate: Date;

      if (view === "week") {
        // For week view: from Monday to Sunday of the week containing currentDate
        const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust to make Monday the first day

        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // For month view: entire month
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      console.log('Date range:', formatDateForAPI(startDate), 'to', formatDateForAPI(endDate));

      // Fetch contents
      const contentsResponse: any = await apiClient(`/api/get-contents?type=content&timezone=${moment.tz.guess()}&from=calendar`, {
        method: "GET",
      });

      // Fetch tasks for the selected date range
      const tasksPromises = [];
      let currentDateCopy = new Date(startDate);

      // Create an array of dates for the entire range
      const dateRange: Date[] = [];
      while (currentDateCopy <= endDate) {
        dateRange.push(new Date(currentDateCopy));
        currentDateCopy.setDate(currentDateCopy.getDate() + 1);
      }
      const formattedDateRange = dateRange.map(date => formatDateForAPI(date));

      const tasksResponse: any = await apiClient(`/api/fetch-task?date=${formattedDateRange}&timezone=${moment.tz.guess()}`, {
        method: "GET",
      }).then((tasksResponse: any) => {
        return tasksResponse;
      }).catch(error => {
        console.warn(`Error fetching tasks for date range:`, error);
        return []; // Return empty array on error
      })

      // Fetch tasks for each date in the range
      for (const date of dateRange) {
        const formattedDate = formatDateForAPI(date);

        tasksPromises.push(
          tasksResponse[formattedDate] || []
        );
      }

      const tasksResponses = await Promise.all(tasksPromises);
      const allTasks = tasksResponses.flat().filter(task => task) as Task[]; // Remove any null/undefined values

      // Filter contents by posting date
      const filteredContents = Array.isArray(contentsResponse?.data)
        ? contentsResponse?.data?.filter((content: Content) => {
          const postDate = parseDate(content.postingDate);
          if (!postDate) return false;

          const postDateStr = formatDateForAPI(postDate);
          const startDateStr = formatDateForAPI(startDate);
          const endDateStr = formatDateForAPI(endDate);

          // For string comparison of dates in YYYY-MM-DD format
          return postDateStr >= startDateStr && postDateStr <= endDateStr;
        })
        : [];

      const validTasks = allTasks.filter(task => {
        return task.contentId;
      });

      setContents(filteredContents as Content[]);
      setTasks(validTasks);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    }
  };

  // Utility function for safe date parsing
  const parseDate = (dateString: string | Date | undefined): Date | null => {
    if (!dateString) return null;

    try {
      // If already a Date object
      if (dateString instanceof Date) {
        if (isNaN(dateString.getTime())) return null;
        return dateString;
      }

      // If it's a string
      if (typeof dateString === 'string') {
        // Try handling common date formats

        // If it's already in YYYY-MM-DD format or similar
        // if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        //   const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        //   // Month is 0-indexed in JavaScript Date
        //   const date = new Date(year, month - 1, day);
        //   return date;
        // }

        // // If it's in a format with slashes (MM/DD/YYYY or similar)
        // if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateString)) {
        //   const [month, day, year] = dateString.split('/').map(num => parseInt(num, 10));
        //   // Month is 0-indexed in JavaScript Date
        //   const date = new Date(year, month - 1, day);
        //   return date;
        // }
        return moment(dateString).toDate();
      }

      // Try standard parsing
      const date = moment(dateString).toDate();
      // Check if date is valid
      if (isNaN(date.getTime())) return null;
      return date;
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  };

  // Helper to get content items for a specific date
  const getContentForDate = (date: Date) => {
    // Try different approaches to match dates
    const targetDateStr = formatDateForAPI(date);

    return contents.filter(content => {
      if (!content.postingDate) return false;

      // Convert content date to a comparable format
      const postDate = parseDate(content.postingDate);
      if (!postDate) return false;

      // Compare using our formatted string approach
      const postDateStr = formatDateForAPI(postDate);

      return targetDateStr === postDateStr;
    });
  };

  // Helper to get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const targetDateStr = formatDateForAPI(date);

    return tasks.filter(task => {
      if (!task.date) return false;

      // Try to parse the task date
      const taskDate = parseDate(task.date);
      if (!taskDate) return false;

      // Compare formatted dates
      const taskDateStr = formatDateForAPI(taskDate);

      return targetDateStr === taskDateStr;
    });
  };

  // Debug function to help troubleshoot date issues
  const debugDate = (dateStr: string | Date | undefined): string => {
    if (!dateStr) return 'undefined';

    try {
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) return `Invalid: ${dateStr}`;

      return `${formatDateForAPI(parsedDate)} (${parsedDate.toISOString()})`;
    } catch (e) {
      return `Error: ${dateStr}`;
    }
  };

  // Render content item for calendar
  const renderContent = (content: Content) => {
    // Get a short display name based on content type or platform
    const getDisplayType = () => {
      if (content.contentType) {
        // Get first letter or first two letters of content type
        const words = content.contentType.split(' ');
        if (words.length > 1) {
          return `${words[0][0]}${words[1][0]}`.toUpperCase();
        }
        return content.contentType.slice(0, 2).toUpperCase();
      }
      if (content.platform) {
        return content.platform.slice(0, 2).toUpperCase();
      }
      return "CN"; // Default for content
    };

    return (
      <div
        key={content._id}
        className="p-1 mb-1 rounded-md text-xs truncate bg-blue-100 text-blue-800 border border-blue-200 flex items-center cursor-pointer hover:bg-blue-200 transition-colors"
        title={`${content.contentType || "Content"}: ${content.ideaTitle || content.hook || "Untitled"}`}
        onClick={() => handleContentClick(content)}
      >
        <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 text-blue-700 text-[10px] mr-1 flex-shrink-0 font-medium">
          {getDisplayType()}
        </span>
        <span className="truncate">{content.ideaTitle || content.hook || "Content"}</span>
      </div>
    );
  };

  // Render task item for calendar
  const renderTask = (task: Task) => {
    // Different colors based on priority
    const priorityColors: Record<string, string> = {
      high: "bg-red-100 text-red-800 border border-red-200",
      medium: "bg-orange-100 text-orange-800 border border-orange-200",
      low: "bg-green-100 text-green-800 border border-green-200"
    };

    const priorityClass = priorityColors[task.priority?.toLowerCase() || ''] || "bg-gray-100 text-gray-800 border border-gray-200";

    // Priority indicators
    const priorityIndicators: Record<string, string> = {
      high: "!!",
      medium: "!",
      low: "·"
    };

    const priorityIndicator = priorityIndicators[task.priority?.toLowerCase() || ''] || "·";

    return (
      <div
        key={task._id}
        className={`p-1 mb-1 rounded-md text-xs truncate ${priorityClass} flex items-center cursor-pointer hover:opacity-80 transition-colors`}
        title={`${task.priority || 'Normal'} priority: ${task.title || "Task"}`}
        onClick={() => handleTaskClick(task)}
      >
        <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-opacity-50 mr-1 flex-shrink-0 font-bold">
          {priorityIndicator}
        </span>
        <span className="truncate">{task.title || "Task"}</span>
      </div>
    );
  };

  const generateWeekView = () => {
    // Get the first day of the week (Monday) based on currentDate
    const firstDayOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust to make Monday the first day
    firstDayOfWeek.setDate(currentDate.getDate() - diff);

    // Generate array of dates for the week
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(firstDayOfWeek);
      day.setDate(firstDayOfWeek.getDate() + i);
      return day;
    });

    return (
      <div className="flex-grow grid grid-cols-7 bg-[#FFFDF8]">
        {weekDates.map((day, index) => {
          const contentItems = getContentForDate(day);
          const taskItems = getTasksForDate(day);
          const isToday = day.toDateString() === new Date().toDateString();
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

          return (
            <div
              key={index}
              className={`border-l border-gray-200 h-auto`}
              style={{ minHeight: "calc(100vh - 200px)" }}
            >
              <div className={`lg:p-4 p-2 border-b ${isToday ? 'bg-blue-50' : 'bg-[#FFFDF8]'} text-center sticky top-0 z-10 shadow-sm`}>
                <p className="text-sm font-semibold">
                  {day.toLocaleString("default", { weekday: "short" })}
                </p>
                <p className={`text-lg font-bold ${isToday ? 'text-blue-600' : ''}`}>
                  {day.getDate()}
                </p>
              </div>
              <div className={`p-2 overflow-y-auto ${isPast ? 'bg-[#FFFDF8]/90' : ''}`}>
                {contentItems.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-gray-500 mb-1 truncate">CONTENT ({contentItems.length})</p>
                    {contentItems.map(renderContent)}
                  </div>
                )}
                {taskItems.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1 truncate">TASKS ({taskItems.length})</p>
                    {taskItems.map(renderTask)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const generateMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay()); // Start from Sunday

    const days = [];
    const day = new Date(startDate);

    // Add days until we have 6 weeks (42 days)
    while (days.length < 42) {
      days.push(new Date(day));
      day.setDate(day.getDate() + 1);
    }

    // Get day names for header
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="flex-grow flex flex-col bg-[#FFFDF8] h-full" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-[#FFFDF8] border-b">
          {dayNames.map((name, index) => (
            <div key={index} className="p-2 text-center text-sm font-medium text-gray-500">
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-grow grid grid-cols-7 auto-rows-fr">
          {days.map((day, index) => {
            const contentItems = getContentForDate(day);
            const taskItems = getTasksForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

            // Calculate if there are more items than can be shown
            const totalItems = contentItems.length + taskItems.length;
            const maxItemsToShow = 4; // Max items to display before showing a +X more
            const hasMoreItems = totalItems > maxItemsToShow;
            const visibleContentItems = contentItems.slice(0, Math.min(contentItems.length, maxItemsToShow));
            const visibleTaskItems = taskItems.slice(0, Math.max(0, maxItemsToShow - contentItems.length));
            const hiddenItems = totalItems - visibleContentItems.length - visibleTaskItems.length;

            return (
              <div
                key={index}
                className={`border relative flex flex-col ${isToday
                  ? 'ring-2 ring-blue-400 z-10'
                  : isCurrentMonth
                    ? 'bg-[#FFFDF8]'
                    : 'bg-gray-50'
                  } ${isPast && isCurrentMonth ? 'bg-[#FFFDF8]/90' : ''}`}
              >
                {/* Date number */}
                <div className={`px-2 py-1 text-right ${isToday
                  ? 'bg-blue-100 text-blue-800'
                  : isCurrentMonth
                    ? 'text-gray-900'
                    : 'text-gray-400'
                  }`}>
                  <span className={`text-sm ${isToday ? 'font-bold' : 'font-medium'}`}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Content items */}
                <div className="p-1 flex-grow overflow-hidden">
                  <div className="space-y-1">
                    {visibleContentItems.map(renderContent)}
                    {visibleTaskItems.map(renderTask)}

                    {/* Show "more" indicator if needed */}
                    {hasMoreItems && (
                      <button
                        className="w-full text-xs text-center py-1 text-gray-500 hover:bg-gray-100 rounded"
                        onClick={() => {
                          // Set currentDate to this day and switch to day view
                          setCurrentDate(new Date(day));
                          setView('day');
                        }}
                      >
                        +{hiddenItems} more
                      </button>
                    )}
                  </div>
                </div>

                {/* Daily total indicator */}
                {totalItems > 0 && (
                  <div className="absolute top-1 left-1 flex gap-1">
                    {contentItems.length > 0 && (
                      <span className="flex items-center justify-center h-4 w-4 bg-blue-100 text-blue-800 rounded-full text-[9px] font-medium">
                        {contentItems.length}
                      </span>
                    )}
                    {taskItems.length > 0 && (
                      <span className="flex items-center justify-center h-4 w-4 bg-green-100 text-green-800 rounded-full text-[9px] font-medium">
                        {taskItems.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render the details modal
  const renderDetailsModal = () => {
    if (!isModalOpen || !selectedItem) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#FFFDF8] rounded-lg shadow-lg p-4 w-full max-w-md mx-4">
          {/* Modal header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Task Details
            </h3>
            <button
              onClick={closeModal}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Modal content */}
          <div className="space-y-4">
            {(selectedItem as Task).title && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Title</h4>
                <p className="text-base">{(selectedItem as Task).title}</p>
              </div>
            )}
            {(selectedItem as Task).priority && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Priority</h4>
                <p className="text-base capitalize">{(selectedItem as Task).priority}</p>
              </div>
            )}
            {(selectedItem as Task).date && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
                <p className="text-base">
                  {moment((selectedItem as Task).date).tz(moment.tz.guess()).format("MM/DD/YYYY")}
                </p>
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="flex justify-end mt-6">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#FFFDF8]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="min-h-screen bg-[#FFFDF8]">
          {/* Header */}
          <div className="bg-[#5D60FF] text-white p-4">
            <h1 className="md:text-2xl text-base font-bold">Content Calendar</h1>
          </div>

          {/* Calendar Controls */}
          <div className="md:flex block justify-between items-center bg-[#FFFDF8] shadow-md p-4 border-b">
            <div className="flex items-center">
              <button
                className="px-3 py-1 text-gray-600 bg-gray-200 rounded-md mr-4"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (view === "week") newDate.setDate(currentDate.getDate() - 7);
                  else newDate.setMonth(currentDate.getMonth() - 1);
                  setCurrentDate(newDate);
                  onlyFirstCallRef.current = true;
                }}
              >
                ◀
              </button>
              <h2 className="text-lg font-semibold text-gray-800">
                {currentDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                  ...(view === "day" && { day: "numeric" })
                })}
              </h2>
              <button
                className="px-3 py-1 text-gray-600 bg-gray-200 rounded-md ml-4"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (view === "week") newDate.setDate(currentDate.getDate() + 7);
                  else newDate.setMonth(currentDate.getMonth() + 1);
                  setCurrentDate(newDate);
                  onlyFirstCallRef.current = true;
                }}
              >
                ▶
              </button>
            </div>

            <div className="flex gap-2 md:mt-0 mt-3 flex justify-end">
              {["week", "month"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setView(mode);
                    localStorage.setItem("calendarView", mode);
                    onlyFirstCallRef.current = true;
                  }}
                  className={`px-4 py-2 rounded-md md:text-base text-[13px] ${view === mode
                    ? "bg-[#5D60FF] text-white"
                    : "bg-gray-200 text-gray-600"
                    }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-[#FFFDF8] bg-opacity-50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="flex">
            {/* Time Column - Only show for day view */}
            {view === "day" && (
              <div className="w-1/12 bg-[#FFFDF8] text-gray-600 text-sm p-4">
                {Array.from({ length: 14 }).map((_, i) => {
                  const hour = i + 6; // Start from 6 AM
                  return (
                    <div key={i} className="h-16 border-b text-right pr-2">
                      {hour % 12 === 0 ? 12 : hour % 12} {hour < 12 ? "AM" : "PM"}
                    </div>
                  );
                })}
              </div>
            )}

            {/* View Content */}
            {view === "week" && generateWeekView()}
            {view === "month" && generateMonthView()}
          </div>

          {/* Legend */}
          <div className="p-4 bg-[#FFFDF8] border-t flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200 mr-2"></div>
              <span className="text-sm">Content</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-200 mr-2"></div>
              <span className="text-sm">High Priority Task</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200 mr-2"></div>
              <span className="text-sm">Medium Priority Task</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-200 mr-2"></div>
              <span className="text-sm">Low Priority Task</span>
            </div>
          </div>
        </div>
      </div>

      {/* Render modal */}
      {renderDetailsModal()}
    </div>
  );
}  