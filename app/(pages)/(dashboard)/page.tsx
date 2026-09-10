"use client"
import { AuthButtons } from "@/components/auth/auth-buttons"
import Image from "next/image"
import { montserrat, delaGothic } from "@/app/layout"

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  return (
    <div className={`min-h-screen bg-zinc-100 ${montserrat.className}`}>
      <header className="flex items-center justify-between px-6 py-4">
        <div className="h-8">
          <Image
            src="/images/logos/klque-logo.PNG"
            alt="KLQUE Logo"
            width={100}
            height={32}
            className="h-full w-auto"
          />
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-zinc-600 hover:text-zinc-900">

          </a>
          <a href="#" className="text-zinc-600 hover:text-zinc-900">
          </a>
        </nav>
        <AuthButtons />
      </header>

      {/* Welcome Text */}
      <div className="flex flex-col items-center justify-center h-[calc(100vh-88px)] -mt-20">
        <h1 className={`${delaGothic.className} text-7xl mb-4 text-black`}>
          Welcome to
        </h1>
        <h1 className={`${delaGothic.className} text-9xl text-[#FF6400]`}>
          Klque
        </h1>
      </div>
    </div>
  )
}