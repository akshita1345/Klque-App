"use client"

import { apiClient } from "@/client/client"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Cookies from "js-cookie"
import { Montserrat } from "next/font/google"
import { useEffect, useState } from "react"
//import StepSkip from "../step-skip"
import { useRouter } from "next/navigation"

const montserrat = Montserrat({ subsets: ["latin"] })

const SubContentTypeSelection = () => {
  const router = useRouter();
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [loginUser, setLoginUser] = useState<any>(null);
  const contentTypes = ["Short form videos", "Text posts", "Visual Posts", "Long form videos", "Not listed here", "Don't know yet"]

  useEffect(() => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
    setLoginUser(user);
  }, []);

  const handleContentTypeSelect = (type: string) => {
    setSelectedContentTypes((prev: any) => {
      // If already selected, remove the type
      if (prev.includes(type?.toLocaleLowerCase())) {
        return prev.filter((t: any) => t !== type);
      }

      // If not already selected and less than 2 types are currently selected, add the type
      return prev.length < 2
        ? [...prev, type?.toLocaleLowerCase()]
        : prev;
    });
  };

  const handleNext = async () => {
    try {
      const input = {
        data: selectedContentTypes,
        step: 5,
        userId: loginUser?._id
      }
      await apiClient("/api/onboard", {
        method: "POST",
        body: JSON.stringify(input),
      });
      router?.push("/onboard/niche")
    } catch (error: any) {
      throw new Error(error.message || "Getting error while onboarding")
    }
  }

  return (
    <div className={montserrat.className}>
      <div className="min-h-screen bg-black p-6 flex flex-col">
        <div className="max-w-3xl mx-auto">
          {/* Progress section */}
          <div className="space-y-2 lg:mb-16 mb-8">
            <p className="text-white mb-2">Just tell us one more thing...</p>
            <Progress value={60} className="h-2" />
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-8">
            <h1 className="text-[#e2eb7c] text-4xl md:text-5xl font-bold max-w-2xl leading-tight">
              What type of content you want to create?
            </h1>
            <span className="text-muted-foreground text-sm mt-0">Select upto 2</span>

            {/* Grid of options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {contentTypes?.map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  className={`py-10 text-xl font-bold lg:rounded-xl rounded-[5px] border-2 ${selectedContentTypes.includes(type?.toLocaleLowerCase())
                    ? 'border-[#e97f5a] text-[#e97f5a] bg-black/50'
                    : 'border-white text-white bg-black'
                    }`}
                  onClick={() => handleContentTypeSelect(type?.toLocaleLowerCase())}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center md:mt-12 mt-[24px]">
            {/* <Button onClick={() => { StepSkip(5, loginUser?._id); router?.push("/onboard/niche") }} variant="ghost" className="text-white/70 hover:text-white hover:bg-transparent">
              Skip
            </Button> */}
            <Button onClick={handleNext} className="bg-[#e97f5a] hover:bg-[#e97f5a]/90 text-white px-8 text-lg font-bold" disabled={selectedContentTypes.length === 0}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubContentTypeSelection