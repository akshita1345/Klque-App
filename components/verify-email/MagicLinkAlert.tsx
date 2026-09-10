import { montserrat } from "@/app/layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Link } from "lucide-react"

export function MagicLinkAlert() {
  return (
    <div className={`mt-6 ${montserrat.className}`}>
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-[#FFFDF8] px-2 text-gray-500">OR</span>
        </div>
      </div>
      <Alert className="border-black bg-black/5">
        <Link className="w-4 h-4 text-black" />
        <AlertDescription className="text-black text-sm">
          <strong>Magic Link Alternative:</strong> Check your email for a magic link. Click it to automatically
          sign in without entering the code.
        </AlertDescription>
      </Alert>
    </div>
  )
} 