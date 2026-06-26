import { useT } from '../i18n'
import { useCoachmark } from '../state/tutorial'
import { StatRing } from './StatRing'

/** Nivell d'alerta de salut: cap / baixa (<25) / crítica (<10) / extrema (<1). */
export function salutAlerta(salut: number): 'none' | 'baixa' | 'critica' | 'extrema' {
  if (salut < 1) return 'extrema'
  if (salut < 10) return 'critica'
  if (salut < 25) return 'baixa'
  return 'none'
}

/**
 * Els 4 stats vitals com a anells (icona + indicador circular), sempre visibles: benestar,
 * salut, nivell acadèmic i vincles. La salut pulsa en vermell quan el risc de mort és alt.
 * Cada anell registra el seu coachmark del tutorial.
 */
export function StatRings({
  benestar,
  salut,
  academic = 0,
  vincles = 0,
  size = 42,
}: {
  benestar: number
  salut: number
  academic?: number
  vincles?: number
  size?: number
}) {
  const { t } = useT()
  const benestarRef = useCoachmark<HTMLDivElement>('benestar')
  const salutRef = useCoachmark<HTMLDivElement>('salut')
  // Acadèmic i vincles són sempre visibles, però el tutorial només surt quan ja són rellevants.
  const academicRef = useCoachmark<HTMLDivElement>('academic', academic > 0)
  const vinclesRef = useCoachmark<HTMLDivElement>('vincles', vincles > 0)
  const alerta = salutAlerta(salut)

  return (
    <div className="flex items-center gap-2.5">
      <div ref={benestarRef}>
        <StatRing value={benestar} icon="🙂" size={size} label={t('stat.benestar')} />
      </div>
      <div
        ref={salutRef}
        className={alerta !== 'none' ? `salut-alerta-${alerta}` : undefined}
      >
        <StatRing value={salut} icon="❤️" size={size} label={t('stat.salut')} />
      </div>
      <div ref={academicRef}>
        <StatRing value={academic * 100} icon="🎓" size={size} label={t('stat.academic')} />
      </div>
      <div ref={vinclesRef}>
        <StatRing value={vincles * 100} icon="🤝" size={size} label={t('stat.vincles')} />
      </div>
    </div>
  )
}

/** Banner d'avís de mort imminent (escalat) quan la salut és molt baixa. */
export function SalutAvis({ salut }: { salut: number }) {
  const { t } = useT()
  const alerta = salutAlerta(salut)
  if (alerta === 'none') return null
  // Un SOL banner segons el nivell (baixa | crítica | extrema), mai dos alhora. Fons OPAC perquè
  // mai s'hi vegi a través cap altre avís de sota (HUD translúcid) ni quedi superposat. La `key`
  // força React a substituir el node en canviar de nivell (no reaprofitar el de "salut baixa").
  const estil =
    alerta === 'baixa'
      ? 'bg-[#2a1416] text-danger ring-danger/30'
      : 'bg-[#3a1012] text-danger ring-danger/60 animate-pulse'
  return (
    <div
      key={alerta}
      className={`mx-auto mt-2 flex max-w-md items-center justify-center gap-1.5 rounded-lg px-3 py-1 text-center text-[11px] font-bold uppercase tracking-wide ring-1 ${estil}`}
    >
      ⚠️ {t(`salut.perill.${alerta}`)}
    </div>
  )
}
