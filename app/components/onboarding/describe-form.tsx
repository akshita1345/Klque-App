import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface DescribeFormProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const OPTIONS = ["Founder / Entrepreneur", "Creator", "Professional / Consultant"];

export function DescribeForm({ value, onChange }: DescribeFormProps) {
  const [otherValue, setOtherValue] = useState(
    value?.find((v) => !OPTIONS?.flatMap((O) => O?.toLowerCase()).includes(v?.toLowerCase())) || ""
  );



  const handleRadioChange = (newValue: string) => {
    if (newValue === "Other") {
      onChange([otherValue]);
    } else {
      onChange([newValue]);
    }
  };

  const handleOtherInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtherValue(e.target.value);
    onChange([e.target.value]);
  };

  return (
    <RadioGroup
      value={value?.find((v) => OPTIONS?.flatMap((O) => O?.toLowerCase()).includes(v?.toLowerCase())) || (otherValue ? "Other" : "")}
      onValueChange={handleRadioChange}
    >
      {OPTIONS.map((option) => (
        <div key={option} className="flex items-center space-x-2">
          <RadioGroupItem value={option} id={option} />
          <Label htmlFor={option}>{option}</Label>
        </div>
      ))}
      <div className="flex space-x-2 flex-col gap-3">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Other" id="other" />
          <Label htmlFor="other">Other</Label>
        </div>
        {value.find((v) => OPTIONS.map((O) => O?.toLowerCase()).includes(v?.toLowerCase())) === undefined && (
          <Input
            value={otherValue}
            onChange={handleOtherInputChange}
            placeholder="Please specify"
          />
        )}
      </div>
    </RadioGroup>
  );
}