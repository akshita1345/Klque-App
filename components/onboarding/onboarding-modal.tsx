"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import SmallRoundedSpinner from "@/components/common/small-rounded-spinner"

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string | React.ReactNode
  iconType?: "error" | "success" | "warning"
  primaryButton?: {
    text: string
    onClick: () => void
    variant?: "default" | "outline" | "destructive" | "ghost" | "link" | "secondary"
    disabled?: boolean
    loading?: boolean
  }
  secondaryButton?: {
    text: string
    onClick: () => void
    variant?: "default" | "outline" | "destructive" | "ghost" | "link" | "secondary"
    disabled?: boolean
    loading?: boolean
  }
  onBackdropClick?: () => void
  showCloseButton?: boolean
}

export function OnboardingModal({
  isOpen,
  onClose,
  title,
  description,
  iconType,
  primaryButton,
  secondaryButton,
  onBackdropClick,
  showCloseButton = true
}: OnboardingModalProps) {
  if (!isOpen) return null

  const getIconConfig = () => {
    switch (iconType) {
      case "error":
        return {
          bgColor: "bg-red-100",
          iconColor: "text-red-600",
          iconPath: "M6 18L18 6M6 6l12 12"
        }
      case "success":
        return {
          bgColor: "bg-green-100",
          iconColor: "text-green-600",
          iconPath: "M5 13l4 4L19 7"
        }
      case "warning":
        return {
          bgColor: "bg-yellow-100",
          iconColor: "text-yellow-600",
          iconPath: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        }
      default:
        return {
          bgColor: "bg-blue-100",
          iconColor: "text-blue-600",
          iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        }
    }
  }

  const iconConfig = getIconConfig()

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (onBackdropClick) {
        onBackdropClick()
      } else {
        onClose()
      }
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-[33rem] p-6 transform transition-all duration-300 ease-in-out animate-in zoom-in-95 sm:scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close dialog"
          >
            <X />
          </button>
        )}
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`w-16 h-16 ${iconConfig.bgColor} rounded-full flex items-center justify-center mb-4`}>
            <svg
              className={`w-8 h-8 ${iconConfig.iconColor}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={iconConfig.iconPath}
              />
            </svg>
          </div>

          {/* Title and Description */}
          <h3 id="modal-title" className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <div className="text-gray-600 mb-6">
            {typeof description === 'string' ? (
              <p dangerouslySetInnerHTML={{ __html: description }} />
            ) : (
              description
            )}
          </div>

          {/* Buttons */}
          {(primaryButton || secondaryButton) && (
            <div className="flex gap-2 w-full">
              {secondaryButton && (
                <Button
                  onClick={secondaryButton.onClick}
                  variant={secondaryButton.variant || "outline"}
                  className="w-full"
                  disabled={secondaryButton.disabled || secondaryButton.loading}
                >
                  {secondaryButton.loading ? (
                    <SmallRoundedSpinner className="w-5 h-5 animate-spin inline-block" />
                  ) : (
                    secondaryButton.text
                  )}
                </Button>
              )}
              {primaryButton && (
                <Button
                  onClick={primaryButton.onClick}
                  variant={primaryButton.variant || "default"}
                  className="w-full"
                  disabled={primaryButton.disabled || primaryButton.loading}
                >
                  {primaryButton.loading ? (
                    <SmallRoundedSpinner className="w-5 h-5 animate-spin inline-block" />
                  ) : (
                    primaryButton.text
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}