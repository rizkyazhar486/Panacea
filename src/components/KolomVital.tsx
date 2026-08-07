import { useEffect, useRef, useState } from 'react'
import { Field, inputClass } from './ui'
import { useVitalField } from '../lib/useVitals'
import type { Vitals } from '../lib/healthVitals'

// ─────────────────────────────────────────────────────────────────────────────
// KolomVital — satu kolom angka yang tahu dari mana isinya datang.
//
// Tiga perilaku yang sebelumnya harus ditulis ulang di setiap halaman:
//
//   1. TERISI SENDIRI. Kolom terbuka dengan angka dari perangkat, bukan angka
//      contoh. Selama pengguna belum mengetik, sinkronisasi baru tetap diikuti.
//   2. BERHENTI MENIMPA. Begitu pengguna mengetik, sinkronisasi latar tidak
//      lagi menarik kolom itu dari bawah tangannya.
//   3. ENTER MENYIMPAN. Angka yang diketik manual tidak berhenti di halaman
//      ini — menekan Enter (atau tombol ↵) menyimpannya ke penyimpanan bersama,
//      jadi Longevity, VitaPulse, Body Composition, Performance Lab dan
//      Recovery langsung memakai angka yang sama.
//
// Logikanya sendiri ada di useVitalField; di sini hanya tampilannya, supaya
// satu-satunya definisi "kapan mengikuti perangkat" tidak bercabang dua.
// ─────────────────────────────────────────────────────────────────────────────

/** Tuple yang dikembalikan useVitalField. */
export type IkatanVital = [number, (n: number) => void, boolean, () => void, boolean]

/**
 * Versi terikat: halaman yang memakai nilainya untuk berhitung memanggil
 * useVitalField sendiri lalu meneruskan tuple-nya ke sini, jadi nilainya tetap
 * hidup di halaman itu sementara perilaku kolomnya tetap satu definisi.
 */
export function KolomVitalTerikat({
  ikat, label, step = 1, satuan, kelas,
}: {
  ikat: IkatanVital
  label: string
  step?: number
  satuan?: string
  kelas?: string
}) {
  const [nilai, setNilai, dariPerangkat, simpan, belumDisimpan] = ikat
  const [tersimpan, setTersimpan] = useState(false)
  const komit = () => {
    if (!belumDisimpan) return
    simpan()
    setTersimpan(true)
    setTimeout(() => setTersimpan(false), 1800)
  }
  return (
    <Field label={
      <span className="flex items-center gap-1">
        <span>{label}</span>
        {dariPerangkat && (
          <span className="rounded bg-brand-50 px-1 text-[9px] font-bold text-brand-dark"
            title="Terisi otomatis dari perangkat">⌚</span>
        )}
      </span>
    }>
      <div className="flex items-center gap-1">
        <input
          className={`${inputClass} ${kelas ?? ''}`}
          type="number"
          step={step}
          value={Number.isFinite(nilai) ? nilai : ''}
          aria-label={satuan ? `${label} (${satuan})` : label}
          onChange={(e) => setNilai(e.target.value === '' ? NaN : +e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); komit() } }}
        />
        {belumDisimpan && (
          <button type="button" onClick={komit}
            title="Simpan angka ini ke seluruh aplikasi (atau tekan Enter)"
            aria-label={`Simpan ${label}`}
            className="shrink-0 rounded-lg bg-brand px-2 py-1.5 text-[12px] font-black text-white">↵</button>
        )}
        {tersimpan && <span className="shrink-0 text-[10px] font-bold text-emerald-600" role="status">✓</span>}
      </div>
    </Field>
  )
}

export function KolomVital({
  kunci, label, cadangan, step = 1, satuan, onChange,
}: {
  /** Kunci di penyimpanan vitals, mis. 'weightKg'. */
  kunci: keyof Vitals & string
  label: string
  /** Dipakai hanya bila perangkat belum pernah mengirim angka ini. */
  cadangan: number
  step?: number
  satuan?: string
  /** Beri tahu halaman induk saat nilainya berubah, agar hitungannya ikut. */
  onChange?: (n: number) => void
}) {
  const [nilai, setNilai, dariPerangkat, simpan, belumDisimpan] = useVitalField(kunci, cadangan)
  const [tersimpan, setTersimpan] = useState(false)
  const kabari = useRef(onChange)
  kabari.current = onChange
  useEffect(() => { kabari.current?.(nilai) }, [nilai])

  const komit = () => {
    if (!belumDisimpan) return
    simpan()
    setTersimpan(true)
    setTimeout(() => setTersimpan(false), 1800)
  }

  return (
    <Field label={
      <span className="flex items-center gap-1.5">
        <span>{label}</span>
        {dariPerangkat && (
          <span className="rounded bg-brand-50 px-1 text-[9px] font-bold text-brand-dark"
            title="Terisi otomatis dari perangkat">⌚</span>
        )}
      </span>
    }>
      <div className="flex items-center gap-1.5">
        <input
          className={inputClass}
          type="number"
          step={step}
          value={Number.isFinite(nilai) ? nilai : ''}
          aria-label={satuan ? `${label} (${satuan})` : label}
          onChange={(e) => setNilai(e.target.value === '' ? NaN : +e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); komit() } }}
        />
        {belumDisimpan && (
          <button type="button" onClick={komit}
            title="Simpan angka ini ke seluruh aplikasi (atau tekan Enter)"
            aria-label={`Simpan ${label}`}
            className="shrink-0 rounded-lg bg-brand px-2.5 py-2 text-[12px] font-black text-white">↵</button>
        )}
        {tersimpan && <span className="shrink-0 text-[11px] font-bold text-emerald-600" role="status">tersimpan</span>}
      </div>
      {belumDisimpan && (
        <span className="mt-1 block text-[10px] text-neutral-400">
          Tekan Enter untuk memakai angka ini di semua halaman.
        </span>
      )}
    </Field>
  )
}

export default KolomVital
