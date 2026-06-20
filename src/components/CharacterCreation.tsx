import { useState } from 'react'
import { FAMILY_PRESETS } from '../domain/family/presets'
import { cognomsPersona, randomIdentitat } from '../domain/identitat'
import type { FamilyClass, Identitat } from '../domain/types'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'

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
      <span className="text-xs text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg bg-slate-900/60 px-3 py-2 text-slate-100 ring-1 ring-slate-700 outline-none focus:ring-indigo-500"
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

  // Els cognoms de la persona deriven sempre dels pares.
  const cognoms = cognomsPersona(id.pare, id.mare)
  const setPare = (p: Partial<Identitat['pare']>) =>
    setId((s) => ({ ...s, pare: { ...s.pare, ...p } }))
  const setMare = (m: Partial<Identitat['mare']>) =>
    setId((s) => ({ ...s, mare: { ...s.mare, ...m } }))

  const comencar = () => {
    const identitat: Identitat = { ...id, cognoms }
    if (mode === 'at16') startGameAt16(preset, identitat)
    else if (mode === 'atCarrera') startGameAtCarrera(preset, identitat)
    else startGame(preset, identitat)
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
        className="mb-4 text-sm text-slate-400 transition hover:text-slate-200"
      >
        ←
      </button>
      <h2 className="text-3xl font-bold text-slate-100">{t('create.title')}</h2>
      <p className="mt-1 text-sm text-slate-400">
        {t(FAMILY_PRESETS[preset].nameKey)} · {t('create.bornOn', { data: avui })}
      </p>

      <div className="mt-6 space-y-5">
        <div className="rounded-xl bg-slate-800/60 p-4">
          <div className="mb-2 text-sm font-semibold text-slate-300">
            {t('create.person')}
          </div>
          <Field
            label={t('create.nom')}
            value={id.nom}
            onChange={(nom) => setId((s) => ({ ...s, nom }))}
          />
          <p className="mt-2 text-xs text-slate-500">
            {t('create.fullName')}:{' '}
            <span className="text-slate-300">
              {id.nom} {cognoms}
            </span>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-800/60 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-300">
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
          <div className="rounded-xl bg-slate-800/60 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-300">
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
            className="rounded-xl bg-slate-700 px-4 py-3 font-medium text-slate-100 transition hover:bg-slate-600"
          >
            🎲 {t('create.random')}
          </button>
          <button
            onClick={comencar}
            disabled={!id.nom.trim()}
            className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-40"
          >
            {t('create.start')}
          </button>
        </div>
      </div>
    </div>
  )
}
