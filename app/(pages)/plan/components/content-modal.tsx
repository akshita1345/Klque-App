"use client"

import { Montserrat, Plus_Jakarta_Sans } from "next/font/google"
import { Button, LoadingButton } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { useToast } from "@/components/ui/use-toast"
import { inputValidationErrorMessage } from "@/utils/error-message"
import { apiClient } from "@/client/client"
import { CONTENT } from "@/constant/toast-message"
import { ensureValidDate } from "@/components/common/common"
import useApi from "@/hooks/use-api"
import { Badge } from "@/components/ui/badge"
import { capitalizeFirstLetter } from "@/utils/capitalize-first-letter"
import moment from "moment-timezone"
import { RoundCheckbox } from "@/components/ui/round-checkbox"
import AddTaskDialog from "./add-task-modal"
import Image from "next/image"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import Link from "next/link"
import { DateTimePicker } from "@/components/ui/date-time-picker"


const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] })

// 📌 Input Types
type Inputs = {
  hook: string
  script: string
  cta: string
  ideaTitle: string
  targetAudience: string
  focus: string
  postingDate: Date | null
  contentPillar: string
  contentType: string
  platform: string
  captions: string
  hashtags: string[]
}

interface ContentFormProps {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  setEditContent: React.Dispatch<React.SetStateAction<any>>
  actionType: string
  editContent: any
  refetch: Function
}

