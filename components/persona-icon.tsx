import type { LucideIcon } from "lucide-react"
import { Briefcase, PawPrint, Sparkles, Globe2 } from "lucide-react"
import type { PersonaIconName } from "@/lib/personas"

const iconMap: Record<PersonaIconName, LucideIcon> = {
  briefcase: Briefcase,
  paw: PawPrint,
  lotus: Sparkles,
  globe: Globe2,
}

interface PersonaIconProps {
  name: PersonaIconName
  className?: string
}

export function PersonaIcon({ name, className }: PersonaIconProps) {
  const Icon = iconMap[name] ?? Sparkles
  return <Icon className={className} />
}

export { iconMap as personaIconMap }
