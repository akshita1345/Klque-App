import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface OnboardingDataSectionProps {
  title: string;
  children: React.ReactNode;
}

export function OnboardingDataSection({
  title,
  children,
}: OnboardingDataSectionProps) {
  return (
    <div className="border bg-white p-4 rounded-md shadow-md">
      <div className="flex items-center justify-between pb-4 pt-0">
        <h3 className="text-[16px] font-semibold">{title}</h3>
      </div>
      <div className="">{children}</div>
    </div>
  );
}