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
import OnboardingSidebar from "./onboarding-sidebar"
export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
const ContentTypeSelection = () => {
  const router = useRouter();
  const [selectedContentType, setSelectedContentType] = useState<string>("");
  const [isDontKnowYet, setIsDontKnowYet] = useState<boolean>(false);
  const [loginUser, setLoginUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const contentTypes = ["solo creator/hobbyist", "community builder/ educator", "professional/thought leader", "startup founder", "D2C brand builder", "service-based business owner/freelancer", "exploring & learning"];
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
    setLoginUser(user);
    handleContentTypeSelect(user?.onboarding?.contentType?.[0] || "");
  }, []);

  const handleContentTypeSelect = (type: string) => {
    setSelectedContentType(type);
  };

  const handleNext = async () => {
    try {
      setIsLoading(true);
      const input = {
        data: isDontKnowYet ? ["Don't know yet"] : [selectedContentType],
        step: 2,
        userId: loginUser?._id
      }
      const response = await apiClient("/api/onboard", {
        method: "POST",
        body: JSON.stringify(input),
      });
      localStorage.setItem("user", JSON.stringify(response));
      startTransition(() => {
        router.push("/onboard/goal")
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
        <div className="2xl:max-w-[calc(100%-460px)] lg:max-w-[calc(100%-400px)] max-w-full w-full relative bg-[#FCF7E4] h-full xl:h-screen xl:py-0 py-4">
          <div className="2xl:max-w-full mx-auto flex items-center justify-center h-full 2xl:px-[148px] lg:px-[80px] px-[50px]">

            {/* Main content */}
            <div className="flex-1 ">
              <h1 className="text-[#0C0829] 2xl:text-[30px] lg:text-[27px] text-[25px] font-semibold max-w-2xl leading-tight 2xl:mb-4">
                First things first, what best describes you?
              </h1>

              {/* Grid of options */}
              <div className="grid grid-cols-1 xl:grid-cols-3 md:grid-cols-2 2xl:gap-x-[37px] md:gap-x-[25px] gap-y-[21px] 2xl:mt-[79px] mt-[60px]">
                {contentTypes.slice(0, 6).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className={`2xl:py-[34.5px] py-[12px] 2xl:px-[24px] px-[16px] 2xl:text-[20px] lg:text-[18px] md:text-[20px] sm:text-[20px] font-medium rounded-[12px] whitespace-normal border-[2px] h-[114px] overflow-hidden !leading-[1.45rem] ${selectedContentType === type

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
              <div className="grid grid-cols-1 xl:grid-cols-3 md:grid-cols-2 gap-x-[37px] gap-y-[21px] mt-[25px]">

                {/* Last option separate */}
                <div>
                  <Button
                    key={contentTypes[6]}
                    variant="outline"
                    className={`w-full 2xl:py-[44.5px] py-[12px] md:px-[24px] px-[16px] 2xl:text-[20px] lg:text-[18px] md:text-[20px] sm:text-[20px] font-medium rounded-[12px] border-[2px] h-[114px] overflow-hidden !leading-[1.45rem] ${selectedContentType === contentTypes[6]
                      ? 'border-[#5D60FF] text-black bg-[#F5F5F5]'
                      : 'border-[#E5E5E5] text-black bg-white hover:bg-[#F5F5F5]'
                      }`}
                    disabled={isDontKnowYet || (isLoading || isPending)}
                    onClick={() => handleContentTypeSelect(contentTypes[6])}
                  >
                    <div className="w-full text-left 2xl:text-[20px] lg:text-[18px] md:text-[20px] text-[18px]">
                      {contentTypes[6]}
                    </div>
                  </Button>
                </div>
              </div>


              {/* Other option field */}
              <div className="mb-12 lg:mt-[82px] mt-8">
                <Input
                  placeholder="something else brewing? tell me more..."
                  className="w-full !h-full py-[16px] px-[26px] lg:text-[16px] text-[14px] font-medium !rounded-[3px] border border-[#DDDDDD] bg-white text-[#616161]"
                />
              </div>

              {/* Navigation buttons */}
              <div className="md:flex block justify-between items-center mt-12 ">

                <div className="flex items-center gap-2">
                  <div className="ml-[37px]">
                    <p className="font-medium text-[20px]">1/4</p>
                    <div className="flex gap-[2px] bg-[#fdfaea] lg:mt-[15px] mt-[10px] cursor-pointer">

                      <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                      <div className="w-[26px] h-[10px] rounded-[20px] border  border-[#5D60FF]"></div>
                      <div className="w-[26px] h-[10px] rounded-[20px] border  border-[#5D60FF]"></div>
                      <div className="w-[26px] h-[10px] rounded-[20px] border  border-[#5D60FF]"></div>
                    </div>
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