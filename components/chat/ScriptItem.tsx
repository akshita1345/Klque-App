import React, { useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import moment from 'moment';
import { DateTimePicker } from '../ui/date-time-picker';

export interface ScriptItemData {
  scriptId: string;
  hook: string;
  script: string;
  platform: string;
  contentType: string;
}

export interface ScriptItemProps {
  script: any;
  onSelectionChange?: (isSelected: boolean) => void;
  onDateChange?: (date: string) => void;
  isSelected?: boolean;
  selectedDate?: string;
  isSaved?: boolean;
}

const ScriptItem: React.FC<ScriptItemProps> = ({
  script,
  onSelectionChange,
  onDateChange,
  isSelected = false,
  selectedDate,
  isSaved
}) => {

  const [isChecked, setIsChecked] = useState(isSelected);
  const [postingDate, setPostingDate] = useState<Date | null>(
    selectedDate ? new Date(selectedDate) : null
  );

  React.useEffect(() => {
    setIsChecked(isSelected);
  }, [isSelected]);

  React.useEffect(() => {
    if (selectedDate) {
      setPostingDate(new Date(selectedDate));
    }
  }, [selectedDate]);

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    onSelectionChange?.(checked);
  };

  const handleDateChange = (date: Date) => {
    setPostingDate(date);
    onDateChange?.(date.toISOString());
  };

  const formatDisplayDate = () => {
    if (!postingDate) return "Posting Date";
    return moment(postingDate).tz(moment.tz.guess()).format('L') + ' ' + moment(postingDate).tz(moment.tz.guess()).format('HH:mm');
  };

  return (
    <div className="border border-gray-200 p-3 mb-2 bg-[#F5F7FF] rounded-[8px] transition-colors">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isChecked}
          onCheckedChange={handleCheckboxChange}
          disabled={isSaved}
          className="mt-1 rounded"
        />
        <div className={`flex-1 lg:flex justify-between ${isSaved ? "opacity-50 cursor-not-allowed" : ""}`}>
          <div className="flex flex-col items-start mb-1 lg:w-[80%] w-full">
            <span className="text-xs font-medium text-gray-600">
              ID: {script.id} {isSaved && <span className="text-[#5D60FF]">Saved</span>}
            </span>
            <h4 className="font-medium xl:text-sm text-[12px] text-gray-900">{script.ideaTitle}</h4>
          </div>
          {(isChecked && !script?.isUpdate) && (
            <div className="!w-[160px]">
              <DateTimePicker
                value={postingDate}
                onChange={handleDateChange}
                showTime={true}
                trigger={
                  <div
                    className={cn(
                      "w-full flex gap-3 justify-start text-left font-normal !p-[10px] rounded-[5px] cursor-pointer border border-gray-300 bg-white hover:bg-gray-50",
                      !postingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <p className="text-[#A7A3B8] text-xs">{formatDisplayDate()}</p>
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScriptItem;