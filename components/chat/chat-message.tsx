import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Check, Plus, X, Layers, Sparkles } from 'lucide-react';
import MultiSelectPopup from '@/components/common/multi-select-popup';
import TaskList from './TaskList';
import ScriptList from './ScriptList';
import ContentDialog from '@/app/(pages)/plan/components/content-modal';
import { useToast } from '../ui/use-toast';
import { Dialog, DialogContent } from '../ui/dialog';
import { ContentDetails } from '@/app/(pages)/plan/components/content-details';
import { apiClient } from '@/client/client';
import { CONTENT } from '@/constant/toast-message';
import { Inter } from "next/font/google";
import moment from 'moment-timezone';

const inter = Inter({
  subsets: ["latin"],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
})
interface Task {
  id?: string;
  _id?: string;
  content?: string;
  title?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  scriptId?: string;
}

interface ScriptItemData {
  scriptId: string;
  hook: string;
  script?: string;
  platform?: string;
  contentType?: string;
}

interface ChatMessageProps {
  item: any;
  index: number;
  showMoreMap: Record<string | number, boolean>;
  newSlotFirstMessageRef: React.RefObject<HTMLDivElement> | null;
  conversationLength: number;
  handleShowMore: (id: string | number) => void;
  insertScriptIdAtCursor: (scriptId: string) => void;
  messageContainsIdeas: (message: string) => boolean;
  saveIdeaToCollection: (message: string) => void;
  handleSendMessage: (message: string) => void;
  getChatHistory: (skipCount: number) => void;
  setConversation: (conversation: any[]) => void;
  setCreateScriptLimitError: (createScriptLimitError: boolean) => void;
  insertSctiptIdAtCursor: (scriptId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  item,
  index,
  showMoreMap,
  newSlotFirstMessageRef,
  conversationLength,
  handleShowMore,
  insertScriptIdAtCursor,
  messageContainsIdeas,
  saveIdeaToCollection,
  handleSendMessage,
  getChatHistory,
  setConversation,
  setCreateScriptLimitError,
  insertSctiptIdAtCursor
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editContent, setEditContent] = useState<any>(null);
  const [actionType, setActionType] = useState<'create' | 'edit'>('edit');
  const [isviewContentOpen, setIsviewContentOpen] = useState(false);
  const [viewContent, setViewContent] = useState<any>(null);
  const [selectedScriptIds, setSelectedScriptIds] = useState<string[]>([]);
  const [showMultiSelect, setShowMultiSelect] = useState(false);

  const { toast } = useToast();

  let generatedScriptIds = item?.message?.generatedScriptIds || item?.generatedScriptIds || [];
  const generatedTasks = item?.message?.generatedTasks || item?.generatedTasks || [];
  const selectPostingDates = item?.message?.selectPostingDates || item?.selectPostingDates || [];
  const generatedDocs = item?.message?.generatedDocs || item?.generatedDocs || [];
  const generatedIdeas = (item?.message?.generatedIdeas || item?.generatedIdeas || []).map((idea: any, index: number) => ({ title: idea?.title, scriptId: index + 1 }));
  if (!generatedScriptIds?.length && generatedDocs?.length) generatedScriptIds = generatedDocs.map((doc: any) => ({ scriptId: doc?.scriptId }));
  const messageContent = item?.message?.content || item?.message;
  const isScriptResponse = item?.message?.isScriptResponse || item?.isScriptResponse || false;
  const isGenerateTaskResponse = item?.message?.isGenerateTaskResponse || item?.isGenerateTaskResponse || false;

  const toggle = () => {
    setIsviewContentOpen(!isviewContentOpen);
    setEditContent(null);
  }

  // Function to handle closing the content details and going back to calendar if needed
  const handleContentDetailClose = () => {
    setIsviewContentOpen(false);
    setViewContent(null);
  };

  const handleUpdateFunction = async (contentId: string, status: boolean) => {
    try {
      await apiClient("/api/update-content?timezone=" + moment.tz.guess(), {
        method: "PUT",
        body: JSON.stringify({ contentId, isCompleted: status }),
      });
      setIsviewContentOpen(false)
      setViewContent(null)
    } catch (err: any) {
      toast({ description: err?.message || CONTENT.UPDATED_ERROR, variant: "destructive" });
    }
  }

  const handleViewContent = (item: any) => {
    setIsviewContentOpen(true); setViewContent(item)
  }

