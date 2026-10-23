// Masukan kartu Performance Lab: kolom kosong atau tidak valid BUKAN nol.
// Dulu `+e.target.value` menyimpan 0 untuk kolom kosong dan hasilnya dihitung dari 0 (mis. FTP kosong → "MLSS 0").

/** Teks kolom → angka; kosong atau bukan angka hingga → NaN (belum diisi). Nol yang diketik tetap 0. */
export function parseMetricInput(raw: string): number {
  if (raw.trim() === '') return NaN
  const v = Number(raw)
  return Number.isFinite(v) ? v : NaN
}

export const metricValue = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Hitung hanya bila setiap kolom terisi angka hingga; selain itu NaN (ditampilkan "—"). */
export function computeMetric<R>(keys: string[], vals: Record<string, unknown>, compute: (v: Record<string, number>) => R): R | number {
  if (!keys.every((k) => metricValue(vals[k]))) return NaN
  return compute(vals as Record<string, number>)
}
