import { useGame } from '../state/GameContext'
import { useTutorial } from '../state/tutorial'
import { useT } from '../i18n'
import { Icon, Landmark } from './icons'

export function StartScreen({
  onNew,
  onNewAt16,
  onNewAtCarrera,
}: {
  onNew: () => void
  onNewAt16: () => void
  onNewAtCarrera: () => void
}) {
  const { t } = useT()
  const { hasSave, continueGame } = useGame()
  const { resetTutorial } = useTutorial()

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-6">
      <div className="w-full max-w-md text-center animate-card-in">
        <div className="mb-3 flex justify-center">
          <span className="rounded-2xl bg-accent/15 p-3 text-accent2 ring-1 ring-accent/30">
            <Icon icon={Landmark} size={40} />
          </span>
        </div>
        <h1 className="bg-gradient-to-b from-ink to-inksoft bg-clip-text text-4xl font-black tracking-tight text-transparent">
          {t('app.title')}
        </h1>
        <p className="mt-3 text-base text-inksoft">{t('start.subtitle')}</p>
        <p className="mt-3 text-sm leading-relaxed text-inkfaint">{t('start.intro')}</p>
        <div className="mt-8 flex flex-col items-stretch gap-3">
          <button onClick={onNew} className="btn-game animate-pulse-glow">
            {t('start.new')}
          </button>
          {hasSave && (
            <button onClick={continueGame} className="btn-game btn-game--ghost">
              {t('start.continue')}
            </button>
          )}
          {/* Dreceres de PROVES: només en desenvolupament, perquè la primera pantalla de
              producció no sembli una build de dev. */}
          {import.meta.env.DEV && (
            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={onNewAt16}
                className="rounded-xl border border-dashed border-line px-6 py-2 text-sm font-medium text-inkfaint transition hover:border-inkfaint hover:text-inksoft"
              >
                🧪 {t('start.newAt16')}
              </button>
              <button
                onClick={onNewAtCarrera}
                className="rounded-xl border border-dashed border-line px-6 py-2 text-sm font-medium text-inkfaint transition hover:border-inkfaint hover:text-inksoft"
              >
                🧪 {t('start.newAtCarrera')}
              </button>
            </div>
          )}
          <button
            onClick={resetTutorial}
            className="mt-2 text-xs text-inkfaint underline-offset-2 transition hover:text-inksoft hover:underline"
          >
            {t('coach.reset')}
          </button>
        </div>
      </div>
    </div>
  )
}
