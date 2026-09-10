"use client"

import { apiClient } from "@/client/client"
import { montserrat } from "@/app/layout"
import Image from "next/image"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { AUTH } from "@/constant/toast-message"
import { Eye, EyeOff } from "lucide-react"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams();
  const _id = searchParams.get('_id');
  const code = searchParams.get('code');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const showError = (description: string) =>
      toast({ description, variant: "destructive" });

    setPasswordError("");
    setConfirmPasswordError("");

    let hasError = false;

    // Strong password validation: at least 8 chars, uppercase, lowercase, number, special char
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      setPasswordError("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
      hasError = true;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      await apiClient("/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ _id, password, code }),
      });

      toast({ description: AUTH.PASSWORD_RESET_SUCCESS });
      router.push("/login");
    } catch (error: any) {
      console.error("Error during password reset:", error);
      showError(error?.message || AUTH.PASSWORD_RESET_FAILURE);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={`flex flex-col lg:flex-row h-screen ${montserrat.className}`}>
      {/* Left side / Bottom on mobile */}
      <div className="w-full lg:w-2/5 bg-[#FFFDF8] flex flex-col items-center justify-center p-6 lg:order-1 order-2">
        <div className="text-center mb-6">
          <div className="mb-10">
            <Image
              src="/images/logos/klque-logo.PNG"
              alt="KLQUE Logo"
              width={180}
              height={90}
              priority
              className="mx-auto lg:max-w-full max-w-[100px] h-auto"
            />
          </div>
          <h2 className={`lg:text-2xl text-[20px] font-semibold mb-2 ${montserrat.className}`}>
            Set your new password
          </h2>


        </div>
        <form onSubmit={handleSubmit} className="lg:space-y-4 space-y-[10px] w-full lg:max-w-sm max-w-full mx-auto">
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
              className={`w-full px-4 py-2 pr-10 rounded-lg border ${passwordError ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-[#5D60FF]"} focus:outline-none focus:ring-2`}
            />
           
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-500 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
             {passwordError && (
              <p className="text-red-500 text-xs mt-1 ml-1">{passwordError}</p>
            )}
          <div className="relative mb-4">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className={`w-full px-4 py-2 pr-10 rounded-lg border ${confirmPasswordError ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-[#5D60FF]"} focus:outline-none focus:ring-2`}
            />
           
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-500 focus:outline-none"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
           {confirmPasswordError && (
              <p className="text-red-500 text-xs mt-1 ml-1">{confirmPasswordError}</p>
            )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#5D60FF] text-white py-2 rounded-lg hover:bg-[#4A4CC7] transition-colors md:text-sm text-[13px] font-[500] ${loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <div className="flex justify-center">
            <button onClick={() => router.push("/login")}
              className="mt-4 text-[#5D60FF] hover:underline md:text-sm text-[13px] font-[500]"
            >
              Back to login
            </button>
          </div>
        </form>
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