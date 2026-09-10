import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, Check, Sparkles, Plus, Zap } from 'lucide-react';

interface MultiSelectPopupProps {
  triggerLabel: string;
  title: string;
  scriptIds: string[];
  selectedIds: string[];
  onSelectionToggle: (scriptId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buttonClassName?: string;
  buttonIcon?: 'sparkles' | 'plus' | 'zap';
  prefixId?: string;
  gradientColors?: {
    from: string;
    to: string;
    border: string;
  };
}

const MultiSelectPopup: React.FC<MultiSelectPopupProps> = ({
  triggerLabel,
  title,
  scriptIds,
  selectedIds,
  onSelectionToggle,
  onSelectAll,
  onClearAll,
  onConfirm,
  onCancel,
  open,
  onOpenChange,
  buttonClassName = "",
  buttonIcon = 'sparkles',
  prefixId = "",
  gradientColors = {
    from: '[#5D60FF]',
    to: '[#7B7DFF]',
    border: '[#5D60FF]'
  }
}) => {
  const getIcon = () => {
    switch (buttonIcon) {
      case 'plus':
        return <Plus className="w-3 h-3" />;
      case 'zap':
        return <Zap className="w-3 h-3" />;
      default:
        return <Sparkles className="w-3 h-3" />;
    }
  };

  const getGradientClass = () => {
    return `!bg-gradient-to-r from-${gradientColors.from} to-${gradientColors.to}`;
  };

  const getCheckboxColor = () => {
    return gradientColors.from.replace('[', '').replace(']', '');
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className={`${getGradientClass()} rounded-full border-${gradientColors.border} !text-white md:text-[12px] px-[12px] py-[6px] ml-2 h-[32px] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 ${buttonClassName}`}
          >
            {getIcon()}
            {triggerLabel}
            {selectedIds.length > 0 && (
              <Badge variant="secondary" className={`ml-1 bg-white text-${gradientColors.from} px-1 py-0 text-[10px]`}>
                {selectedIds.length}
              </Badge>
            )}
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 bg-white/95 backdrop-blur-sm border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
        <div className={`bg-gradient-to-br from-${gradientColors.from}/10 to-${gradientColors.to}/10 p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* {getIcon()} */}
              <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            </div>
            {selectedIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-gray-600 hover:text-gray-800"
                onClick={onClearAll}
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
              {scriptIds.map((doc: any) => (
                <Card
                  key={doc?.scriptId}
                  className={`p-3 cursor-pointer transition-all duration-200 border-2 ${selectedIds.includes(doc?.scriptId)
                    ? `border-${gradientColors.from} bg-${gradientColors.from}/5 shadow-md`
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                    }`}
                  onClick={() => onSelectionToggle(doc?.scriptId)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedIds.includes(doc?.scriptId)}
                      onChange={() => { }}
                      className={`border-${gradientColors.from} data-[state=checked]:bg-${getCheckboxColor()}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-600 mt-1 line-clamp-2">
                          {prefixId ? `${prefixId} ${doc?.scriptId}` : doc?.scriptId}
                        </span>
                      </div>
                      {doc?.title && (
                        <p className="text-sm font-medium text-gray-800">
                          {doc?.title}
                        </p>
                      )}
                    </div>
                    {selectedIds.includes(doc?.scriptId) && (
                      <Check className={`w-4 h-4 text-${gradientColors.from}`} />
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
            className={`w-full ${getGradientClass()} hover:from-${gradientColors.from} hover:to-${gradientColors.to} text-white font-medium py-2 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            onClick={onConfirm}
            disabled={selectedIds.length === 0}
          >
            {getIcon()}
            Selected {selectedIds.length > 0 ? `${selectedIds.length} ` : ''}{prefixId}{selectedIds.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelectPopup;