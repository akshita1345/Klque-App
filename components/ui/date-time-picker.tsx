"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import moment from "moment"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface DateTimePickerProps {
  /** The selected date value */
  value: Date | null
  /** Callback when date/time is confirmed */
  onChange: (date: Date) => void
  /** Whether to show time selection (default: false) */
  showTime?: boolean
  /** Placeholder text when no date is selected */
  placeholder?: string
  /** Date format for display (default: "PPP" or "PPP 'at' HH:mm" with time) */
  dateFormat?: string
  /** Minimum selectable date (default: today) */
  minDate?: Date
  /** Whether to disable dates before minDate (default: true) */
  disablePastDates?: boolean
  /** Use Dialog instead of Popover (default: false) */
  useDialog?: boolean
  /** Custom trigger element - if provided, replaces default button */
  trigger?: React.ReactNode
  /** Additional className for the trigger button */
  triggerClassName?: string
  /** Style for the trigger button */
  triggerStyle?: React.CSSProperties
  /** Custom icon element */
  icon?: React.ReactNode
}

// Generate hours (00-23)
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
// Generate minutes (00-55 in 5-minute intervals)
const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"))

export function DateTimePicker({
  value,
  onChange,
  showTime = false,
  placeholder,
  dateFormat,
  minDate,
  disablePastDates = true,
  useDialog = false,
  trigger,
  triggerClassName,
  triggerStyle,
  icon,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(value)
  const [selectedHour, setSelectedHour] = useState<string>(value ? format(value, "HH") : "09")
  const [selectedMinute, setSelectedMinute] = useState<string>(value ? format(value, "mm") : "00")

  // Sync state when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setSelectedHour(format(value, "HH"))
      setSelectedMinute(format(value, "mm"))
    } else {
      setSelectedDate(null)
      setSelectedHour("09")
      setSelectedMinute("00")
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      // If not showing time, confirm immediately
      if (!showTime) {
        onChange(date)
        setOpen(false)
      }
    }
  }

  const handleConfirm = () => {
    if (selectedDate) {
      const finalDate = new Date(selectedDate)
      if (showTime) {
        finalDate.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0)
      }
      onChange(finalDate)
      setOpen(false)
    }
  }

  const getDefaultPlaceholder = () => {
    if (placeholder) return placeholder
    return showTime ? "dd/mm/yyyy hh:mm" : "dd/mm/yyyy"
  }

  const formatDisplayValue = () => {
    if (!value) return getDefaultPlaceholder()
    
    if (dateFormat) {
      return format(value, dateFormat)
    }
    
    if (showTime) {
      return format(value, "PPP") + " at " + format(value, "HH:mm")
    }
    
    return format(value, "PPP")
  }

  const getDisabledDates = (date: Date) => {
    if (!disablePastDates) return false
    const compareDate = minDate || new Date(new Date().setHours(0, 0, 0, 0))
    return date < compareDate
  }

  const calendarContent = (
    <>
      <Calendar
        mode="single"
        selected={selectedDate || undefined}
        onSelect={handleDateSelect}
        initialFocus
        disabled={getDisabledDates}
      />
      
      {showTime && (
        <>
          {/* Time Selection */}
          <div className="border-t pt-4 mt-2">
            <Label className="text-[14px] mb-[6px] !text-[#838383] font-[500] block">Select Time</Label>
            <div className="flex items-center gap-2 mt-2">
              {/* Hour Select */}
              <Select value={selectedHour} onValueChange={setSelectedHour}>
                <SelectTrigger className="w-[80px] !h-[36px] !rounded-[8px]">
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-[16px] font-medium">:</span>
              
              {/* Minute Select */}
              <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                <SelectTrigger className="w-[80px] !h-[36px] !rounded-[8px]">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Confirm Button */}
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={!selectedDate}
            className="w-full mt-4 !bg-[#5D60FF] hover:!bg-[#4a4dcc]"
          >
            Confirm
          </Button>
        </>
      )}
    </>
  )

  const defaultTrigger = (
    <Button
      type="button"
      variant="outline"
      style={triggerStyle}
      className={cn(
        "w-full justify-start text-left font-normal",
        !value && "text-muted-foreground",
        triggerClassName
      )}
    >
      {icon || <CalendarIcon className="mr-2 h-4 w-4" />}
      {formatDisplayValue()}
    </Button>
  )

  if (useDialog) {
    return (
      <>
        <div onClick={() => setOpen(true)}>
          {trigger || defaultTrigger}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-auto p-6 max-w-fit">
            {calendarContent}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        {calendarContent}
      </PopoverContent>
    </Popover>
  )
}

DateTimePicker.displayName = "DateTimePicker"

export { DateTimePicker as default }
