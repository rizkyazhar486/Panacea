import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, SectionTitle } from '../components/ui'
import { IconChartUp } from '../components/icons'
import { ambilRiwayat } from '../lib/riwayatVitals'
import { getVitals } from '../lib/healthVitals'

// ─────────────────────────────────────────────────────────────────────────────
// Ikhtisar — seluruh angka tubuh pada satu layar, dengan jangka yang dipilih.
//
// MENGAPA RATA-RATA JANGKA IKUT DISEBUT PADA TIAP KARTU. Satu bacaan tidak
// dapat dibaca sendirian: berat 70,0 kg tidak berarti apa-apa tanpa tahu
// biasanya berapa. Karena itu tiap kartu memuat tiga hal — nilai terakhir,
// rata-rata sepanjang jangka yang dipilih, dan SELISIH keduanya.
//
// TIDAK ADA WARNA BAIK/BURUK. Naik pada berat, denyut, dan tidur berarti hal
// yang berbeda-beda, dan mewarnainya seragam adalah penilaian yang tidak dapat
// dipertanggungjawabkan oleh halaman ini.
//
// KOSONG BERKATA KOSONG. Metrik tanpa catatan tidak muncul sama sekali; tidak
// ada kartu berisi "0" atau garis datar yang menyamar sebagai data.
// ─────────────────────────────────────────────────────────────────────────────

interface Medan {
  kunci: string
  label: string
  satuan: string
  bulat: number
  warna: string
}

const MEDAN: Medan[] = [
  { kunci: 'weightKg', label: 'Berat', satuan: 'kg', bulat: 1, warna: '#f59e0b' },
  { kunci: 'restingHr', label: 'Denyut istirahat', satuan: 'bpm', bulat: 0, warna: '#f87171' },
  { kunci: 'hrvMs', label: 'HRV', satuan: 'ms', bulat: 0, warna: '#34d399' },
  { kunci: 'sleepH', label: 'Tidur', satuan: 'jam', bulat: 1, warna: '#a78bfa' },
  { kunci: 'steps', label: 'Langkah', satuan: '', bulat: 0, warna: '#22d3ee' },
  { kunci: 'vo2max', label: 'VO₂max', satuan: 'mL/kg/mnt', bulat: 1, warna: '#4ade80' },
  { kunci: 'systolic', label: 'Sistolik', satuan: 'mmHg', bulat: 0, warna: '#fb7185' },
  { kunci: 'bodyFatPct', label: 'Lemak tubuh', satuan: '%', bulat: 1, warna: '#facc15' },
]

const JANGKA = [
  { hari: 7, label: '7 hari' },
  { hari: 30, label: '30 hari' },
  { hari: 90, label: '90 hari' },
  { hari: 9999, label: 'Semua' },
]

interface Deret {
  medan: Medan
  titik: { tanggal: string; nilai: number }[]
  terakhir: number
  rata: number
  selisih: number
}

function fmt(n: number, bulat: number): string {
  return bulat ? n.toFixed(bulat) : Math.round(n).toLocaleString('id-ID')
}