export default function ContentDialog({
  isOpen,
  setIsOpen,
  setEditContent,
  actionType,
  editContent,
  refetch,
}: ContentFormProps) {
  const { toast } = useToast()
  const loginUser = useMemo(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem("user") || "null")
    }
    return null
  }, [])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)

  const platforms = useMemo(() => ["instagram", "facebook", "twitter", "linkedin", "youtube", "tiktok", "other"], []);

  // Fetch content + tasks
  const {
    data: content,
    loading,
    refetch: contentRefetch,
  }: any = useApi(editContent?._id && `/api/get-content-by-id?contentId=${editContent?._id || ""}`)

  // Form hook
  const {
    handleSubmit,
    register,
    control, // Still needed for DatePicker and Select
    formState: { errors },
    setValue,
    reset,
  } = useForm<Inputs>({
    defaultValues: {
      ideaTitle: "",
      contentPillar: "",
      contentType: "",
      hook: "",
      script: "",
      cta: "",
      targetAudience: "",
      focus: "",
      platform: "instagram",
      captions: "",
      hashtags: [],
      postingDate: null
    }
  })

  // Pre-fill form when editing
  useEffect(() => {
    if (editContent && isOpen) {
      const {
        hook,
        script,
        CTA,
        cta,
        targetAudience,
        focus,
        ideaTitle,
        postingDate,
        contentPillar,
        contentType,
        platform,
        captions,
        hashtags,
      } = editContent

      setValue("hook", hook)
      setValue("script", script)
      setValue("cta", CTA || cta)
      setValue("targetAudience", targetAudience)
      setValue("focus", focus)
      setValue("ideaTitle", ideaTitle)
      setValue("postingDate", postingDate ? ensureValidDate(new Date(postingDate)) : null)
      setValue("contentPillar", contentPillar)
      setValue("contentType", contentType)
      setValue("platform", platforms?.find((p) => p?.toLowerCase() === platform) || "other")
      setValue("captions", captions?.[0])
      setValue("hashtags", hashtags)
    }
  }, [editContent, isOpen, setValue])

  // Handle create/update
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      setIsLoading(true)
      const input = {
        ...(editContent && { contentId: editContent._id }),
        ...data,
        postingDate: data.postingDate ? moment(data.postingDate).utc().toISOString() : null,
        userId: loginUser?._id
      }

      await apiClient(editContent ? "/api/update-content" : `/api/create-content?timezone=${moment.tz.guess()}`, {
        method: editContent ? "PUT" : "POST",
        body: JSON.stringify(input),
      })

      toast({ description: editContent ? CONTENT.UPDATED : CONTENT.CREATED })
      refetch()
      toggle()
    } catch (err: any) {
      toast({
        description: err?.message || (editContent ? CONTENT.UPDATED_ERROR : CONTENT.CREATE_ERROR),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggle = () => {
    setIsOpen(!isOpen)
    reset()
    setEditContent(null)
  }

  // ✅ Delete task (UI + API)
  const handleDeleteTask = async (taskId: string, checked: boolean) => {
    try {
      await apiClient(`/api/update-task?timezone=${moment.tz.guess()}`, {
        method: "PUT",
        body: JSON.stringify({ taskId, isCompleted: checked }),
      });
      contentRefetch()
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={toggle}>
      <DialogContent className="xl:max-w-[1260px] px-0 py-0  lg:max-w-[1000px] md:max-w-[700px] sm:max-w-[200px]  w-full !bg-transparent  !gap-[10px] !border-none sm:rounded-[0]">
        <div className="lg:flex block bg-[#FFFDF8] rounded-b-[20px] rounded-br-[20px]">

          {/* 📝 FORM */}
          <div className="lg:w-[60%] w-full !px-[20px] md:!pt-[35px] !md:pb-[69px] py-4">
            <DialogHeader className="border-b border-[#E5E8F6] pb-[10px] mr-[20px]">
              <DialogTitle className={`flex items-center justify-between
                ${montserrat.className}`}>
                Detail this out!
                {(actionType !== "Add" && !editContent?.isSelfCreated) && <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Link href={`/ideate?chat=${content?.historyId}&scriptId=${content?.scriptId}`}>
                        <button
                          type="button"
                          className="bg-gradient-to-r from-[#4C00FF] to-[#FF00A1] !rounded-[10px] px-0.5 py-0.5 text-center font-medium text-white shadow-[3px_12px_20px_rgba(255,0,150,0.2)] hover:shadow-[3px_12px_20px_rgba(255,0,150,0.2)]  transition-all duration-200"
                        >
                          <div className=" !rounded-[9px] bg-white px-[10px] sm:px-[8px] py-2 sm:py-[8px] text-black text-xs sm:text-[16px] flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200">
                            <Image
                              src="/images/pages/ideate_black.svg"
                              alt="Logo"
                              width={18}
                              height={18}
                              className="object-contain"
                            />
                          </div>
                        </button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-medium">Ideate with Ina</TooltipContent>
                  </Tooltip>
                </TooltipProvider>}
              </DialogTitle>
            </DialogHeader>
            <form className={`md:!pl-[20px] md:!pr-[40px] mt-[12px] border-r border-r-[#E5E8F6] ${plusJakartaSans.className}`} onSubmit={handleSubmit(onSubmit)}>
              <div className="md:grid grid-cols-1 gap-[20px]">
                {/* Title */}
                <FormInput
                  register={register}
                  name="ideaTitle"
                  label="Content Title"
                  placeholder="Title"
                  error={errors.ideaTitle}
                  rules={{ required: "Content title is required" }}
                  className="!p-[0px] !mt-0" />
              </div>


              {/* Pillar + Type */}
              <div className="md:grid grid-cols-2 gap-[20px] !mt-[20px]">
                <FormInput
                  register={register}
                  name="contentPillar"
                  label="Content Pillar"
                  placeholder="Catchy, intriguing, bold maybe..."
                  error={errors.contentPillar}
                  rules={{ required: "Content pillar is required" }}
                />
                <FormInput
                  register={register}
                  name="contentType"
                  label="Content Type"
                  placeholder="Reel, Blog, Post..."
                  error={errors.contentType}
                  rules={{ required: "Content type is required" }}
                />
              </div>
              <div className="md:grid grid-cols-2 gap-[20px]">
                <div className="!mt-[15px]">
                  {/* Hook + Script + CTA + Target + Focus + Date + Platform */}
                  <FormTextarea
                    register={register}
                    name="hook"
                    label="Hook"
                    placeholder="Your Catchy Hook"
                    className={errors.hook ? "pb-3 h-auto" : "h-auto"}
                    error={errors.hook}
                    rules={{ required: "Hook is required", minLength: { value: 5, message: "Hook must be at least 5 characters" } }}
                  />
                  <FormTextarea
                    register={register}
                    name="script"
                    label="Script"
                    placeholder="Tell Your Story"
                    error={errors.script}
                    className={errors.script ? "pb-3 h-auto" : "h-auto"}
                    rules={{ required: "Script is required" }}
                  />
                  <FormTextarea
                    register={register}
                    name="cta"
                    label="CTA"
                    placeholder="Call to Action"
                    className={errors.cta ? "pb-3 h-auto" : "h-auto"}
                    error={errors.cta}
                    rules={{ required: "CTA is required" }}
                  />

                </div>
                <div className="!mt-[15px]">
                  <FormInput
                    register={register}
                    name="targetAudience"
                    label="Target Audience"
                    placeholder="Keep it engaging"
                    error={errors.targetAudience}
                    rules={{ required: "Target audience is required" }}
                    className="!mt-[10px] !min-h-[0]"
                  />
                  <div className="!mt-[10px]">
                    <FormInput
                      register={register}
                      name="focus"
                      label="Focus"
                      placeholder="Main focus here..."
                      error={errors.focus}
                      rules={{ required: "Focus is required" }}
                    />
                  </div>

                  <div className="!mt-[10px]">
                    {/* Date Picker */}
                    <Label className="text-[14px] mb-[6px] !text-[#838383] font-[500]">Posting</Label>
                    <Controller
                      name="postingDate"
                      control={control}
                      render={({ field }) => (
                        <DateTimePicker
                          value={field.value || null}
                          onChange={field.onChange}
                          showTime={true}
                          useDialog={true}
                          triggerClassName="!text-xs !rounded-[10px] !h-[31px] !p-[8px]"
                          triggerStyle={{ fontSize: "12px" }}
                          icon={
                            <Image
                              src="/images/pages/calender-grey.svg"
                              alt="Calendar"
                              width={13}
                              height={14}
                              priority
                              className="mr-2"
                            />
                          }
                        />
                      )}
                    />
                  </div>
                  <div className="!mt-[10px]">
                    <Label className="text-[14px] mb-[6px] !text-[#838383] font-[500]">Platform</Label>

                    {/* Platform */}
                    <Controller
                      name="platform"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value?.toLowerCase()} onValueChange={field.onChange}>

                          <SelectTrigger className="!p-[8px] !rounded-[5px] !h-[31px] !text-[12px]"><SelectValue placeholder="Instagram" /></SelectTrigger>
                          <SelectContent>
                            {platforms.map(p => (
                              <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="!mt-[10px]">
                    <FormInput
                      register={register}
                      name="captions"
                      label="Caption"
                      placeholder="Add a caption"
                      error={errors.captions}
                    // rules={{ required: "Caption is required" }}
                    />
                  </div>

                  <div className="!mt-[10px]">
                    <FormInput
                      register={register}
                      name="hashtags"
                      label="Hashtags"
                      placeholder="Add a hashtag"
                      error={errors.hashtags}
                    // rules={{ required: "Hashtags are required" }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-[20px]">
                {/* Submit */}
                {isLoading ? (
                  <LoadingButton className="w-full !bg-[#5D60FF]" size="lg" />
                ) : (
                  <Button type="submit" className="w-full !bg-[#5D60FF]" size="lg">
                    {actionType} Content
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* ✅ TASKS SECTION */}
          <div className="lg:w-[40%]  w-full lg:pl-[8px] !pt-[35px] !pb-[69px] lg:!pr-[20px] px-[20px]">

            <DialogHeader className="mb-[12px] border-b border-[#E5E8F6] w-full">
              <DialogTitle className={`flex flex-col justify-center !h-[49.81px] md:text-[18px] text-base font-[600] leading-[17px] ${montserrat.className}`}>
                To-Do´s
              </DialogTitle>
            </DialogHeader>
            <TasksSection
              tasks={content?.tasks || []}
              loading={loading}
              onDeleteTask={handleDeleteTask}
              onRefetch={contentRefetch}
              onOpenTaskModal={() => setIsAddTaskOpen(true)}
            />
          </div>
        </div>

        {/* Add Task Modal */}
        <AddTaskDialog isOpen={isAddTaskOpen} setIsOpen={setIsAddTaskOpen} refetch={contentRefetch} content={content} />
      </DialogContent>
    </Dialog>
  )
}

/* ------------------- 🔹 REUSABLE COMPONENTS ------------------- */

export const FormInput = ({
  register,
  name,
  label,
  placeholder,
  error,
  rules = {},
  type = "text",
  className = ""
}: {
  register: any;
  name: string;
  label: string;
  placeholder?: string;
  error?: any;
  rules?: any;
  type?: string;
  className?: string;
}) => (
  <div className={`!rounded-[10px] space-y-[5px] ${className}`}>

    <Label className="text-[14px] !text-[#838383] font-[500]">{label}</Label>
    <Input
      className="font-[500] h-[31px] rounded-[10px] !text-[12px] !px-[8px] !py-0"
      placeholder={placeholder}
      type={type}
      {...register(name, rules)}
    />
    {error && inputValidationErrorMessage(error.message || "")}
  </div>
)

export const FormTextarea = ({
  register,
  name,
  label,
  placeholder,
  error,
  rules = {},
  className = ""
}: {
  register: any;
  name: string;
  label: string;
  placeholder?: string;
  error?: any;
  rules?: any;
  className?: string;
}) => (
  <div className={`mt-[10px] !rounded-[10px] space-y-[5px] ${className}`}>
    <Label className="text-[14px] mb-[6px] !text-[#838383] font-[500]">{label}</Label>
    <Textarea
      className="font-[500] h-[calc(100%-25px)] rounded-[10px] !text-[12px] !px-[8px] !py-0 "
      placeholder={placeholder}
      {...register(name, rules)}
    />
    {error && inputValidationErrorMessage(error.message || "")}
  </div>
)


const TasksSection = ({ tasks, loading, onDeleteTask, onRefetch, onOpenTaskModal }: any) => (
  <div className={`${montserrat.className}`}>
    {/* <p className="text-[12px] text-[#888DA7] my-[10px] font-medium">
      Streamline your content creation with a personalized, actionable checklist.
    </p> */}
    {/* {tasks.filter((t: any) => !t?.isDeleted)?.length > 0 && ( */}
    {tasks?.length > 0 && (
      <div>
        {/* Header */}
        <div className="grid xl:grid-cols-12 grid-cols-4 gap-2">
          <div className="col-span-11 grid 2xl:grid-cols-6 xl:grid-cols-5 md:grid-cols-8 grid-cols-3 gap-2  border-b border-b-[#E5E8F6]">
            <div className="!text-[13px] text-[#838383] font-medium 2xl:col-span-4 xl:col-span-3 md:col-span-4 col-span-3">Tasks</div>
            <div className="!text-[13px] text-[#838383] font-medium xl:col-span-1 lg:col-span-2 md:col-span-2 col-span-3">Priority</div>
            <div className="!text-[13px] text-[#838383] font-medium xl:col-span-1 lg:col-span-2 md:col-span-2 col-span-3">Due Date</div>
          </div>
          <div className="col-span-1"></div>
        </div>
        {/* Rows */}
        <div className="pt-[10px]">
          {tasks
            // .filter((t: any) => !t.isDeleted)
            .map((task: any, index: number) => {
              const taskCompleted = task?.isCompleted || task?.isDeleted;
              return (
                <div
                  key={task?._id}
                  className="relative w-full py-[12px]"
                >
                  <div className={taskCompleted ? "absolute top-[50%] left-0 translate-y-[50%] w-[calc(100%-110px)] h-px bg-[#AEAEAE]" : ""} />
                  {/* Top border line */}
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-11 grid 2xl:grid-cols-6 xl:grid-cols-5 md:grid-cols-8 grid-cols-3 gap-2 ">

                      {/* Task Title */}
                      <div className="flex items-center 2xl:col-span-4 xl:grid-cols-3 xl:col-span-3  md:col-span-4 col-span-3">
                        <p
                          className={`text-[12px] font-medium ${taskCompleted ? " text-[#AEAEAE]" : ""}`}>
                          {index + 1}. {task?.title}
                        </p>
                      </div>

                      {/* Priority Badge */}
                      <Badge
                        className={`xl:col-span-1 lg:col-span-2 md:col-span-2 col-span-3 p-[5px] text-[12px] rounded-[2px] !font-[500] ${taskCompleted
                          ? "bg-[#EEEEEE] !text-[#AEAEAE] hover:bg-[#EEEEEE]"
                          : task?.priority === "high"
                            ? "hover:bg-red-50 bg-red-50 text-red-600"
                            : task.priority === "medium"
                              ? "bg-yellow-50 hover:bg-yellow-50 text-yellow-600"
                              : "bg-[#E4FFD7] hover:bg-[#E4FFD7] text-[#319F43]"
                          }`}
                      >
                        {capitalizeFirstLetter(task?.priority)}
                      </Badge>

                      {/* Due Date + Checkbox */}
                      <div className="flex items-center justify-between xl:col-span-1 lg:col-span-2 md:col-span-2 col-span-3">
                        <div
                          className={`text-[12px] font-[500] ${taskCompleted ? "text-[#AEAEAE]" : ""
                            }`}
                        >
                          {moment(task?.date).format("MM-DD-YYYY")}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <TooltipProvider delayDuration={500}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <RoundCheckbox
                              checked={task?.completed || taskCompleted}
                              onCheckedChange={(checked: boolean) => onDeleteTask(task?._id, checked)}
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
    <Button onClick={onOpenTaskModal} variant="ghost" className="w-full gap-0 bg-[#E5E8F6] px-[10px] py-[13px] rounded-[5px] justify-start text-black md:text-[12px]">
      <Image
        src="/images/pages/plus-icon.svg"
        alt="KLQUE Logo"
        width={14}
        height={14}
        priority
        className="mr-[20px]" /> Add Task
    </Button>
  </div>
)