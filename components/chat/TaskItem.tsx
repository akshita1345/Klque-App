import React, { useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import moment from 'moment';
import { Inter } from "next/font/google";
import { DateTimePicker } from '../ui/date-time-picker';

const inter = Inter({
  subsets: ["latin"],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
});

export interface Task {
  _id?: string;
  id?: string;
  content?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  scriptTitle?: string;
  scriptId?: string;
  isSaved?: boolean;
}

export interface TaskItemProps {
  task: Task;
  onSelectionChange?: (isSelected: boolean) => void;
  isSelected?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onSelectionChange, isSelected = false }) => {
  const [isChecked, setIsChecked] = useState(isSelected);
  const [showOptions, setShowOptions] = useState(isSelected);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task.priority || 'medium');
  const [dueDate, setDueDate] = useState<Date | null>(
    task.dueDate ? new Date(task.dueDate) : new Date()
  );

  // Update local state when isSelected prop changes
  React.useEffect(() => {
    setIsChecked(isSelected);
    setShowOptions(isSelected);
  }, [isSelected]);

  // Handle checkbox changes
  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    setShowOptions(checked);

    // Update task with current priority and due date
    if (onSelectionChange) {
      onSelectionChange(checked);
    }
  };

  // Update task when priority changes
  const handlePriorityChange = (value: 'low' | 'medium' | 'high') => {
    setPriority(value);
    task.priority = value;
  };

  // Update task when due date changes
  const handleDueDateChange = (date: Date) => {
    setDueDate(date);
    task.dueDate = date.toISOString();
  };

  const formatDisplayDate = () => {
    if (!dueDate) return "Pick a date";
    return moment(dueDate).tz(moment.tz.guess()).format('L') + ' ' + moment(dueDate).tz(moment.tz.guess()).format('HH:mm');
  };

  return (
    <div className="w-full mb-2 md:flex align-start justify-between">
      <div className={`flex items-centemd:r gap-2 bg-[#F5F7FF] rounded-[8px] px-[10px] py-[8.5px] w-full ${inter.className}`} onClick={() => handleCheckboxChange(!isChecked)}>
        <Checkbox
          checked={isChecked}
          // onCheckedChange={handleCheckboxChange}
          className="rounded-[5px]"
          disabled={task?.isSaved}
        />
        <span className={`text-[14px] font-[500] ${task?.isSaved ? "opacity-50 cursor-not-allowed" : ""}`}>
          {task.content || task.title} {task?.isSaved && <span className="text-[#5D60FF] font-[400] text-[12px]">Saved</span>}
        </span>
      </div>

      {showOptions && (
        <div className="md:ml-[8px] flex gap-2 md:mt-0 mt-2">
          <div className="flex-1 relative w-[100px]">
            <Select value={priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="w-full text-xs bg-white">
                <SelectValue placeholder="Select Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 relative w-[150px]">
            <DateTimePicker
              value={dueDate}
              onChange={handleDueDateChange}
              showTime={true}
              trigger={
                <div
                  className={cn(
                    "w-full flex gap-3 justify-start text-left font-normal !p-[10px] rounded-[5px] cursor-pointer border border-gray-300 bg-white hover:bg-gray-50",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  <p className="text-[#A7A3B8] text-xs">{formatDisplayDate()}</p>
                </div>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;