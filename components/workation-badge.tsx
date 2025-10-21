"use client"

import { Badge } from "@/components/ui/badge"
import { Briefcase, Wifi, Laptop, CheckCircle2 } from "lucide-react"

interface WorkationBadgeProps {
  variant?: "default" | "outline" | "minimal"
  size?: "sm" | "md" | "lg"
  showDetails?: boolean
  wifiSpeed?: number
  hasWorkspace?: boolean
}

export function WorkationBadge({ 
  variant = "default",
  size = "md",
  showDetails = false,
  wifiSpeed = 300,
  hasWorkspace = true
}: WorkationBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  }

  if (variant === "minimal") {
    return (
      <Badge 
        className={`bg-gradient-to-r from-purple-600 to-blue-600 ${sizeClasses[size]}`}
      >
        <Briefcase className="w-3 h-3 mr-1" />
        Workation
      </Badge>
    )
  }

  if (showDetails) {
    return (
      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <div className="p-1.5 bg-white dark:bg-gray-900 rounded">
          <Briefcase className="w-4 h-4 text-purple-600" />
        </div>
        <div className="space-y-0.5">
          <div className="font-semibold text-sm flex items-center space-x-1">
            <span>Workation Ready</span>
            <CheckCircle2 className="w-3 h-3 text-green-600" />
          </div>
          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
            {hasWorkspace && (
              <span className="flex items-center space-x-1">
                <Laptop className="w-3 h-3" />
                <span>Workspace</span>
              </span>
            )}
            {wifiSpeed && (
              <span className="flex items-center space-x-1">
                <Wifi className="w-3 h-3" />
                <span>{wifiSpeed}+ Mbps</span>
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Badge 
      variant={variant === "outline" ? "outline" : "default"}
      className={`${
        variant === "default" 
          ? "bg-gradient-to-r from-purple-600 to-blue-600" 
          : "border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
      } ${sizeClasses[size]}`}
    >
      <Briefcase className="w-3 h-3 mr-1" />
      Workation Ready
    </Badge>
  )
}
