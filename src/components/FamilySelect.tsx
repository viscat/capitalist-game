import {
  FAMILY_PRESETS,
  FAMILY_PRESET_ORDER,
} from '../domain/family/presets'
import type { FamilyPreset } from '../domain/family/presets'
import type { FamilyClass } from '../domain/types'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'

type GameMode = 'normal' | 'at16' | 'atCarrera'

function chooseLabelKey(mode: GameMode): string {
  if (mode === 'at16') return 'family.select.chooseAt16'
  if (mode === 'atCarrera') return 'family.select.chooseAtCarrera'
  return 'family.select.choose'
}

function PresetCard({
  preset,
  mode,
  onPick,
}: {
  preset: FamilyPreset
  mode: GameMode
  onPick: (preset: FamilyClass) => void
}) {
  const { t } = useT()
  const f = preset.familia
  const onChoose = () => onPick(preset.id)

  const rows: [string, string][] = [
    [t('family.stat.ingressos'), `${formatEuros(f.ingressosMensuals)}/mes`],
    [t('family.stat.patrimoni'), formatEuros(f.patrimoni)],
    [t('family.stat.horesFeina'), `${f.horesFeina} h`],
    [t('family.stat.horesCura'), `${f.horesCura} h`],
    [t('family.stat.cuidador'), f.cuidadorContractat ? t('common.si') : t('common.no')],
  ]

  return (
    <div className="flex flex-col rounded-2xl bg-surface/70 p-5 ring-1 ring-line/50">
      <h3 className="text-lg font-bold text-ink">{t(preset.nameKey)}</h3>
      <p className="mt-1 min-h-[3rem] text-sm text-inksoft">
        {t(preset.descKey)}
      </p>
      <dl className="mt-3 space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <dt className="text-inksoft">{label}</dt>
            <dd className="font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <button
        onClick={onChoose}
        className="mt-4 rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover:bg-accent2"
      >
        {t(chooseLabelKey(mode))}
      </button>
    </div>
  )
}

export function FamilySelect({
  mode,
  onBack,
  onPick,
}: {
  mode: GameMode
  onBack: () => void
  onPick: (preset: FamilyClass) => void
}) {
  const { t } = useT()
  return (
    <div className="mx-auto max-w-5xl p-6">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-inksoft transition hover:text-ink"
      >
        ←
      </button>
      <h2 className="text-3xl font-bold text-ink">
        {mode === 'normal' ? t('family.select.title') : t('family.select.titleAt16')}
      </h2>
      <p className="mt-1 text-inksoft">{t('family.select.subtitle')}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FAMILY_PRESET_ORDER.map((id) => (
          <PresetCard
            key={id}
            preset={FAMILY_PRESETS[id]}
            mode={mode}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  )
}
