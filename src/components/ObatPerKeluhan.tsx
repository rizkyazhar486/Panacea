import { useMemo, useState } from 'react'
import { OBAT_PER_KELUHAN, type GolonganObat } from '../lib/golonganObat'
import { Rantai } from './Rantai'

// ─────────────────────────────────────────────────────────────────────────────
// Golongan obat dibaca DARI KELUHAN, bukan dari abjad.
//
// Daftar tatalaksana dan kamus mekanisme obat keduanya menuntut pemakainya
// sudah tahu nama obat yang dicarinya. Yang berdiri di depan pasien tidak tahu
// — yang ia punya hanya keluhan. Bagian ini menutup jarak itu.
//
// Semua terlipat secara bawaan, dan hanya SATU golongan terbuka pada satu
// waktu. Alasannya: tiap golongan memuat rantai mekanisme yang panjang, dan
// membuka semuanya sekaligus mengubah halaman ini menjadi dinding teks — persis
// bentuk yang membuat orang berhenti membaca.
// ─────────────────────────────────────────────────────────────────────────────

function KartuGolongan({ g, buka, ketuk }: { g: GolonganObat; buka: boolean; ketuk: () => void }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-white/10">
      <button
        onClick={ketuk}
        aria-expanded={buka}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="min-w-0">
          <span className="block text-[12.5px] font-black text-ink dark:text-white">{g.nama}</span>
          <span className="block truncate text-[10.5px] font-semibold text-neutral-400">{g.contoh}</span>
        </span>
        <span aria-hidden className="shrink-0 text-[11px] font-black text-brand">{buka ? '▲' : '▼'}</span>
      </button>

      {buka && (
        <div className="space-y-2.5 px-3 pb-3">
          <p className="text-[11.5px] leading-snug text-neutral-700 dark:text-neutral-200">
            <span className="font-bold text-brand-dark dark:text-brand">Kapan dipakai: </span>
            {g.kapan}
          </p>

          <Rantai langkah={g.rantai} />

          <p className="text-[11.5px] leading-snug text-neutral-700 dark:text-neutral-200">
            <span className="font-bold">Memilih di dalam golongan: </span>
            {g.memilih}
          </p>

          {/* Bagian yang paling menentukan, dan karena itu diberi latar sendiri:
              daftar obat mengajarkan apa yang harus dipilih, bukan apa yang akan
              keliru dipilih. */}
          <p className="rounded-lg bg-amber-50 p-2.5 text-[11.5px] leading-snug text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <span className="font-black">⚠️ Yang sering keliru: </span>
            {g.salahnya}
          </p>
        </div>
      )}
    </div>
  )
}

export function ObatPerKeluhan() {
  const [terbuka, setTerbuka] = useState<string | null>(null)
  const [cari, setCari] = useState('')

  const tampil = useMemo(() => {
    const q = cari.toLowerCase().trim()
    if (!q) return OBAT_PER_KELUHAN
    return OBAT_PER_KELUHAN
      .map((k) => ({
        ...k,
        golongan: k.golongan.filter(
          (g) =>
            g.nama.toLowerCase().includes(q) ||
            g.contoh.toLowerCase().includes(q) ||
            g.kapan.toLowerCase().includes(q) ||
            k.keluhan.toLowerCase().includes(q),
        ),
      }))
      .filter((k) => k.golongan.length > 0)
  }, [cari])

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-[15px] font-black text-ink dark:text-white">Obat menurut keluhan</h3>
        <p className="mt-1 text-[11.5px] leading-snug text-neutral-500">
          Dari keluhan menuju GOLONGAN, baru menuju obatnya. Yang menentukan di depan pasien adalah
          keputusan tingkat golongan — mukolitik atau antitusif, loop atau aldosteron, vasopresor
          atau inotropik, beta-laktam atau makrolid. Salah golongan jauh lebih merugikan daripada
          salah merek.
        </p>
      </div>

      <input
        type="search"
        value={cari}
        onChange={(e) => setCari(e.target.value)}
        placeholder="Cari golongan atau obat (mis. furosemid, kuinolon, syok)…"
        className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3 text-[13px] text-ink placeholder:text-neutral-400 dark:border-white/10 dark:bg-neutral-900 dark:text-white"
      />

      {tampil.length === 0 && (
        <p className="text-center text-[12.5px] text-neutral-500">Tidak ada hasil — coba kata lain.</p>
      )}

      {tampil.map((k) => (
        <div key={k.keluhan} className="space-y-2">
          <div>
            <h4 className="text-[13px] font-black uppercase tracking-wide text-brand">{k.keluhan}</h4>
            <p className="mt-0.5 text-[11.5px] leading-snug text-neutral-600 dark:text-neutral-300">
              {k.inti}
            </p>
          </div>
          <div className="space-y-1.5">
            {k.golongan.map((g) => (
              <KartuGolongan
                key={g.nama}
                g={g}
                buka={terbuka === k.keluhan + g.nama}
                ketuk={() =>
                  setTerbuka((v) => (v === k.keluhan + g.nama ? null : k.keluhan + g.nama))
                }
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

export default ObatPerKeluhan
