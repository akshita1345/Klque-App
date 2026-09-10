import { montserrat } from "@/app/layout";
import { Button } from "@/components/ui/button"

export function ResendSection({
  isResending,
  resendCooldown,
  onResend,
  userEmail
}: {
  isResending: boolean;
  resendCooldown: number;
  onResend: () => void;
  userEmail: string;
}) {
  return (
    <div className={`text-center space-y-3 mt-6 ${montserrat.className}`}>
      <p className="text-sm text-gray-600">Didn&apos;t receive the email?</p>
      <Button
        variant="outline"
        onClick={onResend}
        disabled={isResending || resendCooldown > 0}
        className="w-full border-[#5D60FF]/20 text-[#5D60FF] hover:bg-[#5D60FF]/5"
      >
        {isResending ? (
          <>
            <span className="w-4 h-4 mr-2 animate-spin inline-block">⏳</span>
            Sending...
          </>
        ) : resendCooldown > 0 ? (
          `Resend in ${resendCooldown}s`
        ) : (
          "Resend Email"
        )}
      </Button>
      <div className={`text-xs text-gray-500 space-y-1 ${montserrat.className}`}>
        <p>• Check your spam/junk folder</p>
        <p>• Make sure {userEmail} is correct</p>
        <p>• The code expires in 10 minutes</p>
      </div>
    </div>
  )
} 