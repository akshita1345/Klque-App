import { TooltipContent, TooltipProvider, TooltipTrigger, Tooltip } from "../ui/tooltip"

const CommonTooltip = ({ triggerElement, toolTipContent, contentWidth, iconWidth, iconHeight }: any) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {triggerElement}
        </TooltipTrigger>
        <TooltipContent className={`max-w-[${contentWidth}px]`}>{toolTipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default CommonTooltip