"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff } from 'lucide-react'
import { Button, LoadingButton } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { apiClient } from "@/client/client"
import { useToast } from "@/components/ui/use-toast"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { montserrat, delaGothic } from "@/app/layout"
import Link from "next/link"
import Image from "next/image"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"


// Validation schema using zod
const schema = z.object({
  email: z.string().email("Please enter a valid email").nonempty("Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").nonempty("Password is required"),
})

type FormData = {
  email: string
  password: string
}

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false)

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Redirect to home if already logged in
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      router.push('/ideate');
    }
  }, [router]);

  const handleReset = () => {
    reset({
      email: "",
      password: "",
    });
  }

  const handlePostAuth = (user: any, token: string, isSocial?: boolean) => {
    localStorage.setItem("user", JSON.stringify(user));
    // localStorage.setItem("user", JSON.stringify(user));
    Cookies.set("userId", user?._id);
    Cookies.set("token", token);
    window.localStorage.setItem("hasUsedAppBefore", user?.hasUsedAppBefore || false);
    handleReset();
    if (!user?.isOnboarded) { // if user is not onboarded
      const onboardingRoutes = [
        "/onboard/describe",
        "/onboard/main-goal",
        "/onboard/new-vibe",
        "/onboard/business-info",
        "/onboard/profile-summary",
        "/onboard/tone-voice",
        "/onboard/suggest-script",
        "/onboard/start-onboarding",
      ];

      const nextRoute =
        typeof user?.onboardingStep === "number" && onboardingRoutes[user.onboardingStep]
          ? onboardingRoutes[user.onboardingStep]
          : "/ideate";

      router.push(nextRoute);
    } else { // if user is onboarded
      router.push("/ideate");
      toast({ description: `You are ${isSocial ? 'logged in' : 'signed up'} successfully!` });
    }
  }

  const handleSocialAuthentication = async (d: any) => {
    setGoogleLoading(true)
    const credential = d.credential
    const provider = 'google'
    const body = { credential, provider }

    const response = await apiClient('/api/social-auth',
      {
        method: "POST",
        body: JSON.stringify(body),
      })
    let { token, user } = response;
    user = user ? user : response
    if (user?._id) {
      handlePostAuth(user, token);
    }
    setGoogleLoading(false)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      // Call the API using the utility
      const response = await apiClient("/api/signin", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const { token,
        isDeleted,
        isLastReplyQue,
        isLastReplyIdeaScript,
        status,
        createdAt,
        updatedAt,
        __v,
        otp,
        verificationSecretTime,
        linkedin,
        google,
        id,
        ...userData } = response?.user;

      if (userData?._id) {
        localStorage.setItem("user", JSON.stringify(userData));
        // localStorage.setItem("user", JSON.stringify(userData));
        Cookies.set("userId", userData?._id);
        Cookies.set("token", token);
        window.localStorage.setItem("hasUsedAppBefore", userData?.hasUsedAppBefore || false);
        handleReset();
        if (!userData?.isOnboarded) { // if user is not onboarded
          const onboardingRoutes = [
            "/onboard/content-type", // 1
            "/onboard/goal",         // 2
            "/onboard/vibe",         // 3
            "/onboard/platform",     // 4
            "/onboard/type",         // 5
            "/onboard/niche",        // 6
          ];

          const nextRoute =
            typeof userData?.onboardingStep === "number" && onboardingRoutes[userData.onboardingStep]
              ? onboardingRoutes[userData.onboardingStep]
              : "/ideate";

          router.push(nextRoute);
        } else { // if user is onboarded
          router.push("/ideate");
          toast({ description: "You are logged in successfully!" });
        }
      }
    } catch (err: any) {
      toast({ description: (err?.message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col lg:flex-row h-screen ${montserrat.className}`}>
      {/* Left side / Form side */}
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
          <h2 className={`text-2xl mb-2 font-semibold ${montserrat.className}`}>Welcome back</h2>
          <p className="text-center text-gray-700 mt-4 max-w-xs mx-auto"> Ready to make some content magic?</p>
        </div>

        <form className="lg:space-y-4 space-y-[10px] w-full lg:max-w-sm max-w-full mx-auto" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (  
                <Input
                  {...field}
                  type="email"
                  placeholder="email"
                  className="border-zinc-300"
                />
              )}
            />
            {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
          </div>

          <div className="relative">
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type={showPassword ? "text" : "password"}
                  placeholder="password"
                  className="border-zinc-300 pr-10"
                />
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-500"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
            <div className="text-right mt-1">
              <Link
                href="/forgot-password"
                className="text-[12px] text-[#5D60FF] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="pt-2">
            {loading ? (
              <LoadingButton className="w-full bg-[#5D60FF]" />
            ) : (
              <Button
                type="submit"
                className="w-full bg-[#5D60FF] hover:bg-[#5D60FF]/90 text-white font-[600] md:text-sm text-[13px]"
              >
                Log In
              </Button>
            )}
          </div>

          <div className="flex items-center justify-center my-[1rem]">
            <div className="border-t border-borderColor flex-grow mr-2" />
            <span className="text-muted-foreground">OR</span>
            <div className="border-t border-borderColor flex-grow ml-2" />
          </div>
          <div className="w-full mb-[1rem] flex justify-center">
            {googleLoading ? (
              // Show loading button when Google login is processing
              <div className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-full bg-white">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                <span className="text-gray-700">Signing in with Google...</span>
              </div>
            ) : (
              <GoogleOAuthProvider
                clientId={process.env.GOOGLE_CLIENT_ID!}
              >
                <GoogleLogin
                  shape="pill"
                  theme="outline"
                  text="continue_with"
                  size="large"
                  auto_select={false}
                  onSuccess={(d: any) => handleSocialAuthentication(d)}
                  onError={() => {
                    console.log('Login Failed');
                    toast({
                      description: "Google login failed. Please try again.",
                      variant: "destructive"
                    });
                  }}
                />
              </GoogleOAuthProvider>
            )}
          </div>

          <div className="text-center text-sm text-gray-600 pt-2 border-t border-gray-200 mt-[20px]">
            Don&apos;t have an account?{" "}
            <Link href="/welcome" className="text-[#404FED] hover:underline font-[600]">
              Sign Up
            </Link>
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