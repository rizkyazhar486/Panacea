import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { deretMetrik } from '../lib/riwayatVitals'
import { getVitals } from '../lib/healthVitals'

// ─────────────────────────────────────────────────────────────────────────────
// Dua widget lebar yang menggambarkan hari: tidur dan asupan.
//
// Keduanya memakai PEMBANDING DIRI SENDIRI, bukan angka bulat populer. "8 jam"
// dan "2.000 kkal" bukan berasal dari orangnya: kebutuhan tidur orang dewasa
// berbeda-beda, dan kebutuhan kalori bergantung berat, tinggi, usia, dan
// gerak. Yang dibandingkan di sini adalah malam ini terhadap kebiasaan
// empat belas malam terakhir, dan hari ini terhadap kebiasaan tujuh hari.
//
// Selisih ditulis apa adanya, tanpa dinilai baik atau buruk: tidur lebih
// pendek pada malam sebelum jaga bukan kegagalan, dan makan lebih banyak pada
// hari latihan panjang bukan kesalahan.
// ─────────────────────────────────────────────────────────────────────────────

const HARI = 864e5

function kunciHari(t: number): string {
  const d = new Date(t)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function median(a: number[]): number {
  if (!a.length) return 0
  const s = [...a].sort((x, y) => x - y)
  const t = Math.floor(s.length / 2)
  return s.length % 2 ? s[t] : (s[t - 1] + s[t]) / 2
}

/** Batang berdasar nol dengan penanda kebiasaan sebagai garis mendatar. */
function BatangDenganGaris({ deret, biasa, nada }: { deret: number[]; biasa: number; nada: string }) {
  const maks = Math.max(...deret, biasa, 1)
  return (
    <span className="relative flex h-12 items-end gap-[3px]" aria-hidden>
      {deret.map((v, i) => (
        <span
          key={i}
          className={`flex-1 rounded-sm ${v > 0 ? nada : 'bg-neutral-300 dark:bg-white/15'}`}
          style={{ height: v > 0 ? `${Math.max(8, (v / maks) * 100)}%` : '3px' }}
        />
      ))}
      {biasa > 0 && (
        <span
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-neutral-400 dark:border-white/40"
          style={{ bottom: `${(biasa / maks) * 100}%` }}
        />
      )}
    </span>
  )
}

// ── Tidur 14 malam ─────────────────────────────────────────────────────────
export function UbinTidurLebar() {
  const { state } = useStore()

  const { deret, semalam, biasa, konsisten, jumlahMalam } = useMemo(() => {
    const peta = new Map<string, number>()
    for (const t of deretMetrik('sleepH')) peta.set(t.tanggal, t.nilai)
    for (const s of state.sleepLogs ?? []) if (s?.date && s.hours > 0) peta.set(s.date, s.hours)

    const deret: number[] = []
    for (let i = 13; i >= 0; i--) deret.push(peta.get(kunciHari(Date.now() - i * HARI)) ?? 0)

    const terisi = deret.filter((x) => x > 0)
    const semalam = deret[deret.length - 1] || deret[deret.length - 2] || 0
    // Kebiasaan dihitung dari MALAM YANG TERCATAT saja. Memasukkan malam yang
    // tidak dicatat sebagai nol akan menurunkan kebiasaannya setiap kali orang
    // lupa mencatat, dan kebiasaan yang turun karena lupa bukan kebiasaan.
    const biasa = median(terisi)

    const belakangan = (state.sleepLogs ?? []).slice(-14)
    const konsisten = belakangan.length ? belakangan.filter((s) => s.bedtimeConsistent).length : null
    return { deret, semalam, biasa, konsisten, jumlahMalam: belakangan.length }
  }, [state.sleepLogs])

  if (!deret.some((x) => x > 0)) return null
  const selisih = biasa > 0 && semalam > 0 ? semalam - biasa : null

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Tidur 14 malam</h2>
        <Link to="/pola-tidur" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          Buka →
        </Link>
      </div>

      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">
            {semalam > 0 ? semalam.toFixed(1) : '—'}
          </span>
          <span className="t-mikro font-bold text-neutral-400">jam semalam</span>
          {selisih != null && (
            <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-500">
              {selisih >= 0 ? '+' : '−'}{Math.abs(selisih).toFixed(1)} j dari kebiasaan
            </span>
          )}
        </div>

        <div className="mt-2">
          <BatangDenganGaris deret={deret} biasa={biasa} nada="bg-indigo-400" />
        </div>

        <p className="t-mikro mt-1.5 truncate text-neutral-400">
          Garis putus-putus = kebiasaan Anda {biasa > 0 ? `${biasa.toFixed(1)} j` : '—'}
          {konsisten != null && jumlahMalam > 0 ? ` · jam tidur seragam ${konsisten}/${jumlahMalam} malam` : ''}
        </p>
      </div>
    </section>
  )
}

