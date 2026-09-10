import Image from "next/image"
import { Mail } from "lucide-react"
import { montserrat } from "@/app/layout"

export function LogoHeader({ userEmail }: { userEmail: string }) {
  return (
    <>
      {/* Logo */}
      <div className="text-center mb-8">
        <Image
          src="/images/logos/klque-logo.PNG"
          alt="KLQUE Logo"
          width={180}
          height={90}
          priority
          className="mx-auto lg:max-w-full max-w-[100px] h-auto"
        />
      </div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-12 h-12 bg-[#5D60FF]/10 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-black" />
        </div>
        <h2 className={`lg:text-2xl text-[20px] font-semibold lg:mb-2 mb-[44px]`}>
          Check your inbox (or spam)
        </h2>
        <p className={`text-center text-[#000000] text-[12px] max-w-xs mx-auto font-[500] ${montserrat.className}`}>
          We&apos;ve sent a verification email to your inbox at
          {userEmail && (
            <>
              <br />
              <span className="font-bold text-[#5D60FF] ">{userEmail}</span>
            </>
          )}
          <br />
          <span className="block">finish setting up your account to get started!</span>
        </p>
      </div>
    </>
  )
} 