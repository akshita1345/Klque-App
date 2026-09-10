
"use client"

import { apiClient } from "@/client/client"
import { Button } from "@/components/ui/button"
import Cookies from "js-cookie"
import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { montserrat } from "@/app/layout"
import Image from "next/image"
import SmallRoundedSpinner from "@/components/common/small-rounded-spinner"
import OnboardingSidebar from "../content-type/onboarding-sidebar"
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import ReactMarkdown from 'react-markdown';
import RoundedLargeSpinner from "@/components/common/round-large-spinner"
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";

const BusinessInput = () => {
  const apiCalledRef = useRef(false);

  const router = useRouter();
  const [loginUser, setLoginUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [AILoading, setAILoading] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadyUsedApp, setIsAlreadyUsedApp] = useState<boolean>(false);
  const [selectedTone, setSelectedTone] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition()
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkedStates, setCheckedStates] = useState({});
  const [cardData, setCardData] = useState<any>([]);

  useEffect(() => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
    setSelectedTone(user?.onboarding?.toneVoice?.tone || []);
    setSelectedVoice(user?.onboarding?.toneVoice?.voice || []);
    setTags(user?.onboarding?.toneVoice?.sites || []);
    setLoginUser(user);
  }, []);

  const generateScripts = async (isTryAgain?: boolean) => {
    try {
      // Mark that we're calling the API
      apiCalledRef.current = true;
      setAILoading(true);
      setIsAlreadyUsedApp(false);
      setError(null);
      const messageData: any = {
        userId: loginUser?._id,
        message: "Give me 3 or 4 scripts by analyzing my information",
        senderId: "human",
        timestamp: new Date().toISOString(),
        historyId: "",
        isScriptGeneration: true,
        isTryAgain,
      }
      const response = await apiClient("/api/ai-assist", {
        method: "POST",
        body: JSON.stringify(messageData),
      });

      if (response?.messageData) {
        setCardData(response?.messageData || []);
        if (!response?.messageData?.generatedScriptIds?.length) {
          setError("Hey there! It looks like you’ve already generated your scripts ready to pick your favorites and keep the momentum going?");
          setIsAlreadyUsedApp(true);
        }
      } else {
        setError("Something went wrong while generating scripts");
      }
      setAILoading(false);
    } catch (error: any) {
      // Reset the ref if there's an error so we can try again
      apiCalledRef.current = false;
      setAILoading(false);
      setError(error.message || "Getting error while generating scripts");
    }
  }

  useEffect(() => {
    if (apiCalledRef.current) return;
    if (loginUser?.isSubscribed && loginUser?.plan) {
      setError("Hey there! It looks like you’ve already generated your scripts ready to pick your favorites and keep the momentum going?");
      return;
    }
    if (loginUser) {
      generateScripts();
    }
  }, [loginUser])


  const getOnboardingInput = (nextStep: number, isBack?: boolean) => ({
    ...(isBack ? {} : { data: cardData?.id }),
    step: nextStep,
    userId: loginUser?._id
  });

  const handleNavigation = async (nextStep: number, redirectPath: string, isBack?: boolean, isSkip?: boolean, isOnboarded?: boolean) => {
    try {
      setIsLoading(true);
      if (!Object.keys(checkedStates).filter((id: string) => (checkedStates as Record<string, boolean>)[id]).length && !isSkip && !isBack && !isOnboarded) {
        setError("Please select at least one script");
        return;
      }
      const input = getOnboardingInput(nextStep, isBack);
      const response = await apiClient("/api/onboard", {
        method: "POST",
        body: JSON.stringify({ ...input, ...(isOnboarded ? { input: { isOnboarded } } : {}) }),
      });
      localStorage.setItem("user", JSON.stringify(response));
      localStorage.setItem("hasUsedAppBefore", "true");
      if (!isSkip && !isBack && !isOnboarded) localStorage.setItem("pendingChatPrompt", `${Object.keys(checkedStates).filter((id: string) => (checkedStates as Record<string, boolean>)[id]).join(', ')} Add it to my plan`);
      startTransition(() => {
        router?.push(redirectPath)
      })
    } catch (error: any) {
      setError(error.message || "Getting error while onboarding");
    } finally {
      setIsLoading(false);
    }
  }

  const handleNext = (isSkip?: boolean) => {
    if (loginUser?.isSubscribed && loginUser?.plan) {
      handleNavigation(7, "/ideate", false, isSkip, true)
    } else {
      handleNavigation(7, "/onboard/start-onboarding", false, isSkip || !!error)
    }
  };
  const handleBack = () => handleNavigation(5, "/onboard/tone-voice", true);

  const handleNextScript = () => {
    setCurrentIndex((prev) => (prev + 1) % cardData?.generatedScriptIds?.length);
  };

  const handlePrevScript = () => {
    setCurrentIndex((prev) => (prev - 1 + cardData?.generatedScriptIds?.length) % cardData?.generatedScriptIds?.length);
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setCheckedStates((prev) => ({ ...prev, [id]: checked }));
  };

  const getCardStyle = (offset: number) => {
    if (offset === 0) {
      return 'relative z-50 translate-x-0 scale-100';
    } else if (offset === 1) {
      return 'absolute inset-0 translate-x-20 scale-[83.75%] z-40';
    } else if (offset === -1) {
      return 'absolute inset-0 -translate-x-20 scale-[83.75%] z-30';
    } else if (offset === 2) {
      return 'absolute inset-0  z-30 opacity-100 ';
    } else if (offset === -2) {
      return 'absolute inset-0 z-30 opacity-100';
    } else if (offset >= 3) {
      return 'absolute inset-0 translate-x-10 opacity-0 z-20';
    } else {
      return 'absolute inset-0 -translate-x-10 opacity-0 z-20';
    }
  };

  const getOffset = (cardIndex: number) => {
    return cardIndex - currentIndex;
  };
  return (
    <div className={montserrat.className}>
      <div className="lg:flex flex-col lg:flex-row h-full">
        {/* Left side - Profile info and Ina */}
        <OnboardingSidebar description="Here are some killer script ideas hand-picked for your content!" />
        <div className="2xl:max-w-[calc(100%-460px)] lg:max-w-[calc(100%-400px)] max-w-full w-full relative bg-[#FCF7E4] xl:py-[40px] xl:h-screen py-4 h-full overflow-auto ">
          {(AILoading) && <div className="flex flex-col justify-center items-center h-screen">
            <div className="relative w-20 h-20">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Generating Personalised script for you...</p>
            <p className="mt-1 text-gray-600 font-medium">it may take a moment</p>

          </div>}
          <div className="w-full max-w-5xl mx-auto px-4 lg:px-8 md:px-[170px]">
            {/* Card slider */}
            <div className="px-[50px] sm:px-8 lg:px-[100px]">
              <div className="max-w-3xl mx-auto relative">
                {/* Side Navigation Buttons */}
                {cardData?.generatedScriptIds?.length > 0 && <>
                  <button
                    onClick={handlePrevScript}
                    className={`${error || isAlreadyUsedApp ? "fixed" : "absolute"} left-[-60px] top-1/2 -translate-y-1/2 z-[60] bg-white hover:bg-indigo-50 text-indigo-600 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-300`}
                    aria-label="Previous card"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={handleNextScript}
                    className={`${error || isAlreadyUsedApp ? "fixed" : "absolute"} right-[-60px] top-1/2 -translate-y-1/2 z-[60] bg-white hover:bg-indigo-50 text-indigo-600 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-300`}
                    aria-label="Next card"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
                }

                {/* Cards */}
                <div className="relative ">
                  {cardData?.generatedScriptIds?.map((card: any, index: number) => {
                    const offset = getOffset(index);
                    const isChecked = (checkedStates as Record<string, boolean>)[card.scriptId] || false;

                    return (
                      <div
                        key={card.scriptId}
                        className={`${getCardStyle(offset)} transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group`}
                      >
                        <div className={`xl:w-[750px] bg-white p-6 rounded-lg shadow-2xl transition-all duration-300 h-full ${isChecked ? "border-2 border-indigo-500" : "border border-transparent"}`}>
                          <header className="mb-2">
                            <div className="text-sm font-medium text-indigo-500 hover:underline flex justify-end">
                              <div className="flex items-center justify-between group-hover:border-[#C9C9C9]">
                                <Checkbox
                                  id={card.scriptId}
                                  checked={isChecked}
                                  onCheckedChange={(val) => handleCheckboxChange(card.scriptId, Boolean(val))}
                                  className="rounded-full w-4 h-4"
                                />
                              </div>
                            </div>
                            <h1 className="text-xl font-bold text-slate-900">SCRIPT ID: {card.scriptId}</h1>
                          </header>

                          <div className="lg:w-[450ox] overflow-y-auto">

                            <div className="space-y-2">
                              <p className="text-[14px] text-[#888DA7] font-[500]">Title:</p>
                              <p className="text-[12px] text-black font-[500]">{card.title}</p>
                            </div>

                            <div className="space-y-2 mt-2">
                              <p className="text-[14px] text-[#888DA7] font-[500]">Content Type:</p>
                              <p className="text-[12px] text-black font-[500]">{card.contentType}</p>
                            </div>

                            <div className="space-y-2 mt-2">
                              <p className="text-[14px] text-[#888DA7] font-[500]">Content Pillar:</p>
                              <p className="text-[12px] text-black font-[500]">{card.contentPillar}</p>
                            </div>

                            <div className="space-y-2 mt-2">
                              <p className="text-[14px] text-[#888DA7] font-[500]">Platform:</p>
                              <p className="text-[12px] text-black font-[500]">{card.platform}</p>
                            </div>

                            <div className="space-y-2 mt-2">
                              <p className="text-[14px] text-[#888DA7] font-[500]">Target Audience:</p>
                              <p className="text-[12px] text-black font-[500]">{card.targetAudience}</p>
                            </div>

                            <div className="space-y-2 mt-2">
                              <p className="text-[14px] text-[#888DA7] font-[500]">Focus:</p>
                              <p className="text-[12px] text-black font-[500]">{card.focus}</p>
                            </div>

                            <div className="space-y-2 mt-2">
                              <p className="text-[14px] text-[#888DA7] font-[500]">The Hook</p>
                              <p className="text-[12px] text-black font-[500]">{card.hook}</p>
                            </div>

                            <div className="space-y-2 mt-2">
                              <p className="text-[14px] text-[#888DA7] font-[500]">The Body</p>
                              <ol className="list-decimal pl-[15px]">
                                <ReactMarkdown
                                  className="prose prose-sm break-words content-wrapper"
                                  components={{
                                    ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', fontSize: '12px', fontWeight: '500', color: 'black' }} {...props} />,
                                    ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', fontSize: '12px', fontWeight: '500', color: 'black' }} {...props} />,
                                    a: ({ node, ...props }) => <a style={{ textDecoration: 'underline', fontSize: '12px', fontWeight: '500' }} target="_blank" {...props} />,
                                    pre: ({ node, ...props }) => <pre style={{ backgroundColor: '#f0f0f0', padding: '0.8em', borderRadius: '4px', overflowX: 'auto', fontSize: '12px', color: 'black', fontWeight: '500' }} {...props} />,
                                    p: ({ node, ...props }) => <p style={{ whiteSpace: 'pre-line', marginTop: '0.1em', marginBottom: '0.1em', color: 'black', fontWeight: '500', fontSize: '12px' }} {...props} />,
                                    strong: ({ node, ...props }) => <strong style={{ color: 'black', fontSize: '12px', fontWeight: '500' }} {...props} />,
                                    hr: ({ node, ...props }) => <hr style={{ margin: '1em 0', fontSize: '12px', fontWeight: '500' }} {...props} />,
                                    br: () => null, // Remove <br/> tags entirely
                                  }}
                                >
                                  {card.body}
                                </ReactMarkdown>
                              </ol>
                            </div>

                            <div className="space-y-2 mt-2">
                              <p className="text-[14px] text-[#888DA7] font-[500]">The Conclusion</p>
                              <p className="text-[12px] text-black font-[500]">{card.conclusion}</p>
                            </div>

                            <div className="space-y-2 mt-2">
                              <p className="text-[14px] text-[#888DA7] font-[500]">The CTA</p>
                              <p className="text-[12px] text-black font-[500]">{card.cta}</p>
                            </div>

                            <div className="space-y-2 mt-2">
                              <p className="text-[14px] text-[#888DA7] font-[500]">Caption</p>
                              <p className="text-[12px] text-black font-[500]">{card.caption}</p>
                            </div>

                            <div className="space-y-2 mt-2">
                              <p className="text-[14px] text-[#888DA7] font-[500]">Hashtags</p>
                              <p className="text-[12px] text-black font-[500]">{card.hashtags}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          {/* Navigation buttons */}
          <div className="2xl:max-w-6xl 2xl:px-0 lg:px-[50px] px-[20px] mx-auto md:flex block justify-between items-center mt-12 w-full">
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
            {/* Generate Again Button */}
            <div className="flex item-center gap-2">
              {/* <Button
                onClick={() => {
                  apiCalledRef.current = false;
                  generateScripts(true);
                }}
                variant="outline"
                className="text-[#5D60FF] border-[#5D60FF] hover:bg-[#5D60FF]/10 px-6 lg:!text-[16px] text-[16px] font-[600] w-full h-full lg:py-[16.5px] py-[12px] md:mt-0 mt-4"
                disabled={AILoading}
              >
                {AILoading ? (
                  <SmallRoundedSpinner className="border-[#5D60FF]" />
                ) : (
                  "Generate again"
                )}
              </Button> */}
              {cardData?.generatedScriptIds?.length ? <Button
                onClick={() => {
                  handleNext(true);
                }}
                variant="outline"
                className="text-[#5D60FF] border-[#5D60FF] hover:bg-[#5D60FF]/10 px-6 lg:!text-[16px] text-[16px] font-[600] w-full h-full lg:py-[16.5px] py-[12px] md:mt-0 mt-4"
                disabled={AILoading}
              >
                Skip
              </Button> : null}
              <Button
                onClick={() => {
                  handleNext(false);
                }}
                className="bg-[#5D60FF] hover:bg-[#5D60FF]/90 text-white px-6 lg:!text-[16px] text-[16px] font-[600] w-full h-full lg:py-[16.5px] py-[12px] md:mt-0 mt-4"
              // disabled={!goal || isLoading || isPending}
              >
                {isLoading || isPending ? <SmallRoundedSpinner className="border-white" /> : cardData?.generatedScriptIds?.length ? "Ready to schedule!" : "next"}
              </Button>
            </div>
          </div>
        </div>

        {
          error && (
            <OnboardingModal
              isOpen={!!error}
              onClose={() => setError(null)}
              title="Oops! Something went wrong"
              description={error}
              iconType="error"
              primaryButton={{
                text: "Try again!",
                onClick: () => {
                  apiCalledRef.current = false;
                  generateScripts(true);
                },
                variant: "outline" as const,
                disabled: isLoading
              }}
              secondaryButton={{
                text: "Skip",
                onClick: () => handleNavigation(7, "/onboard/start-onboarding", false, true),
                disabled: isLoading,
                loading: isLoading
              }}
            />
          )
        }
        {
          isAlreadyUsedApp && (
            <OnboardingModal
              isOpen={isAlreadyUsedApp}
              onClose={() => handleNavigation(7, "/onboard/start-onboarding", false, true)}
              title="You are already an app user"
              description="You have already generated scripts. You don't need to visit this step press <b>continue</b> for move forward."
              iconType="success"
              primaryButton={{
                text: "Continue",
                onClick: () => handleNavigation(7, "/onboard/start-onboarding", false, true),
                disabled: isLoading,
                loading: isLoading
              }}
              onBackdropClick={() => handleNavigation(7, "/onboard/start-onboarding", false, true)}
              showCloseButton={false}
            />
          )
        }
      </div>
    </div>
  )
}

export default BusinessInput