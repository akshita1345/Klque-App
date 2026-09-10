"use client"

import { apiClient } from "@/client/client"
import { Button } from "@/components/ui/button"
import Cookies from "js-cookie"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { montserrat } from "@/app/layout"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import SmallRoundedSpinner from "@/components/common/small-rounded-spinner"
import OnboardingSidebar from "../content-type/onboarding-sidebar"

const GoalSelection = () => {
  const router = useRouter();
  const [goal, setGoal] = useState<string>("");
  const [loginUser, setLoginUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition()
  const cardConfigurations = [
    {
      title: 'grow my dream audience',
    },
    {
      title: 'turn content into sales',
    },
    {
      title: 'build a thriving community',
    },
    {
      title: 'get clear on what to post and when',
    },
    {
      title: 'stay consistent & stop second guessing',
    },
    {
      title: 'not sure yet- I need guidance',
    }
  ];

  useEffect(() => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
    setGoal(user?.onboarding?.goal || "");
    setLoginUser(user);
  }, []);

  const getOnboardingInput = (nextStep: number, isBack?: boolean) => ({
    ...(isBack ? {} : { data: goal }),
    step: nextStep,
    userId: loginUser?._id
  });

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

  const handleNext = () => handleNavigation(3, "/onboard/vibe");
  const handleBack = () => handleNavigation(1, "/onboard/content-type", true);

  return (
    <div className={montserrat.className}>
      <div className="lg:flex flex-col lg:flex-row h-full">
        {/* Left side - Profile info and Ina */}
        <OnboardingSidebar description="nice to meet you! I’ll help you achieve your dream content goals" />

        {/* Right side - Goal selection */}
        <div className="2xl:max-w-[calc(100%-460px)] lg:max-w-[calc(100%-400px)] max-w-full w-full relative bg-[#FCF7E4] h-full lg:h-screen xl:py-0 py-4">
          <div className="2xl:max-w-full mx-auto flex items-center justify-center h-full 2xl:px-[148px] lg:px-[80px] px-[50px]">
            {/* Main content */}
            <div className="flex-1">
              <h1 className="text-[#0C0829] xl:text-[30px] text-[25px] font-semibold leading-tight !mb-[90px]">
                Awesome! what&apos;s your main goal for creating content right now?
              </h1>

              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:gap-[30px] gap-[20px] 2xl:min-w-[660px] 2xl:mx-auto 2xl:items-stretch">

                {cardConfigurations.map((card, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`2xl:py-[34.5px] py-[12px] 2xl:px-[24px] px-[16px] 2xl:text-[20px] lg:text-[18px] md:text-[20px] sm:text-[20px] font-medium rounded-[12px] whitespace-normal border h-[114px] overflow-hidden !leading-[1.45rem] ${goal === card.title.toLowerCase()
                      ? 'border-[#5D60FF] text-black bg-[#F5F5F5] border-2'
                      : 'border-[#E5E5E5] text-black bg-white hover:bg-[#F5F5F5]'
                      }`}
                    disabled={isLoading || isPending}
                    onClick={() => setGoal(card.title.toLowerCase())}>
                    <div className="w-full text-left">
                      {card.title}
                    </div>
                  </Button>
                ))}
              </div>

              {/* Other option field */}
              <div className="mb-12 lg:mt-[82px] mt-8">
                <Input
                  placeholder="Something else brewing? tell me more..."
                  className="w-full !h-full py-[16px] px-[26px] lg:text-[16px] text-[14px] font-medium !rounded-[3px] border border-[#DDDDDD] bg-white text-[#616161]"

                />
              </div>

              {/* Navigation buttons */}
              <div className="md:flex block justify-between items-center mt-12">
                <div className="flex items-center gap-2">

                  <div className="w-[48px] h-[48px] rounded-[5px] border flex justify-center items-center border-[#1E1E1E] cursor-pointer"
                    onClick={handleBack}
                  >
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
                    <p className="font-medium text-[20px]">2/4</p>
                    <div className="flex gap-[2px] bg-[#fdfaea] lg:mt-[15px] mt-[10px] cursor-pointer">

                      <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                      <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                      <div className="w-[26px] h-[10px] rounded-[20px] border  border-[#5D60FF]"></div>
                      <div className="w-[26px] h-[10px] rounded-[20px] border  border-[#5D60FF]"></div>
                    </div>
                  </div>

                </div>
                <Button
                  onClick={handleNext}
                  className="bg-[#5D60FF] hover:bg-[#5D60FF]/90 text-white px-6 lg:!text-[20px] text-[16px] font-[600] md:w-[115px] w-full h-full lg:py-[16.5px] py-[12px] md:mt-0 mt-4"
                // disabled={!goal || isLoading || isPending}
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

export default GoalSelection