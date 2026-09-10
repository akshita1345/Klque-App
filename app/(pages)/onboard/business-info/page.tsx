"use client"

import { BlueCheckbox } from "@/components/ui/BlueCheckbox"
import { useEffect, useState, useTransition } from "react"
import { apiClient } from "@/client/client"
import { Button } from "@/components/ui/button"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { montserrat } from "@/app/layout"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import SmallRoundedSpinner from "@/components/common/small-rounded-spinner"
import OnboardingSidebar from "../content-type/onboarding-sidebar"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const BusinessInfo = () => {
    const router = useRouter();
    const [loginUser, setLoginUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [tags, setTags] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState<boolean>(true);
    const [isPending, startTransition] = useTransition()

    // Business form fields
    const [isPersonalDetailsChecked, setIsPersonalDetailsChecked] = useState<boolean>(false);
    const [businessName, setBusinessName] = useState<string>("");
    const [industry, setIndustry] = useState<string>("");
    const [businessWebsite, setBusinessWebsite] = useState<string>("");

    // Form validation errors
    const [formErrors, setFormErrors] = useState<{
        businessName?: string;
        industry?: string;
        businessWebsite?: string;
    }>({});

    useEffect(() => {
        const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
        setBusinessName(user?.onboarding?.businessInfo?.name || "");
        setIndustry(user?.onboarding?.businessInfo?.industry || "");
        setBusinessWebsite(user?.onboarding?.businessInfo?.website || "");
        setTags(user?.onboarding?.businessInfo?.sites || []);
        setLoginUser(user);
    }, []);

    const getOnboardingInput = (nextStep: number, isBack?: boolean) => ({
        ...(isBack ? {} : {
            data: {
                name: !isPersonalDetailsChecked ? businessName : "",
                industry: !isPersonalDetailsChecked ? industry : "",
                website: !isPersonalDetailsChecked ? businessWebsite : "",
                sites: tags,
            }
        }),
        step: nextStep,
        userId: loginUser?._id
    });

    const handleNavigation = async (nextStep: number, redirectPath: string, isBack?: boolean) => {
        try {
            setIsLoading(true);
            const input = getOnboardingInput(nextStep, isBack);
            const response = await apiClient("/api/onboard", {
                method: "POST",
                body: JSON.stringify({ ...input, input: { isPersonal: isPersonalDetailsChecked } }),
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

    // Validate all required fields
    const validateForm = (): boolean => {
        if (isPersonalDetailsChecked) return true;

        const errors: {
            businessName?: string;
            industry?: string;
            businessWebsite?: string;
        } = {};

        if (!businessName.trim()) {
            errors.businessName = "Business name is required";
        }

        if (!industry.trim()) {
            errors.industry = "Industry is required";
        }

        // if (!businessWebsite.trim()) {
        //     errors.businessWebsite = "Business website is required";
        // }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateForm()) {
            handleNavigation(4, "/onboard/profile-summary");
        }
    };

    const handleBack = () => handleNavigation(2, "/onboard/new-vibe", true);

    // Tag validation rules
    const validateTag = (tag: string): { valid: boolean; message?: string } => {
        if (tag.length < 2) {
            return { valid: false, message: "Tag must be at least 2 characters" };
        }
        if (tags.includes(tag)) {
            return { valid: false, message: "This tag already exists" };
        }
        if (tags.length >= 5) {
            return { valid: false, message: "Maximum 5 accounts/website links allowed" };
        }
        return { valid: true };
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        // Real-time validation feedback
        if (value.trim() !== "") {
            const validation = validateTag(value.trim());
            setIsValid(validation.valid);
            setError(validation.valid ? null : validation.message || null);
        } else {
            setIsValid(true);
            setError(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputValue.trim() !== "") {
            e.preventDefault();
            const newTag = inputValue.trim();
            const validation = validateTag(newTag);

            if (validation.valid) {
                setTags([...tags, newTag]);
                setInputValue("");
                setError(null);
                setIsValid(true);
            } else {
                setError(validation.message || null);
                setIsValid(false);
            }
        } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
        // Reset error state when removing tags
        if (tags.length <= 10) {
            setError(null);
            setIsValid(true);
        }
    };

    const addTag = () => {
        if (inputValue.trim() !== "") {
            const newTag = inputValue.trim();
            const validation = validateTag(newTag);

            if (validation.valid) {
                setTags([...tags, newTag]);
                setInputValue("");
                setError(null);
                setIsValid(true);
            } else {
                setError(validation.message || null);
                setIsValid(false);
            }
        }
    };

    return (
        <div className={montserrat.className}>
            <div className="lg:flex flex-col lg:flex-row h-full">
                {/* Left side - Profile info and Ina */}
                <OnboardingSidebar description="love that! tell me a little about your brand to get started" />

                {/* Right side - Goal selection */}
                <div className="2xl:max-w-[calc(100%-460px)] lg:max-w-[calc(100%-400px)] max-w-full w-full relative bg-[#FCF7E4] h-full lg:h-screen xl:py-0 py-4">
                    <div className="2xl:max-w-full mx-auto flex items-center justify-center h-full 2xl:px-[148px] lg:px-[80px] px-[50px]">
                        {/* Main content */}
                        <div className="flex-1">
                            <label className="text-[#0C0829] 2xl:text-[25px] lg:text-[27px] text-[25px] font-semibold leading-tight 2xl:mb-4 mb-2 block">
                                Provide your business information.
                            </label>

                            <div className="flex items-center gap-2 mb-6 mt-4">
                                <BlueCheckbox
                                    checked={isPersonalDetailsChecked}
                                    onCheckedChange={(checked) => setIsPersonalDetailsChecked(checked as boolean)}
                                    id="personal-details-check"
                                />
                                <label
                                    htmlFor="personal-details-check"
                                    className="text-[18px] font-medium text-[#1E1E1E] cursor-pointer"
                                >
                                    Personal Details
                                </label>
                            </div>

                            {!isPersonalDetailsChecked && (
                                <>
                                    <div className="mb-8 mt-4">
                                        <p className="font-medium text-[18px] mb-2">
                                            Business Name :
                                        </p>
                                        <Input
                                            placeholder="Enter your business name..."
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            className={cn(
                                                "w-full !h-full py-[16px] px-[26px] lg:text-[16px] text-[14px] font-medium !rounded-[6px] border bg-[#FFFDF8] text-[#616161]",
                                                formErrors.businessName ? "border-red-500" : "border-[#DDDDDD]"
                                            )}
                                        />
                                        {formErrors.businessName && (
                                            <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.businessName}</p>
                                        )}
                                    </div>
                                    <div className="mb-8 mt-8">
                                        <p className="font-medium text-[18px] mb-2">
                                            Industry :
                                        </p>
                                        <Input
                                            placeholder="Enter your industry..."
                                            value={industry}
                                            onChange={(e) => setIndustry(e.target.value)}
                                            className={cn(
                                                "w-full !h-full py-[16px] px-[26px] lg:text-[16px] text-[14px] font-medium !rounded-[6px] border bg-[#FFFDF8] text-[#616161]",
                                                formErrors.industry ? "border-red-500" : "border-[#DDDDDD]"
                                            )}
                                        />
                                        {formErrors.industry && (
                                            <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.industry}</p>
                                        )}
                                    </div>
                                    <div className="mb-8 mt-8">
                                        <p className="font-medium text-[18px] mb-2">
                                            Business Website :
                                        </p>
                                        <Input
                                            placeholder="Enter your business website..."
                                            value={businessWebsite}
                                            onChange={(e) => setBusinessWebsite(e.target.value)}
                                            className={cn(
                                                "w-full !h-full py-[16px] px-[26px] lg:text-[16px] text-[14px] font-medium !rounded-[6px] border bg-[#FFFDF8] text-[#616161]",
                                                formErrors.businessWebsite ? "border-red-500" : "border-[#DDDDDD]"
                                            )}
                                        />
                                        {formErrors.businessWebsite && (
                                            <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.businessWebsite}</p>
                                        )}
                                    </div>
                                </>
                            )}
                            <div className="mb-8 mx-auto w-full">
                                <p className="font-medium text-[18px] mb-2">
                                    Your Social handles :
                                </p>
                                <div
                                    className={cn(
                                        "flex flex-wrap items-center gap-2 rounded-md border px-[20px] py-[10px]",
                                        "focus-within:ring-1",
                                        "transition-all duration-200 bg-[#FFFDF8]",
                                        !isValid ? "border-red-500" : "border-input"
                                    )}
                                >
                                    {tags.map((tag) => (
                                        <div
                                            key={tag}
                                            className="flex items-center gap-1 rounded-full bg-[#5d60ff] px-3 py-1.5 text-sm text-white transition-all hover:bg-[#4a4dff]"
                                        >
                                            <span>{tag}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-1 text-white rounded-full hover:bg-[#4a4dff]/50 p-0.5 transition-colors"
                                                aria-label={`Remove ${tag} tag`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}

                                    <div className="flex-1 flex items-center min-w-[200px] relative">
                                        <Input
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            placeholder={tags.length === 0 ? "Type an account/website link and press Enter" : "Add another link"}
                                            className={cn(
                                                "border-none bg-transparent focus-visible:ring-0 p-0 lg:text-[16px] text-[14px] font-medium !rounded-[6px] text-[#616161]",
                                                !isValid ? "text-red-500" : ""
                                            )}
                                            aria-invalid={!isValid}
                                            aria-describedby="tag-error"
                                        />
                                        {inputValue.trim() !== "" && (
                                            <button
                                                type="button"
                                                onClick={addTag}
                                                className={cn(
                                                    "ml-2 p-1 rounded-full transition-colors",
                                                    isValid
                                                        ? "text-[#5d60ff] hover:bg-[#5d60ff]/10"
                                                        : "text-red-500 hover:bg-red-500/10"
                                                )}
                                                disabled={!isValid}
                                                aria-label="Add tag"
                                            >
                                                +
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {error && (
                                    <p id="tag-error" className="text-red-500 text-xs mt-1 ml-1">{error}</p>
                                )}
                                {tags.length > 0 && !error && (
                                    <p className="text-xs text-gray-500 mt-1 ml-1">{tags.length} of 5 accounts/website links added</p>
                                )}
                            </div>
                            {/* Navigation buttons */}
                            <div className="md:flex block justify-between items-center mt-12">
                                {/* <div className="flex items-center gap-2">

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
                                        <p className="font-medium text-[20px]">3/4</p>
                                        <div className="flex gap-[2px] bg-[#fdfaea] lg:mt-[15px] mt-[10px] cursor-pointer">

                                            <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                                            <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                                            <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                                            <div className="w-[26px] h-[10px] rounded-[20px] border  border-[#5D60FF]"></div>
                                        </div>
                                    </div>

                                </div> */}
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

export default BusinessInfo