"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useForm, Controller } from "react-hook-form";
import { apiClient } from "@/client/client";
import { useToast } from "@/components/ui/use-toast";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { montserrat } from "@/app/layout";
import { LoadingButton } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import SmallRoundedSpinner from "@/components/common/small-rounded-spinner";

export const dynamic = "force-dynamic";

interface FormData {
  fullName: string;
  lastName: string;
  email: string;
  password: string;
  profession: string;
  otherProfession?: string;
}

export default function Welcome() {
  const { toast } = useToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormData>({
    mode: "onBlur",
  });

  // Helper to handle post-authentication logic
  const handlePostAuth = (user: any, token: string, isSocial?: boolean) => {
    localStorage.setItem("user", JSON.stringify(user));
    Cookies.set("userId", user?._id);
    Cookies.set("token", token);
    window.localStorage.setItem("hasUsedAppBefore", user?.hasUsedAppBefore || false);
    handleReset();
    if (!user?.isOnboarded) {
      // if user is not onboarded
      const onboardingRoutes = [
        "/onboard/describe", // 0
        "/onboard/main-goal", // 1
        "/onboard/new-vibe", // 2
        "/onboard/tone-voice", // 2
        "/onboard/start-onboarding", // 3
      ];

      const nextRoute =
        typeof user?.onboardingStep === "number" &&
          onboardingRoutes[user.onboardingStep]
          ? onboardingRoutes[user.onboardingStep]
          : "/ideate";

      router.push(nextRoute);
    } else {
      // if user is onboarded
      router.push("/ideate");
      toast({
        description: `You are ${isSocial ? "logged in" : "signed up"
          } successfully!`,
      });
    }
  };

  const handleSocialAuthentication = async (d: any) => {
    setGoogleLoading(true)
    const credential = d.credential;
    const provider = "google";
    const body = { credential, provider };

    const response = await apiClient("/api/social-auth", {
      method: "POST",
      body: JSON.stringify(body),
    });
    let { token, user } = response;
    user = user ? user : response;

    if (user?._id) {
      handlePostAuth(user, token, true);
    }
    setGoogleLoading(false)
  };

  // Watch profession value to conditionally show the "other profession" input
  const profession = watch("profession");

  const handleReset = () => {
    reset({
      fullName: "",
      email: "",
      password: "",
      profession: "",
      otherProfession: "",
    });
  };

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
        handlePostAuth(user, token);
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
    <div
      className={`flex flex-col md:flex-row h-screen ${montserrat.className}`}
    >
      {/* Right side / Bottom on mobile TO MAKE THE WIDTH LESS */}
      <div className="w-full lg:w-2/5 bg-[#FFFDF8] flex flex-col items-center justify-center md:px-[40px] px-[20px] py-[27px] lg:order-1 order-2">
        <div className="text-center lg:mb-6">
          <div className="lg:mb-10 mb-3">
            <Image
              src="/images/logos/klque-logo.PNG"
              alt="KLQUE Logo"
              width={180}
              height={90}
              priority
              className="mx-auto lg:max-w-full max-w-[100px]  h-auto"
            />
          </div>
          <h2 className={`lg:text-2xl text-[20px] font-semibold lg:mb-2 mb-[12px] ${montserrat.className}`}>
            Sign up in seconds
          </h2>
        </div>

        <form
          id="signupForm"
          onSubmit={handleSubmit(onSubmit)} className="lg:space-y-4 space-y-[10px] w-full lg:max-w-sm max-w-full mx-auto"
        >
          <div className="flex justify-between lg:space-x-4">
            <div>
              <Controller
                name="fullName"
                control={control}
                rules={{
                  required: "First Name is required",
                  validate: (value) => {
                    const trimmedValue = value?.trim();
                    if (!trimmedValue) return "First Name is required";
                    if (trimmedValue.length < 2) return "First Name must be at least 2 characters";
                    if (!/^[a-zA-Z\s'-]+$/.test(trimmedValue)) return "First Name can only contain letters, spaces, hyphens, and apostrophes";
                    return true;
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.trimStart())}
                    onBlur={(e) => field.onChange(e.target.value.trim())}
                    placeholder="First name"
                    className="border-zinc-300"
                  />
                )}
              />
              {errors.fullName && (
                <span className="text-red-600 text-sm">
                  {errors.fullName.message}
                </span>
              )}
            </div>

            <div>
              <Controller
                name="lastName"
                control={control}
                rules={{
                  required: "Last Name is required",
                  validate: (value) => {
                    const trimmedValue = value?.trim();
                    if (!trimmedValue) return "Last Name is required";
                    if (trimmedValue.length < 2) return "Last Name must be at least 2 characters";
                    if (!/^[a-zA-Z\s'-]+$/.test(trimmedValue)) return "Last Name can only contain letters, spaces, hyphens, and apostrophes";
                    return true;
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.trimStart())}
                    onBlur={(e) => field.onChange(e.target.value.trim())}
                    placeholder="Last name"
                    className="border-zinc-300"
                  />
                )}
              />
              {errors.lastName && (
                <span className="text-red-600 text-sm">
                  {errors.lastName.message}
                </span>
              )}
            </div>
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
                  placeholder="email"
                  className="border-zinc-300"
                />
              )}
            />
            {errors.email && (
              <span className="text-red-600 text-sm">
                {errors.email.message}
              </span>
            )}
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
                  value:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message:
                    "Password must include an uppercase letter, a lowercase letter, a number, and a special character",
                },
              }}
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
            {errors.password && (
              <span className="text-red-600 text-sm">
                {errors.password.message}
              </span>
            )}
          </div>

          <div className="">
            {loading ? (
              <LoadingButton className="w-full bg-[#FF6400]" />
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5D60FF] hover:bg-[#5D60FF]/90 text-white"
              >
                {loading ? <SmallRoundedSpinner className="border-white" /> : "Sign Up"}
              </Button>
            )}
          </div>

          <div>{/* Profession field removed as requested */}</div>

          <div className="flex items-center justify-center my-[20px]">
            <div className="border-t border-borderColor flex-grow mr-2" />
            <span className="text-muted-foreground">OR</span>
            <div className="border-t border-borderColor flex-grow ml-2" />
          </div>

          {googleLoading ? (
            <div className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-full bg-white">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
              <span className="text-gray-700">Signing in with Google...</span>
            </div>
          ) : (
            <div className="w-full mb-[1rem] flex justify-center">
              <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID!}>
                <GoogleLogin
                  shape="pill"
                  theme="outline"
                  text="continue_with"
                  size="large"
                  auto_select={false}
                  onSuccess={(d: any) => handleSocialAuthentication(d)}
                  onError={() => console.log("Login Failed")}
                />
              </GoogleOAuthProvider>
            </div>
          )}

          <div className="text-center text-[14px] text-[#181818] py-[11.5px] mt-[20px] mb-[27px] font-[500]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#404FED] ">
              Log In
            </Link>
          </div>

          <div className="text-center text-[12px] text-[#363636]">
            By continuing you agree to Klque&apos;s{" "}
            <Link
              href="/privacy-policy"
              className="text-[#404FED] underline me-2 inline-block"
            >
              Privacy Policy
            </Link>
            and
            <Link
              href="/terms-of-use"
              className="text-[#404FED] underline ms-2 inline-block"
            >
              Terms of Use
            </Link>
            .
          </div>
        </form>
      </div>

      {/* Right side (Illustration) */}
      <div className="w-full lg:w-3/5 relative flex items-center justify-center bg-[#FCF7E4] p-0 lg:order-2 order-1">
        {/* <div className="mb-10 lg:hidden block">
            <Image
              src="/images/logos/klque-logo.PNG"
              alt="KLQUE Logo"
              width={180}
              height={90}
              priority
              className="mx-auto max-w-full h-auto"
            />
          </div> */}
        <Image
          src="/images/pages/welcome_background.PNG"
          alt="Welcome Background"
          width={800}
          height={800}
          className="object-contain"
          priority
        />
      </div>

      {/* Left side / Top on mobile
      <div className="w-full md:w-1/2 bg-[#FCF7E4] flex flex-col items-center justify-center p-6 md:p-10">
        <div className="text-center w-full">
          <h2 className={`text-[#FF6400] text-4xl md:text-5xl mb-3 font-bold`}>Welcome to</h2>
          <div className="mb-8">
            <Image
              src="/images/logos/klque-logo.PNG"
              alt="KLQUE Logo"
              width={500}
              height={250}
              priority
              className="mx-auto max-w-full h-auto"
            />
          </div>

          <Button
            className="bg-[#8FA0D8] hover:bg-[#8FA0D8]/90 text-white py-5 md:py-7 px-12 md:px-20 text-lg md:text-xl font-bold rounded-md mb-10 md:mb-0"
            onClick={() => {
              window.open('https://klque.ai/', '_blank');
            }}
          >
            Join the tribe!
          </Button>
        </div>
      </div> */}
    </div>
  );
}