// ── Asupan hari ini ────────────────────────────────────────────────────────
export function UbinGiziLebar() {
  const { state } = useStore()

  const { kkal, karbo, protein, lemak, biasa, adaHariIni } = useMemo(() => {
    const hariIni = kunciHari(Date.now())
    let kkal = 0, karbo = 0, protein = 0, lemak = 0
    const perHari = new Map<string, number>()
    for (const f of state.foods ?? []) {
      if (!f?.date) continue
      perHari.set(f.date, (perHari.get(f.date) ?? 0) + (f.kcal ?? 0))
      if (f.date === hariIni) {
        kkal += f.kcal ?? 0
        karbo += f.carbs ?? 0
        protein += f.protein ?? 0
        lemak += f.fat ?? 0
      }
    }
    const tujuh: number[] = []
    for (let i = 1; i <= 7; i++) {
      const v = perHari.get(kunciHari(Date.now() - i * HARI))
      if (v && v > 0) tujuh.push(v)
    }
    return { kkal, karbo, protein, lemak, biasa: median(tujuh), adaHariIni: perHari.has(hariIni) }
  }, [state.foods])

  if (!(state.foods ?? []).length) return null
  const berat = typeof getVitals().weightKg === 'number' ? (getVitals().weightKg as number) : 0

  // Energi dari makronutrien: 4 kkal/g karbohidrat dan protein, 9 kkal/g lemak
  // (faktor Atwater). Dipakai untuk PERBANDINGAN antar-makro, bukan untuk
  // mengoreksi kalori yang tercatat — keduanya bisa berbeda karena serat dan
  // alkohol, dan menimpa angka yang tercatat berarti menyembunyikan selisih.
  const eK = karbo * 4, eP = protein * 4, eL = lemak * 9
  const eTotal = eK + eP + eL

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Asupan hari ini</h2>
        <Link to="/nutrition" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          Catat →
        </Link>
      </div>

      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">
            {adaHariIni ? Math.round(kkal).toLocaleString('id-ID') : '—'}
          </span>
          <span className="t-mikro font-bold text-neutral-400">kkal</span>
          {biasa > 0 && (
            <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-500">
              biasanya {Math.round(biasa).toLocaleString('id-ID')}
            </span>
          )}
        </div>

        {/* PITA PROTEIN DILIPAT KE SINI dari widget tersendiri.
            Dua widget yang sama-sama menjawab "sudah cukup makan apa belum"
            memaksa mata memeriksa keduanya untuk satu pertanyaan. Sasarannya
            tetap sama: pita 1,2-2,0 g/kg dengan garis 1,6 g/kg — bentuk
            buktinya memang rentang, bukan satu angka. */}
        {berat > 0 && protein > 0 && (
          <div className="mt-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="t-mikro text-neutral-500">Protein <b className="text-ink dark:text-white">{Math.round(protein)} g</b></span>
              <span className="t-mikro tabular-nums text-neutral-400">{Math.round(berat * 1.2)}–{Math.round(berat * 2)} g untuk {berat} kg</span>
            </div>
            <span className="relative mt-1 block h-2 w-full rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden>
              <span
                className="absolute inset-y-0 rounded-full bg-brand/25"
                style={{ left: `${(1.2 / 2.3) * 100}%`, width: `${(0.8 / 2.3) * 100}%` }}
              />
              <span className="absolute inset-y-0 w-px bg-neutral-600 dark:bg-white/60" style={{ left: `${(1.6 / 2.3) * 100}%` }} />
              <span className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: `${Math.min(100, (protein / berat / 2.3) * 100)}%` }} />
            </span>
          </div>
        )}

        {eTotal > 0 ? (
          <>
            {/* Satu batang bersusun: bagian tiap makro terhadap energi hari
                ini. Tiga lingkaran terpisah akan menuntut mata menjumlahkan
                sendiri, padahal yang ditanyakan justru perbandingannya. */}
            <span className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10" aria-hidden>
              <span className="h-full bg-amber-400" style={{ width: `${(eK / eTotal) * 100}%` }} />
              <span className="h-full bg-brand" style={{ width: `${(eP / eTotal) * 100}%` }} />
              <span className="h-full bg-rose-400" style={{ width: `${(eL / eTotal) * 100}%` }} />
            </span>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              {[
                { l: 'Karbo', g: karbo, n: 'bg-amber-400' },
                { l: 'Protein', g: protein, n: 'bg-brand' },
                { l: 'Lemak', g: lemak, n: 'bg-rose-400' },
              ].map((x) => (
                <span key={x.l} className="flex min-w-0 items-center gap-1.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${x.n}`} />
                  <span className="t-mikro truncate text-neutral-500">{x.l}</span>
                  <span className="t-mikro shrink-0 font-black tabular-nums text-ink dark:text-white">{Math.round(x.g)} g</span>
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="t-kecil mt-2 text-neutral-500">Belum ada yang dicatat hari ini.</p>
        )}
      </div>
    </section>
  )
}
