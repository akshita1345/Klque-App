"use client"

import { apiClient } from "@/client/client"
import { Button } from "@/components/ui/button"
import Cookies from "js-cookie"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Montserrat } from "next/font/google"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import SmallRoundedSpinner from "@/components/common/small-rounded-spinner"
import OnboardingSidebar from "../content-type/onboarding-sidebar"
export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const ContentTypeSelection = () => {
  const [customType, setCustomType] = useState("");
  const router = useRouter();
  const [selectedContentType, setSelectedContentType] = useState<string>("");
  const [isDontKnowYet, setIsDontKnowYet] = useState<boolean>(false);
  const [loginUser, setLoginUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const contentTypes = ["Founder / Entrepreneur", "Creator", "Professional / Consultant", "Other"];
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
    setLoginUser(user);

    const tempGoal = contentTypes?.find((item) => item?.toLowerCase() === user?.onboarding?.describe?.[0]?.toLowerCase())?.toLowerCase() || ""
    if (!tempGoal) {
      setCustomType(user?.onboarding?.describe?.[0] || "");
      handleContentTypeSelect("Other");
    } else handleContentTypeSelect(user?.onboarding?.describe?.[0] || "");
  }, []);

  const handleContentTypeSelect = (type: string) => {
    setSelectedContentType(type);
  };

  const handleNext = async () => {
    try {
      if (!selectedContentType || (selectedContentType === "Other" && !customType)) {
        setError("Please select an option or type a custom");
        return;
      }
      setIsLoading(true);
      const input = {
        data: selectedContentType === "Other" ? [customType] : [selectedContentType],
        step: 1,
        userId: loginUser?._id
      }
      const response = await apiClient("/api/onboard", {
        method: "POST",
        body: JSON.stringify(input),
      });
      localStorage.setItem("user", JSON.stringify(response));
      startTransition(() => {
        router.push("/onboard/main-goal")
      })
    } catch (error: any) {
      setError(error.message || "Getting error while onboarding");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={montserrat.className}>
      <div className="lg:flex flex-col lg:flex-row h-full">
        {/* Left side - Profile info and Ina */}
        <OnboardingSidebar description="so excited to have you here!" />


        {/* Right side - Content type selection */}
        <div className="2xl:max-w-[calc(100%-460px)] lg:max-w-[calc(100%-400px)] max-w-full w-full relative bg-[#FCF7E4] h-full lg:h-screen xl:py-0 py-4">
          <div className="2xl:max-w-full mx-auto flex items-center justify-center h-full 2xl:px-[148px] lg:px-[80px] px-[50px]">
            {/* Main content */}
            <div className="flex-1 ">
              {
                error && (
                  <div className="max-w-6xl mx-auto mb-6">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                      <svg
                        className="w-5 h-5 mt-0.5 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="font-semibold">Oops! Something went wrong</p>
                        <p className="text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                )
              }
              <h1 className="text-[#0C0829] 2xl:text-[30px] lg:text-[27px] text-[25px] font-semibold leading-tight mb-4">
                Hi{loginUser?.name ? ` ${loginUser?.name}` : ""}, first things first, which of these best describes you?
              </h1>

              {/* Grid of options */}
              <div className="flex flex-col gap-4">
                {contentTypes.slice(0, 6).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className={`sm:py-[10px] px-[20px] h-full 2xl:text-[20px] lg:text-[18px] md:text-[20px] sm:text-[20px] font-medium rounded-[12px] border overflow-hidden !leading-[1.45rem] max-w-fit ${selectedContentType === type
                      ? 'border-[#5D60FF] text-black bg-[#F5F5F5] border-2'
                      : 'border-[#E5E5E5] text-black bg-white hover:bg-[#F5F5F5]'
                      }`}
                    disabled={isDontKnowYet || (isLoading || isPending)}
                    onClick={() => handleContentTypeSelect(type)}
                  >
                    <div className="w-full text-left 2xl:text-[20px] lg:text-[18px] md:text-[20px] text-[18px] ">
                      {type}
                    </div>
                  </Button>
                ))}
              </div>

              {/* Other option field */}

              <div className="mb-12 mt-4 transition-all duration-300">
                <p className="font-medium text-[18px] mb-2" onClick={() => handleContentTypeSelect("Other")}></p>
                {(selectedContentType === "Other" || customType) && (
                  <Input
                    placeholder="something else brewing? tell me more..."
                    className="w-full !h-full py-[16px] px-[26px] lg:text-[16px] text-[14px] font-medium !rounded-[3px] border border-[#DDDDDD] bg-white text-[#616161]"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                  />
                )}
              </div>

              {/* Navigation buttons */}
              <div className="md:flex block  justify-between items-center mt-12 ">

                <div className="flex items-center gap-2">
                  <div className="ml-[37px]">
                    {/* <p className="font-medium text-[20px]">1/4</p> */}
                    {/* <div className="flex gap-[2px] bg-[#fdfaea] lg:mt-[15px] mt-[10px] cursor-pointer">

                      <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                      <div className="w-[26px] h-[10px] rounded-[20px] border  border-[#5D60FF]"></div>
                      <div className="w-[26px] h-[10px] rounded-[20px] border  border-[#5D60FF]"></div>
                      <div className="w-[26px] h-[10px] rounded-[20px] border  border-[#5D60FF]"></div>
                    </div> */}
                  </div>

                </div>
                <Button
                  onClick={handleNext}
                  className="bg-[#5D60FF] hover:bg-[#5D60FF]/90 text-white px-6 lg:!text-[20px] text-[16px] font-[600] md:w-[115px] w-full h-full lg:py-[16.5px] py-[12px] md:mt-0 mt-4"
                // disabled={!selectedContentType && !isDontKnowYet || (isLoading || isPending)}
                >
                  {(isLoading || isPending) ? <SmallRoundedSpinner className="border-white" /> : "next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContentTypeSelection