import type { ReactNode } from 'react'

/**
 * Shell de joc mòbil vertical: HUD fix a dalt + àrea de contingut scrollable al mig + un peu
 * d'acció FIX a baix (`footer`). El peu és un germà del `flex` (fora de l'àrea scrollable),
 * així que SEMPRE és visible —tant si fas scroll amunt com avall— i mai tapa el contingut: la
 * zona scrollable s'encongeix per deixar-li lloc i el seu últim contingut queda just per damunt.
 *
 * Claus: `h-[100dvh]` (alçada de viewport dinàmica, perquè la barra del navegador no tapi res a
 * mòbil) i `min-h-0` al main (perquè el flex-item pugui encongir i fer scroll intern).
 */
export function AppShell({
  hud,
  children,
  footer,
}: {
  hud: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex h-[100dvh] flex-col">
      {hud}
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-md px-4 pt-3 pb-3">{children}</div>
      </main>
      {footer && (
        <footer className="shrink-0 border-t border-line/60 bg-bg2/90 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
          <div className="mx-auto max-w-md px-4 pt-3">{footer}</div>
        </footer>
      )}
    </div>
  )
}
