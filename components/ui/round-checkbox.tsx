"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const RoundCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
  ref={ref}
  className={cn(
    "!h-[24px] !w-[24px] shrink-0 !rounded-full border-[#999999] border-2 flex items-center justify-center data-[state=checked]:border-[1px] data-[state=checked]:border-[#5D60FF] bg-transparent",
    "data-[state=checked]:bg-transparent data-[state=checked]:text-[#999999]]", // grey icon when checked
    "focus-visible:outline-none disabled:cursor-not-allowed",
    className
  )}
  {...props}
>
  <CheckboxPrimitive.Indicator
    className={cn(
      "w-[18px] h-[18px] bg-transparent rounded-full flex items-center justify-center data-[state=checked]:text-[#999999] data-[state=checked]:bg-[#5D60FF]", // force grey icon color
      "data-[state=checked]:text-[#fff] data-[state=checked]:border-[#5D60FF]"              // also grey when checked
    )}
  >
    <Check className="h-[14px] w-[12px] stroke-[3]" />
  </CheckboxPrimitive.Indicator>
</CheckboxPrimitive.Root>
))
RoundCheckbox.displayName = CheckboxPrimitive.Root.displayName

export { RoundCheckbox }
