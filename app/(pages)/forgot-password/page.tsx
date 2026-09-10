"use client"

import { apiClient } from "@/client/client"
import { montserrat } from "@/app/layout"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { AUTH } from "@/constant/toast-message"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiClient("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      })
      setEmail("");
      toast({
        description: AUTH.PASSWORD_RESET_INSTRUCTIONS,
      })
    } catch (error: any) {
      toast({ description: (error?.message || AUTH.PASSWORD_RESET_ERROR), variant: "destructive" });
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex flex-col lg:flex-row h-screen ${montserrat.className}`}>
      {/* Left side / Bottom on mobile */}
      <div className="w-full lg:w-2/5 bg-[#FFFDF8] flex flex-col items-center justify-center md:p-6 p-[20px] lg:order-1 order-2">
        <div className="text-center mb-6">
          <div className="mb-10">
            <Image
              src="/images/logos/klque-logo.PNG"
              alt="KLQUE Logo"
              width={180}
              height={90}
              priority
              className="mx-auto lg:max-w-full  max-w-[100px]  h-auto"
            />
          </div>
          <h2 className={`lg:text-2xl text-[20px] font-semibold mb-2 ${montserrat.className}`}>
            Reset your password
          </h2>
          <form onSubmit={handleSubmit} className="mt-6 w-full max-w-xs mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5D60FF] mb-4"
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#5D60FF] text-white py-2 rounded-lg hover:bg-[#4A4CC7] transition-colors md:text-sm text-[13px] font-[500] ${loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 text-[#5D60FF] hover:underline md:text-sm text-[13px] font-[500]"
          >
            Back to login
          </button>
        </div>
      </div>

      {/* Right side (Illustration) */}
      <div className="w-full lg:w-3/5 relative flex items-center justify-center bg-[#FCF7E4] p-0 lg:order-2 order-1">
        <Image
          src="/images/pages/welcome_background.PNG"
          alt="Welcome Background"
          width={800}
          height={800}
          className="object-contain"
          priority
        />
      </div>
    </div>
  )
}