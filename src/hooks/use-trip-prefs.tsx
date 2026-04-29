import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

export type TripPrefs = {
  city?: string
  date?: string
  dateEnd?: string
  flexible?: boolean
  partySize?: number
}

const STORAGE_KEY = "daytrip:trip-prefs"
const EMPTY: TripPrefs = {}

type Ctx = {
  prefs: TripPrefs
  setPrefs: (patch: Partial<TripPrefs>) => void
  reset: () => void
}

const TripPrefsContext = createContext<Ctx | null>(null)

export function TripPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<TripPrefs>(EMPTY)

  // Hydrate from localStorage on mount (client only). Doing this in an
  // effect keeps SSR output deterministic and avoids React hydration
  // mismatches.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setPrefsState(JSON.parse(raw))
    } catch {
      // ignore: corrupt JSON / disabled storage
    }
  }, [])

  const setPrefs = useCallback((patch: Partial<TripPrefs>) => {
    setPrefsState((prev) => {
      const next: TripPrefs = { ...prev, ...patch }
      for (const key of Object.keys(next) as Array<keyof TripPrefs>) {
        if (next[key] === undefined) delete next[key]
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setPrefsState(EMPTY)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  return (
    <TripPrefsContext.Provider value={{ prefs, setPrefs, reset }}>
      {children}
    </TripPrefsContext.Provider>
  )
}

export function useTripPrefs() {
  const ctx = useContext(TripPrefsContext)
  if (!ctx) {
    throw new Error("useTripPrefs must be used within TripPrefsProvider")
  }
  return ctx
}
