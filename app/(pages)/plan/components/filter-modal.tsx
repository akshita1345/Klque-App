"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BlueCheckbox } from "@/components/ui/BlueCheckbox"
import { Separator } from "@/components/ui/separator"
import { FilterApplyProps } from "./plan-dashboard"
import { Montserrat } from 'next/font/google';

interface FilterOption {
  id: string
  label: string
  count?: number
}
const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});
interface FilterCategoryProps {
  title: string
  options: FilterOption[]
  selectedOptions: string[]
  onSelectionChange: (id: string) => void
}

const FilterCategory = ({
  title,
  options = [],
  selectedOptions,
  onSelectionChange
}: FilterCategoryProps) => {
  const [showAll, setShowAll] = useState(false);

  // Display only first 4 options if showAll is false
  const visibleOptions = showAll ? options : options?.slice(0, 3);
  const hasMoreOptions = options?.length > 3;

  return (
    <div className={`mb-[20px] ${montserrat.className}`}>
      <h3 className="text-[16px] font-[600] mt-[30px]">{title}</h3>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center">
          {visibleOptions.map((option) => (
            <div key={option.id} className="mt-4 flex items-start min-w-[150px] mr-[10px]">
              <BlueCheckbox
                id={option.id}
                checked={selectedOptions.includes(option.id)}
                onCheckedChange={() => onSelectionChange(option.id)}
                className="mr-[5.28px]"
              />
              <label
                htmlFor={option.id}
                className="text-[16px] font-medium cursor-pointer text-black"
              >
                {option.label}
              </label>
              {option.count !== undefined && (
                <span className="text-[16px] text-[#838383] ml-1">({option.count})</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end min-w-[80px]">
          {hasMoreOptions && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="text-[14px] text-[#000000] mt-4 font-[600]"
            >
              +{options.length - 3} more
            </button>
          )}

        </div>

      </div>
    </div>
  )
}

interface FilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filterCategories: {
    targetAudience: FilterOption[],
    contentPillar: FilterOption[],
    contentType: FilterOption[],
    platform: FilterOption[],
  },
  handleFilterApply: (filters: FilterApplyProps) => void,
  defaultFilters?: FilterApplyProps
}

export function FilterModal({ open, onOpenChange, filterCategories, handleFilterApply, defaultFilters }: FilterModalProps) {
  const [selectedContentPillars, setSelectedContentPillars] = useState<string[]>([])
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([])
  const { targetAudience: audiences = [], contentPillar: contentPillars = [], contentType: contentTypes = [], platform: platforms = [] } = filterCategories

  useEffect(() => {
    setSelectedContentPillars(defaultFilters?.contentPillars || []);
    setSelectedContentTypes(defaultFilters?.contentTypes || []);
    setSelectedPlatforms(defaultFilters?.platforms || []);
    setSelectedAudiences(defaultFilters?.targetAudience || []);
  }, [open, defaultFilters])

  const handleContentPillarChange = (id: string) => {
    setSelectedContentPillars(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleContentTypeChange = (id: string) => {
    setSelectedContentTypes(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handlePlatformChange = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleAudienceChange = (id: string) => {
    setSelectedAudiences(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleClearAll = () => {
    setSelectedContentPillars([])
    setSelectedContentTypes([])
    setSelectedPlatforms([])
    setSelectedAudiences([])
  }

  const handleApply = async () => {
    await handleFilterApply({
      contentPillars: selectedContentPillars,
      contentTypes: selectedContentTypes,
      platforms: selectedPlatforms,
      targetAudience: selectedAudiences,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`bg-[#FFFDF8] p-6 lg:max-w-[870px] md:max-w-[650px] sm:max-w-[500px] w-full max-h-[90vh] overflow-y-auto !px-[24px] !pt-[6px] pb-[30px] ${montserrat.className}`}>
        {/* <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Filter</DialogTitle>
        </DialogHeader> */}

        <div className="mt-[10px]">
          <FilterCategory
            title="Content Pillar"
            options={[...contentPillars].sort((a, b) => a.label.localeCompare(b.label))}
            selectedOptions={selectedContentPillars}
            onSelectionChange={handleContentPillarChange}
          />

          <Separator className="my-4" />

          <FilterCategory
            title="Content Type"
            options={[...contentTypes].sort((a, b) => a.label.localeCompare(b.label))}
            selectedOptions={selectedContentTypes}
            onSelectionChange={handleContentTypeChange}
          />

          <Separator className="my-4" />

          <FilterCategory
            title="Platform"
            options={[...platforms].sort((a, b) => a.label.localeCompare(b.label))}
            selectedOptions={selectedPlatforms}
            onSelectionChange={handlePlatformChange}
          />

          <Separator className="my-4" />

          <FilterCategory
            title="Target Audience"
            options={[...audiences].sort((a, b) => a.label.localeCompare(b.label))}
            selectedOptions={selectedAudiences}
            onSelectionChange={handleAudienceChange}
          />
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="px-0 hover:text-[#5D60FF] hover:bg-transparent bg-transparent text-[#5D60FF] border-none"
          >
            Clear All
          </Button>
          <Button
            onClick={handleApply}
            className="bg-[#5D60FF] hover:bg-[#5D60FF] rounded-[5px] font-[600] !text-[16px] space-x-[10px] py-[10px] px-[20px]"
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
