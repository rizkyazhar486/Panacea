// React binding for the shared vitals store.
//
// `useVitals()` re-reads whenever any page merges new device data (the
// 'panacea:health-updated' broadcast), when another tab writes to localStorage,
// and on window focus — so a value synced on one page appears on every other
// page without a reload.
//
// `useVitalField` is the piece that makes pages actually autofill: it seeds a
// normal input's state from the device value, keeps following the device while
// the user hasn't typed, and stops overriding the moment they edit by hand.
// Without that last rule, a background sync would yank a field out from under
// someone mid-entry.

import { useCallback, useEffect, useRef, useState } from 'react'
import { getVitals, type Vitals } from './healthVitals'

export function useVitals(): Vitals {
  const [v, setV] = useState<Vitals>(() => (typeof window === 'undefined' ? {} : getVitals()))

  useEffect(() => {
    const sync = () => setV(getVitals())
    window.addEventListener('panacea:health-updated', sync)
    window.addEventListener('focus', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('panacea:health-updated', sync)
      window.removeEventListener('focus', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return v
}

/**
 * A number input backed by device data.
 *
 * Returns [value, setValue, fromDevice] where `fromDevice` is true while the
 * value still comes from the watch — pages use it to show a "from your device"
 * badge so a prefilled number is never mistaken for something the user typed.
 */
export function useVitalField(
  field: keyof Vitals,
  fallback: number,
): [number, (n: number) => void, boolean] {
  const vitals = useVitals()
  const deviceValue = typeof vitals[field] === 'number' ? (vitals[field] as number) : undefined
  const editedRef = useRef(false)
  const [value, setValue] = useState<number>(deviceValue ?? fallback)

  useEffect(() => {
    // Follow the device only until the user takes over this field.
    if (!editedRef.current && typeof deviceValue === 'number') setValue(deviceValue)
  }, [deviceValue])

  const set = useCallback((n: number) => {
    editedRef.current = true
    setValue(n)
  }, [])

  return [value, set, !editedRef.current && typeof deviceValue === 'number']
}
