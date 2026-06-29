import { useSyncExternalStore } from 'react'
import { isSoundEnabled, setSoundEnabled, subscribeSound } from '../lib/sound'
import { useT } from '../i18n'
import { Icon, Volume2, VolumeX } from './icons'

/** Llegeix l'estat del so (opt-in) de manera reactiva. */
export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribeSound, isSoundEnabled, () => false)
}

/**
 * Botó per activar/desactivar el so i la vibració (per defecte OFF). Petit i discret;
 * apte per al HUD o pantalles de menú. En activar-lo, desbloqueja l'àudio dins del gest.
 */
export function SoundToggle({ className = '' }: { className?: string }) {
  const { t } = useT()
  const on = useSoundEnabled()
  return (
    <button
      type="button"
      onClick={() => setSoundEnabled(!on)}
      aria-pressed={on}
      aria-label={on ? t('so.desactiva') : t('so.activa')}
      title={on ? t('so.desactiva') : t('so.activa')}
      className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-inkfaint transition hover:text-inksoft ${className}`}
    >
      <Icon icon={on ? Volume2 : VolumeX} size={18} />
    </button>
  )
}
