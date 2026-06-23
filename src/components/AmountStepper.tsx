import { useState } from 'react'

/**
 * Control numèric: − [input editable] +. El valor és editable per teclat (només enters,
 * sense decimals) i es clampa a [min, max]. Els botons mouen ±step. Pensat per a imports de
 * pressupost / pla d'inversió, on abans només hi havia +/− i es percebien salts estranys.
 */
export function AmountStepper({
  value,
  min = 0,
  max,
  step,
  onChange,
  ariaLabel,
}: {
  value: number
  min?: number
  max: number
  step: number
  onChange: (v: number) => void
  ariaLabel?: string
}) {
  const [text, setText] = useState(String(value))
  // Sincronitza el text quan el valor canvia des de fora (p. ex. en clampar-se pel
  // pressupost), ajustant l'estat durant el render (patró recomanat de React, no via effect).
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setText(String(value))
  }

  const clamp = (n: number) => Math.max(min, Math.min(max, Math.round(n)))
  const commit = (n: number) => onChange(clamp(n))

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => commit(value - step)}
        disabled={value <= min}
        aria-label="−"
        className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-700 text-lg text-slate-200 transition hover:bg-slate-600 disabled:opacity-40"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={text}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, '')
          setText(digits)
          if (digits !== '') commit(Number(digits))
        }}
        onBlur={() => commit(text === '' ? min : Number(text))}
        className="w-20 rounded-md bg-slate-900/60 px-2 py-1.5 text-right font-mono text-sm text-slate-100 ring-1 ring-slate-700 outline-none focus:ring-indigo-500"
      />
      <button
        type="button"
        onClick={() => commit(value + step)}
        disabled={value >= max}
        aria-label="+"
        className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-700 text-lg text-slate-200 transition hover:bg-slate-600 disabled:opacity-40"
      >
        +
      </button>
    </div>
  )
}
