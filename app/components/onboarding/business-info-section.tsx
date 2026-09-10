import { OnboardingDataSection } from "./onboarding-data-section";

interface BusinessInfoSectionProps {
  businessInfo: {
    name: string;
    industry: string;
    website: string;
    sites: string[];
  };
}

export function BusinessInfoSection({
  businessInfo,
}: BusinessInfoSectionProps) {
  return (
    <OnboardingDataSection title="Business Info">
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-sm">
          <p className="font-semibold">Business Name: </p>
          <p>{businessInfo?.name}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <p className="font-semibold">Industry: </p>
          <p>{businessInfo?.industry}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <p className="font-semibold">Business Website: </p>
          <p>{businessInfo?.website}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <p className="font-semibold">Social Handles: </p>
          <div className="flex flex-wrap gap-2">
            {businessInfo?.sites.map((site) => (
              <div key={site} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {site}
              </div>
            ))}
          </div>
        </div>
      </div>
    </OnboardingDataSection>
  );
}