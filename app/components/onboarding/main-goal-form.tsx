import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MainGoalFormProps {
  value: string[];
  onChange: (value: string) => void;
}

const OPTIONS = [
  "Growing brand awareness online",
  "Driving sales or leads through content",
  "Sharing my story and journey",
  "Building credibility and authority in my field",
];

export function MainGoalForm({ value, onChange }: MainGoalFormProps) {
  const [otherValue, setOtherValue] = useState(
    value?.find((v) => !OPTIONS?.flatMap((O) => O?.toLowerCase()).includes(v?.toLowerCase())) || ""
  );

  const handleRadioChange = (newValue: string) => {
    if (newValue === "Other") {
      onChange(otherValue);
    } else {
      onChange(newValue);
    }
  };

  const handleOtherInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtherValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <RadioGroup
      value={OPTIONS?.find((O) => O?.toLowerCase() === value?.[0]?.toLowerCase()) || (otherValue ? "Other" : "")}
      onValueChange={handleRadioChange}
    >
      {OPTIONS.map((option) => (
        <div key={option} className="flex items-center space-x-2">
          <RadioGroupItem value={option} id={option} />
          <Label htmlFor={option}>{option}</Label>
        </div>
      ))}
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="Other" id="other" />
        <Label htmlFor="other">Other</Label>
      </div>
      {OPTIONS?.find((O) => O?.toLowerCase() === value?.[0]?.toLowerCase()) === undefined && (
        <Input
          value={otherValue}
          onChange={handleOtherInputChange}
          placeholder="Please specify"
        />
      )}
    </RadioGroup>
  );
}