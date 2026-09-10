
"use client"

import { apiClient } from "@/client/client"
import { Button } from "@/components/ui/button"
import Cookies from "js-cookie"
import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { montserrat } from "@/app/layout"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import SmallRoundedSpinner from "@/components/common/small-rounded-spinner"
import OnboardingSidebar from "../content-type/onboarding-sidebar"
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
const ToneVoiceSelection = () => {
  const router = useRouter();
  const [loginUser, setLoginUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTone, setSelectedTone] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string[]>([]);
  const [ctaItems, setCtaItems] = useState<string[]>([]);
  const [newCtaItem, setNewCtaItem] = useState<string>("");

  const apiCalledRef = useRef(false);

  const [isPending, startTransition] = useTransition()

  const tone = ["Formal", "Professional", "Authoritative", "Analytical", "Academic", "Neutral", "Friendly", "Empathetic", "Supportive", "Encouraging", "Playful", "Inspirational", "Creative / Storyteller", "Dynamic", "Conversational", "Minimalist", "Adaptive / Contextual", "Consultative", "Mentor / Coach", "Butler / Assistant"];

  const voice = ["Expert / Consultant Voice", "Coach / Mentor Voice", "Teacher / Educator Voice", "Assistant / Butler Voice", "Friend / Companion Voice", "Storyteller Voice", "Entertainer Voice", "Analyst / Detective Voice", "Creator / Visionary Voice", "Reporter / Journalist Voice", "Therapist / Empath Voice", "Executive / Leader Voice", "Innovator Voice", "Minimalist Voice", "Humorous / Playful Voice", "Detective / Investigator Voice", "AI-Native Voice", "Academic / Scholar Voice", "Customer Service Voice", "Narrative Voice"];

  const toggleToneSelect = (item: string) => {
    setSelectedTone(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };
  const toggleVoiceSelect = (item: string) => {
    setSelectedVoice(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  useEffect(() => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
    setSelectedTone(user?.onboarding?.toneVoice?.tone || []);
    setSelectedVoice(user?.onboarding?.toneVoice?.voice || []);
    setCtaItems(user?.onboarding?.toneVoice?.cta || []);
    setLoginUser(user);

    const fetchProfileSummary = async () => {
      try {
        // Mark that we're calling the API
        apiCalledRef.current = true;
        const response = await apiClient(`/api/ai-profile-summary?userId=${user?._id}`, { method: "GET" });
        setSelectedTone(response?.data?.profileSummary?.tones || []);
        setSelectedVoice(response?.data?.profileSummary?.voice || []);
        setCtaItems(response?.data?.profileSummary?.CTA || []);
      } catch (error: any) {
        // Reset the ref if there's an error so we can try again
        apiCalledRef.current = false;
        console.log("🚀 ~ page.tsx:88 ~ fetchProfileSummary ~ error:", error);
      }
    }

    if (apiCalledRef.current) return;

    if (user?._id && user?.onboarding?.toneVoice?.tone?.length === 0) fetchProfileSummary();
  }, []);

  const getOnboardingInput = (nextStep: number, isBack?: boolean, isInput?: boolean) => ({
    ...(isBack ? {} : isInput ? {
      input: {
        toneVoice: {
          tone: selectedTone,
          voice: selectedVoice,
          cta: ctaItems,
        }
      }
    } : {
      data: {
        tone: selectedTone,
        voice: selectedVoice,
        cta: ctaItems,
      }
    }),
    step: nextStep,
    userId: loginUser?._id
  });

  const handleNavigation = async (nextStep: number, redirectPath: string, input?: any) => {
    try {
      setIsLoading(true);
      const response = await apiClient("/api/onboard", {
        method: "POST",
        body: JSON.stringify(input),
      });
      localStorage.setItem("user", JSON.stringify(response));
      startTransition(() => {
        router?.push(redirectPath)
      })
    } catch (error: any) {
      console.log("🚀 ~ page.tsx:75 ~ handleNavigation ~ error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleNext = () => {
    if (loginUser?.isSubscribed && loginUser?.plan) {
      const input = getOnboardingInput(7, false, true);
      handleNavigation(7, "/ideate", { ...input, input: { ...(input as any).input || {}, isOnboarded: true } })
    } else if (loginUser?.lastConversationHistoryId || loginUser?.isPersonal) {
      const input = getOnboardingInput(7, false, true);
      handleNavigation(7, "/onboard/start-onboarding", input)
    } else {
      const input = getOnboardingInput(6, false, false);
      handleNavigation(6, "/onboard/suggest-script", input)
    }
  };
  const handleBack = () => {
    const input = getOnboardingInput(4, true);
    handleNavigation(4, "/onboard/profile-summary", input)
  };

  return (
    <div className={montserrat.className}>
      <div className="lg:flex flex-col lg:flex-row h-full">
        {/* Left side - Profile info and Ina */}
        <OnboardingSidebar description="let&apos;s set the tone and voice for your content" />

        {/* Right side - Goal selection */}
        <div className="2xl:max-w-[calc(100%-460px)] lg:max-w-[calc(100%-400px)] max-w-full w-full relative bg-[#FCF7E4] lg:h-screen xl:py-8 py-4 h-screen overflow-auto">

          <div className="2xl:max-w-6xl px-[50px]  mx-auto">
            <div>
              <h1 className="text-[#0C0829] 2xl:text-[25px] lg:text-[27px] text-[25px] font-semibold max-w-2xl leading-tight mb-4">
                Select your preferred Tone?
              </h1>
            </div>

            <div className="flex flex-wrap gap-2">
              {tone.map(item => (
                <button
                  key={item}
                  onClick={() => toggleToneSelect(item)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm transition-all",
                    selectedTone.includes(item)
                      ? "bg-[#5d60ff] text-white border-[#5d60ff]"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="2xl:max-w-6xl px-[50px] mx-auto mt-8">
            <div>
              <h1 className="text-[#0C0829] 2xl:text-[25px] lg:text-[27px] text-[25px] font-semibold max-w-2xl leading-tight mb-4">
                Select your preferred Voice?
              </h1>
            </div>

            <div className="flex flex-wrap gap-2">
              {voice.map(item => (
                <button
                  key={item}
                  onClick={() => toggleVoiceSelect(item)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm transition-all",
                    selectedVoice.includes(item)
                      ? "bg-[#5d60ff] text-white border-[#5d60ff]"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="2xl:max-w-6xl px-[50px] mx-auto mt-8">
            <div>
              <h1 className="text-[#0C0829] 2xl:text-[25px] lg:text-[27px] text-[25px] font-semibold max-w-2xl leading-tight mb-4">
                Suggested CTAs (call-to-actions)
              </h1>
            </div>

            <div className="flex flex-col gap-4 w-full">
              {/* List of current CTA items */}
              <div className="flex flex-col gap-2 w-full">
                {ctaItems?.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 w-full">
                    <span className="font-medium">{index + 1}.</span>
                    <div className="flex-1 px-4 py-2 rounded-md border border-gray-300 bg-white text-sm">
                      {item}
                    </div>
                    <button
                      onClick={() => {
                        const newItems = [...ctaItems];
                        newItems.splice(index, 1);
                        setCtaItems(newItems);
                      }}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <X size={16} className="text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new CTA item */}
              <div className="flex items-center gap-2 w-full">
                <Input
                  value={newCtaItem}
                  onChange={(e) => setNewCtaItem(e.target.value)}
                  placeholder="Add a new CTA..."
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    if (newCtaItem.trim()) {
                      setCtaItems([...ctaItems, newCtaItem.trim()]);
                      setNewCtaItem("");
                    }
                  }}
                  className="bg-[#5d60ff] text-white hover:bg-[#4a4dff]"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
          {/* Navigation buttons */}
          <div className="2xl:max-w-6xl px-[50px] mx-auto md:flex block justify-between items-center mt-12 w-full">
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
              {/* <div className="ml-[37px]">
                <p className="font-medium text-[20px]">4/4</p>
                <div className="flex gap-[2px] bg-[#fdfaea] lg:mt-[15px] mt-[10px] cursor-pointer">

                  <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                  <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                  <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                  <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                </div>
              </div> */}

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
  )
}

export default ToneVoiceSelection