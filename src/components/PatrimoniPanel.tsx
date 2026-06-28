import {
  balancUniversitatAnual,
  desglosNominaMensual,
  estalviAnualCriatura,
  factorSalariPersonal,
  pagaMensual,
  patrimoniTotal,
} from '../domain/stats'
import type {
  Familia,
  Habitatge,
  Identitat,
  Itinerari,
  LifeStage,
  Person,
} from '../domain/types'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-100">{value}</span>
    </div>
  )
}

/** Desglossament de la nòmina mensual: brut → Seguretat Social, IRPF → net. */
function NominaRows({ brutMensual }: { brutMensual: number }) {
  const { t } = useT()
  const n = desglosNominaMensual(brutMensual)
  return (
    <>
      <Row label={t('nomina.brut')} value={`${formatEuros(n.brut)}/mes`} />
      <div className="flex justify-between text-sm">
        <span className="pl-3 text-slate-500">{t('nomina.ss')}</span>
        <span className="font-medium text-amber-400">
          −{formatEuros(n.seguretatSocial)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="pl-3 text-slate-500">{t('nomina.irpf')}</span>
        <span className="font-medium text-amber-400">−{formatEuros(n.irpf)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-slate-200">{t('nomina.net')}</span>
        <span className="font-bold text-emerald-300">{formatEuros(n.net)}/mes</span>
      </div>
    </>
  )
}

export function PatrimoniPanel({
  person,
  familia,
  stage,
  itinerari,
  salari,
  identitat,
  habitatge,
}: {
  person: Person
  familia: Familia
  stage: LifeStage
  itinerari?: Itinerari
  salari?: number
  identitat?: Identitat
  habitatge?: Habitatge
}) {
  const { t } = useT()
  const { efectiu, inversions, cases } = person.patrimoni
  const esAdult = stage === 'universitat' || stage === 'carrera'
  const valorCases = cases.reduce((a, b) => a + b, 0)
  const deuteHipoteca = habitatge?.hipoteca?.deute ?? 0
  const deuteConsum = person.patrimoni.deute ?? 0
  // patrimoniTotal ja descompta el deute de consum; aquí restem també la hipoteca.
  const net = patrimoniTotal(person) - deuteHipoteca

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-800/60 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-300">
          {t('patrimoni.title')}
        </h3>
        <div className="space-y-1.5">
          <Row label={t('patrimoni.efectiu')} value={formatEuros(efectiu)} />
          {(esAdult || inversions > 0) && (
            <Row label={t('patrimoni.inversions')} value={formatEuros(inversions)} />
          )}
          {cases.length > 0 && (
            <Row label={t('patrimoni.cases')} value={formatEuros(valorCases)} />
          )}
          {deuteConsum > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-red-300">{t('patrimoni.deute')}</span>
              <span className="font-medium text-red-400">
                −{formatEuros(deuteConsum)}
              </span>
            </div>
          )}
          {deuteHipoteca > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{t('habitatge.deute')}</span>
              <span className="font-medium text-amber-400">
                −{formatEuros(deuteHipoteca)}
              </span>
            </div>
          )}
          <div className="my-2 border-t border-slate-700" />
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-slate-200">
              {t('patrimoni.total')}
            </span>
            <span className={`font-bold ${net < 0 ? 'text-red-400' : 'text-emerald-300'}`}>
              {formatEuros(net)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/60 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-300">
          {t('context.title')}
        </h3>
        <div className="space-y-1.5">
          <Row
            label={t('context.ingressos')}
            value={`${formatEuros(familia.ingressosMensuals)}/mes`}
          />
          {stage === 'laboral' ? (
            itinerari === 'treball' ? (
              salari && salari > 0 ? (
                <NominaRows brutMensual={salari} />
              ) : (
                <Row label={t('context.ingressosPropis')} value={t('context.atur')} />
              )
            ) : (
              <Row
                label={t('context.paga')}
                value={`${formatEuros(pagaMensual(familia))}/mes`}
              />
            )
          ) : stage === 'carrera' ? (
            salari && salari > 0 ? (
              <NominaRows brutMensual={salari} />
            ) : (
              <Row label={t('context.ingressosPropis')} value={t('context.atur')} />
            )
          ) : stage === 'universitat' ? (
            <Row
              label={t('context.suportUni')}
              value={`${formatEuros(balancUniversitatAnual(familia))}/any`}
            />
          ) : stage === 'adolescencia' || stage === 'estudis_post' ? (
            <Row
              label={t('context.paga')}
              value={`${formatEuros(pagaMensual(familia))}/mes`}
            />
          ) : (
            <Row
              label={t('context.estalviAnual')}
              value={formatEuros(estalviAnualCriatura(familia))}
            />
          )}
          {identitat?.genere && (
            <Row label={t('create.genere')} value={t(`genere.${identitat.genere}`)} />
          )}
          {identitat?.origen && (
            <Row label={t('create.origen')} value={t(`origen.${identitat.origen}`)} />
          )}
          {esAdult && factorSalariPersonal(identitat) < 1 && (
            <p className="text-xs text-amber-400/80">
              ⚖️ {t('patrimoni.bretxa', {
                pct: Math.round((1 - factorSalariPersonal(identitat)) * 100),
              })}
            </p>
          )}
          {identitat && (
            <>
              <Row
                label={t('create.pare')}
                value={`${identitat.pare.nom} ${identitat.pare.cognoms}`}
              />
              <Row
                label={t('create.mare')}
                value={`${identitat.mare.nom} ${identitat.mare.cognoms}`}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
