import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";

interface ToneVoiceFormProps {
  value: {
    tone: string[];
    voice: string[];
    cta: string[];
  };
  onChange: (value: {
    tone: string[];
    voice: string[];
    cta: string[];
  }) => void;
}

const TONE_OPTIONS = ["Formal", "Professional", "Authoritative", "Analytical", "Academic", "Neutral", "Friendly", "Empathetic", "Supportive", "Encouraging", "Playful", "Inspirational", "Creative / Storyteller", "Dynamic", "Conversational", "Minimalist", "Adaptive / Contextual", "Consultative", "Mentor / Coach", "Butler / Assistant"];
const VOICE_OPTIONS = ["Expert / Consultant Voice", "Coach / Mentor Voice", "Teacher / Educator Voice", "Assistant / Butler Voice", "Friend / Companion Voice", "Storyteller Voice", "Entertainer Voice", "Analyst / Detective Voice", "Creator / Visionary Voice", "Reporter / Journalist Voice", "Therapist / Empath Voice", "Executive / Leader Voice", "Innovator Voice", "Minimalist Voice", "Humorous / Playful Voice", "Detective / Investigator Voice", "AI-Native Voice", "Academic / Scholar Voice", "Customer Service Voice", "Narrative Voice"];

export function ToneVoiceForm({ value, onChange }: ToneVoiceFormProps) {
  const [newCta, setNewCta] = useState("");

  const addCta = () => {
    if (newCta.trim()) {
      onChange({ ...value, cta: [...value.cta, newCta.trim()] });
      setNewCta("");
    }
  };

  const removeCta = (index: number) => {
    const newCtas = [...value.cta];
    newCtas.splice(index, 1);
    onChange({ ...value, cta: newCtas });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Tone</Label>
        <MultiSelect
          options={TONE_OPTIONS.map((option) => ({
            value: option,
            label: option,
          }))}
          onValueChange={(selected) =>
            onChange({
              ...value,
              tone: selected,
            })
          }
          placeholder="Select tones"
          defaultValue={value.tone}
        />
      </div>
      <div>
        <Label>Voice</Label>
        <MultiSelect
          options={VOICE_OPTIONS.map((option) => ({
            value: option,
            label: option,
          }))}
          onValueChange={(selected) =>
            onChange({
              ...value,
              voice: selected,
            })
          }
          placeholder="Select voices"
          defaultValue={value.voice}
        />
      </div>
      <div>
        <Label>CTAs</Label>
        <div className="space-y-2">
          {value.cta.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input value={item} readOnly className="flex-1" />
              <Button variant="ghost" size="icon" onClick={() => removeCta(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={newCta}
              onChange={(e) => setNewCta(e.target.value)}
              placeholder="Add a new CTA"
            />
            <Button onClick={addCta} variant="outline" className="rounded text-xs px-3 py-1 ml-2">Add</Button>
          </div>
        </div>
      </div>
    </div>
  );
}