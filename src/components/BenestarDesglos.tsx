import { baselineBenestar, desglosBenestarAdult, desglosSalut } from '../domain/stats'
import type { GameState } from '../domain/types'
import { useT } from '../i18n'
import { Heart, Icon, Smile } from './icons'

/** Una fila etiqueta → valor signat (verd suma, vermell resta). */
function FilaDesglos({ clau, valor, suffix = '' }: { clau: string; valor: number; suffix?: string }) {
  const { t } = useT()
  return (
    <div className="flex justify-between text-xs">
      <span className="text-inksoft">{t(clau)}</span>
      <span
        className={`font-medium tabular-nums ${
          valor > 0 ? 'text-money' : valor < 0 ? 'text-danger' : 'text-inkfaint'
        }`}
      >
        {valor > 0 ? '+' : ''}
        {valor}
        {suffix}
      </span>
    </div>
  )
}

/**
 * Explica el mecanisme SUBJACENT de benestar i salut perquè no semblin màgia:
 *  - BENESTAR: cada any es mou poc a poc cap a una REFERÈNCIA (es mostra referència vs actual) que
 *    surt de l'ingrés, el patrimoni, l'habitatge, els vincles, el deute, la precarietat d'origen i
 *    la salut baixa (acoblament).
 *  - SALUT: cada any canvia segons l'edat, la precarietat (benestar baix), les seqüeles i la cura.
 * Es mostra al calaix de detall (vida adulta) i al GameOver.
 */
export function BenestarDesglos({ state }: { state: GameState }) {
  const { t } = useT()
  const comps = desglosBenestarAdult(state)
  const referencia = Math.round(baselineBenestar(state))
  const benestarActual = Math.round(state.person.stats.benestar)
  const salut = desglosSalut(state)
  const salutActual = Math.round(state.person.stats.salut)

  return (
    <div className="space-y-3">
      {/* BENESTAR */}
      <div className="rounded-xl bg-surface/60 p-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-inksoft">
            <Icon icon={Smile} size={15} /> {t('desglos.titol')}
          </h3>
          <span className="text-xs tabular-nums text-inkfaint">
            {t('desglos.referencia', { ref: referencia, ara: benestarActual })}
          </span>
        </div>
        <div className="space-y-1">
          {comps.map((c) => (
            <FilaDesglos key={c.clau} clau={c.clau} valor={c.valor} />
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-inkfaint">{t('desglos.nota')}</p>
      </div>

      {/* SALUT */}
      <div className="rounded-xl bg-surface/60 p-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-inksoft">
            <Icon icon={Heart} size={15} /> {t('salut.desglos.titol')}
          </h3>
          <span
            className={`text-xs font-medium tabular-nums ${
              salut.net > 0 ? 'text-money' : salut.net < 0 ? 'text-danger' : 'text-inkfaint'
            }`}
          >
            {t('salut.desglos.net', {
              actual: salutActual,
              net: `${salut.net > 0 ? '+' : ''}${salut.net}`,
            })}
          </span>
        </div>
        {salut.comps.length > 0 ? (
          <div className="space-y-1">
            {salut.comps.map((c) => (
              <FilaDesglos key={c.clau} clau={c.clau} valor={c.valor} suffix="/any" />
            ))}
          </div>
        ) : (
          <p className="text-xs text-inkfaint">{t('salut.desglos.estable')}</p>
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-inkfaint">{t('salut.desglos.nota')}</p>
      </div>
    </div>
  )
}
