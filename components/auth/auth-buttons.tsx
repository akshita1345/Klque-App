"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LoginModal } from "./login-modal"
import { SignUpModal } from "./sign-up-modal"
import { montserrat } from "@/app/layout"

export function AuthButtons() {
  const [showLogin, setShowLogin] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)

  return (
    <div className={`flex items-center gap-2 ${montserrat.className}`}>
      <Button
        variant="outline"
        className="border-[#FF6400] text-[#FF6400] hover:bg-[#FF6400] hover:text-white"
        onClick={() => setShowLogin(true)}
      >
        Log in
      </Button>
      <Button
        className="bg-[#FF6400] hover:bg-[#FF6400]/90 text-white"
        onClick={() => setShowSignUp(true)}
      >
        Sign up
      </Button>

      <LoginModal
        isOpen={showLogin}
        onShowSignUp={() => {
          setShowLogin(false)
          setShowSignUp(true)
        }}
        setShowLogin={setShowLogin}
      />

      <SignUpModal
        isOpen={showSignUp}
        onShowLogin={() => {
          setShowSignUp(false)
          setShowLogin(true)
        }}
        setShowSignUp={setShowSignUp}
      />
    </div>
  )
}

