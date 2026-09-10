import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useImperativeHandle, forwardRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BusinessInfoFormProps {
  value: {
    name: string;
    industry: string;
    website: string;
    sites: string[];
  };
  onChange: (value: {
    name: string;
    industry: string;
    website: string;
    sites: string[];
  }) => void;
}

export const BusinessInfoForm = forwardRef(({ value, onChange }: BusinessInfoFormProps, ref) => {
  const [inputValue, setInputValue] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    name: false,
    industry: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value: val } = e.target;
    onChange({ ...value, [name]: val });

    // Clear validation error when user starts typing
    if (val.trim() !== "") {
      setValidationErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value.trim() !== "") {
      validateInput(e.target.value);
    }
  };

  const addTag = () => {
    if (inputValue.trim() && isValid && value.sites.length < 5) {
      onChange({ ...value, sites: [...value.sites, inputValue.trim()] });
      setInputValue("");
      setError("");
    } else if (value.sites.length >= 5) {
      setError("You can add a maximum of 5 links.");
    } else if (!isValid) {
      setError("Please enter a valid URL.");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange({
      ...value,
      sites: value.sites.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const validateInput = (input: string) => {
    const urlPattern = new RegExp(
      "^(https?:\/\/)?" + // protocol
      "(([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3})" + // OR ip (v4) address
      "(\\:\\d+)?" + // port
      "(\/[-a-z\\d%_.~+]*)*" + // path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
      "i"
    );
    setIsValid(urlPattern.test(input));
  };

  const validateRequiredFields = () => {
    const errors = {
      name: !value.name || value.name.trim() === "",
      industry: !value.industry || value.industry.trim() === ""
    };
    setValidationErrors(errors);
    return !errors.name && !errors.industry;
  };

  // Expose validation function to parent components
  useImperativeHandle(ref, () => ({
    validateRequiredFields
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Business Name *</Label>
        <Input
          id="name"
          name="name"
          value={value.name}
          onChange={handleInputChange}
          required
          aria-required="true"
          className={cn(
            validationErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""
          )}
          aria-invalid={validationErrors.name}
          aria-describedby={validationErrors.name ? "name-error" : undefined}
        />
        {validationErrors.name && (
          <p id="name-error" className="mt-1 ml-1 text-xs text-red-500">
            Business name is required
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="industry">Industry *</Label>
        <Input
          id="industry"
          name="industry"
          value={value.industry}
          onChange={handleInputChange}
          required
          aria-required="true"
          className={cn(
            validationErrors.industry ? "border-red-500 focus-visible:ring-red-500" : ""
          )}
          aria-invalid={validationErrors.industry}
          aria-describedby={validationErrors.industry ? "industry-error" : undefined}
        />
        {validationErrors.industry && (
          <p id="industry-error" className="mt-1 ml-1 text-xs text-red-500">
            Industry is required
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="website">Business Website</Label>
        <Input
          id="website"
          name="website"
          value={value.website}
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Label>Social Handles</Label>
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 rounded-md border px-3 py-2",
            "focus-within:ring-1",
            "transition-all duration-200",
            !isValid ? "border-red-500" : "border-input"
          )}
        >
          {value.sites.map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-sm"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full p-0.5 transition-colors hover:bg-gray-300"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <div className="relative flex-1">
            <Input
              value={inputValue}
              onChange={handleTagInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                value.sites.length === 0
                  ? "Type a link and press Enter"
                  : "Add another link"
              }
              className={cn(
                "border-none bg-transparent p-0 focus-visible:ring-0",
                !isValid ? "text-red-500" : ""
              )}
              aria-invalid={!isValid}
              aria-describedby="tag-error"
            />
          </div>
        </div>
        {error && (
          <p id="tag-error" className="mt-1 ml-1 text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    </div>
  );
});

BusinessInfoForm.displayName = "BusinessInfoForm";