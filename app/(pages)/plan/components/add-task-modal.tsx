"use client"

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
import { CalendarIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { useToast } from "@/components/ui/use-toast"
import { inputValidationErrorMessage } from "@/utils/error-message"
import { apiClient } from "@/client/client"
import { TASK } from "@/constant/toast-message"
import { Plus_Jakarta_Sans } from "next/font/google"
import { ensureValidDate } from "@/components/common/common"
import moment from "moment-timezone"
import { DateTimePicker } from "@/components/ui/date-time-picker"

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

interface ContentFormProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refetch: Function
  content: any
}

type Inputs = {
  title: string
  date: Date | null
  priority: string
}

export default function AddTaskDialog({ isOpen, setIsOpen, refetch, content }: ContentFormProps) {

  const { toast } = useToast();
  const loginUser = useMemo(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem("user") || "null");
    }
    return null;
  }, []);
  const [isLoading, setIsLoading] = useState(false);


  // FORM HOOK 
  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    reset
  } = useForm<Inputs>({
    defaultValues: {
      title: "",
      date: null,
      priority: ""
    }
  });

  // Initialize the date field when the form is first opened
  useEffect(() => {
    if (isOpen) {
      // Only set the date on first open, don't override user selection
      // when the form is already open
      setValue("date", ensureValidDate(new Date()));
    }
  }, [isOpen]); // Remove setValue from dependency array

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      setIsLoading(true);
      const input = {
        ...data,
        date: moment(ensureValidDate(data.date)).utc().toISOString(),
        userId: loginUser?._id,
        contentId: content?._id
      };

      await apiClient("/api/create-task?timezone=" + moment.tz.guess(), {
        method: "POST",
        body: JSON.stringify(input),
      });
      toast({ description: TASK.CREATED });
      refetch();
      toggle();
      setIsLoading(false);
    } catch (err: any) {
      toast({ description: err?.message || TASK.CREATE_ERROR, variant: "destructive" });
      setIsLoading(false);
    }
  }

  const toggle = () => {
    setIsOpen(!isOpen);
    reset({
      title: "",
      date: ensureValidDate(new Date()),
      priority: ""
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => toggle()}>
      <DialogContent
        className={`!bg-[#FFFDF8] !max-w-[390px] ${plusJakartaSans.className}
              [&>button[aria-label="Close"]]:hidden`}>
        <DialogHeader>
          <DialogTitle className={`md:text-[14px] text-[14px] text-center font-[600] ${plusJakartaSans.className}`}>Break it down</DialogTitle>
        </DialogHeader>
        <form className={`space-y-6 ${plusJakartaSans.className}`} onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hook" className={`font-medium ${plusJakartaSans.className}`}>Name this task</Label>
              <Controller
                name="title"
                control={control}
                rules={{ required: "title is require" }}
                render={({ field }) =>
                  <Input
                    {...field}
                    id="title"
                    placeholder="Catchy, intriguing, bold maybe..."
                    className={`${plusJakartaSans.className} md:text-[12px] text-[12px] !bg-transparent text-[#A7A3B8] !rounded-[5px] !p-[11.5px] 1text-[#A7A3B8]`}
                  />
                }
              />
              {errors.title && inputValidationErrorMessage(errors.title.message || "")}
            </div>
            <div className="space-y-2">
              <Label className={`font-medium ${plusJakartaSans.className}`}>When's it gotta be done?</Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => {
                  // Ensure we're working with a valid date
                  const currentValue = ensureValidDate(field.value);

                  const roundToNearestMinutes = (date: moment.Moment, step = 5) => {
                    const minutes = date.minutes();
                    const rounded = Math.round(minutes / step) * step;
                    return date.clone().minutes(rounded).seconds(0);
                  };

                  const formatDisplayValue = () => {
                    if (!currentValue) return "dd/mm/yyyy hh:mm";

                    const m = moment(currentValue).tz(moment.tz.guess());
                    const rounded = roundToNearestMinutes(m, 5);

                    return rounded.format("MMM Do [at] HH:mm");
                  };


                  return (
                    <DateTimePicker
                      value={currentValue}
                      onChange={field.onChange}
                      showTime={true}
                      useDialog={true}
                      triggerClassName={`w-full justify-start text-left font-normal !bg-transparent rounded-md !text-[12px] !p-[11.5px] ${plusJakartaSans.className}`}
                      icon={<CalendarIcon className="mr-2 h-4 w-4" />}
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          className={`w-full justify-start text-left font-normal !bg-transparent rounded-md !text-[12px] !p-[11.5px] ${plusJakartaSans.className}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          <p className="!text-[#A7A3B8]">
                            {formatDisplayValue()}
                          </p>
                        </Button>
                      }
                    />
                  );
                }}
              />
              {errors.date && inputValidationErrorMessage(errors.date.message || "")}
            </div>
            <div className="space-y-2 w-1/2">
              <Label htmlFor="priority" className={`font-medium ${plusJakartaSans.className}`}>How important is this?</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select

                    onValueChange={(value: string) => {
                      field.onChange(value);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger className={`px-[16px] py-[10px] w-full !bg-transparent border border-gray-300 rounded-md text-sm text-[#A7A3B8] ${plusJakartaSans.className}`}>
                      <SelectValue placeholder="select priority" />
                    </SelectTrigger>
                    <SelectContent className={plusJakartaSans.className}>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.priority && inputValidationErrorMessage(errors.priority.message || "")}
            </div>
          </div>
          {isLoading ? <LoadingButton className={`w-full bg-[#5D60FF] hover:bg-[#5D60FF] ${plusJakartaSans.className}`} size="lg" /> :
            <Button type="submit" className={`w-full bg-[#5D60FF] hover:bg-[#5D60FF] ${plusJakartaSans.className}`} size="lg">
              Add it to my list
            </Button>
          }
        </form>
      </DialogContent>
    </Dialog>
  )
}
