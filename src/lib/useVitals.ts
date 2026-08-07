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
import { getVitals, mergeVitals, type Vitals } from './healthVitals'
import { mergeHealthCache } from './profile'

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
 * Returns [value, setValue, fromDevice, simpan, belumDisimpan]:
 *
 *   fromDevice     true while the value still comes from the watch — pages show
 *                  a badge so a prefilled number is never mistaken for typed.
 *   simpan()       commit a hand-typed number to the shared store so every
 *                  other page uses it too. Without this, a manual correction
 *                  died on the page it was typed on and the rest of the app
 *                  kept calculating with the stale device number.
 *   belumDisimpan  the user has typed something not yet committed — pages use
 *                  it to reveal the Enter (↵) button.
 *
 * Committing is deliberate, never on every keystroke: "72" on the way to
 * typing "725" must not get broadcast across the whole app.
 */
export function useVitalField(
  field: keyof Vitals,
  fallback: number,
): [number, (n: number) => void, boolean, () => void, boolean] {
  const vitals = useVitals()
  const deviceValue = typeof vitals[field] === 'number' ? (vitals[field] as number) : undefined
  const [edited, setEdited] = useState(false)
  const [value, setValue] = useState<number>(deviceValue ?? fallback)

  useEffect(() => {
    // Follow the device only until the user takes over this field.
    if (!edited && typeof deviceValue === 'number') setValue(deviceValue)
  }, [deviceValue, edited])

  const set = useCallback((n: number) => {
    setEdited(true)
    setValue(n)
  }, [])

  const simpan = useCallback(() => {
    if (!Number.isFinite(value) || value <= 0) return
    mergeVitals({ [field]: value, source: 'Manual', measuredAt: new Date().toISOString() })
    mergeHealthCache({ [field]: value })
    // Kembali mengikuti perangkat: angka ini kini ADA di penyimpanan bersama,
    // jadi "mengikuti" berarti mengikuti angka yang baru saja disimpan.
    setEdited(false)
  }, [field, value])

  return [value, set, !edited && typeof deviceValue === 'number', simpan, edited]
}