export function Ikhtisar() {
  const [hari, setHari] = useState(30)
  const riwayat = useMemo(() => ambilRiwayat(), [])
  const kini = useMemo(() => getVitals(), [])

  const deret = useMemo<Deret[]>(() => {
    const potong = riwayat.slice(-hari)
    const out: Deret[] = []
    for (const m of MEDAN) {
      const titik = potong
        .filter((h) => typeof h.nilai[m.kunci] === 'number' && Number.isFinite(h.nilai[m.kunci]))
        .map((h) => ({ tanggal: h.tanggal, nilai: h.nilai[m.kunci] }))
      if (!titik.length) continue
      const rata = titik.reduce((a, t) => a + t.nilai, 0) / titik.length
      // Nilai terakhir diambil dari vitals bila ada — itulah bacaan terbaru,
      // yang belum tentu sudah masuk ke riwayat harian hari ini.
      const dariVitals = kini[m.kunci]
      const terakhir = typeof dariVitals === 'number' && dariVitals > 0 ? dariVitals : titik[titik.length - 1].nilai
      out.push({ medan: m, titik, rata, terakhir, selisih: terakhir - rata })
    }
    return out
  }, [riwayat, hari, kini])

  const jangkaTerpakai = JANGKA.find((j) => j.hari === hari)?.label ?? ''

  if (!deret.length) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-fluid pb-24">
        <SectionTitle icon={<IconChartUp size={20} />} title="Ikhtisar" subtitle="Seluruh angka tubuh pada satu layar" />
        <Card>
          <p className="text-[13px] leading-relaxed text-neutral-500">
            Belum ada riwayat angka tubuh yang tersimpan. Riwayat terkumpul sendiri begitu data masuk — dari impor
            perangkat, atau dari angka yang Anda catat di halaman Tubuh. Halaman ini sengaja kosong alih-alih menampilkan
            contoh: angka contoh tidak dapat dibedakan dari angka Anda.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-fluid pb-24">
      <SectionTitle
        icon={<IconChartUp size={20} />}
        title="Ikhtisar"
        subtitle={`${deret.length} metrik tercatat · ${riwayat.length} hari riwayat`}
      />

      {/* Pemilih jangka. Mengubah jangka mengubah RATA-RATA PEMBANDING juga,
          bukan hanya lebar grafik — itulah sebabnya jangkanya selalu ikut
          ditulis di tiap kartu. */}
      <div className="flex gap-1.5 overflow-x-auto">
        {JANGKA.map((j) => (
          <button
            key={j.hari}
            onClick={() => setHari(j.hari)}
            aria-pressed={hari === j.hari}
            className={`flex min-h-[40px] shrink-0 items-center rounded-full px-4 text-[12px] font-bold transition ${
              hari === j.hari ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
            }`}
          >
            {j.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {deret.map((d) => (
          <div key={d.medan.kunci} className="kaca rounded-2xl p-3">
            <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-neutral-500">
              {d.medan.label}
            </span>
            <span className="flex items-baseline gap-1">
              <span className="text-[20px] font-black leading-none tabular-nums text-ink dark:text-white">
                {fmt(d.terakhir, d.medan.bulat)}
              </span>
              {d.medan.satuan && <span className="text-[10px] font-bold text-neutral-400">{d.medan.satuan}</span>}
            </span>
            <span className="mt-0.5 block truncate text-[10px] leading-tight text-neutral-500">
              rata {jangkaTerpakai.toLowerCase()} {fmt(d.rata, d.medan.bulat)}
              {' · '}
              <span className="font-bold">
                {d.selisih >= 0 ? '+' : '−'}{fmt(Math.abs(d.selisih), d.medan.bulat)}
              </span>
            </span>
          </div>
        ))}
      </div>

      {deret.map((d) => (
        <Card key={d.medan.kunci} className="!p-3">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wide text-neutral-500">
              {d.medan.label} {d.medan.satuan && `· ${d.medan.satuan}`}
            </span>
            <span className="text-[11px] tabular-nums text-neutral-400">{d.titik.length} bacaan</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.titik} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`g-${d.medan.kunci}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={d.medan.warna} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={d.medan.warna} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="tanggal" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} minTickGap={28} />
                {/* Sumbu Y TIDAK dimulai dari nol, dan itu disengaja: pada berat
                    badan atau denyut istirahat, nol bukan titik yang bermakna
                    dan memaksakannya membuat seluruh perubahan tampak rata.
                    Sebagai gantinya angkanya selalu ikut tertera. */}
                <YAxis
                  domain={['dataMin', 'dataMax']}
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  width={38}
                  /* Tanpa pembulatan ini, sumbu memakai nilai mentah dan
                     mencetak label seperti "70,77038" yang terpotong menjadi
                     "77038" — angka yang sama sekali bukan berat siapa pun. */
                  tickFormatter={(v) => fmt(Number(v), d.medan.bulat)}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 12 }}
                  formatter={(v) => [fmt(Number(v), d.medan.bulat), d.medan.label]}
                />
                <Area type="monotone" dataKey="nilai" stroke={d.medan.warna} strokeWidth={2} fill={`url(#g-${d.medan.kunci})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ))}

      <p className="text-[11px] leading-snug text-neutral-500">
        Sumbu tegak mengikuti rentang datanya sendiri, bukan dimulai dari nol — pada berat badan dan denyut istirahat, nol
        bukan titik yang bermakna. Akibatnya perubahan kecil tampak besar, jadi bacalah angkanya, bukan kemiringannya.
      </p>
    </div>
  )
}

export default Ikhtisar
