import { Button } from "@/components/ui/button";
import { OnboardingDataSection } from "./onboarding-data-section";

interface ProfileSummarySectionProps {
  profileSummary: {
    coreValues: string[];
    niche: string[];
    audience: string[];
    audienceObjectives: string[];
    audiencePainPoints: string[];
  };
}

export function ProfileSummarySection({
  profileSummary,
}: ProfileSummarySectionProps) {
  return (
    <OnboardingDataSection title="Profile Summary">
      <div className="space-y-2">
        <div>
          <p className="font-semibold">Core Values</p>
          <div className="flex flex-wrap gap-2">
            {profileSummary?.coreValues.map((value) => (
              <div
                key={value}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm"
              >
                {value}
              </div>
            ))}
          </div>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Niche</p>
          {profileSummary?.niche.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </div>
        <div className="text-sm">
          <p className="font-semibold">Audience</p>
          {profileSummary?.audience.map((a) => (
            <p key={a}>{a}</p>
          ))}
        </div>
        <div className="text-sm">
          <p className="font-semibold">Audience Objectives</p>
          <ul className="list-disc space-y-1 pl-5">
            {profileSummary?.audienceObjectives.map((obj) => (
              <li key={obj}>{obj}</li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Audience Pain Points</p>
          <ul className="list-disc space-y-1 pl-5">
            {profileSummary?.audiencePainPoints.map((painPoint) => (
              <li key={painPoint}>{painPoint}</li>
            ))}
          </ul>
        </div>
      </div>
    </OnboardingDataSection>
  );
}