"use client"

import { apiClient } from "@/client/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Cookies from "js-cookie"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { montserrat } from "@/app/layout"
import Image from "next/image"
import SmallRoundedSpinner from "@/components/common/small-rounded-spinner"
import OnboardingSidebar from "../content-type/onboarding-sidebar"

const PlatformSelection = () => {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [missionDescription, setMissionDescription] = useState<string>("");
  const [loginUser, setLoginUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
    setLoginUser(user);
  }, []);

  const getOnboardingInput = (nextStep: number, isBack?: boolean) => {
    // Format the data as a string array to match the expected format
    const formattedData = [];

    if (websiteUrl.trim()) {
      formattedData.push(`websiteUrl:${websiteUrl.trim()}`);
    }

    if (missionDescription.trim()) {
      formattedData.push(`missionDescription:${missionDescription.trim()}`);
    }

    return {
      ...(isBack ? {} : { data: formattedData }),
      step: nextStep,
      userId: loginUser?._id
    };
  };

  const handleNavigation = async (nextStep: number, redirectPath: string, isBack?: boolean) => {
    try {
      setIsLoading(true);
      const input = getOnboardingInput(nextStep, isBack);
      const response = await apiClient("/api/onboard", {
        method: "POST",
        body: JSON.stringify(input),
      });
      localStorage.setItem("user", JSON.stringify(response));
      startTransition(() => {
        router?.push(redirectPath)
      })
    } catch (error: any) {
      setError(error.message || "Getting error while onboarding");
    } finally {
      setIsLoading(false);
    }
  }

  const handleNext = () => handleNavigation(5, "/ideate");
  const handleBack = () => handleNavigation(3, "/onboard/vibe", true);

  return (
    <div className={montserrat.className}>
      <div className="lg:flex flex-col lg:flex-row h-full">
        {/* Left side - Profile info and Ina */}
        <OnboardingSidebar description="love that! tell me a little about your brand to get started" />

        {/* Right side - Platform selection */}
        <div className="2xl:max-w-[calc(100%-460px)] lg:max-w-[calc(100%-400px)] max-w-full w-full relative bg-[#FCF7E4] h-full lg:h-screen xl:py-0 py-4">
          <div className="2xl:max-w-full mx-auto flex items-center justify-center h-full 2xl:px-[148px] lg:px-[80px] px-[50px]">
            {/* Main content */}
            <div className="flex-1">
              <h1 className="text-[#0C0829] xl:text-[30px] text-[25px] font-semibold leading-tight mb-[80px]">
                Alright last one! Want even smarter ideas?
              </h1>

              {/* Website input */}
              <div className="space-y-[8px]">
                <label className="block text-[#0C0829] text-[16px] font-medium">
                  a place where we can learn about you
                </label>
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="Paste your website"
                  className="w-full !h-full py-[16px] px-[23px] lg:text-[16px] text-[14px] font-medium !rounded-[3px] border border-[#DDDDDD] bg-white text-[#616161]"

                  disabled={isLoading || isPending}
                />
              </div>

              {/* Mission description */}
              <div className="mt-[48px] space-y-[8px]">
                <label className="block text-[#0C0829] text-[16px] font-medium">

                  describe your mission/ product/ audience
                </label>
                <Textarea
                  value={missionDescription}
                  onChange={(e) => setMissionDescription(e.target.value)}
                  placeholder="ex: I have a snack brand for diet conscious women who are looking for affordable but healthy munching options"
                  className="w-full !h-full py-[16px] px-[23px] lg:text-[16px] text-[14px] font-medium !rounded-none border border-[#DDDDDD] bg-white text-[#616161] min-h-[83px]"

                  disabled={isLoading || isPending}
                />
              </div>

              {/* Navigation buttons */}
              <div className="md:flex block justify-between items-center mt-[65px]">
                <div className="flex items-center gap-2">

                  <div className="w-[48px] h-[48px] rounded-[5px] border flex justify-center items-center border-[#1E1E1E] cursor-pointer" onClick={handleBack}>
                    {isLoading ? <SmallRoundedSpinner className="border-white" /> :
                      <Image
                        src="/images/pages/left-arrow-icon.svg"
                        alt="Ina"
                        width={12}
                        height={24}
                        priority />
                    }
                  </div>
                  <div className="ml-[37px]">
                    <p className="font-medium text-[20px]">4/4</p>
                    <div className="flex gap-[2px] bg-[#fdfaea] lg:mt-[15px] mt-[10px] cursor-pointer">

                      <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                      <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                      <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                      <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                    </div>
                  </div>

                </div>
                <Button
                  onClick={handleNext}
                  className="bg-[#5D60FF] hover:bg-[#5D60FF]/90 text-white px-6 lg:!text-[20px] text-[16px] font-[600] md:w-[115px] w-full h-full lg:py-[16.5px] py-[12px] md:mt-0 mt-4"
                // disabled={isLoading || isPending}
                >
                  {isLoading || isPending ? <SmallRoundedSpinner className="border-white" /> : "next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlatformSelection