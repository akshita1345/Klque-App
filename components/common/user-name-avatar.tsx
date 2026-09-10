import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from "@/lib/utils"

const UserNameAvatar = ({ name, className }: { name: string, className?: string }) => {
  return (
    <Avatar className={cn(className, "rounded-full ltr:mr-2 rtl:ml-2")}>
      <AvatarImage src="" alt="KLQUE" />
      {/* <AvatarFallback>{name?.slice(0, 2) || ""}</AvatarFallback> */}
      <AvatarFallback>{name?.split(" ").length > 1 ? name?.split(" ").map((word: any) => word[0]).join("") : name?.slice(0, 2) || ""}</AvatarFallback>
    </Avatar>
  )
}

export default UserNameAvatar