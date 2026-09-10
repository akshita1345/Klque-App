import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useEffect } from "react";
import { montserrat } from "@/app/layout";

export function OtpInput({
  otp,
  isVerifying,
  onOtpChange,
  onKeyDown,
  onPaste,
  onSubmit,
  isOtpComplete,
  inputRefs
}: {
  otp: string[];
  isVerifying: boolean;
  onOtpChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onSubmit: () => void;
  isOtpComplete: boolean;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}) {

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  return (
    <div className="space-y-4">
      <label className={`text-sm font-medium text-center block text-gray-700 ${montserrat.className}`}>
        Enter the 6-digit code
      </label>
      <div className={`flex justify-center gap-2 ${montserrat.className}`}>
        {otp.map((digit, index) => (
          <Input
            key={index}
            ref={el => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => onOtpChange(index, e.target.value)}
            onKeyDown={e => {
              onKeyDown(index, e);
              if (e.key === "Enter" && isOtpComplete && !isVerifying) {
                onSubmit();
              }
            }}
            onPaste={onPaste}
            className="w-10 h-10 text-center text-lg font-semibold border-2 rounded-lg"
            disabled={isVerifying}
          />
        ))}
      </div>
      <Button 
        onClick={onSubmit}
        disabled={!isOtpComplete || isVerifying}
        className={`w-full bg-[#5D60FF] hover:bg-[#5D60FF]/90 md:text-sm text-[13px] text-white rounded-lg ${montserrat.className}`}
      >
        {isVerifying ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify Code"
        )}
      </Button>
    </div>
  )
} 