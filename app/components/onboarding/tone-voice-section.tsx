import { OnboardingDataSection } from "./onboarding-data-section";

interface ToneVoiceSectionProps {
  toneVoice: {
    tone: string[];
    voice: string[];
    cta: string[];
  };
}

export function ToneVoiceSection({
  toneVoice,
}: ToneVoiceSectionProps) {
  return (
    <OnboardingDataSection title="Tone & Voice">
      <div className="space-y-2">
        <div>
          <p className="font-semibold">Tone</p>
          <div className="flex flex-wrap gap-2">
            {toneVoice?.tone.map((t) => (
              <div key={t} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {t}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold">Voice</p>
          <div className="flex flex-wrap gap-2">
            {toneVoice?.voice.map((v) => (
              <div key={v} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {v}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold">CTAs</p>
          <ul className="list-disc space-y-1 pl-5">
            {toneVoice?.cta.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </OnboardingDataSection>
  );
}