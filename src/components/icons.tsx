import {
  Baby,
  Bandage,
  Banknote,
  BarChart3,
  BookOpen,
  Briefcase,
  Coins,
  Dices,
  Dna,
  Factory,
  GraduationCap,
  Handshake,
  HeartHandshake,
  HeartPulse,
  Heart,
  Home,
  Hourglass,
  Landmark,
  LifeBuoy,
  Lock,
  Megaphone,
  Scale,
  Smile,
  Sprout,
  TrendingUp,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type { LucideIcon }

/**
 * Icones de LÍNIA (Lucide) com a sistema únic d'iconografia funcional, en substitució dels
 * emoji. Monocromes (hereten `currentColor`), de gruix i mida consistents: encaixen amb el to
 * editorial seriós i es renderitzen igual a tots els sistemes (els emoji canviaven per SO).
 * Els emoji NOMÉS es conserven al text narratiu dels esdeveniments (color/sabor), no a la UI.
 */

export const ICON_STROKE = 2

/** Renderitza una icona Lucide amb mida/gruix coherents. Hereta el color del text (`currentColor`). */
export function Icon({
  icon: Cmp,
  size = 16,
  className,
}: {
  icon: LucideIcon
  size?: number
  className?: string
}) {
  return <Cmp size={size} strokeWidth={ICON_STROKE} className={className} aria-hidden />
}

/** Icona de cada stat vital (anells del HUD, barres, badges d'efecte). */
export const STAT_ICON: Record<string, LucideIcon> = {
  benestar: Smile,
  salut: Heart,
  moralitat: Scale,
  academic: GraduationCap,
  vincles: Handshake,
  sindicat: Megaphone,
  sequela: Bandage,
  fills: Baby,
}

// Icones estructurals reutilitzables a tota la UI.
export {
  Baby,
  Bandage,
  Banknote,
  BarChart3,
  BookOpen,
  Briefcase,
  Coins,
  Dices,
  Dna,
  Factory,
  GraduationCap,
  Handshake,
  HeartHandshake,
  HeartPulse,
  Heart,
  Home,
  Hourglass,
  Landmark,
  LifeBuoy,
  Lock,
  Megaphone,
  Scale,
  Smile,
  Sprout,
  TrendingUp,
  TriangleAlert,
  Users,
}
