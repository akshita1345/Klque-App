"use client"

import { useRouter } from "next/navigation"
import { montserrat } from "@/app/layout"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import Cookies from "js-cookie"

export default function PaymentCancel() {
  const router = useRouter()
  const [loginUser, setLoginUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
    setLoginUser(user);
  }, []);

  useEffect(() => {
    const resetOnboardingStep = async () => {
      if (loginUser?.id) {
        const response = await fetch('/api/(onboard)/onboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {},
            step: 1,
            userId: loginUser?.id
          }),
        });

        if (!response.ok) {
          console.error('Failed to reset onboarding step');
        }

      }
    };

    resetOnboardingStep();
  });

  const handleTryAgain = () => {
    router.push("/onboard/start-onboarding")
  }

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
          <XCircle className="h-16 w-16 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>

        <p className="text-gray-600 mb-6">
          Your payment process was cancelled. No worries, you can try again whenever you're ready.
          If you have any questions about our pricing or subscription plans, please contact our support team.
        </p>

        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleTryAgain}
            className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-6 rounded-md"
          >
            Try Again
          </Button>

          {/* <Button
            onClick={() => router.push("/ideate")}
            variant="outline"
            className="border-indigo-500 text-indigo-500 hover:bg-indigo-50 py-2 px-6 rounded-md"
          >
            Return to Dashboard
          </Button> */}
        </div>
      </div>
    </div>
  )
} 