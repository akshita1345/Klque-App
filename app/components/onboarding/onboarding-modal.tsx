"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BusinessInfoForm } from "./business-info-form";
import { DescribeForm } from "./describe-form";
import { MainGoalForm } from "./main-goal-form";
import { NewVibeForm } from "./new-vibe-form";
import { ToneVoiceForm } from "./tone-voice-form";

interface OnboardingData {
  describe: string[];
  mainGoal: string;
  newVibe: string[];
  businessInfo: {
    name: string;
    industry: string;
    website: string;
    sites: string[];
  };
  toneVoice: {
    tone: string[];
    voice: string[];
    cta: string[];
  };
  profileSummary: {
    coreValues: string[];
    niche: string[];
    audience: string[];
    audienceObjectives: string[];
    audiencePainPoints: string[];
  };
}

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: OnboardingData;
  currentField: keyof OnboardingData | 'profileSummary' | null;
  handleSave: (data: any) => void;
}

export const OnboardingModal = ({ open, onOpenChange, initialData, currentField, handleSave }: OnboardingModalProps) => {
  const [formData, setFormData] = useState<OnboardingData>(initialData);
  const businessInfoFormRef = useRef<any>(null);

  // Update form data when initial data or current field changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData, currentField]);

  const updateFormData = (newData: any) => {
    setFormData({ ...formData, ...newData });
  };

  const handleSubmit = () => {
    // Validate business info fields before submission
    if (currentField === 'businessInfo' && businessInfoFormRef.current) {
      const isValid = businessInfoFormRef.current.validateRequiredFields();
      if (!isValid) {
        return; // Don't submit if validation fails
      }
    }

    // Handle individual field updates
    switch (currentField) {
      case 'describe':
      case 'mainGoal':
      case 'newVibe':
      case 'businessInfo':
      case 'toneVoice':
      case 'profileSummary':
        handleSave({ [currentField]: formData[currentField] });
        break;
      default:
        handleSave(formData);
        break;
    }

    onOpenChange(false);
  };

  const toggleModal = (value: boolean) => {
    onOpenChange(value);
    // Reset form data to initial state when closing
    if (!value) {
      setFormData(initialData);
    }
  };

  // Get the title for the current field
  const getTitle = () => {
    switch (currentField) {
      case 'describe':
        return "Which of these best describes you?";
      case 'mainGoal':
        return "What's the main goal you want to focus on right now?";
      case 'newVibe':
        return "When people see your content, what's the lasting feeling you'd like them to walk away with?";
      case 'businessInfo':
        return "Business Info";
      case 'toneVoice':
        return "Tone & Voice";
      case 'profileSummary':
        return "Profile Summary";
      default:
        return "Onboarding";
    }
  };

  // Render the appropriate form based on current field
  const renderForm = () => {
    if (!currentField) return null;

    switch (currentField) {
      case 'describe':
        return (
          <DescribeForm
            value={formData.describe}
            onChange={(newData) => updateFormData({ describe: newData })}
          />
        );
      case 'mainGoal':
        return (
          <MainGoalForm
            value={[formData.mainGoal]}
            onChange={(newData) => updateFormData({ mainGoal: newData })}
          />
        );
      case 'newVibe':
        return (
          <NewVibeForm
            value={formData.newVibe}
            onChange={(newData) => updateFormData({ newVibe: newData })}
          />
        );
      case 'businessInfo':
        return (
          <BusinessInfoForm
            ref={businessInfoFormRef}
            value={formData.businessInfo}
            onChange={(newData) => updateFormData({ businessInfo: newData })}
          />
        );
      case 'toneVoice':
        return (
          <ToneVoiceForm
            value={formData.toneVoice}
            onChange={(newData) => updateFormData({ toneVoice: newData })}
          />
        );
      case 'profileSummary':
        // Profile summary edit requires a more complex form
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Core Values</label>
              <textarea
                value={formData.profileSummary.coreValues.join('\n')}
                onChange={(e) => {
                  const values = e.target.value.split('\n').filter(v => v.trim() !== '');
                  updateFormData({
                    profileSummary: {
                      ...formData.profileSummary,
                      coreValues: values
                    }
                  });
                }}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Enter one value per line"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Niche</label>
              <textarea
                value={formData.profileSummary.niche.join('\n')}
                onChange={(e) => {
                  const values = e.target.value.split('\n').filter(v => v.trim() !== '');
                  updateFormData({
                    profileSummary: {
                      ...formData.profileSummary,
                      niche: values
                    }
                  });
                }}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="Enter one niche per line"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Audience</label>
              <textarea
                value={formData.profileSummary.audience.join('\n')}
                onChange={(e) => {
                  const values = e.target.value.split('\n').filter(v => v.trim() !== '');
                  updateFormData({
                    profileSummary: {
                      ...formData.profileSummary,
                      audience: values
                    }
                  });
                }}
                className="w-full p-2 border rounded"
                rows={2}
                placeholder="Enter one audience per line"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Audience Objectives</label>
              <textarea
                value={formData.profileSummary.audienceObjectives.join('\n')}
                onChange={(e) => {
                  const values = e.target.value.split('\n').filter(v => v.trim() !== '');
                  updateFormData({
                    profileSummary: {
                      ...formData.profileSummary,
                      audienceObjectives: values
                    }
                  });
                }}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Enter one objective per line"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Audience Pain Points</label>
              <textarea
                value={formData.profileSummary.audiencePainPoints.join('\n')}
                onChange={(e) => {
                  const values = e.target.value.split('\n').filter(v => v.trim() !== '');
                  updateFormData({
                    profileSummary: {
                      ...formData.profileSummary,
                      audiencePainPoints: values
                    }
                  });
                }}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Enter one pain point per line"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={toggleModal}>
      <DialogContent className="md:max-w-[750px] pt-[15px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div>
          {renderForm()}

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSubmit}
              className="rounded bg-[#5D60FF] hover:bg-[#5D60FF] text-[#FFF] text-xs px-3 py-1 ml-2"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};