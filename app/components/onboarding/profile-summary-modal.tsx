import React, { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, SaveIcon } from 'lucide-react';
import { PROFILE_SUMMARY_PERSONAL_TITLE, PROFILE_SUMMARY_BUSINESS_TITLE } from '@/utils/message.util';

const ProfileSummaryModal = ({ open, onOpenChange, userData, handleSave, fetchData }: { open: boolean, onOpenChange: (open: boolean) => void, userData: any, handleSave: (data: any) => void, fetchData: (userData: any, setIsFetchProfileLoading: any, setProfileData: any) => void }) => {

    const [consolidatedProfileText, setConsolidatedProfileText] = useState('');
    const [isFetchProfileLoading, setIsFetchProfileLoading] = useState<boolean>(false);
    const [editMode, setEditMode] = useState({
        allSections: false
    });
    const [profileData, setProfileData] = useState({
        coreValues: [],
        niche: [],
        audience: [],
        audienceObjectives: [],
        audiencePainPoints: [],
        cta: []
    });

    const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (userData?.onboarding && open) {
            fetchData(userData, setIsFetchProfileLoading, setProfileData);
        }
    }, [userData?.onboarding, open]);


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
            const newData = parseTextToProfileData(consolidatedProfileText);
            setProfileData(newData);
        }

        setEditMode(prev => ({
            ...prev,
            allSections: !prev.allSections
        }));
    };

    const handleSubmit = () => {
        // Exiting edit mode - parse text back to data structure
        const newData = parseTextToProfileData(consolidatedProfileText);
        setProfileData(newData);
        handleSave({ profileSummary: newData });
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange} modal>
            <DialogContent className="md:max-w-[750px]">
                <DialogHeader>
                    <DialogTitle>Profile</DialogTitle>
                    <DialogDescription>{loggedInUser?.onboarding?.isPersonal ? PROFILE_SUMMARY_PERSONAL_TITLE : PROFILE_SUMMARY_BUSINESS_TITLE}</DialogDescription>
                    <hr />
                </DialogHeader>
                <div className="mb-12">
                    <div className="max-w-[800px] mx-auto">
                        {/* Single Profile Card */}
                        <div className="bg-white rounded-lg overflow-auto">
                            {/* All sections in a single view/edit mode */}
                            <div className="">
                                {/* Loading Animation */}
                                {isFetchProfileLoading ? (
                                    <div className="flex flex-col items-center justify-center py-10">
                                        <div className="relative w-20 h-20">
                                            <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                                            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
                                        </div>
                                        <p className="mt-4 text-gray-600 font-medium">Generating your profile summary...</p>
                                    </div>
                                ) : (
                                    <>
                                        {(!editMode.allSections && profileData.coreValues?.length) ? (
                                            <>
                                                {/* Core Values Section */}
                                                <div className="mb-3 pb-3 ">
                                                    <h3 className="text-lg font-semibold mb-3">Core Values</h3>
                                                    <ol className="text-[16px] list-decimal pl-5 space-y-2">
                                                        {profileData.coreValues.map((value, index) => (
                                                            <li key={`core-value-${index}`}>{value}</li>
                                                        ))}
                                                    </ol>
                                                </div>

                                                {/* Niche Section */}
                                                <div className="mb-3 pb-3 ">
                                                    <h3 className="text-lg font-semibold mb-3">Niche</h3>
                                                    <ol className="text-[16px] list-decimal pl-5 space-y-2">
                                                        {profileData.niche.map((value, index) => (
                                                            <li key={`niche-${index}`}>{value}</li>
                                                        ))}
                                                    </ol>
                                                </div>

                                                {/* Audience Section */}
                                                <div className="mb-3 pb-3 ">
                                                    <h3 className="text-lg font-semibold mb-3">Audience</h3>
                                                    <ol className="text-[16px] list-decimal pl-5 space-y-2">
                                                        {profileData.audience.map((value, index) => (
                                                            <li key={`audience-${index}`}>{value}</li>
                                                        ))}
                                                    </ol>
                                                </div>

                                                {/* Audience Objectives Section */}
                                                <div className="mb-3 pb-3 ">
                                                    <h3 className="text-lg font-semibold mb-3">Audience Objectives</h3>
                                                    <ol className="text-[16px] list-decimal pl-5 space-y-2">
                                                        {profileData.audienceObjectives.map((value, index) => (
                                                            <li key={`audience-obj-${index}`}>{value}</li>
                                                        ))}
                                                    </ol>
                                                </div>

                                                {/* Audience Pain Points Section */}
                                                <div className="mb-3">
                                                    <h3 className="text-lg font-semibold mb-3">Audience Pain Points</h3>
                                                    <ol className="text-[16px] list-decimal pl-5 space-y-2">
                                                        {profileData.audiencePainPoints.map((value, index) => (
                                                            <li key={`audience-pain-${index}`}>{value}</li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            </>
                                        ) : (!editMode.allSections && !profileData.coreValues?.length) ? (
                                            <div className="flex flex-col items-center justify-center py-8 px-4">
                                                <div className="text-center mb-4">
                                                    <h3 className="text-lg font-semibold mb-2">No Profile Data Available</h3>
                                                    <p className="ttext-[16px] ext-muted-foreground">We couldn&apos;t find your profile information. Would you like to try again?</p>
                                                </div>
                                                <Button
                                                    onClick={() => {
                                                        // Trigger data refresh
                                                        fetchData(userData, setIsFetchProfileLoading, setProfileData);
                                                    }}
                                                    className="flex items-center gap-2 rounded bg-[#5D60FF] hover:bg-[#5D60FF] text-[#FFF] text-xs px-3 py-1 ml-2"
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


                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    {/* Single Edit/Save Button */}
                    <div className="mt-6 text-right flex w-full justify-end gap-2">
                        <button
                            className="px-4 py-2 bg-white border rounded-md text-sm font-medium flex gap-2 items-center"
                            onClick={toggleAllSectionsEditMode}
                            disabled={isFetchProfileLoading}
                        >
                            <Edit3 className="w-[16px] h-[16px]" /> {editMode.allSections ? 'Save' : 'Edit'}
                        </button>
                        <Button
                            onClick={() => handleSubmit()}
                            className="rounded bg-[#5D60FF] hover:bg-[#5D60FF] text-[#FFF] text-xs px-3 py-1 ml-2"
                            disabled={isFetchProfileLoading}
                        >
                            <SaveIcon className="w-[16px] h-[16px]" /> Save
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ProfileSummaryModal