  const toggleScriptIdSelection = (scriptId: string) => {
    setSelectedScriptIds(prev =>
      prev.includes(scriptId)
        ? prev.filter(id => id !== scriptId)
        : [...prev, scriptId]
    );
  };

  const selectAllScriptIds = () => {
    const allScriptIds = generatedDocs.map((doc: any) => doc.scriptId);
    setSelectedScriptIds(allScriptIds);
  };

  const clearAllSelections = () => {
    setSelectedScriptIds([]);
  };

  const addSelectedToPlan = () => {
    if (selectedScriptIds.length > 0) {
      setShowMultiSelect(false);
      setSelectedScriptIds([]);
      handleSendMessage(`${selectedScriptIds.join(', ')} Add it to my plan`);
    }
  };

  const generateTasksForSelected = () => {
    if (selectedScriptIds.length > 0) {
      setShowMultiSelect(false);
      setSelectedScriptIds([]);
      handleSendMessage(`${selectedScriptIds.join(', ')} Generate tasks for ${selectedScriptIds.length !== 1 ? 'these scripts' : 'this script'}`);
    }
  };

  const generateScriptsForSelected = () => {
    if (selectedScriptIds.length > 0) {
      setShowMultiSelect(false);
      setSelectedScriptIds([]);
      handleSendMessage(`Generate scripts for idea ${selectedScriptIds.length !== 1 ? 'numbers' : 'number'}: ${selectedScriptIds.join(', ')}`);
    }
  };

