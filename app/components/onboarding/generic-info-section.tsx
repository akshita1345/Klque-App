import { OnboardingDataSection } from "./onboarding-data-section";

interface GenericInfoSectionProps {
  title: string;
  data: string[];
}

export function GenericInfoSection({
  title,
  data,
}: GenericInfoSectionProps) {
  return (
    <OnboardingDataSection title={title}>
      <div className="flex flex-wrap gap-2">
        {data.map((item) => (
          <div key={item} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
            {item}
          </div>
        ))}
      </div>
    </OnboardingDataSection>
  );
}