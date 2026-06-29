import { useState } from 'react'
import { FAMILY_PRESETS } from '../domain/family/presets'
import { cognomsPersona, randomIdentitat } from '../domain/identitat'
import type {
  FamilyClass,
  Genere,
  Identitat,
  Origen,
  RegimPolitic,
} from '../domain/types'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { Dices, Icon } from './icons'

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  optionLabel,
}: {
  label: string
  options: readonly T[]
  value: T | undefined
  onChange: (v: T) => void
  optionLabel: (v: T) => string
}) {
  return (
    <div>
      <span className="text-xs text-inksoft">{label}</span>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`min-h-9 flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
              value === o
                ? 'bg-accent text-white'
                : 'bg-bg/60 text-inksoft ring-1 ring-line hover:bg-surface2'
            }`}
          >
            {optionLabel(o)}
          </button>
        ))}
      </div>
    </div>
  )
}

const GENERES: readonly Genere[] = ['dona', 'home', 'no_binari']
const ORIGENS: readonly Origen[] = ['autocton', 'migrant']
const REGIMS: readonly RegimPolitic[] = ['residual', 'mixt', 'socialdemocrata']

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs text-inksoft">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg bg-bg/60 px-3 py-2 text-ink ring-1 ring-line outline-none focus:ring-accent"
      />
    </label>
  )
}

export function CharacterCreation({
  mode,
  preset,
  onBack,
}: {
  mode: 'normal' | 'at16' | 'atCarrera'
  preset: FamilyClass
  onBack: () => void
}) {
  const { t } = useT()
  const { startGame, startGameAt16, startGameAtCarrera } = useGame()
  const [id, setId] = useState<Identitat>(() => randomIdentitat())
  const [regim, setRegim] = useState<RegimPolitic>('mixt')

  // Els cognoms de la persona deriven sempre dels pares.
  const cognoms = cognomsPersona(id.pare, id.mare)
  const setPare = (p: Partial<Identitat['pare']>) =>
    setId((s) => ({ ...s, pare: { ...s.pare, ...p } }))
  const setMare = (m: Partial<Identitat['mare']>) =>
    setId((s) => ({ ...s, mare: { ...s.mare, ...m } }))

  const comencar = () => {
    const identitat: Identitat = { ...id, cognoms }
    if (mode === 'at16') startGameAt16(preset, identitat, regim)
    else if (mode === 'atCarrera') startGameAtCarrera(preset, identitat, regim)
    else startGame(preset, identitat, regim)
  }

  const avui = new Date().toLocaleDateString('ca-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-lg p-6">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-inksoft transition hover:text-ink"
      >
        ←
      </button>
      <h2 className="text-3xl font-bold text-ink">{t('create.title')}</h2>
      <p className="mt-1 text-sm text-inksoft">
        {t(FAMILY_PRESETS[preset].nameKey)} · {t('create.bornOn', { data: avui })}
      </p>

      <div className="mt-6 space-y-5">
        <div className="rounded-xl bg-surface/60 p-4">
          <div className="mb-2 text-sm font-semibold text-inksoft">
            {t('create.person')}
          </div>
          <Field
            label={t('create.nom')}
            value={id.nom}
            onChange={(nom) => setId((s) => ({ ...s, nom }))}
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Segmented
              label={t('create.genere')}
              options={GENERES}
              value={id.genere}
              onChange={(genere) => setId((s) => ({ ...s, genere }))}
              optionLabel={(g) => t(`genere.${g}`)}
            />
            <Segmented
              label={t('create.origen')}
              options={ORIGENS}
              value={id.origen}
              onChange={(origen) => setId((s) => ({ ...s, origen }))}
              optionLabel={(o) => t(`origen.${o}`)}
            />
          </div>
          <p className="mt-2 text-xs text-inkfaint">
            {t('create.fullName')}:{' '}
            <span className="text-inksoft">
              {id.nom} {cognoms}
            </span>
          </p>
        </div>

        <div className="rounded-xl bg-surface/60 p-4">
          <div className="mb-2 text-sm font-semibold text-inksoft">
            {t('create.mon')}
          </div>
          <Segmented
            label={t('create.regim')}
            options={REGIMS}
            value={regim}
            onChange={setRegim}
            optionLabel={(r) => t(`regim.${r}.nom`)}
          />
          <p className="mt-2 text-xs text-inkfaint">{t(`regim.${regim}.desc`)}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-surface/60 p-4">
            <div className="mb-2 text-sm font-semibold text-inksoft">
              {t('create.pare')}
            </div>
            <div className="space-y-2">
              <Field
                label={t('create.nom')}
                value={id.pare.nom}
                onChange={(nom) => setPare({ nom })}
              />
              <Field
                label={t('create.cognoms')}
                value={id.pare.cognoms}
                onChange={(cognoms) => setPare({ cognoms })}
              />
            </div>
          </div>
          <div className="rounded-xl bg-surface/60 p-4">
            <div className="mb-2 text-sm font-semibold text-inksoft">
              {t('create.mare')}
            </div>
            <div className="space-y-2">
              <Field
                label={t('create.nom')}
                value={id.mare.nom}
                onChange={(nom) => setMare({ nom })}
              />
              <Field
                label={t('create.cognoms')}
                value={id.mare.cognoms}
                onChange={(cognoms) => setMare({ cognoms })}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setId(randomIdentitat())}
            className="flex items-center gap-1.5 rounded-xl bg-surface2 px-4 py-3 font-medium text-ink transition hover:bg-line"
          >
            <Icon icon={Dices} size={16} /> {t('create.random')}
          </button>
          <button
            onClick={comencar}
            disabled={!id.nom.trim()}
            className="flex-1 rounded-xl bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accent2 disabled:opacity-40"
          >
            {t('create.start')}
          </button>
        </div>
      </div>
    </div>
  )
}
