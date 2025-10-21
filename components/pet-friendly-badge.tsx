"use client"

import { Badge } from "@/components/ui/badge"
import { PawPrint, CheckCircle2 } from "lucide-react"

interface PetFriendlyBadgeProps {
  variant?: "default" | "outline" | "minimal" | "detailed"
  size?: "sm" | "md" | "lg"
  showVerified?: boolean
  maxPets?: number
}

export function PetFriendlyBadge({ 
  variant = "default",
  size = "md",
  showVerified = false,
  maxPets
}: PetFriendlyBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  }

  if (variant === "minimal") {
    return (
      <Badge 
        className={`bg-gradient-to-r from-green-600 to-emerald-600 ${sizeClasses[size]}`}
      >
        <PawPrint className="w-3 h-3 mr-1" />
        Pet-Friendly
      </Badge>
    )
  }

  if (variant === "detailed") {
    return (
      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="p-1.5 bg-white dark:bg-gray-900 rounded">
          <PawPrint className="w-4 h-4 text-green-600" />
        </div>
        <div className="space-y-0.5">
          <div className="font-semibold text-sm flex items-center space-x-1">
            <span>Thân thiện thú cưng</span>
            {showVerified && (
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            )}
          </div>
          {maxPets && (
            <div className="text-xs text-muted-foreground">
              Tối đa {maxPets} thú cưng
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Badge 
      variant={variant === "outline" ? "outline" : "default"}
      className={`${
        variant === "default" 
          ? "bg-gradient-to-r from-green-600 to-emerald-600" 
          : "border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
      } ${sizeClasses[size]}`}
    >
      <PawPrint className="w-3 h-3 mr-1" />
      Pet-Friendly
      {showVerified && (
        <CheckCircle2 className="w-3 h-3 ml-1" />
      )}
    </Badge>
  )
}
