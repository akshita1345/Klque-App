import React, { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import Cookies from 'js-cookie';
import moment from 'moment-timezone';
import TaskItem, { Task } from './TaskItem';

export interface TaskListProps {
  tasks: Task[];
  messageId?: string;
  handleSendMessage: (message: string) => void;
  getChatHistory: (skipCount: number) => void;
  setConversation: (conversation: any[]) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, messageId, handleSendMessage, getChatHistory, setConversation }) => {
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleTaskSelection = (task: Task, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTasks(prev => [...prev, task]);
    } else {
      setSelectedTasks(prev => prev.filter(t => (t.id || t._id) !== (task.id || task._id)));
    }
  };

  const saveTasksToPlan = async () => {
    if (selectedTasks.length === 0) {
      setSaveStatus({ success: false, message: 'Please select at least one task' });
      return;
    }

    setIsLoading(true);
    setSaveStatus(null);

    try {
      // Format tasks for API with proper date format (MM-DD-YYYY)
      const tasksToSave = selectedTasks.map(task => {
        // Format date to MM-DD-YYYY as expected by the API
        let formattedDate;
        if (task.dueDate) {
          const date = new Date(task.dueDate);
          if (!isNaN(date.getTime())) {
            formattedDate = moment(task.dueDate).toISOString();
          } else {
            formattedDate = moment().add(1, 'day').toISOString();
          }
        } else {
          formattedDate = moment().add(1, 'day').toISOString();
        }

        return {
          title: task.content || task.title,
          priority: task.priority || 'medium',
          dueDate: formattedDate,
          scriptId: task.scriptId // Include if available
        };
      });

      const token: string | undefined = Cookies.get("token");

      // Call the API
      const response = await fetch('/api/save-tasks?', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": token || ""
        },
        body: JSON.stringify({ tasks: tasksToSave, messageId, timezone: moment.tz.guess() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSaveStatus({ success: true, message: data.message || 'Tasks saved successfully' });
        // Clear selections after successful save
        setSelectedTasks([]);
        // setConversation([]);
        getChatHistory(0);
      } else if (data.error === 'Invalid due dates' && data.invalidDates) {
        setSaveStatus({ success: false, message: `Invalid due dates for tasks: ${data.invalidDates.map((t: { title: string }) => t.title).join(', ')}` });
      } else {
        setSaveStatus({ success: false, message: data.error || 'Failed to save tasks' });
      }
    } catch (error) {
      console.error('Error saving tasks:', error);
      setSaveStatus({ success: false, message: 'An error occurred while saving tasks' });
    } finally {
      setIsLoading(false);
    }
  };

  // Group tasks by scriptId
  const groupedTasks = useMemo(() => {
    return tasks.reduce((groups: Record<string, Task[]>, task) => {
      const scriptId = task.scriptId || 'unassigned';
      if (!groups[scriptId]) {
        groups[scriptId] = [];
      }
      groups[scriptId].push(task);
      return groups;
    }, {});
  }, [tasks]);

  return (
    <div className="mt-[7px] rounded-lg xl:w-[700px] lg:w-[500px] w-full">
      {saveStatus && (
        <div className={`mb-2 p-2 text-sm rounded ${saveStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {saveStatus.message}
        </div>
      )}
      {Object.entries(groupedTasks).map(([scriptId, tasksInGroup]) => (
        <div key={scriptId} className="mb-4">
          <div className="text-[#5D60FF] text-sm font-semibold rounded mb-2">
            {scriptId}
          </div>
          {tasksInGroup.map((task, index) => (
            <TaskItem
              key={task.id || task._id || index}
              task={task}
              onSelectionChange={(isSelected) => handleTaskSelection(task, isSelected)}
              isSelected={selectedTasks.some(t => (t.id || t._id) === (task.id || task._id))}
            />
          ))}
        </div>
      ))}
      <div className='flex justify-end'>
        <Button
          variant="outline"
          className="!bg-[#EBECFF] rounded-[3px] border-[#5D60FF] !text-[#5D60FF] md:text-[12px] px-[12px] py-[6px] !h-[27px] font-[500]"
          onClick={saveTasksToPlan}
          disabled={isLoading || selectedTasks.length === 0}
        >
          {isLoading ? 'Saving...' : 'Add to my To-Do\'s'}
        </Button>
        <Button
          variant="outline"
          className="rounded-[3px] border-[#5D60FF] !text-[#5D60FF] md:text-[12px] px-[12px] py-[6px] ml-2  !h-[27px] font-[500]"
          onClick={() => handleSendMessage('Skip')}
          disabled={isLoading || !tasks?.find(t => !t?.isSaved)}
        >
          Skip
        </Button>
      </div>
    </div>
  );
};

export default TaskList;