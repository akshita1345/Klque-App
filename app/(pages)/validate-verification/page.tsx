'use client';

import { useEffect, useCallback, useRef, useState, useTransition, startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/client/client';
import { toast } from 'sonner';
import { Montserrat } from "next/font/google"

import Image from 'next/image';
import RoundedLargeSpinner from '@/components/common/round-large-spinner';

// Loading spinner component
const LoadingSpinner = () => {
  return (
      <div className="flex justify-center">
      <RoundedLargeSpinner />
      </div>
  )
}
export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
export default function ValidateVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRun = useRef(false);
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const verifyEmail = useCallback(async () => {
    const token = searchParams.get('token');

    if (!token) {
      toast.error("Missing token");
      return;
    }

    try {
      setLoading(true)
       await apiClient("/api/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      toast.success('Email verified successfully');
      startTransition(() => {
        router.replace('/login');
      })
      setLoading(false)
    } catch (error: any) {
      console.error(error);
      toast.error(error.message ?? "Something went wrong");
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      verifyEmail();
    }
  }, [verifyEmail]);

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
              className="mx-auto lg:max-w-full max-w-[100px] h-auto"
            />
          </div>
          <h2 className="text-2xl mb-2">Validating verification, please wait!</h2>
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
      { loading && isPending && <LoadingSpinner/> }
    </div>
  );
}
