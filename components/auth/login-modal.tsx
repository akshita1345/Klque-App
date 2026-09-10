"use client"

import { useState } from "react"
import { Eye, EyeOff } from 'lucide-react'
import { Button, LoadingButton } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { apiClient } from "@/client/client"
import { useToast } from "@/components/ui/use-toast"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { montserrat, delaGothic } from "@/app/layout"

// Validation schema using zod
const schema = z.object({
  email: z.string().email("Please enter a valid email").nonempty("Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").nonempty("Password is required"),
})

interface LoginModalProps {
  isOpen: boolean
  setShowLogin: any
  onShowSignUp: () => void
}

type FormData = {
  email: string
  password: string
}

export function LoginModal({ isOpen, onShowSignUp, setShowLogin }: LoginModalProps) {

  const { toast } = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, watch, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const handleReset = () => {
    reset({
      email: "",
      password: "",
    });
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      // Call the API using the utility
      const response = await apiClient("/api/signin", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const { token, ...userData } = response?.user;

      if (userData?._id) {
        Cookies.set("userId", userData?._id);
        localStorage.setItem("user", JSON.stringify(userData));
        Cookies.set("token", token);
        handleReset();
        setShowLogin(false);
        if (!userData?.isOnboarded) { // if user is not onboarded
          if (userData?.onboardingStep === 0) {
            router.push("/onboard/content-type");
          } else if (userData?.onboardingStep === 1) {
            router.push("/onboard/goal");
          } else if (userData?.onboardingStep === 2) {
            router.push("/onboard/vibe");
          } else if (userData?.onboardingStep === 3) {
            router.push("/onboard/platform");
          } else if (userData?.onboardingStep === 4) {
            router.push("/onboard/type");
          } else if (userData?.onboardingStep === 5) {
            router.push("/onboard/niche");
          } else {
            router.push("/ideate");
          }
        } else { // if user is onboarded
          router.push("/ideate");
          toast({ description: "You are log in successfully!" });
        }
      }
    } catch (err: any) {
      toast({ description: (err?.message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={() => {
      handleReset();
      setShowLogin(false)
    }}>
      <DialogContent className={`sm:max-w-md bg-black border-zinc-800 ${montserrat.className}`}>
        <DialogHeader>
          <DialogTitle className={`text-center text-2xl text-[#F0F871] ${delaGothic.className}`}>
            Log in
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4 py-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  placeholder="Email id"
                  className="bg-transparent border-zinc-700 text-white placeholder:text-zinc-400"
                />
              )}
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <div className="relative">
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="bg-transparent border-zinc-700 text-white placeholder:text-zinc-400 pr-10"
                  />
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-300"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-zinc-400 hover:text-zinc-300"
              >
                Forgot Password?
              </button>
            </div>
          </div>
          {loading ?
            <LoadingButton className="w-full font-[600] bg-[#F37154]" /> :
            <Button
              type="submit"
              className="w-full bg-[#F37154] hover:bg-[#F37154]/90 text-white"
            >
              Log In
            </Button>
          }

          <div className="text-center text-sm text-zinc-400">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onShowSignUp}
              className="text-[#F37154] hover:underline"
            >
              Sign Up
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