  if (item?.senderId === "aibot") {
    return (
      <div className={`lg:max-w-[60%] max-w-full ${inter.className}`}
        ref={conversationLength >= 20 && index === 20 ? newSlotFirstMessageRef : undefined}
      >
        <div className="bg-[#FCF7E4] text-[#141522] font-[500] p-3 rounded-tl-[10px] rounded-tr-[10px] rounded-bl-[0px] rounded-br-[10px] w-full lg:text-[14px] text-[12px] shadow-[0px_0.82px_2.46px_0px_rgba(116,109,102,0.1)] ">
          <ReactMarkdown
            className="prose prose-sm break-words content-wrapper"
            components={{
              ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '2.2em' }} {...props} />,
              ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '2.2em' }} {...props} />,
              a: ({ node, ...props }) => <a style={{ textDecoration: 'underline' }} target="_blank" {...props} />,
              pre: ({ node, ...props }) => <pre style={{ backgroundColor: '#f0f0f0', padding: '0.8em', borderRadius: '4px', overflowX: 'auto' }} {...props} />,
              p: ({ node, ...props }) => <p style={{ whiteSpace: 'pre-line', marginTop: '0.1em', marginBottom: '0.1em', color: '#494848', fontWeight: '400' }} {...props} />,
              strong: ({ node, ...props }) => <strong style={{ color: 'black' }} {...props} />,
              hr: ({ node, ...props }) => <hr style={{ margin: '1em 0' }} {...props} />,
              br: () => null, // Remove <br/> tags entirely
            }}
          >
            {messageContent}
          </ReactMarkdown>
        </div>
        <div className="flex justify-between mt-[10px] items-start">
          <div className={`w-full flex ${generatedDocs?.length ? "flex-row" : "flex-col"}`}>
            {
              // Show only 3 script ids by default.
              generatedScriptIds?.length ? (
                <div className="flex flex-wrap gap-2">
                  {generatedScriptIds.slice(0, showMoreMap[item._id || index] ? undefined : 3).map(({ scriptId }: any) => (
                    <TooltipProvider key={scriptId}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="min-w-[68px] bg-gradient-to-r from-[#5D60FF] to-[#7B7EFF] hover:from-[#4A4DFF] hover:to-[#6A6DFF] rounded-[10px] !text-white text-[8px] !px-[8px] !py-[8px] border-none hover:!bg-[#4A4DFF] font-normal !h-[23px]"
                            onClick={() => insertScriptIdAtCursor(scriptId)}
                          >
                            {scriptId}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Click to insert script ID: <strong>{scriptId}</strong></p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {generatedScriptIds.length > 3 && !showMoreMap[item._id || index] && (
                    <Button
                      variant="outline"
                      className="min-w-[68px] !bg-[#5D60FF] rounded-[10px] !text-white text-[8px] !px-[8px] !py-[8px] border-none hover:!bg-[#4A4DFF] font-normal !h-[23px]"
                      onClick={() => handleShowMore(item._id || index)}
                    >
                      +{generatedScriptIds.length - 3} more
                    </Button>
                  )}
                </div>
              ) : null
            }
            {
              generatedTasks?.length ? (
                <>
                  <TaskList tasks={generatedTasks} messageId={item?.id} handleSendMessage={handleSendMessage} getChatHistory={getChatHistory} setConversation={setConversation} />
                </>
              ) : null
            }
            {
              selectPostingDates?.length ? (
                <ScriptList
                  scripts={selectPostingDates}
                  messageId={item?.id}
                  handleSendMessage={handleSendMessage}
                  getChatHistory={getChatHistory}
                  setConversation={setConversation}
                  handleViewContent={handleViewContent}
                  setCreateScriptLimitError={setCreateScriptLimitError}
                />
              ) : null
            }
          </div>
          <div className="flex">
            <div className="flex items-center gap-2">
              {
                isScriptResponse ?
                  <Popover open={showMultiSelect} onOpenChange={setShowMultiSelect}>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="!bg-gradient-to-r from-[#5D60FF] to-[#7B7EFF] rounded-full border-[#5D60FF] !text-white md:text-[12px] px-[12px] py-[6px] ml-2 h-[32px] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                        >
                          <Layers className="w-3 h-3" />
                          Add to plan
                          {selectedScriptIds.length > 0 && (
                            <Badge variant="secondary" className="ml-1 bg-white text-[#5D60FF] px-1 py-0 text-[10px]">
                              {selectedScriptIds.length}
                            </Badge>
                          )}
                        </Button>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] p-0 bg-white/95 backdrop-blur-sm border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
                      <div className="bg-gradient-to-br from-[#5D60FF]/10 to-[#7B7EFF]/10 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#5D60FF]" />
                            <h3 className="text-sm font-semibold text-gray-800">Select Scripts</h3>
                          </div>
                          {selectedScriptIds.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px] text-gray-600 hover:text-gray-800"
                              onClick={clearAllSelections}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Clear
                            </Button>
                          )}
                        </div>
                      </div>

                      <ScrollArea className="h-[230px] w-full">
                        <div className="p-4 pt-2">
                          <div className="space-y-2">
                            {generatedScriptIds.map(({ scriptId, title }: any) => (
                              <Card
                                key={scriptId}
                                className={`p-3 cursor-pointer transition-all duration-200 border-2 ${selectedScriptIds.includes(scriptId)
                                  ? 'border-[#5D60FF] bg-[#5D60FF]/5 shadow-md'
                                  : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                                  }`}
                                onClick={() => toggleScriptIdSelection(scriptId)}
                              >
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={selectedScriptIds.includes(scriptId)}
                                    onChange={() => { }}
                                    className="border-[#5D60FF] data-[state=checked]:bg-[#5D60FF]"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-gray-600 mt-1 line-clamp-2">
                                        {scriptId}
                                      </span>
                                      {/* {doc.platform && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-gray-300 text-gray-600">
                                          {doc.platform}
                                        </Badge>
                                      )} */}
                                    </div>
                                    {title && (
                                      <p className="text-sm font-medium text-gray-800">
                                        {title}
                                      </p>
                                    )}
                                  </div>
                                  {selectedScriptIds.includes(scriptId) && (
                                    <Check className="w-4 h-4 text-[#5D60FF]" />
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </ScrollArea>

                      <Separator className="bg-gray-100" />

                      <div className="p-4 bg-gray-50/50">
                        <Button
                          className="w-full bg-gradient-to-r from-[#5D60FF] to-[#7B7EFF] hover:from-[#4A4DFF] hover:to-[#6A6DFF] text-white font-medium py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          onClick={addSelectedToPlan}
                          disabled={selectedScriptIds.length === 0}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add {selectedScriptIds.length > 0 ? `${selectedScriptIds.length} ` : ''}to Plan
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover> : null
              }
              {
                (isGenerateTaskResponse || generatedDocs?.length) ?
                  <MultiSelectPopup
                    triggerLabel="Generate tasks"
                    title="Select scripts"
                    scriptIds={generatedDocs}
                    selectedIds={selectedScriptIds}
                    onSelectionToggle={toggleScriptIdSelection}
                    onSelectAll={selectAllScriptIds}
                    onClearAll={clearAllSelections}
                    onConfirm={generateTasksForSelected}
                    onCancel={() => setShowMultiSelect(false)}
                    open={showMultiSelect}
                    onOpenChange={setShowMultiSelect}
                    prefixId="Script"
                    buttonIcon="plus"
                    gradientColors={{
                      from: '[#5D60FF]',
                      to: '[#7B7EFF]',
                      border: '[#5D60FF]'
                    }}
                  /> : null
              }
              {
                (generatedIdeas?.length) ?
                  <MultiSelectPopup
                    triggerLabel="Select scripts"
                    title="Select ideas"
                    scriptIds={generatedIdeas}
                    selectedIds={selectedScriptIds}
                    onSelectionToggle={toggleScriptIdSelection}
                    onSelectAll={selectAllScriptIds}
                    onClearAll={clearAllSelections}
                    onConfirm={generateScriptsForSelected}
                    onCancel={() => setShowMultiSelect(false)}
                    open={showMultiSelect}
                    onOpenChange={setShowMultiSelect}
                    prefixId="Idea"
                    // buttonIcon="plus"
                    gradientColors={{
                      from: '[#5D60FF]',
                      to: '[#7B7EFF]',
                      border: '[#5D60FF]'
                    }}
                  /> : null
              }
              {
                generatedDocs?.length ? (
                  <div className="w-full flex items-center justify-end gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="!bg-[#EBECFF] rounded-[3px] border-[#5D60FF] !text-[#5D60FF] md:text-[12px] px-[12px] py-[6px] ml-2 h-[27px]"
                        >
                          View content
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-fit p-0">
                        <div className="space-y-2">
                          <div className="flex flex-col gap-1">
                            {generatedDocs.map((item: any) => (
                              <Button
                                key={item?.scriptId}
                                variant="ghost"
                                size="sm"
                                className="text-xs justify-start hover:bg-[#EBECFF] w-full"
                                onClick={() => handleViewContent(item)}
                              >
                                {item?.scriptId}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : null
              }
              {messageContainsIdeas(messageContent) && (
                <Button
                  variant="outline"
                  className="!bg-[#EBECFF] rounded-[3px] border-[#5D60FF] !text-[#5D60FF] md:text-[12px] px-[12px] py-[6px] ml-2 h-[27px]"
                  onClick={() => saveIdeaToCollection(messageContent)}
                >
                  Save Response
                </Button>
              )}
            </div>
          </div>
        </div>

        <ContentDialog
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          setEditContent={setEditContent}
          actionType={actionType}
          editContent={editContent}
          refetch={() => { }}
        />

        <Dialog open={isviewContentOpen} onOpenChange={toggle}>
          <DialogContent className="xl:max-w-[1300px] lg:max-w-[1000px] md:max-w-[700px] max-w-[390px] w-full !bg-transparent !p-[0px] !gap-[10px] !border-none sm:rounded-[0]">
            <ContentDetails
              setIsviewContentOpen={handleContentDetailClose}
              contentId={viewContent?.docId}
              setViewContent={setViewContent}
              setIsOpen={setIsOpen}
              setActionType={setActionType}
              editContent={editContent}
              setEditContent={setEditContent}
              handleUpdateFunction={handleUpdateFunction}
              isInPopup={true}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // User message
  return (
    <div className={`lg:max-w-[60%] max-w-full ml-auto ${inter.className}`}
      ref={conversationLength >= 20 && index === 20 ? newSlotFirstMessageRef : undefined}
    >
      <div className="bg-[#5D60FF] text-white px-[10px] py-[5.62px] rounded-bl-[10px] rounded-tr-[10px] rounded-tl-[10px] rounded-br-[0] w-fit lg:text-[14px] text-[12px] ml-auto shadow-[0_4px_10px_0px_rgba(93,96,255,0.3)] ">
        <ReactMarkdown
          className="prose prose-sm break-words"
          components={{
            ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '1.2em' }} {...props} />,
            ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.2em' }} {...props} />,
            a: ({ node, ...props }) => <a style={{ textDecoration: 'underline' }} target="_blank" {...props} />,
            pre: ({ node, ...props }) => <pre style={{ backgroundColor: '#f0f0f0', padding: '0.8em', borderRadius: '4px', overflowX: 'auto' }} {...props} />,
            p: ({ node, ...props }) => <p style={{ whiteSpace: 'pre-line', marginTop: '0.1em', marginBottom: '0.1em' }} {...props} />,
          }}
        >
          {item?.message}
        </ReactMarkdown>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const MemoizedChatMessage = React.memo(ChatMessage);

export default ChatMessage;