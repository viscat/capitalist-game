import type { ReactNode } from 'react'

/**
 * Shell de joc mòbil vertical: HUD fix a dalt + àrea de contingut scrollable que ocupa la
 * resta de la pantalla. El CTA primari de cada fase viu en un peu "sticky" dins del
 * contingut, de manera que sempre és accessible sense fer scroll amunt i avall.
 *
 * Claus: `h-[100dvh]` (alçada de viewport dinàmica, perquè la barra del navegador no tapi
 * res a mòbil) i `min-h-0` al main (perquè el flex-item pugui encongir i fer scroll intern).
 */
export function AppShell({ hud, children }: { hud: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] flex-col">
      {hud}
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-md px-4 pt-3 pb-3">{children}</div>
      </main>
    </div>
  )
}

/**
 * Peu d'acció "sticky": conté el resum viu (efecte de la tria) i el CTA primari. Es queda
 * enganxat a baix de l'àrea scrollable, així el botó de confirmar és sempre a un dit.
 */
export function StickyAction({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-3 border-t border-line/60 bg-bg2/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
      <div className="animate-bar-up">{children}</div>
    </div>
  )
}
