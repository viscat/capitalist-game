import { desglosBenestarAdult } from '../domain/stats'
import type { GameState } from '../domain/types'
import { useT } from '../i18n'

/**
 * Desglossament del benestar de referència adult: d'on surt cada punt (base, ingrés, patrimoni,
 * HABITATGE, vincles, deute, seqüeles, petjada, precarietat d'origen). Fa visible per què el
 * benestar és el que és —p. ex. que viure amb els pares resta i tenir casa pròpia suma—, cosa que
 * abans no es reflectia enlloc. Es mostra al calaix de detall (vida adulta) i al GameOver.
 */
export function BenestarDesglos({ state }: { state: GameState }) {
  const { t } = useT()
  const comps = desglosBenestarAdult(state)
  return (
    <div className="rounded-xl bg-slate-800/60 p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-300">
        {t('desglos.titol')}
      </h3>
      <div className="space-y-1">
        {comps.map((c) => (
          <div key={c.clau} className="flex justify-between text-xs">
            <span className="text-slate-400">{t(c.clau)}</span>
            <span
              className={`font-medium tabular-nums ${
                c.valor > 0
                  ? 'text-emerald-300'
                  : c.valor < 0
                    ? 'text-red-300'
                    : 'text-slate-500'
              }`}
            >
              {c.valor > 0 ? '+' : ''}
              {c.valor}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-inkfaint">
        {t('desglos.nota')}
      </p>
    </div>
  )
}
