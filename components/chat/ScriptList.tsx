import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import Cookies from 'js-cookie';
import ScriptItem from './ScriptItem';
import moment from 'moment-timezone';
import { useToast } from '../ui/use-toast';
import { FileText } from 'lucide-react';

export interface ScriptListProps {
  scripts: any[];
  messageId?: string;
  handleSendMessage: (message: string) => void;
  getChatHistory: (skipCount: number) => void;
  setConversation: (conversation: any[]) => void;
  handleViewContent: (item: any) => void;
  setCreateScriptLimitError: (createScriptLimitError: boolean) => void;
}

const ScriptList: React.FC<ScriptListProps> = ({
  scripts,
  messageId,
  handleSendMessage,
  getChatHistory,
  setConversation,
  handleViewContent,
  setCreateScriptLimitError
}) => {

  const { toast } = useToast();
  const [selectedScripts, setSelectedScripts] = useState<any[]>([]);
  const [scriptDates, setScriptDates] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleScriptSelection = (script: any, isSelected: boolean) => {
    if (isSelected) {
      setSelectedScripts(prev => {
        const existingIndex = prev.findIndex(s => s.id === script.id);
        if (existingIndex >= 0) {
          // Update existing script
          const updated = [...prev];
          updated[existingIndex] = script;
          return updated;
        }
        // Add new script if not found
        return [...prev, script];
      });
      // Set default date if not already set
      if (!scriptDates[script.id]) {
        setScriptDates(prev => ({
          ...prev,
          [script.id]: null
        }));
      }
    } else {
      setSelectedScripts(prev => prev.filter(s => s.id !== script.id));
      // Remove date when script is deselected
      setScriptDates(prev => {
        const newDates = { ...prev };
        delete newDates[script.id];
        return newDates;
      });
    }
  };

  const handleDateChange = (scriptId: string, date: string) => {
    setScriptDates(prev => ({
      ...prev,
      [scriptId]: date
    }));
  };

  const saveScriptsWithDates = async () => {
    if (selectedScripts.length === 0) {
      toast({
        title: "Error",
        description: 'Please select at least one script',
        variant: "destructive",
      });
      return;
    }

    // Check if all selected scripts have posting dates
    const scriptsWithoutDates = selectedScripts.filter(script => !scriptDates[script.id] && !script.isUpdate);
    if (scriptsWithoutDates.length > 0) {
      toast({
        title: "Error",
        description: 'Please select posting dates for all scripts',
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSaveStatus(null);

    try {
      // Format scripts for API
      const scriptsToSave = selectedScripts.map(script => ({
        ...script,
        ...(script.isUpdate ? {} : { postingDate: scriptDates[script.id] || '' }),
      }));

      const token: string | undefined = Cookies.get("token");

      const response = await fetch(`/api/save-contents-with-dates?timezone=${moment.tz.guess()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || ''
        },
        body: JSON.stringify({
          scripts: scriptsToSave,
          messageId
        }),
      });

      const data = await response.json();

      if (data.success) {

        await Promise.all(data?.processedScripts?.map(async (script: any) => {
          toast({
            icon: <FileText className="w-[14px] h-[18px]" />,
            title: script.title,
            description: 'Added to your plan.',
            className: "sm:top-0 w-[340px] right-[20px] flex flex-col gap-1 items-start fixed bg-white border border-[#E5E8F6] rounded-[12px] !toast-shadow p-[12px]",
            action: (
              <div className="px-[12px] w-full flex justify-center">
                <Button
                  className="border-0 text-[#5D60FF] text-xs items-center !m-0 bg-white hover:bg-white"
                  onClick={() => handleViewContent(script)}
                >
                  View Content
                </Button>
              </div>
            ),
          });
        }));

        // Clear selections after successful save
        setSelectedScripts([]);
        setScriptDates({});
        // setConversation(prev => [...prev]);
        getChatHistory(0);
      } else {
        if (data?.type === 'LIMIT_REACHED') {
          setCreateScriptLimitError(true);
          return;
        }
        toast({
          title: "Error",
          description: data.error || 'Failed to save scripts',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving scripts:', error);
      toast({
        title: "Error",
        description: 'An error occurred while saving scripts',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scripts?.length === 1 && !scripts?.[0]?.isSaved) {
      handleScriptSelection(scripts[0], true);
    }
  }, [scripts])

  return (
    <div className="mt-[7px] rounded-lg  max-w-full">

      {scripts.map((script, index) => (
        <ScriptItem
          key={script.id || index}
          script={script}
          onSelectionChange={(isSelected) => handleScriptSelection(script, isSelected)}
          onDateChange={(date) => handleDateChange(script.id, date)}
          isSelected={selectedScripts.some(s => s.id === script.id)}
          selectedDate={scriptDates[script.id]}
          isSaved={script?.isSaved}
        />
      ))}

      <div className='flex justify-end mt-4'>
        <Button
          variant="outline"
          className="!bg-[#EBECFF] rounded-[3px] border-[#5D60FF] !text-[#5D60FF] md:text-[12px] px-[12px] py-[6px] !h-[27px] font-[500]"
          onClick={saveScriptsWithDates}
          disabled={isLoading || selectedScripts.length === 0}
        >
          {isLoading ? 'Proceeding...' : (scripts?.length === 1 ? 'Proceed' : 'Proceed Selected')}
        </Button>
        <Button
          variant="outline"
          className="rounded-[3px] border-[#5D60FF] !text-[#5D60FF] md:text-[12px] px-[12px] py-[6px] ml-2 !h-[27px] font-[500]"
          onClick={() => handleSendMessage('Skip')}
          disabled={isLoading || !scripts.find(s => !s?.isSaved)}
        >
          Skip
        </Button>
      </div>
    </div>
  );
};

export default ScriptList;