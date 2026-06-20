// Setup global dels tests (Vitest).
//
// Node 24+ incorpora un `localStorage` natiu (experimental) que ombreja el de
// jsdom i que, sense `--localstorage-file`, és inaccessible (retorna undefined).
// Això faria petar els tests que toquen l'autosave segons la versió de Node. Per
// fer-los deterministes i independents de la versió, hi instal·lem un
// `localStorage` en memòria senzill.

class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: new MemoryStorage(),
})
