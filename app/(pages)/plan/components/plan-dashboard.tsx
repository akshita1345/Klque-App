"use client"

import { ContentCard } from "@/app/(pages)/plan/components/content-card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import useApi from "@/hooks/use-api"
import { useState, useEffect, useCallback } from "react"
import ContentDialog from "./content-modal"
import ConfirmationModal from "@/components/common/confirmation-modal"
import { apiClient } from "@/client/client"
import { CONTENT } from "@/constant/toast-message"
import { ContentDetails } from "./content-details"
import { Plus, Search, X } from "lucide-react"
import { montserrat } from "@/app/layout"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import RoundedLargeSpinner from "@/components/common/round-large-spinner"
// import moment from "moment"
import moment from "moment-timezone"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import PerfectScrollbar from 'react-perfect-scrollbar';
import { FilterModal } from "./filter-modal";
import Cookies from "js-cookie"

const DatePickerButton = ({ style, value, onChange }: { style?: React.CSSProperties, value?: Date; onChange: (d: Date) => void }) => {

  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" style={style} className="!md:text-xs text-[!#000000] !h-[43px] !rounded-[10px] justify-start text-left py-[10px] px-[14px] mr-[10px] color-black text-[14px] font-semibold ">
          <Image
            src="/images/pages/calendar-black.svg"
            alt="Calendar"
            width={20}
            height={22}
            priority
            className="mr-2"
          />
          {value ? moment(value).tz(moment.tz.guess()).format("MMM D, YYYY") : "Select Date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => date && (onChange(date), setOpen(false))}
          initialFocus
          disabled={(date) => date < new Date("1900-01-01")}
          className="rounded-md border shadow"
        />
      </PopoverContent>
    </Popover>
  )
}

export interface FilterApplyProps {
  contentPillars: string[];
  contentTypes: string[];
  platforms: string[];
  targetAudience: string[];
}

export function PlanDashboard() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const contentIdParam = searchParams.get('contentId');
  const selectedTabParam = searchParams.get('selectedTab');

  // All states
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionType, setActionType] = useState("Add");
  const [selectedTab, setSelectedTab] = useState(selectedTabParam || "content");
  const [editContent, setEditContent] = useState(null);
  const [viewContent, setViewContent] = useState<any>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isviewContentOpen, setIsviewContentOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterApplyProps>({
    contentPillars: [],
    contentTypes: [],
    platforms: [],
    targetAudience: [],
  });

  // Filter categories
  const [filterCategories, setFilterCategories] = useState<any>([]);

  // State for grouped content data
  const [groupedContent, setGroupedContent] = useState<{
    sortedDates: string[];
    groupedByDate: { [key: string]: any[] };
    dateLabels: { [key: string]: string };
  }>({ sortedDates: [], groupedByDate: {}, dateLabels: {} });

  // State for API data
  // Define type for API response
  interface ContentResponse {
    data: any[];
    counts?: {
      scheduledCount: number;
      unScheduledCount: number;
      completedCount: number;
      historyCount: number;
    };
  }

  const [contents, setContents] = useState<ContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Custom API call function
  const fetchContents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient(`/api/get-contents?type=${selectedTab}&date=${selectedDate ? moment(selectedDate).format("YYYY-MM-DD") : ""}&timezone=${moment.tz.guess()}`, {
        method: "POST",
        body: JSON.stringify({ filters: filters })
      });
      setContents(response as ContentResponse);
      setLoading(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [selectedTab, selectedDate, filters]);

  // Fetch contents when dependencies change
  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  // Define refetch function for use in components
  const refetch = fetchContents;

  const handleSearch = useCallback((contentData: any[]) => {
    if (!searchTerm) return contentData;
    const lowerSearch = searchTerm.toLowerCase();
    return contentData.filter(item =>
    (item.ideaTitle?.toLowerCase().includes(lowerSearch) ||
      item.hook?.toLowerCase().includes(lowerSearch))
    );
  }, [searchTerm]);

  const fetchFilterCategories = async () => {
    const token: string | undefined = Cookies.get("token");

    const myHeaders = new Headers();
    myHeaders.append("Authorization", token || "");

    const requestOptions: RequestInit = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };

    fetch("/api/get-filter-categories", requestOptions)
      .then((response) => response.json())
      .then((result) => {
        setFilterCategories(result?.data || []);
      })
      .catch((error) => console.error(error));
  }

  // Group content data by posting date
  useEffect(() => {
    if (contents && contents.data && contents.data.length > 0) {
      const filtered = handleSearch(contents.data);
      const groupedByDate: { [key: string]: any[] } = {};
      const dateLabels: { [key: string]: string } = {};

      // Group content by posting date
      filtered.forEach((item: any) => {
        if (item.postingDate) {
          const dateKey = moment(item.postingDate).tz(moment.tz.guess()).format("YYYY-MM-DD");
          if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = [];
          }
          groupedByDate[dateKey].push(item);
        } else {
          // Handle items without posting date
          if (!groupedByDate['unscheduled']) {
            groupedByDate['unscheduled'] = [];
          }
          groupedByDate['unscheduled'].push(item);
        }
      });

      // Sort contents within each group by createAt field (newest first)
      Object.keys(groupedByDate).forEach(dateKey => {
        groupedByDate[dateKey].sort((a, b) => {
          const dateA = a.createAt ? moment(a.createAt).valueOf() : 0;
          const dateB = b.createAt ? moment(b.createAt).valueOf() : 0;
          return dateB - dateA; // Sort in descending order (newest first)
        });
      });

      // Sort dates based on selectedTab
      const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
        if (a === 'unscheduled') return 1; // Always put unscheduled at the end
        if (b === 'unscheduled') return -1;

        if (selectedTab === "content") {
          // For content tab: ascending order (oldest first)
          return moment(a).valueOf() - moment(b).valueOf();
        } else {
          // For history and other tabs: descending order (newest first)
          return moment(b).valueOf() - moment(a).valueOf();
        }
      });

      // Create date labels
      sortedDates.forEach(dateKey => {
        if (dateKey === 'unscheduled') {
          dateLabels[dateKey] = 'Unscheduled';
        } else {
          const today = moment().format("YYYY-MM-DD");
          const selectedDateString = selectedDate ? moment(selectedDate).format("YYYY-MM-DD") : null;
          const yesterday = moment().subtract(1, 'days').format("YYYY-MM-DD");
          const tomorrow = moment().add(1, 'days').format("YYYY-MM-DD");

          if (selectedDateString && dateKey === selectedDateString && dateKey === today) {
            dateLabels[dateKey] = 'Plan for the day!';
          } else if (dateKey === today) {
            dateLabels[dateKey] = 'Today';
          } else if (dateKey === yesterday) {
            dateLabels[dateKey] = 'Yesterday';
          } else if (dateKey === tomorrow) {
            dateLabels[dateKey] = 'Tomorrow';
          } else {
            dateLabels[dateKey] = moment(dateKey).format("MMM D, YYYY");
          }
        }
      });

      setGroupedContent({ sortedDates, groupedByDate, dateLabels });
    } else {
      setGroupedContent({ sortedDates: [], groupedByDate: {}, dateLabels: {} });
    }
  }, [contents, handleSearch, selectedTab, selectedDate]);

  // Handle content ID from URL (when coming from calendar)
  useEffect(() => {
    if (contentIdParam && contents && contents.data?.length > 0) {
      const contentToView = contents.data.find((content: any) => content._id === contentIdParam);
      if (contentToView) {
        setViewContent(contentToView);
        setIsviewContentOpen(true);
      }
    }
  }, [contentIdParam, contents]);

  // Fetch filter categories
  useEffect(() => {
    fetchFilterCategories();
  }, []);

  const handleUpdateFunction = async (contentId: string, status: boolean) => {
    try {
      await apiClient("/api/update-content?timezone=" + moment.tz.guess(), {
        method: "PUT",
        body: JSON.stringify({ contentId, isCompleted: status }),
      });
      await refetch();
      setIsviewContentOpen(false)
      setViewContent(null)
    } catch (err: any) {
      toast({ description: err?.message || CONTENT.UPDATED_ERROR, variant: "destructive" });
    }
  }

  const handleDeleteFunction = async () => {
    try {
      setDeleteLoading(true);
      await apiClient("/api/delete-content?timezone=" + moment.tz.guess(), {
        method: "DELETE",
        body: JSON.stringify({ contentId: deleteId }),
      });
      setIsDeleteDialogOpen(!isDeleteDialogOpen);
      await refetch();
      toast({ description: CONTENT.DELETED });
      setDeleteLoading(false);
      setIsviewContentOpen(false)
      setViewContent(null)
    } catch (err: any) {
      toast({ description: err?.message || CONTENT.DELETED_ERROR, variant: "destructive" });
      setDeleteLoading(false);
    }
  }

  // Function to handle closing the content details and going back to calendar if needed
  const handleContentDetailClose = () => {
    setIsviewContentOpen(false);
    setViewContent(null);

    // Check if user came from calendar
    const fromCalendar = localStorage.getItem('calendarView');
    if (fromCalendar && contentIdParam) {
      // Navigate back to calendar
      window.location.href = '/calender';
    }
  };

  const handleFilterApply = (filters: FilterApplyProps) => {
    setFilters(filters);
  }

  return (
    <>
      {loading && <div className="flex justify-center">
        <RoundedLargeSpinner />
      </div>}
      <div className={`relative lg:px-[30px] lg:py-[40px] px-[20px] py-[20px] ${montserrat.className} bg-[#FCF7E4] h-screen`}>
        <div className="lg:flex block items-center justify-between mb-8">
          <div className="lg:mb-0 mb-2">
            <h1 className="md:text-[22px] text-[23px] bg-black text-transparent bg-clip-text font-semibold">
              Plan
            </h1>
            {/* <p className="text-base bg-black text-transparent bg-clip-text mt-1">
            Your ideas. Your voice. Fully in sync.
          </p> */}
          </div>
          <div className="md:flex block lg:justify-end items-center">
            <div className="flex items-center bg-white border border-[#E5E8F6] rounded-[10px] p-[10px] md:w-[353px] w-full me-[10px] mb-2 md:mb-0">
              <Search className="text-[#656565] font-[600] w-[14px] h-[14px]" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-[14px] ml-[10px] w-full outline-none text-[#999999] placeholder-[#999999]"
              />
            </div>
            <div className="w-full md:w-auto mb-2 md:mb-0 mr-[10px]">
              <DatePickerButton
                style={{ fontSize: "12px", width: "100%" }}
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
              />
            </div>
            <div className="w-full md:w-auto">
              <button
                type="button"
                onClick={() => { setIsOpen(!isOpen); setActionType("Add") }}
                className="w-full md:w-auto bg-gradient-to-r from-[#4C00FF] to-[#FF00A1] !rounded-[12px] px-0.5 py-0.5 text-center font-medium text-white shadow-[3px_12px_20px_rgba(255,0,150,0.2)] hover:shadow-[3px_12px_20px_rgba(255,0,150,0.2)]  transition-all duration-200"
              >
                <div className=" !rounded-[10px] bg-white px-[12px] md:[12px] py-2 md:py-[10px] text-black text-xs md:text-[16px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors duration-200">
                  <Plus className="h-[18px] md:h-[18px] w-[18px] md:w-[18px]" strokeWidth={2.5} />
                  New Plan
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 lg:flex justify-between items-start gap-[20px] ">
            <div className="2xl:w-[60%] xl:w-[54%] lg:w-[50%] w-full max-h-[calc(100vh-160px)] md:max-h-[calc(100vh-155px)] flex flex-col">
              <div className="flex-none md:flex block items-start justify-between">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-[10px] mb-2 lg:mb-0">
                    <Button className={`hover:bg-[#E5E8F6] hover:text-[#5D60FF] rounded-[10px] px-[12px] py-[8px] text-[14px] ${selectedTab === "history" ? "text-[#5D60FF] bg-[#E5E8F6]" : "text-[#000000] border border-[#E5E8F6] bg-[#FFFDF8]"} font-[400] w-full sm:w-auto`} onClick={() => { setSelectedTab("history"); setIsviewContentOpen(false) }}>History ({contents?.counts ? contents.counts.historyCount : 0})</Button>
                    <Button className={`hover:bg-[#E5E8F6] hover:text-[#5D60FF] rounded-[10px] px-[12px] py-[8px] text-[14px] ${selectedTab === "unscheduled" ? "text-[#5D60FF] bg-[#E5E8F6]" : "text-[#000000] border border-[#E5E8F6] bg-[#FFFDF8]"} font-[400] w-full sm:w-auto`} onClick={() => { setSelectedTab("unscheduled"); setIsviewContentOpen(false) }}>Unscheduled ({contents?.counts ? contents.counts.unScheduledCount : 0})</Button>
                    <Button className={`hover:bg-[#E5E8F6] hover:text-[#5D60FF] rounded-[10px] px-[12px] py-[8px] text-[14px] ${selectedTab === "content" ? "text-[#5D60FF] bg-[#E5E8F6]" : "text-[#000000] border border-[#E5E8F6] bg-[#FFFDF8]"} font-[400] w-full sm:w-auto`} onClick={() => { setSelectedTab("content"); setIsviewContentOpen(false) }}>Scheduled ({contents?.counts ? contents.counts.scheduledCount : 0})</Button>
                    <Button className={`hover:bg-[#E5E8F6] hover:text-[#5D60FF] rounded-[10px] px-[12px] py-[8px] text-[14px] ${selectedTab === "completed" ? "text-[#5D60FF] bg-[#E5E8F6]" : "text-[#000000] border border-[#E5E8F6] bg-[#FFFDF8]"} font-[400] w-full sm:w-auto`} onClick={() => { setSelectedTab("completed"); setIsviewContentOpen(false) }}>Completed ({contents?.counts ? contents.counts.completedCount : 0})</Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedDate && (
                      <div className="bg-[#E5E8F6] text-[#5D60FF] rounded-[10px] px-[12px] py-[6px] text-[12px] font-medium flex items-center gap-2">
                        <span>Date: {moment(selectedDate).tz(moment.tz.guess()).format("MMM D, YYYY")}</span>
                        <button
                          onClick={() => setSelectedDate(undefined)}
                          className="text-[#5D60FF] hover:text-[#4C00FF] font-bold"
                        >
                          <X className="h-[14px] w-[14px]" />
                        </button>
                      </div>
                    )}

                    {filters.contentPillars.length > 0 && (
                      <div className="bg-[#E5E8F6] text-[#5D60FF] rounded-[10px] px-[12px] py-[6px] text-[12px] font-medium flex items-center gap-2">
                        <span>Content Pillars: {filters.contentPillars.join(", ")}</span>
                        <button
                          onClick={() => setFilters({ ...filters, contentPillars: [] })}
                          className="text-[#5D60FF] hover:text-[#4C00FF] font-bold"
                        >
                          <X className="h-[14px] w-[14px]" />
                        </button>
                      </div>
                    )}

                    {filters.contentTypes.length > 0 && (
                      <div className="bg-[#E5E8F6] text-[#5D60FF] rounded-[10px] px-[12px] py-[6px] text-[12px] font-medium flex items-center gap-2">
                        <span>Content Types: {filters.contentTypes.join(", ")}</span>
                        <button
                          onClick={() => setFilters({ ...filters, contentTypes: [] })}
                          className="text-[#5D60FF] hover:text-[#4C00FF] font-bold"
                        >
                          <X className="h-[14px] w-[14px]" />
                        </button>
                      </div>
                    )}

                    {filters.platforms.length > 0 && (
                      <div className="bg-[#E5E8F6] text-[#5D60FF] rounded-[10px] px-[12px] py-[6px] text-[12px] font-medium flex items-center gap-2">
                        <span>Platforms: {filters.platforms.join(", ")}</span>
                        <button
                          onClick={() => setFilters({ ...filters, platforms: [] })}
                          className="text-[#5D60FF] hover:text-[#4C00FF] font-bold"
                        >
                          <X className="h-[14px] w-[14px]" />
                        </button>
                      </div>
                    )}

                    {filters.targetAudience.length > 0 && (
                      <div className="bg-[#E5E8F6] text-[#5D60FF] rounded-[10px] px-[12px] py-[6px] text-[12px] font-medium flex items-center gap-2">
                        <span>Audiences: {filters.targetAudience.join(", ")}</span>
                        <button
                          onClick={() => setFilters({ ...filters, targetAudience: [] })}
                          className="text-[#5D60FF] hover:text-[#4C00FF] font-bold"
                        >
                          <X className="h-[14px] w-[14px]" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full md:w-auto flex justify-center md:justify-start lg:mt-0 mt-2 md:mt-0 md:mb-0 mb-2">
                  <FilterModal open={filterOpen} onOpenChange={setFilterOpen} filterCategories={filterCategories} handleFilterApply={handleFilterApply} defaultFilters={filters} />
                  <Button
                    className="bg-white hover:bg-white rounded-[10px] px-[12px] py-[8px] text-[14px] text-[#000000] font-[500] border border-[#E5E8F6]"
                    onClick={() => setFilterOpen(true)}
                  >
                    <Image
                      src="/images/pages/filter-icon.svg"
                      alt="KLQUE Logo"
                      width={17}
                      height={12}
                      className="mr-1" />
                    Filter
                  </Button>
                </div>
              </div>
              <PerfectScrollbar options={{ suppressScrollX: true }}>
                {contents && contents.data && contents.data.length > 0 && groupedContent.sortedDates.map((dateKey) => (
                  <div key={dateKey}>
                    <p className="my-[21px] text-black font-[600]">{groupedContent.dateLabels[dateKey]}</p>
                    <div className="grid xl:grid-cols-2 grid-cols-1 lg:gap-x-[30px] gap-x-[10px] gap-y-[10px] w-full overflow-y-auto md:pb-10 pb-20 lg:pb-0">
                      {groupedContent.groupedByDate[dateKey].map((item: any, index: number) => (
                        <div key={index} className="h-fit">
                          <ContentCard
                            selectedContentId={viewContent?._id}
                            content={item}
                            setIsOpen={setIsOpen}
                            setEditContent={setEditContent}
                            setActionType={setActionType}
                            setDeleteId={setDeleteId}
                            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                            setViewContent={setViewContent}
                            setIsviewContentOpen={setIsviewContentOpen}
                            viewContentId={viewContent?._id}
                            handleUpdateFunction={handleUpdateFunction}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </PerfectScrollbar>
              {contents && contents.data && contents.data.length === 0 && (
                <div className="flex justify-center items-center h-screen">
                  <p className="text-gray-500">No content available</p>
                </div>
              )}
              {/* <p className="my-[21px] text-black font-[600]">Yesterday</p>
                <div className="grid md:grid-cols-2 grid-cols-1 lg:gap-x-[30px] gap-x-[10px] gap-y-[10px] w-full h-full overflow-y-auto">
                  {contents?.length > 0 && contents?.map((item: any, index: number) => (
                    <div key={index} className="h-fit">
                      <ContentCard
                        content={item}
                        setIsOpen={setIsOpen}
                        setEditContent={setEditContent}
                        setActionType={setActionType}
                        setDeleteId={setDeleteId}
                        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                        setViewContent={setViewContent}
                        setIsviewContentOpen={setIsviewContentOpen}
                        viewContentId={viewContent?._id}
                        handleUpdateFunction={handleUpdateFunction}
                      />
                    </div>
                  ))}
                </div> */}
            </div>
            <div className="2xl:w-[40%] xl:w-[46%] lg:w-[50%] w-full xl:h-full  lg:mt-0 mt-4 ">
              {isviewContentOpen && <ContentDetails
                setIsviewContentOpen={handleContentDetailClose}
                contentId={viewContent?._id}
                setViewContent={setViewContent}
                setIsOpen={setIsOpen}
                isOpen={isOpen}
                setActionType={setActionType}
                editContent={editContent}
                setEditContent={setEditContent}
                handleUpdateFunction={handleUpdateFunction}
              />}
            </div>
          </div>
        </div>

        <ContentDialog
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          setEditContent={setEditContent}
          actionType={actionType}
          editContent={editContent}
          refetch={refetch}
        />

        <ConfirmationModal
          isOpen={isDeleteDialogOpen}
          setIsOpen={setIsDeleteDialogOpen}
          loading={deleteLoading}
          handleYesFunction={handleDeleteFunction}
        />
      </div>
    </>
  )
}