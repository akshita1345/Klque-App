"use client"

import { apiClient } from "@/client/client"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Cookies from "js-cookie"
import { useEffect, useState } from "react"
import StepSkip from "../step-skip"
import { useRouter } from "next/navigation"
import { montserrat, delaGothic } from "@/app/layout"
import Image from "next/image"
import { LogOut } from "lucide-react"
import Link from "next/link"

const NicheSelection = () => {
  const router = useRouter();
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [loginUser, setLoginUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [contentIdeas, setContentIdeas] = useState<{ id: number, text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
    setLoginUser(user);

    if (user?._id) {
      generateContentIdeas(user._id);
    }
  }, []);

  const generateContentIdeas = async (userId: string) => {
    try {
      setIsLoading(true);
      console.log("Starting content idea generation for user ID:", userId);

      // Set fallback ideas immediately to ensure users see something even if AI fails
      setFallbackIdeas();

      // Create a simple prompt that doesn't rely on user data
      const promptData = {
        message: `Generate exactly 4 numbered content ideas for content creators.
          
          YOU MUST FORMAT YOUR RESPONSE AS FOLLOWS (with numbers and periods):
          1. [First content idea]
          2. [Second content idea] 
          3. [Third content idea]
          4. [Fourth content idea]
          
          Each idea should be specific, actionable and 1-2 sentences long.
          Only output the numbered list, with no other text or explanation.`,
        userId: userId,
        senderId: "human",
        timestamp: new Date().toISOString(),
        historyId: ""
      };

      console.log("Sending AI request with prompt:", promptData.message);

      try {
        console.log("Making API call to /api/ai-assist");
        const aiResponse = await apiClient("/api/ai-assist", {
          method: "POST",
          body: JSON.stringify(promptData),
        }).catch(err => {
          console.error("Error during API call:", err);
          return null;
        });

        if (!aiResponse) {
          console.log("No response from AI API, using fallback ideas");
          setFallbackIdeas();
          return;
        }

        console.log("AI Response received:", aiResponse);

        if (aiResponse?.messageData?.message) {
          const content = aiResponse.messageData.message;
          console.log("Raw AI content:", content);

          // Extract ideas with multiple approaches
          let ideas: { id: number, text: string }[] = [];

          // Method 1: Try regex extraction first
          const regexIdeas = extractIdeasWithRegex(content);
          if (regexIdeas.length >= 3) {
            ideas = regexIdeas;
          } else {
            // Method 2: Try splitting by numbers
            ideas = extractIdeasBySplitting(content);
          }

          if (ideas.length >= 3) {
            console.log("Successfully extracted ideas:", ideas);
            setContentIdeas(ideas.slice(0, 4));
          } else {
            console.log("Not enough ideas extracted, using fallbacks");
            setFallbackIdeas();
          }
        } else {
          console.log("No message in AI response, using fallback ideas");
          setFallbackIdeas();
        }
      } catch (aiError: any) {
        console.error("AI service error:", aiError);
        console.log("Error details:", aiError.message || "Unknown error");
        setFallbackIdeas();
      }
    } catch (error: any) {
      console.error("Error in content generation:", error);
      console.log("Error details:", error.message || "Unknown error");
      setFallbackIdeas();
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced fallback ideas relevant to various industries
  const setFallbackIdeas = () => {
    console.log("Setting fallback content ideas");
    setContentIdeas([
      { id: 1, text: "Creating a weekly industry news digest with actionable takeaways for professionals in your field." },
      { id: 2, text: "Producing behind-the-scenes content showing your creative process and building trust with your audience." },
      { id: 3, text: "Developing a step-by-step tutorial series addressing common pain points in your niche." },
      { id: 4, text: "Launching a Q&A series where you address the most pressing questions from your audience." }
    ]);
  };

  const handleIdeaSelect = (idea: string) => {
    setSelectedIdea(idea);
  };

  const handleNext = async () => {
    try {
      // If no idea is selected, use the first one by default
      const selectedContent = selectedIdea || (contentIdeas.length > 0 ? contentIdeas[0].text : "Content creation");

      const input = {
        data: [selectedContent],
        step: 6,
        userId: loginUser?._id
      }
      await apiClient("/api/onboard", {
        method: "POST",
        body: JSON.stringify(input),
      });
      router?.push("/ideate?tour=true")
    } catch (error: any) {
      setError(error.message || "Getting error while onboarding");
    }
  }

  const handleLogout = () => {
    Cookies.remove("userId");
    Cookies.remove("token");
    localStorage.clear();
    router.push("/login");
  };

  // Helper function to extract ideas using regex
  const extractIdeasWithRegex = (content: string): { id: number, text: string }[] => {
    const ideas: { id: number, text: string }[] = [];
    const regex = /(\d+)[.)]?\s*([^.\d\n][^\n]+)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const ideaNumber = parseInt(match[1]);
      const ideaText = match[2].trim();
      if (ideaNumber && ideaText) {
        ideas.push({
          id: ideaNumber,
          text: ideaText
        });
      }
    }

    return ideas;
  };

  // Helper function to extract ideas by splitting
  const extractIdeasBySplitting = (content: string): { id: number, text: string }[] => {
    // First clean up the content - remove any leading/trailing junk
    const cleanContent = content
      .replace(/^[^0-9]*/, '') // Remove anything before the first number
      .replace(/\n+/g, '\n')   // Normalize newlines
      .trim();

    // Split by numbers and filter
    const parts = cleanContent.split(/\d+\./).map(p => p.trim()).filter(Boolean);

    return parts.map((text, index) => ({
      id: index + 1,
      text: text
    }));
  };

  return (
    <div className={montserrat.className}>
      <div className="flex flex-col md:flex-row h-screen">
        {/* Left side - Profile info and Ina */}
        <div className="w-full md:w-2/5 bg-[#FFFDF8] flex flex-col h-full">
          {/* Logo in top corner */}
          <div className="p-6">
            <Image
              src="/images/logos/klque-logo.PNG"
              alt="KLQUE Logo"
              width={120}
              height={60}
              priority
              className="lg:max-w-full max-w-[100px] mx-auto h-auto"
            />
          </div>

          {/* Main content centered */}
          <div className="flex-grow flex flex-col items-center justify-center px-6">
            <h2 className="text-[24px] font-[700] mb-6">hey, It's Ina!</h2>

            <div className="relative w-full max-w-xs mb-8">
              <Image
                src="/images/pages/ina.PNG"
                alt="Ina"
                width={250}
                height={250}
                priority
                className="mx-auto"
              />
            </div>

            <div className="text-center w-full max-w-xs mb-8">
              <p className="text-sm text-[#282C40]">
                i just cooked up some quick ideas & this is just the tip of iceberg!
              </p>
            </div>

            {error && (
              <div className="text-red-500 mb-4 text-sm w-full max-w-xs text-center">
                {error}
              </div>
            )}

            <div className="w-full max-w-xs mt-6 flex justify-center">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-[#5D60FF] text-sm hover:underline flex items-center gap-2"
              >
                <LogOut size={16} />
                Log in with a different account ?
              </Button>
            </div>
          </div>

          <div className="p-6"></div>
        </div>

        {/* Right side - Content ideas */}
        <div className="w-full md:w-3/5 bg-[#FCF7E4] md:p-6 p-[20px] md:overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {/* Progress section */}
            <div className="space-y-2 lg:mb-16 mb-8">
              <p className="text-[#0C0829] mb-2">And you&apos;re all set to create...</p>
              <Progress value={100} className="h-2" />
            </div>

            {/* Main content */}
            <div className="flex-1 space-y-8">
              <h1 className="text-[#0C0829] text-xl md:text-2xl font-semibold max-w-2xl leading-tight mb-10">
                Alright, based on what you&apos;ve shared, check these out!
              </h1>
              {/* <p className="text-[#0C0829] text-sm">Here are a few initial ideas to get your wheels turning:</p> */}

              {/* Content Ideas */}
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 my-8">
                  {[1, 2, 3, 4].map((id) => (
                    <div key={id} className="bg-white rounded-xl p-6 shadow-sm animate-pulse h-24">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 my-8">
                  {contentIdeas.map((idea) => (
                    <Button
                      key={idea.id}
                      variant="outline"
                      onClick={() => handleIdeaSelect(idea.text)}
                      className={`p-4 text-base font-medium md:rounded-xl rounded-[5px] border text-left justify-start h-auto ${selectedIdea === idea.text
                        ? 'border-[#5D60FF] text-black bg-[#F5F5F5]'
                        : 'border-[#E5E5E5] text-black bg-white hover:bg-[#F5F5F5]'
                        }`}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="flex-shrink-0 w-6 h-6 min-w-[24px] rounded-full bg-gray-100 flex items-center justify-center mr-2">
                          {idea.id}
                        </div>
                        <div className="flex-grow">
                          <p className="text-[#0C0829] text-left break-words whitespace-normal">
                            {idea.text}
                          </p>
                        </div>
                        {selectedIdea === idea.text && (
                          <div className="ml-auto text-[#5D60FF] flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}

              {/* Pro Upgrade Banner - directly replaces navigation buttons */}
              <div className="mt-16 mb-6 text-center">
                <p className="text-[#0C0829] font-medium mb-4">
                  Want endless ideas, streamlined plan and much more magic?
                </p>
                <Button
                  onClick={handleNext}
                  className="bg-[#5D60FF] hover:bg-[#5D60FF]/90 text-white px-8 py-2 text-base font-medium"
                >
                  Go Pro & Unlock Everything
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NicheSelection;