"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { montserrat } from "@/app/layout"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/client/client"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Cookies from "js-cookie"

export default function PaymentSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionCode = searchParams.get("session_code")
  const userId = searchParams.get("userId")

  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(10)

  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null
  const verificationStart = useRef(false)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * 🔹 Verify payment with backend & handle onboarding + confirmation email
   */
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true)

        if (!sessionCode || !userId) {
          setError("Missing session details")
          setLoading(false)
          return
        }

        // Step 1: Verify payment
        const response = await apiClient("/api/verify-payment", {
          method: "POST",
          body: JSON.stringify({ sessionCode, userId }),
        })

        if (!response.success) {
          setError("Payment verification failed. Please try again.")
          setVerified(false)
          setLoading(false)
          return
        }

        // Step 2: Mark as verified
        setVerified(true)

        // Step 3: Onboarding if not already onboarded
        const res = await fetch(`/api/get-user?userId=${userId}`)
        const data = await res.json()

        // if (!data?.user?.isOnboarded) {
        //   const input = {
        //     data: ["Welcome"], // Dummy onboarding step
        //     step: 1,
        //     userId,
        //   }
        //   await apiClient("/api/onboard", {
        //     method: "POST",
        //     body: JSON.stringify(input),
        //   })
        // }

        // Step 4: Send confirmation email (AFTER verification succeeds)
        if (user?.email) {
          await apiClient("/api/send-confirmation", {
            method: "POST",
            body: JSON.stringify({ userId: user._id, email: user.email }),
          })
        }

        setLoading(false)
      } catch (err: any) {
        console.error("Error verifying payment:", err)
        setError("Unexpected error while verifying payment.")
        setLoading(false)
      }
    }

    if (!verificationStart.current) {
      verificationStart.current = true
      verifyPayment()
    }
  }, [sessionCode, userId, user])

  // Auto-click countdown timer
  useEffect(() => {
    if (verified && !loading) {
      setCountdown(10)
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
            }
            handleContinue()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [verified, loading])

  /**
   * 🔹 Handle button click
   */
  const handleContinue = () => {
    // if (verified) {
    //   router.push("/onboard/content-type") // Verified → onboarding
    // } else {
    router.push("/ideate?tour=true") // Failed → ideation retry
    // }
  }

  /**
   * 🔹 Loading Card UI
   */
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen bg-[#FFFDF8] p-8 ${montserrat.className}`}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <Image
              src="/images/logos/klque-logo.PNG"
              alt="KLQUE Logo"
              width={120}
              height={60}
              priority
              className="mx-auto"
            />
          </div>
          <div className="flex justify-center mb-6">
            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Processing Payment...</h1>
          <p className="text-gray-600 mb-6">
            Please wait while we verify your payment. This may take a few seconds.
          </p>
          <Button disabled className="bg-gray-400 text-white py-2 px-6 rounded-md">
            Processing...
          </Button>
        </div>
      </div>
    )
  }

  /**
   * 🔹 Success / Failure UI
   */
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-[#FFFDF8] p-8 ${montserrat.className}`}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {/* Logo */}
        <div className="mb-6">
          <Image
            src="/images/logos/klque-logo.PNG"
            alt="KLQUE Logo"
            width={120}
            height={60}
            priority
            className="mx-auto"
          />
        </div>

        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {verified ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-4">
          {verified ? "Payment Successful!" : "Payment Verification Failed"}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {verified
            ? "Thank you for subscribing to Klque Pro! Your payment has been processed successfully. You now have full access to all premium features."
            : error || "We couldn’t verify your payment. Please try again."}
        </p>

        {/* Button */}
        <Button
          onClick={handleContinue}
          className={`py-2 px-6 rounded-md text-white ${verified ? "bg-indigo-500 hover:bg-indigo-600" : "bg-red-500 hover:bg-red-600"
            }`}
        >
          {verified ? `Continue (${countdown}s)` : "Try Again"}
        </Button>
      </div>
    </div>
  )
}