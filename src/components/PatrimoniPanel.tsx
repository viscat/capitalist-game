import { estalviAnualCriatura, pagaMensual, patrimoniTotal } from '../domain/stats'
import type { Familia, LifeStage, Person } from '../domain/types'
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

export function PatrimoniPanel({
  person,
  familia,
  stage,
}: {
  person: Person
  familia: Familia
  stage: LifeStage
}) {
  const { t } = useT()
  const { efectiu, estalvi, inversions, cases } = person.patrimoni

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-800/60 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-300">
          {t('patrimoni.title')}
        </h3>
        <div className="space-y-1.5">
          <Row label={t('patrimoni.efectiu')} value={formatEuros(efectiu)} />
          <Row label={t('patrimoni.estalvi')} value={formatEuros(estalvi)} />
          <Row label={t('patrimoni.inversions')} value={formatEuros(inversions)} />
          <Row label={t('patrimoni.cases')} value={String(cases.length)} />
          <div className="my-2 border-t border-slate-700" />
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-slate-200">
              {t('patrimoni.total')}
            </span>
            <span className="font-bold text-emerald-300">
              {formatEuros(patrimoniTotal(person))}
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
          {stage === 'adolescencia' ? (
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
        </div>
      </div>
    </div>
  )
}
