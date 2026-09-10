import RoundedSpinner from "@/components/common/rounded-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useApi from "@/hooks/use-api";
import { CalendarPlus, X } from "lucide-react";
import moment from "moment-timezone";
import { useState, useEffect } from "react";
import AddTaskDialog from "./add-task-modal";
import { capitalizeFirstLetter } from "@/utils/capitalize-first-letter";

import { RoundCheckbox } from "@/components/ui/round-checkbox";


import ReactMarkdown from "react-markdown";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/client/client";
import Image from "next/image";
import Link from "next/link";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { generateGoogleCalendarUrl, generateOutlookWebUrl } from "@/config";

interface ContentCardProps {
  isOpen?: boolean;
  setIsOpen: any;
  contentId: string;
  setViewContent: any;
  setActionType: any;
  editContent: any;
  setEditContent: any;
  setIsviewContentOpen: any;
  handleUpdateFunction: any;
  isInPopup?: boolean;
}
export function ContentDetails({
  isOpen,
  setIsOpen,
  setIsviewContentOpen,
  contentId,
  setViewContent,
  setActionType,
  editContent,
  setEditContent,
  handleUpdateFunction,
  isInPopup
}: ContentCardProps) {
  const searchParams = useSearchParams();
  const fromCalendar = searchParams.get('contentId') === contentId && localStorage.getItem('calendarView');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'tasks'>('content');
  const {
    data: content,
    loading,
    error,
    refetch,
  }: any = useApi(contentId && `/api/get-content-by-id?contentId=${contentId || ""}&isEdit=${Boolean(editContent?._id)}`);

  const handleCloseContent = () => {
    // If we came from calendar, offer to go back to calendar view
    if (fromCalendar) {
      setIsviewContentOpen(false);
    } else {
      // Regular close behavior
      setIsviewContentOpen(false);
      setViewContent(null);
    }
  };

  const handleDeleteTask = async (taskId: string, checked: boolean) => {
    // console.log(taskId)
    try {
      // Remove task from UI instantly
      // setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));

      // Make API call to delete task
      await apiClient("/api/update-task?timezone=" + moment.tz.guess(), {
        method: "PUT",
        body: JSON.stringify({ taskId, isCompleted: checked }),
      });

      // Refetch updated task list from API
      refetch();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const onCheckedChange = (taskId: string, checked: boolean) => {
    console.log(taskId);
    // if (checked) {
    handleDeleteTask(taskId, checked);
    // }
  };

  const handleSyncProvider = (result: any, provider: 'Google' | 'Outlook') => {
    try {
      // Validate that we have a date
      const taskDate = result?.date || result?.postingDate;
      if (!taskDate) {
        console.error('No date available for calendar event');
        // You might want to show a toast/notification to the user here
        return;
      }

      // Use the exact date/time from result and add 1 hour duration
      const startTime = moment(taskDate).utc();
      const endTime = moment(taskDate).add(1, 'hour').utc(); // 1 hour duration

    const task = {
      id: result?.id || result?._id,
      subject: "New task scheduled",
      summary: result?.title || result?.ideaTitle,
      description: result?.title || result?.ideaTitle,
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      attendees: [],
      location: `${process.env.ENDPOINT_URL}/plan?contentId=${result?.id || result?._id}`,
      action: "create",
      allDay: false,
    };

      // Generate and open calendar URL
    if (provider === 'Google') {
      const googleCalendarUrl = generateGoogleCalendarUrl({
        summary: task.summary,
        description: task.description,
        start: task.start,
        end: task.end,
        location: task.location,
        attendees: task.attendees,
        allDay: task.allDay
      });

      const newWindow = window.open(googleCalendarUrl, '_blank');
      if (!newWindow) {
        console.error('Popup blocked. Please allow popups for this site.');
        // You might want to show a message to the user here
      }
    } else if (provider === 'Outlook') {
        const outlookUrl = generateOutlookWebUrl({
          summary: task.summary,
          description: task.description,
          start: task.start,
          end: task.end,
          location: task.location,
          attendees: task.attendees,
          allDay: task.allDay
        });

        const newWindow = window.open(outlookUrl, '_blank');
        if (!newWindow) {
          console.error('Popup blocked. Please allow popups for this site.');
          // You might want to show a message to the user here
        }
      }
    } catch (error) {
      console.error('Error syncing to calendar:', error);
    // You might want to show an error message to the user here
    }
  };

  useEffect(() => {
    if (!isOpen) {
      refetch();
    }
  }, [isOpen]);

  return (
    <div className="relative w-full bg-[#FFFDF8] rounded-[20px] md:px-[30px] md:py-[25.5px] px-[15px] py-[20px] flex flex-col max-h-[calc(100vh-155px)]">

      {
        loading && <div className="flex justify-center absolute top-1/2 left-1/2">
          <RoundedSpinner />
        </div>
      }
      <div className="flex-none">
        <div className="flex justify-between">

          {!isInPopup && <Button
            variant="ghost"
            className="p-2 w-[24px] h-[24px] hover:bg-transparent"
            onClick={handleCloseContent}
          >
            <X className="!size-[24px] text-black cursor-pointer object-cover" />
          </Button>}
          <div className="absolute lg:right-[20px] top-[20px] right-[20px] z-10">
            {(!isInPopup && !content?.isSelfCreated) && <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Link href={`/ideate?chat=${content?.historyId}&scriptId=help me edit this script: ${content?.scriptId}`}>
                    <button
                      type="button"
                      className="bg-gradient-to-r from-[#4C00FF] to-[#FF00A1] !rounded-[12px] px-0.5 py-0.5 text-center font-medium text-white shadow-[3px_12px_20px_rgba(255,0,150,0.2)] hover:shadow-[3px_12px_20px_rgba(255,0,150,0.2)]  transition-all duration-200"
                    >
                      <div className=" !rounded-[10px] bg-white px-[10px] sm:px-[12px] py-2 sm:py-[10px] text-black text-xs sm:text-[16px] flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200">
                        <Image
                          src="/images/pages/ideate_black.svg"
                          alt="Logo"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      </div>
                    </button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Ideate with Ina</TooltipContent>
              </Tooltip>
            </TooltipProvider>}



            {/* <Link href={`/ideate?chat=${content?.historyId}`}>
              <button
                type="button"
                className="bg-gradient-to-r from-[#4C00FF] to-[#FF00A1] !rounded-[12px] px-0.5 py-0.5 text-center font-medium text-white shadow-[3px_12px_20px_rgba(255,0,150,0.2)] hover:shadow-[3px_12px_20px_rgba(255,0,150,0.2)]  transition-all duration-200"
              >
                <div className=" !rounded-[10px] bg-white px-[10px] sm:px-[12px] py-2 sm:py-[10px] text-black text-xs sm:text-[16px] flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200">
                  <Image
                    src="/images/pages/ideate_black.svg"
                    alt="Logo"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  <span className="whitespace-nowrap">Ideate with Ina</span>
                </div>
              </button>
            </Link> */}
          </div>



        </div>

        <div className="flex flex-col md:flex-row items-start sm:items-center border-b-[1px] pb-[10px] border-b-[#E5E8F6] pt-[30.5px] w-full gap-2">
          <div className="flex flex-col 2xl:w-[70%] xl:w-[60%] lg:w-[60%] w-full">
            <p className="text-[18px] font-[600] break-words">{content?.ideaTitle}</p>
          </div>
          <div className="flex items-center gap-2 2xl:w-[40%] xl:w-[40%] lg:w-[40%] w-full justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className="cursor-pointer flex items-center justify-between text-[14px] text-[#5D60FF] space-x-[4px] border border-[#5D60FF] rounded-[8px] px-[7px] py-[3px] font-[500]"
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <CalendarPlus className="!size-[20px]" />
                      </TooltipTrigger>
                      <TooltipContent>Add to calendar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-36 p-1 rounded-[8px] border-[#E5E8F6] bg-white shadow-lg"
              >
                <DropdownMenuItem
                  className="text-[12px] px-2 py-1.5"
                  onClick={() => handleSyncProvider(content, 'Google')}
                >
                  Google Calendar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[12px] px-2 py-1.5"
                  onClick={() => handleSyncProvider(content, 'Outlook')}
                >
                  Outlook Calendar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
              setActionType("Edit");
              setEditContent(content);
            }} className="cursor-pointer flex items-center justify-between text-[14px] text-[#5D60FF] space-x-[4px] border border-[#5D60FF] rounded-[8px] px-[7px] py-[3px] font-[500]">
              <Image
                src="/images/pages/edit-icon.svg"
                alt="KLQUE Logo"
                width={13}
                height={14}
                className="mr-[4px]" />
              Edit
            </div>
            {/* <div onClick={() =>
              router.push(`/ideate?chat=${content?.historyId}`, {
                scroll: true,
              })
            } className="cursor-pointer flex items-center justify-between text-[14px] text-[#5D60FF] space-x-[4px] border border-[#5D60FF] rounded-[8px] px-[7px] py-[3px] font-[500]">
              <Image
                src="/images/pages/share-icon.svg"
                alt="KLQUE Logo"
                width={14}
                height={16}
                className="mr-[4px]"
              />
              Share
            </div> */}
          </div>
        </div>
        {/* Tabs */}
        <div className="flex mt-[20px] gap-6">
          {/* All About It */}
          <div
            onClick={() => setActiveTab('content')}
            className="flex flex-col items-center cursor-pointer"
          >
            <span
              className="text-black  text-[14px] font-medium px-[10px]"
            >
              All About It
            </span>
            {activeTab === 'content' && (
              <span className="mt-[10px] h-[6px] w-full bg-[#5D60FF] rounded-full"></span>
            )}
          </div>

          {/* To-Do's */}
          <div
            onClick={() => setActiveTab('tasks')}
            className="flex flex-col items-center cursor-pointer"
          >
            <span
              className="text-black  text-[14px] font-medium px-[10px]"
            >
              To-Do&apos;s
            </span>
            {activeTab === 'tasks' && (
              <span className="mt-[10px] h-[6px] w-full bg-[#5D60FF] rounded-full"></span>
            )}
          </div>
        </div>

      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'content' && (
          <>
            <div>
              <p className="text-[12px] text-[#888DA7] my-[10px] font-medium">A complete overview of everything you&apos;ve planned.</p>
              <div className="flex flex-wrap items-center gap-[20px] overflow-auto">
                <div className="flex flex-col">
                  <div className="xl:text-[14px] text-[12px] text-black !font-[500] mb-[10px]">Content Pillar</div>
                  <Badge
                    variant="secondary"
                    className="py-[5.5px] px-[12px] text-[10px] text-white bg-[#5D60FF] hover:bg-[#5D60FF] text-center justify-center !rounded-[6px] !font-[400]"
                  >
                    <p>{content?.contentPillar?.toUpperCase()}</p>
                  </Badge>
                </div>

                <div className="flex flex-col">
                  <div className="xl:text-[14px] text-[12px] text-black !font-[500] mb-[10px]">Content type</div>
                  <Badge
                    variant="secondary"
                    className="py-[5.5px] px-[12px] text-[10px] text-white bg-[#5D60FF] hover:bg-[#5D60FF] text-center justify-center !rounded-[6px] !font-[400]"
                  >
                    <p>{content?.contentType?.toUpperCase()}</p>
                  </Badge>
                </div>

                <div className="flex flex-col">
                  <div className="xl:text-[14px] text-[12px] text-black !font-[500] mb-[10px]">Platform</div>
                  <Badge
                    variant="secondary"
                    className="py-[5.5px] px-[12px] text-[10px] text-white bg-[#5D60FF] hover:bg-[#5D60FF] text-center justify-center !rounded-[6px] !font-[400]"
                  >
                    <p>{content?.platform?.toUpperCase()}</p>
                  </Badge>
                </div>

              </div>
            </div>
            <div className="mt-[10px]">
              <div className="text-[14px] text-[#888DA7] font-[500]">Hook</div>
              <div className="xl:text-[14px] text-[12px] text-black font-[500] mt-[9px]">{content?.hook}</div>
            </div>

            <div className="space-y-1 mt-[13px]">
              <div className="text-[14px] text-[#888DA7] font-[500]">Script</div>
              <div className="xl:text-[14px] text-[12px] text-black font-[500] mt-[6px]">
                <ReactMarkdown
                  className="prose prose-sm"
                  components={{
                    ol: ({ node, ...props }) => (
                      <ol
                        style={{ listStyleType: "decimal", paddingLeft: "1.5em" }}
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        style={{ listStyleType: "disc", paddingLeft: "1.5em" }}
                        {...props}
                      />
                    ),
                    a: ({ node, ...props }) => (
                      <a
                        style={{ textDecoration: "underline" }}
                        target="_blank"
                        {...props}
                      />
                    ),
                    pre: ({ node, ...props }) => (
                      <pre
                        style={{
                          backgroundColor: "#f0f0f0",
                          padding: "1em",
                          borderRadius: "4px",
                          overflowX: "auto",
                        }}
                        {...props}
                      />
                    ),
                  }}
                >
                  {content?.script}
                </ReactMarkdown>
              </div>
            </div>

            <div className="space-y-1 mt-[13px]">
              <div className="text-[14px] text-[#888DA7] font-[500]">CTA</div>
              <div className="xl:text-[14px] text-[12px] text-black font-[500] mt-[6px]">{content?.cta || content?.CTA}</div>
            </div>

            <div className="space-y-1 mt-[13px]">
              <div className="text-[14px] text-[#888DA7] font-[500]">Target Audience</div>
              <div className="xl:text-[14px] text-[12px] text-black font-[500] mt-[6px]">{content?.targetAudience}</div>
            </div>

            <div className="space-y-1 mt-[13px]">
              <div className="text-[14px] text-[#888DA7] font-[500]">Focus</div>
              <div className="xl:text-[14px] text-[12px] text-black font-[500] mt-[6px]">{content?.focus}</div>
            </div>

            <div className="space-y-1 mt-[13px]">
              <div className="text-[14px] text-[#888DA7] font-[500]">Captions</div>
              {content?.captions?.length > 0 && (
                <div className="xl:text-[14px] text-[12px] text-black font-[500] mt-[6px]">
                  <ul >
                    {content?.captions?.map((caption: any, index: number) => (
                      <li key={index}>{caption}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-1 mt-[13px]">
              <div className="text-[14px] text-[#888DA7] font-[500]">HashTags</div>
              {content?.hashtags?.length > 0 && (
                <div className="xl:text-[14px] text-[12px] text-black font-[500] mt-[6px]">
                  <ul >
                    {content?.hashtags?.map((hashtag: any, index: number) => (
                      <li key={index}>{hashtag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-1 mt-[13px]">
              <div className="text-[14px] text-[#888DA7] font-[500]">Posting</div>
              <div className="xl:text-[14px] text-[12px] text-black font-[500] mt-[6px]">
                {moment(content?.postingDate).tz(moment.tz.guess()).format(`MM-DD-YYYY hh:mm A`)}
              </div>
            </div>
            {!content?.isCompleted && <Button className="w-full bg-[#5D60FF] hover:bg-[#5D60FF] flex items-center rounded-[5px] font-[700] !text-[13px] space-x-[10px] py-[10px] mt-[15px]"
              onClick={() => handleUpdateFunction(content?._id, true)}
            >
              <Image
                src="/images/pages/mark-complete-icon.svg"
                alt="KLQUE Logo"
                width={16}
                height={16}
              />
              Mark as Complete
            </Button>}
          </>
        )}

        {activeTab === 'tasks' && (
          <div>
            {/* <p className="text-[12px] text-[#888DA7] my-[10px] font-medium">
              Streamline your content creation with a personalized, actionable checklist.
            </p> */}

            {content?.tasks?.length > 0 && (
              <div className="">
                <div className="grid grid-cols-12 gap-2 pt-[12px]">
                  <div className="col-span-11 grid 2xl:grid-cols-8 xl:grid-cols-7 grid-cols-10 gap-2 border-b border-b-[#E5E8F6] py-2">
                    <div className="!text-[14px] text-[#838383] font-medium 2xl:col-span-4 xl:col-span-3 col-span-4">Tasks</div>
                    <div className="!text-[14px] text-[#838383] font-medium xl:col-span-1 lg:col-span-2 col-span-2 flex items-center justify-center">
                      {/* <Button
                        variant="outline"
                        size="sm"
                        // disabled={taskCompleted}
                        className="flex items-center justify-center text-[12px] h-8 px-2 rounded-[6px] border-[#5D60FF] bg-white text-[#5D60FF] hover:bg-accent/10">
                      </Button> */}
                        <CalendarPlus className="!size-[20px]" />
                    </div>
                    <div className="!text-[14px] text-[#838383] font-medium xl:col-span-1 lg:col-span-2 col-span-2">Priority</div>
                    <div className="!text-[14px] text-[#838383] font-medium lg:col-span-2 col-span-2">Due Date</div>
                  </div>
                  <div className="col-span-1"></div>
                </div>
                <div className="py-[10px]">
                  {(content?.tasks || [])
                    // .filter((task: any) => !task.isDeleted) // ✅ Filter out deleted tasks
                    .map((task: any, index: number) => {
                      const taskCompleted = task?.isCompleted || task?.isDeleted;
                      return (
                        <div key={task?._id} className="relative w-full py-[12px] " >
                          <div className={taskCompleted ? "absolute top-[50%] left-0 translate-y-[50%] 2xl:w-[calc(100%-90px)] md:w-[calc(100%-50px)] h-px bg-[#AEAEAE]" : ""} />

                          <div key={index} className="grid grid-cols-12 gap-2">
                            <div className="col-span-11 grid 2xl:grid-cols-8 xl:grid-cols-7 grid-cols-10 gap-2 ">
                              <div className="2xl:col-span-4 xl:col-span-3  col-span-4 flex items-center ">
                                <div className="flex items-center ">
                                  <p className={`text-[12px] font-medium ${taskCompleted ? "text-[#AEAEAE]" : ""}`}
                                  // className={`truncate overflow-hidden whitespace-nowrap w-full lg:min-w-0 max-w-[400px] max-w-[200px] break-all text-[12px]`}
                                  >{index + 1}.{" "}{task?.title}
                                  </p>
                                </div>
                              </div>

                              <div className="xl:col-span-1 lg:col-span-2 col-span-2 flex items-center justify-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={taskCompleted}
                                      className={`flex items-center justify-center text-[12px] h-8 px-2 rounded-[6px] border-[#5D60FF] ${taskCompleted
                                        ? "bg-[#EEEEEE] text-[#AEAEAE] hover:bg-[#EEEEEE] cursor-not-allowed"
                                        : "bg-white text-[#5D60FF] hover:bg-accent/10"
                                        }`}
                                    >
                                      <CalendarPlus className="!size-[20px]" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-36 p-1 rounded-[8px] border-[#E5E8F6] bg-white shadow-lg"
                                  >
                                    <DropdownMenuItem
                                      className="text-[12px] px-2 py-1.5"
                                      onClick={() => handleSyncProvider(task, 'Google')}
                                    >
                                      Google Calendar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-[12px] px-2 py-1.5"
                                      onClick={() => handleSyncProvider(task, 'Outlook')}
                                    >
                                      Outlook Calendar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <Badge
                                variant="secondary"
                                className={`xl:col-span-1 lg:col-span-2 col-span-2 cursor-pointer p-[5px] text-[12px] rounded-[2px] justify-center

                                  ${taskCompleted
                                    ? "bg-[#EEEEEE] !text-[#AEAEAE] hover:bg-[#EEEEEE] "
                                    : task?.priority === "high"
                                      ? "bg-red-50 text-red-600 hover:bg-red-50"
                                      : task?.priority === "medium"
                                        ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-50"
                                        : task?.priority === "low"
                                          ? "bg-[#E4FFD7] text-[#319F43] hover:bg-[#E4FFD7]"
                                          : ""
                                  }
                      `}
                              >
                                {capitalizeFirstLetter(task?.priority)}
                              </Badge>

                              <div className="lg:col-span-2 col-span-2 flex items-center justify-between">

                                <div className={`text-[12px] font-[500] ${taskCompleted ? "text-[#AEAEAE]" : ""
                                  }`}>
                                  {moment(task?.date).tz(moment.tz.guess()).format("MM-DD-YYYY HH:mm A")}
                                </div>


                                {/* <RoundCheckbox
                                  id={`task-${index}`}
                                  className="rounded-full w-4 h-4 shrink-0"
                                  checked={task?.completed || taskCompleted}
                                  onCheckedChange={(checked) =>
                                    onCheckedChange(task._id, checked === true)
                                  }
                                  disabled={loading || taskCompleted}
                                /> */}
                              </div>

                            </div>
                            <div className="col-span-1 flex items-center justify-center">
                              <TooltipProvider delayDuration={500}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <RoundCheckbox
                                      checked={task?.completed || taskCompleted}
                                      onCheckedChange={(checked: boolean) => onCheckedChange(task?._id, checked)}
                                      disabled={loading}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent side="left">Mark task as {(task?.completed || taskCompleted) ? "incomplete" : "completed"}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            <Button
              onClick={() => setIsAddTaskOpen(true)}
              variant="ghost"
              className="gap-0 h-full bg-[#E5E8F6] w-full  !px-[10px] !py-[13px] rounded-[5px] justify-start text-black md:text-[12px]"
            >
              <Image
                src="/images/pages/plus-icon.svg"
                alt="KLQUE Logo"
                width={14}
                height={14}
                priority
                className="mr-[20px]" />
              Add Task
            </Button>
          </div>
        )}
      </div>



      <AddTaskDialog
        isOpen={isAddTaskOpen}
        setIsOpen={setIsAddTaskOpen}
        refetch={refetch}
        content={content}
      />

    </div>
  );
}
