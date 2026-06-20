import {
  FAMILY_PRESETS,
  FAMILY_PRESET_ORDER,
} from '../domain/family/presets'
import type { FamilyPreset } from '../domain/family/presets'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'

function PresetCard({ preset }: { preset: FamilyPreset }) {
  const { t } = useT()
  const { startGame } = useGame()
  const f = preset.familia

  const rows: [string, string][] = [
    [t('family.stat.ingressos'), `${formatEuros(f.ingressosMensuals)}/mes`],
    [t('family.stat.patrimoni'), formatEuros(f.patrimoni)],
    [t('family.stat.horesFeina'), `${f.horesFeina} h`],
    [t('family.stat.horesCura'), `${f.horesCura} h`],
    [t('family.stat.cuidador'), f.cuidadorContractat ? t('common.si') : t('common.no')],
  ]

  return (
    <div className="flex flex-col rounded-2xl bg-slate-800/70 p-5 ring-1 ring-slate-700/50">
      <h3 className="text-lg font-bold text-slate-100">{t(preset.nameKey)}</h3>
      <p className="mt-1 min-h-[3rem] text-sm text-slate-400">
        {t(preset.descKey)}
      </p>
      <dl className="mt-3 space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <dt className="text-slate-400">{label}</dt>
            <dd className="font-medium text-slate-200">{value}</dd>
          </div>
        ))}
      </dl>
      <button
        onClick={() => startGame(preset.id)}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500"
      >
        {t('family.select.choose')}
      </button>
    </div>
  )
}

export function FamilySelect({ onBack }: { onBack: () => void }) {
  const { t } = useT()
  return (
    <div className="mx-auto max-w-5xl p-6">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-slate-400 transition hover:text-slate-200"
      >
        ← {t('start.new')}
      </button>
      <h2 className="text-3xl font-bold text-slate-100">
        {t('family.select.title')}
      </h2>
      <p className="mt-1 text-slate-400">{t('family.select.subtitle')}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FAMILY_PRESET_ORDER.map((id) => (
          <PresetCard key={id} preset={FAMILY_PRESETS[id]} />
        ))}
      </div>
    </div>
  )
}
