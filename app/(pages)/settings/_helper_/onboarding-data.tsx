"use client"
import { GenericInfoSection } from "../../../components/onboarding/generic-info-section";
import { ProfileSummarySection } from "../../../components/onboarding/profile-summary-section";
import { ToneVoiceSection } from "../../../components/onboarding/tone-voice-section";
import { BusinessInfoSection } from "../../../components/onboarding/business-info-section";
import { Button } from "@/components/ui/button";

interface BusinessInfo {
    name: string;
    industry: string;
    website: string;
    sites: string[];
}

interface ToneVoice {
    tone: string[];
    voice: string[];
    cta: string[];
}

interface ProfileSummary {
    coreValues: string[];
    niche: string[];
    audience: string[];
    audienceObjectives: string[];
    audiencePainPoints: string[];
}

interface OnboardingData {
    describe: string[];
    mainGoal: string;
    newVibe: string[];
    businessInfo: BusinessInfo;
    toneVoice: ToneVoice;
    profileSummary: ProfileSummary;
    cta: string[];
}

interface OnboardingResponse {
    title: string;
    field: keyof OnboardingData;
    data: string[];
}

interface OnboardingDataProps {
    onboardingData: OnboardingData;
    setEditingField: (field: keyof OnboardingData | 'profileSummary') => void;
    handleRegenerateProfileSummary: (isRegenerate: boolean) => void;
    onboardingResponses: OnboardingResponse[];
}

export const OnboardingData = ({
    onboardingData,
    setEditingField,
    handleRegenerateProfileSummary,
    onboardingResponses
}: OnboardingDataProps) => {
    return (
        <div className="bg-[#FFFDF8] rounded-lg md:py-[20px] px-[10px] p-4 lg:h-full">
            <div className="flex justify-between items-center">
                <h1 className="text-[14px] font-[600] text-[#2A2A2A] mb-[6px]">Onboarding Data</h1>
                <div className="flex gap-2">
                    <Button onClick={() => setEditingField("profileSummary")} className="rounded bg-[#5D60FF] hover:bg-[#5D60FF] text-[#FFF] text-xs px-3 py-1 ml-2">
                        Edit onboarding data
                    </Button>
                    <Button onClick={() => handleRegenerateProfileSummary(true)} className="rounded bg-[#5D60FF] hover:bg-[#5D60FF] text-[#FFF] text-xs px-3 py-1 ml-2">
                        Regenerate profile summary
                    </Button>
                </div>
            </div>
            <div className="space-y-6 rounded-lg py-4">
                {onboardingResponses.map((response: OnboardingResponse, index: number) => (
                    <GenericInfoSection
                        key={index}
                        title={response.title}
                        data={response.data}
                    />
                ))}
                <BusinessInfoSection
                    businessInfo={onboardingData.businessInfo}
                />
                <ProfileSummarySection
                    profileSummary={onboardingData.profileSummary}
                />
                <ToneVoiceSection
                    toneVoice={onboardingData.toneVoice}
                />
            </div>
        </div>
    )
}