"use client"

import Image from "next/image"
import { useEffect, useState, useRef } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { apiClient } from "@/client/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { LogoHeader } from "@/components/verify-email/LogoHeader"
import { OtpInput } from "@/components/verify-email/OtpInput"
import { MagicLinkAlert } from "@/components/verify-email/MagicLinkAlert"
import { ResendSection } from "@/components/verify-email/ResendSection"
import { StatusMessages } from "@/components/verify-email/StatusMessages"
import RoundedLargeSpinner from "@/components/common/round-large-spinner"
import { Montserrat } from "next/font/google"


// Loading spinner component
const LoadingSpinner = () => {
  return (
    <div className="flex justify-center">
      <RoundedLargeSpinner />
    </div>
  )
}

// Assuming montserrat is available - if not, remove this import and className usage
// const montserrat = { className: "font-sans" } // Fallback if import fails
export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
export default function VerifyEmail() {

  const [userEmail, setUserEmail] = useState<string>("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const [bootstrapping, setBootstrapping] = useState(true); // NEW

  const router = useRouter()

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          // No user in cookies => just stop bootstrapping and show OTP UI
          if (!cancelled) setBootstrapping(false);
          return;
        }

        const userObj = JSON.parse(userStr);
        if (userObj?.email) setUserEmail(userObj.email);

        // If already verified, bounce them out immediately
        if (userObj?.emailVerified) {
          router.replace("/ideate");
          return; // IMPORTANT: don't touch state after navigation
        }

        // Otherwise, check server user to know where to send them
        const { user } = await apiClient(`/api/get-user?userId=${userObj.id}`, {
          method: "GET",
        });

        if (cancelled) return;

        if (!user?.isOnboarded) {
          const onboardingRoutes = [
            "/onboard/describe",
            "/onboard/main-goal",
            "/onboard/new-vibe",
            "/onboard/tone-voice",
            "/onboard/start-onboarding",
          ];

          const nextRoute =
            typeof user?.onboardingStep === "number" &&
              onboardingRoutes[user.onboardingStep]
              ? onboardingRoutes[user.onboardingStep]
              : "/ideate";

          router.replace(nextRoute);
          return;
        } else {
          router.replace("/ideate");
          return;
        }
      } catch (e) {
        console.error("bootstrap failed", e);
        // Fall back to showing OTP screen
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);


  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only take the last character
    setOtp(newOtp)
    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newOtp = [...otp]

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)

    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleSubmit = async () => {
    const otpString = otp.join("")

    if (otpString.length !== 6) {
      setError("Please enter all 6 digits")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      const response = await apiClient('/api/verify-email', {
        method: 'POST',
        body: JSON.stringify({ otp: otpString, email: userEmail })
      })

      setSuccess("Email verified successfully! Redirecting...")
      toast.success(response.message)
      setTimeout(() => {
        router.replace("/onboard/content-type")
      }, 2000)
    } catch (error: any) {
      console.error('error...', error)
      setError(error.message || "Verification failed. Please try again.")
      toast.error(error.message)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    setError("")
    setSuccess("")

    try {
      // Replace with your actual resend API call
      const response = await apiClient('/api/send-verification', {
        method: 'POST',
        body: JSON.stringify({ email: userEmail })
      })

      setSuccess("Verification email sent successfully!")
      toast.success("Verification email sent!")
      setResendCooldown(60) // 60 second cooldown

      // Clear OTP inputs
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } catch (error: any) {
      setError("Failed to resend email. Please try again.")
      toast.error("Failed to resend email")
    } finally {
      setIsResending(false)
    }
  }

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Get user data from cookies
        const userData = localStorage.getItem("user")
        if (userData) {
          try {
            const user = JSON.parse(userData)
            if (user?.email) {
              setUserEmail(user.email)
            }
            if (user?.emailVerified) {
              router.push("/ideate")
              return
            }
          } catch (error) {
            console.error("Error parsing user data:", error)
          }
        }
      } catch (error) {
        console.error("Error initializing component:", error)
      }
    }

    initializeComponent()
  }, [router])

  const isOtpComplete = otp.every((digit) => digit !== "")

  const handleRouterBack = () => {
    Cookies.remove('token')
    Cookies.remove('userId')
    localStorage.clear();
    router.replace('/login')
  }

  return (
    <div className={`flex flex-col lg:flex-row h-screen ${montserrat.className}`}>
      {/* Left side / Bottom on mobile */}
      <div className="w-full lg:w-2/5 bg-[#FFFDF8] flex flex-col items-center justify-center p-6 lg:order-1 order-2">
        <div className="w-full max-w-sm">
          <LogoHeader userEmail={userEmail} />
          <div className="space-y-6">
            <OtpInput
              otp={otp}
              isVerifying={isVerifying}
              onOtpChange={handleOtpChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onSubmit={handleSubmit}
              isOtpComplete={isOtpComplete}
              inputRefs={inputRefs}
            />
          </div>
          {/* <MagicLinkAlert /> */}
          <ResendSection
            isResending={isResending}
            resendCooldown={resendCooldown}
            onResend={handleResendEmail}
            userEmail={userEmail}
          />
          <div className={`${montserrat.className}`}>
            <StatusMessages error={error} success={success} />
          </div>
          <div className={`text-center mt-6 ${montserrat.className}`}>
            <Button
              variant="ghost"
              className={`text-sm text-gray-600 hover:text-gray-900 ${montserrat.className}`}
              onClick={() => handleRouterBack()}
              disabled={isVerifying || isResending}
            >
              ← Back to login
            </Button>
          </div>
        </div>
      </div>

      {/* Right side (Illustration) */}
      <div className="w-full lg:w-3/5 relative flex items-center justify-center bg-[#FCF7E4] p-0  lg:order-2 order-1">
        <Image
          src="/images/pages/welcome_background.PNG"
          alt="Welcome Background"
          width={800}
          height={800}
          className="object-contain"
          priority
        />
      </div>

      {/* Loading Overlays */}
      {(bootstrapping) && (
        <LoadingSpinner />
      )}
    </div>
  )
}