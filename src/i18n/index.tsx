import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ca } from './locales/ca'

export type Locale = 'ca'

const LOCALES: Record<Locale, Record<string, string>> = { ca }

export type TParams = Record<string, string | number>

/** Resol una clau i interpola els paràmetres {nom}. */
export function translate(
  locale: Locale,
  key: string,
  params?: TParams,
): string {
  const dict = LOCALES[locale]
  let text = dict[key] ?? key
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: TParams) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ca')
  const t = useCallback(
    (key: string, params?: TParams) => translate(locale, key, params),
    [locale],
  )
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useT s’ha d’utilitzar dins d’un I18nProvider')
  return ctx
}
