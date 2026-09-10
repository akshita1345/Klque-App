"use client"

import { apiClient } from "@/client/client"
import { Button } from "@/components/ui/button"
import Cookies from "js-cookie"
import { useEffect, useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { montserrat } from "@/app/layout"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import SmallRoundedSpinner from "@/components/common/small-rounded-spinner"
import OnboardingSidebar from "../content-type/onboarding-sidebar"
import { Edit3 } from "lucide-react"
import { PROFILE_SUMMARY_BUSINESS_TITLE, PROFILE_SUMMARY_PERSONAL_TITLE } from "@/utils/message.util"

const ProfileSummary = () => {
    const router = useRouter();
    const [loginUser, setLoginUser] = useState<any>(null);
    const [isFetchProfileLoading, setIsFetchProfileLoading] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const apiCalledRef = useRef(false);

    // State for edit mode
    const [editMode, setEditMode] = useState({
        allSections: false
    });

    const [profileData, setProfileData] = useState({
        coreValues: [],
        niche: [],
        audience: [],
        audienceObjectives: [],
        audiencePainPoints: []
    });

    // State for consolidated text
    const [consolidatedProfileText, setConsolidatedProfileText] = useState('');

    // Format profile data into consolidated text
    const formatProfileDataToText = () => {
        let text = '';

        // Core Values
        text += 'Core Values:\n';
        profileData.coreValues.forEach((value, index) => {
            text += `${index + 1}. ${value}\n`;
        });
        text += '\n';

        // Niche
        text += 'Niche:\n';
        profileData.niche.forEach((value, index) => {
            text += `${index + 1}. ${value}\n`;
        });
        text += '\n';

        // Audience
        text += 'Audience:\n';
        profileData.audience.forEach((value, index) => {
            text += `${index + 1}. ${value}\n`;
        });
        text += '\n';

        // Audience Objectives
        text += 'Audience Objectives:\n';
        profileData.audienceObjectives.forEach((value, index) => {
            text += `${index + 1}. ${value}\n`;
        });
        text += '\n';

        // Audience Pain Points
        text += 'Audience Pain Points:\n';
        profileData.audiencePainPoints.forEach((value, index) => {
            text += `${index + 1}. ${value}\n`;
        });

        return text;
    };

    // Parse consolidated text back to profile data structure
    const parseTextToProfileData = (text: string) => {
        const sections = text.split('\n\n');
        const newProfileData: any = { ...profileData };

        sections.forEach(section => {
            if (section.startsWith('Core Values:')) {
                const lines = section.split('\n').slice(1).filter(line => line.trim() !== '');
                newProfileData.coreValues = lines.map(line => line.replace(/^\d+\.\s*/, ''));
            } else if (section.startsWith('Niche:')) {
                const lines = section.split('\n').slice(1).filter(line => line.trim() !== '');
                newProfileData.niche = lines.map(line => line.replace(/^\d+\.\s*/, ''));
            } else if (section.startsWith('Audience:')) {
                const lines = section.split('\n').slice(1).filter(line => line.trim() !== '');
                newProfileData.audience = lines.map(line => line.replace(/^\d+\.\s*/, ''));
            } else if (section.startsWith('Audience Objectives:')) {
                const lines = section.split('\n').slice(1).filter(line => line.trim() !== '');
                newProfileData.audienceObjectives = lines.map(line => line.replace(/^\d+\.\s*/, ''));
            } else if (section.startsWith('Audience Pain Points:')) {
                const lines = section.split('\n').slice(1).filter(line => line.trim() !== '');
                newProfileData.audiencePainPoints = lines.map(line => line.replace(/^\d+\.\s*/, ''));
            }
        });

        return newProfileData;
    };

    // Toggle edit mode for all sections
    const toggleAllSectionsEditMode = () => {
        if (!editMode.allSections) {
            // Entering edit mode - format current data to text
            setConsolidatedProfileText(formatProfileDataToText());
        } else {
            // Exiting edit mode - parse text back to data structure
            setProfileData(parseTextToProfileData(consolidatedProfileText));
        }

        setEditMode(prev => ({
            ...prev,
            allSections: !prev.allSections
        }));
    };

    const fetchData = async () => {
        setIsFetchProfileLoading(true);
        try {
            // Mark that we're calling the API
            apiCalledRef.current = true;

            const response = await fetch('/api/ai-profile-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: loginUser?._id,
                    describe: loginUser?.onboarding?.describe,
                    mainGoal: loginUser?.onboarding?.mainGoal,
                    newVibe: loginUser?.onboarding?.newVibe,
                    businessInfo: loginUser?.onboarding?.businessInfo,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile summary');
            }

            const result = await response.json();
            const profileSummary = result.data;

            setProfileData({
                coreValues: profileSummary?.core_values || [],
                niche: profileSummary?.niche || [],
                audience: profileSummary?.target_audience || [],
                audienceObjectives: profileSummary?.audience_objectives || [],
                audiencePainPoints: profileSummary?.audience_pain_points || []
            });
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Failed to fetch user data');
            // Reset the ref if there's an error so we can try again
            apiCalledRef.current = false;
        } finally {
            setIsFetchProfileLoading(false);
        }
    };

    useEffect(() => {
        const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
        setLoginUser(user);
    }, []);

    useEffect(() => {
        if (apiCalledRef.current) return;
        if (loginUser && !loginUser?.profileSummary) {
            fetchData();
        } else if (loginUser?.profileSummary) {
            setProfileData(loginUser?.profileSummary);
        }
    }, [loginUser]);

    const getOnboardingInput = (nextStep: number, isBack?: boolean) => ({
        ...(isBack ? {} : { data: profileData }),
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

    const handleNext = () => handleNavigation(5, "/onboard/tone-voice");
    const handleBack = () => handleNavigation(3, "/onboard/business-info", true);

    return (
        <div className={montserrat.className}>
            <div className="lg:flex flex-col lg:flex-row h-full">
                {/* Left side - Profile info and Ina */}
                <OnboardingSidebar description="Hurray! your profile summary is ready" />

                {/* Right side - Goal selection */}
                <div className="2xl:max-w-[calc(100%-460px)] lg:max-w-[calc(100%-400px)] max-w-full w-full relative bg-[#FCF7E4] h-full lg:h-screen xl:py-0 py-4 overflow-auto">
                    <div className="2xl:max-w-full mx-auto 2xl:px-[148px] lg:px-[80px] px-[50px] my-8">
                        {/* Main content */}
                        <div className="flex-1">
                            {/* <h1 className="text-[#0C0829] xl:text-[30px] text-[25px] font-semibold leading-tight !mb-[30px]">
                                Here&apos;s your profile summary based on information you have provided.
                            </h1> */}

                            <div className="mb-12 mt-8">
                                <div className="max-w-[800px] mx-auto">
                                    {/* Single Profile Card */}
                                    <div className="bg-white rounded-lg py-8 shadow-sm overflow-auto">
                                        {/* Profile Header */}
                                        <h2 className="text-2xl font-semibold mb-3 px-8">Profile</h2>
                                        <p className="text-gray-600 mb-3 px-8">{loginUser?.onboarding?.isPersonal ? PROFILE_SUMMARY_PERSONAL_TITLE : PROFILE_SUMMARY_BUSINESS_TITLE}</p>
                                        <hr />
                                        {/* Core Values Section */}
                                        {/* All sections in a single view/edit mode */}
                                        <div className="px-8 mt-3">
                                            {/* Loading Animation */}
                                            {isFetchProfileLoading ? (
                                                <div className="flex flex-col items-center justify-center py-10">
                                                    <div className="relative w-20 h-20">
                                                        <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                                                        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
                                                    </div>
                                                    <p className="mt-4 text-gray-600 font-medium">Generating your profile summary...</p>
                                                    {/* <div className="mt-6 w-full max-w-md">
                                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
                                                        </div>
                                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                                            {[1, 2, 3].map((i) => (
                                                                <div key={i} className="h-8 bg-gray-200 rounded-md animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                                                            ))}
                                                        </div>
                                                    </div> */}
                                                </div>
                                            ) : (
                                                <>
                                                    {(!editMode.allSections && profileData.coreValues?.length) ? (
                                                        <>
                                                            {/* Core Values Section */}
                                                            <div className="mb-3 pb-3 ">
                                                                <h3 className="text-xl font-semibold mb-3">Core Values</h3>
                                                                <ol className="list-decimal pl-5 space-y-2">
                                                                    {profileData.coreValues.map((value, index) => (
                                                                        <li key={`core-value-${index}`}>{value}</li>
                                                                    ))}
                                                                </ol>
                                                            </div>

                                                            {/* Niche Section */}
                                                            <div className="mb-3 pb-3 ">
                                                                <h3 className="text-xl font-semibold mb-3">Niche</h3>
                                                                <ol className="list-decimal pl-5 space-y-2">
                                                                    {profileData.niche.map((value, index) => (
                                                                        <li key={`niche-${index}`}>{value}</li>
                                                                    ))}
                                                                </ol>
                                                            </div>

                                                            {/* Audience Section */}
                                                            <div className="mb-3 pb-3 ">
                                                                <h3 className="text-xl font-semibold mb-3">Audience</h3>
                                                                <ol className="list-decimal pl-5 space-y-2">
                                                                    {profileData.audience.map((value, index) => (
                                                                        <li key={`audience-${index}`}>{value}</li>
                                                                    ))}
                                                                </ol>
                                                            </div>

                                                            {/* Audience Objectives Section */}
                                                            <div className="mb-3 pb-3 ">
                                                                <h3 className="text-xl font-semibold mb-3">Audience Objectives</h3>
                                                                <ol className="list-decimal pl-5 space-y-2">
                                                                    {profileData.audienceObjectives.map((value, index) => (
                                                                        <li key={`audience-obj-${index}`}>{value}</li>
                                                                    ))}
                                                                </ol>
                                                            </div>

                                                            {/* Audience Pain Points Section */}
                                                            <div className="mb-3">
                                                                <h3 className="text-xl font-semibold mb-3">Audience Pain Points</h3>
                                                                <ol className="list-decimal pl-5 space-y-2">
                                                                    {profileData.audiencePainPoints.map((value, index) => (
                                                                        <li key={`audience-pain-${index}`}>{value}</li>
                                                                    ))}
                                                                </ol>
                                                            </div>
                                                        </>
                                                    ) : (!editMode.allSections && !profileData.coreValues?.length) ? (
                                                        <div className="flex flex-col items-center justify-center py-8 px-4">
                                                            <div className="text-center mb-4">
                                                                <h3 className="text-xl font-semibold mb-2">No Profile Data Available</h3>
                                                                <p className="text-muted-foreground">We couldn&apos;t find your profile information. Would you like to try again?</p>
                                                            </div>
                                                            <Button
                                                                onClick={() => {
                                                                    // Trigger data refresh
                                                                    fetchData();
                                                                }}
                                                                className="flex items-center gap-2"
                                                                variant="default"
                                                            >
                                                                Try Again
                                                            </Button>
                                                        </div>
                                                    ) : null
                                                    }

                                                    {/* Single Textarea for all sections in edit mode */}
                                                    {editMode.allSections ? (
                                                        <div className="mt-6 mb-6">
                                                            <Textarea
                                                                value={consolidatedProfileText}
                                                                onChange={(e) => setConsolidatedProfileText(e.target.value)}
                                                                className="w-full min-h-[400px]"
                                                                placeholder="Enter your profile information here..."
                                                            />
                                                        </div>
                                                    ) : null}

                                                    {/* Single Edit/Save Button */}
                                                    <div className="mt-6 text-right flex w-full justify-end">
                                                        <button
                                                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium flex gap-2 items-center"
                                                            onClick={toggleAllSectionsEditMode}
                                                            disabled={isLoading}
                                                        >
                                                            <Edit3 className="w-[16px] h-[16px]" /> {editMode.allSections ? 'Save' : 'Edit'}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
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
                                    {/* <div className="ml-[37px]">
                                        <p className="font-medium text-[20px]">2/4</p>
                                        <div className="flex gap-[2px] bg-[#fdfaea] lg:mt-[15px] mt-[10px] cursor-pointer">

                                            <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                                            <div className="w-[26px] h-[10px] rounded-[20px] bg-[#5D60FF] border  border-[#5D60FF]"></div>
                                            <div className="w-[26px] h-[10px] rounded-[20px] border  border-[#5D60FF]"></div>
                                            <div className="w-[26px] h-[10px] rounded-[20px] border  border-[#5D60FF]"></div>
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
            </div>
        </div>
    )
}

export default ProfileSummary