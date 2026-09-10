import { Calendar, ChevronRight, Facebook, Instagram, Linkedin, Trash2, Twitter, Youtube, Music } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import moment from "moment-timezone";

import { Pencil, Trash } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ContentCardProps {
  content: any
  setEditContent: any
  setActionType: any
  setDeleteId: any
  setIsOpen: any
  setIsDeleteDialogOpen: any
  setViewContent: any
  setIsviewContentOpen: any
  viewContentId: any
  handleUpdateFunction: any
  selectedContentId: any
}

const platformIcons: any = {
  instagram: <Instagram className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  tiktok: <Music className="w-4 h-4" />
};

export function ContentCard({ content, setEditContent, setActionType, setDeleteId, setIsOpen, setIsDeleteDialogOpen, setViewContent, setIsviewContentOpen, viewContentId, handleUpdateFunction, selectedContentId }: ContentCardProps) {
  // Format date for display
  // Format date for display
  const formattedDate = content?.postingDate ? moment(content.postingDate).tz(moment.tz.guess()).format("MMM D, YYYY") : '';

  return (
    <Card
      className={`group group-hover:bg-[#E5E8F6] cursor-pointer hover:shadow-none transition-shadow w-full max-w-full h-fit bg-white text-black rounded-[10px] ${selectedContentId === content?._id ? 'border border-[#5D60FF] bg-[#E5E8F6]' : ' border-none'}`}
    >
      <CardContent className="relative !px-[18px] !py-[14px] group-hover:bg-[#E5E8F6] rounded-[10px]">
        <div className="h-full min-h-[120px] w-full group group-hover:bg-[#E5E8F6] rounded-[10px]">
          <div>
            <div>
              <div className='flex items-start justify-between'>
                {/* <div className='flex items-center'>
                  <div className='min-w-[15px] mr-[6.5px] hidden group-hover:block transition-opacity duration-200 -ml-[8.5px]'>
                    <Image
                      src="/images/pages/grey-checkbox.svg"
                      alt="preview"
                      width={15}
                      height={15} />
                  </div>
                </div> */}
                <p className='text-[12px] font-[600] text-black 2xl:min-w-[80%] lg:min-w-[75%] w-full'>{content?.ideaTitle}</p>
                <div className='sm:flex block items-start'>
                  <div className='flex items-center justify-end w-full space-x-[4px]' onClick={(e) => { e.stopPropagation(); setViewContent(content); setIsviewContentOpen(true) }}>
                    <div className='min-w-[14.29px]'>
                      <Image
                        src="/images/pages/preview.png"
                        alt="preview"
                        width={14.29}
                        height={10} />
                    </div>
                    <p className='font-[400] text-[12px]  ml-[4px] text-black'>Preview</p>
                  </div>
                </div>
              </div>
              <div className="mb-[6px] mt-[4px]">
                <div className="flex items-center font-[400] text-black">
                  <span className="text-[12px]">{formattedDate}</span>
                </div>
              </div>
              <h3 className="min-h-[63px] line-clamp-3 md:text-[14px] text-[12px] font-[500] text-[#141522]">
                {content?.hook}
              </h3>
            </div>
          </div>

          <div className="flex items-center justify-between mt-[16px] pt-[7px] border-t-[1px] border-[#c9c9c9] group-hover:border-[#C9C9C9] ">
            <TooltipProvider key={selectedContentId}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Checkbox
                    className={`group-hover:bg-white rounded-full w-4 h-4 ${selectedContentId === content?._id ? '!bg-white opacity-1' : ''}`}
                    checked={content?.isCompleted}
                    onCheckedChange={(checked: boolean) =>
                      handleUpdateFunction(content?._id, checked as boolean)
                    }
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{content?.isCompleted ? 'Click to mark as incomplete' : 'Click to mark as completed'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="p-1 rounded-full hover:bg-gray-100">
                    <Image
                      src="/images/pages/option-icon.svg"
                      alt="Options"
                      width={24}
                      height={24}
                      className="object-contain size-4"
                    />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[140px] bg-white border border-gray-200 rounded-lg shadow-md p-1"
                    sideOffset={4}
                  >
                    {/* Edit Option */}
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setIsOpen(true);
                        setActionType("Edit");
                        setEditContent(content);
                      }}
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                      Edit
                    </DropdownMenu.Item>

                    {/* Delete Option */}
                    <DropdownMenu.Item
                      onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true); setDeleteId(content?._id) }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-md cursor-pointer hover:bg-red-50"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

