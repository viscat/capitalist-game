import { useGame } from '../state/GameContext'
import { useT } from '../i18n'

export function StartScreen({ onNew }: { onNew: () => void }) {
  const { t } = useT()
  const { hasSave, continueGame } = useGame()

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="max-w-lg text-center">
        <h1 className="text-5xl font-black tracking-tight text-slate-100">
          {t('app.title')}
        </h1>
        <p className="mt-4 text-lg text-slate-300">{t('start.subtitle')}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          {t('start.intro')}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={onNew}
            className="w-64 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            {t('start.new')}
          </button>
          {hasSave && (
            <button
              onClick={continueGame}
              className="w-64 rounded-xl bg-slate-700 px-6 py-3 font-semibold text-slate-100 transition hover:bg-slate-600"
            >
              {t('start.continue')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
