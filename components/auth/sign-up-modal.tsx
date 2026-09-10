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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm, Controller } from "react-hook-form"
import { apiClient } from "@/client/client"
import { useToast } from "@/components/ui/use-toast"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { montserrat, delaGothic } from "@/app/layout"

interface SignUpModalProps {
  isOpen: boolean
  onShowLogin: () => void
  setShowSignUp: any
}

interface FormData {
  fullName: string
  email: string
  password: string
  profession: string
  otherProfession?: string
}

export function SignUpModal({ isOpen, onShowLogin, setShowSignUp }: SignUpModalProps) {

  const { toast } = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors }, watch, reset } = useForm<FormData>({
    mode: "onBlur",
  })

  // Watch profession value to conditionally show the "other profession" input
  const profession = watch("profession");

  const handleReset = () => {
    reset({
      fullName: "",
      email: "",
      password: "",
      profession: "",
      otherProfession: ""
    });
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      // Call the API using the utility
      const response = await apiClient("/api/signup", {
        method: "POST",
        body: JSON.stringify(data),
      });

      const { token, user } = response;

      if (user?._id) {
        Cookies.set("userId", user?._id);
        localStorage.setItem("user", JSON.stringify(user));
        Cookies.set("token", token);
        handleReset();
        setShowSignUp(false);
        if (!user?.isOnboarded) { // if user is not onboarded
          if (user?.onboardingStep === 0) {
            router.push("/onboard/content-type");
          } else if (user?.onboardingStep === 1) {
            router.push("/onboard/goal");
          } else if (user?.onboardingStep === 2) {
            router.push("/onboard/vibe");
          } else if (user?.onboardingStep === 3) {
            router.push("/onboard/platform");
          } else if (user?.onboardingStep === 4) {
            router.push("/onboard/type");
          } else if (user?.onboardingStep === 5) {
            router.push("/onboard/niche");
          } else {
            router.push("/home");
          }
        } else { // if user is onboarded
          router.push("/home");
          toast({ description: "You are signed up successfully!" });
        }
      }
    } catch (err: any) {
      toast({
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      handleReset();
      setShowSignUp(false);
    }}>
      <DialogContent className={`sm:max-w-[500px] bg-black border-zinc-800 ${montserrat.className}`}>
        <DialogHeader className="flex items-center justify-center min-h-[50px]">
          <DialogTitle className={`text-center text-3xl text-[#E2FF6F] ${delaGothic.className}`}>
            Sign up with email
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-6 py-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Controller
              name="fullName"
              control={control}
              rules={{ required: "Full Name is required" }}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Full Name"
                  className="bg-transparent border-zinc-700 text-white placeholder:text-zinc-400"
                />
              )}
            />
            {errors.fullName && <span className="text-red-600 text-sm">{errors.fullName.message}</span>}
          </div>
          <div>
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                  message: "Invalid email address",
                },
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  placeholder="Email id"
                  className="bg-transparent border-zinc-700 text-white placeholder:text-zinc-400"
                />
              )}
            />
            {errors.email && <span className="text-red-600 text-sm">{errors.email.message}</span>}
          </div>
          <div className="relative">
            <Controller
              name="password"
              control={control}
              rules={{
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters long",
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message: "Password must include an uppercase letter, a lowercase letter, a number, and a special character",
                },
              }}
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
            {errors.password && <span className="text-red-600 text-sm">{errors.password.message}</span>}
          </div>
          <div>
            <Controller
              name="profession"
              control={control}
              rules={{ required: "Please select a profession" }}
              render={({ field }) => (
                <Select onValueChange={(value: string) => {
                  field.onChange(value);
                }}
                  value={field.value}
                >
                  <SelectTrigger className="bg-transparent border-zinc-700 text-white">
                    <SelectValue placeholder="Select your profession" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Content Creator">Content Creator</SelectItem>
                    <SelectItem value="Brand Owner">Brand Owner</SelectItem>
                    <SelectItem value="Social media manager">Social media manager</SelectItem>
                    <SelectItem value="other">Not mentioned here</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.profession && <span className="text-red-600 text-sm">{errors.profession.message}</span>}
          </div>
          {profession === "other" && (
            <div>
              <Controller
                name="otherProfession"
                control={control}
                rules={{ required: "Please specify your profession" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Tell us who you are"
                    className="bg-transparent border-zinc-700 text-white placeholder:text-zinc-400"
                  />
                )}
              />
              {errors.otherProfession && <span className="text-red-600 text-sm">{errors.otherProfession.message}</span>}
            </div>
          )}
          {loading ?
            <LoadingButton className="w-full font-[600] bg-[#F37154]" /> :
            <Button
              type="submit"
              className="w-full bg-[#F37154] hover:bg-[#F37154]/90 text-white"
            >
              Let&apos;s Create
            </Button>
          }

          <div className="text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onShowLogin}
              className="text-[#F37154] hover:underline"
            >
              Log in
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}