import { useMemo, useState } from 'react'
import { Card, SectionTitle, Button, Field, inputClass } from '../components/ui'
import { IconActivity } from '../components/icons'
import { useJam } from '../lib/useJam'
import {
  bacaSelaman, simpanSelaman, hapusSelaman, lamaMenit, jedaPermukaan,
  waktuTerbang, ringkasSelam, peringatan, type Selaman,
} from '../lib/menyelam'

// ─────────────────────────────────────────────────────────────────────────────
// Catatan menyelam.
//
// YANG PALING BESAR DI LAYAR ADALAH HITUNG MUNDUR SEBELUM TERBANG, bukan
// jumlah selaman. Jumlah selaman adalah kenangan; waktu tunggu sebelum terbang
// adalah satu-satunya angka di halaman ini yang dapat mencederai seseorang bila
// diabaikan.
//
// HALAMAN INI TIDAK MENGHITUNG DEKOMPRESI dan mengatakannya di layar, bukan
// hanya di dalam kode. Penyelam yang mengira teleponnya menghitung batas
// tanpa-dekompresi akan mengambil keputusan berdasarkan angka yang tidak
// pernah ada.
// ─────────────────────────────────────────────────────────────────────────────

function uid() {
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

function isoLokal(d = new Date()) {
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function Menyelam() {
  const sekarang = useJam(1)
  const [daftar, setDaftar] = useState<Selaman[]>(bacaSelaman)
  const [buka, setBuka] = useState(false)
  const [konfirmasi, setKonfirmasi] = useState<string | null>(null)

  const [masuk, setMasuk] = useState(isoLokal(new Date(Date.now() - 45 * 60000)))
  const [keluar, setKeluar] = useState(isoLokal())
  const [maks, setMaks] = useState<number | undefined>(18)
  const [rata, setRata] = useState<number | undefined>(12)
  const [lokasi, setLokasi] = useState('')
  const [suhu, setSuhu] = useState<number | undefined>(undefined)
  const [gas, setGas] = useState('Air')

  const ring = useMemo(() => ringkasSelam(daftar, sekarang), [daftar, sekarang])
  const terbang = useMemo(() => waktuTerbang(daftar, sekarang), [daftar, sekarang])
  const jeda = useMemo(() => (ring.terakhir ? jedaPermukaan(ring.terakhir, sekarang) : null), [ring.terakhir, sekarang])
  const awas = useMemo(() => peringatan(daftar, sekarang), [daftar, sekarang])

  function simpan() {
    if (!maks || maks <= 0) return
    setDaftar(simpanSelaman({
      id: uid(),
      masuk: new Date(masuk).toISOString(),
      keluar: new Date(keluar).toISOString(),
      kedalamanMaks: maks,
      kedalamanRata: rata,
      lokasi: lokasi.trim() || undefined,
      suhuC: suhu,
      gas: gas.trim() || undefined,
    }))
    setBuka(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <SectionTitle
        icon={<IconActivity size={20} />}
        title="Dive log"
        subtitle="Depth, surface interval, and the wait before flying"
      />

      {/* PALING ATAS DAN PALING BESAR — satu-satunya angka di sini yang dapat
          mencederai seseorang bila diabaikan. */}
      {terbang && (
        <Card>
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-400">Time to fly</div>
          <div
            className="text-[40px] font-black leading-none tabular-nums"
            style={{ color: terbang.aman ? '#34d399' : '#fb7185' }}
          >
            {terbang.aman ? 'Clear' : `${terbang.jamLagi} h`}
          </div>
          <p className="mt-1 text-[12px] leading-snug text-neutral-600 dark:text-neutral-300">{terbang.alasan}</p>
          <span className="mt-2 block h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
            <span
              className="block h-full rounded-full transition-all"
              style={{
                width: `${terbang.aman ? 100 : Math.max(2, ((terbang.syaratJam - terbang.jamLagi) / terbang.syaratJam) * 100)}%`,
                background: terbang.aman ? '#34d399' : '#fb7185',
              }}
            />
          </span>
          <p className="mt-2 text-[10.5px] leading-relaxed text-neutral-500">
            Divers Alert Network guidance: at least 12 hours after a single no-decompression dive, at least 18 after
            repetitive or multi-day diving. This is a consensus recommendation, not a guarantee — if you feel unwell,
            wait longer regardless of what this says.
          </p>
        </Card>
      )}

      {awas.length > 0 && (
        <Card className="!p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
            Worth knowing right now
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {awas.map((a, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-ink dark:text-neutral-200">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-500" aria-hidden />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Ringkasan angka */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { l: 'Dives', v: ring.total, c: '#38bdf8' },
          { l: 'Deepest', v: ring.terdalam ? `${ring.terdalam}m` : '—', c: '#a78bfa' },
          { l: 'Bottom time', v: ring.totalMenit ? `${Math.round(ring.totalMenit / 60)}h` : '—', c: '#34d399' },
          { l: 'Surface', v: jeda ? jeda.teks : '—', c: '#fbbf24' },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl border p-2 text-center" style={{ borderColor: `${x.c}55`, background: `${x.c}14` }}>
            <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{x.l}</div>
            <div className="text-[18px] font-black leading-tight tabular-nums" style={{ color: x.c }}>{x.v}</div>
          </div>
        ))}
      </div>

      <Button onClick={() => setBuka((v) => !v)} className="w-full">
        {buka ? 'Cancel' : '+ Log a dive'}
      </Button>

      {buka && (
        <Card className="!p-4">
          <div className="grid grid-cols-2 gap-2">
            <Field label="In"><input className={inputClass} type="datetime-local" value={masuk} onChange={(e) => setMasuk(e.target.value)} /></Field>
            <Field label="Out"><input className={inputClass} type="datetime-local" value={keluar} onChange={(e) => setKeluar(e.target.value)} /></Field>
            <Field label="Max depth (m)"><input className={inputClass} type="number" value={maks ?? ''} onChange={(e) => setMaks(e.target.value ? +e.target.value : undefined)} /></Field>
            <Field label="Average depth (m)"><input className={inputClass} type="number" value={rata ?? ''} onChange={(e) => setRata(e.target.value ? +e.target.value : undefined)} /></Field>
            <Field label="Water temp (°C)"><input className={inputClass} type="number" value={suhu ?? ''} onChange={(e) => setSuhu(e.target.value ? +e.target.value : undefined)} /></Field>
            <Field label="Gas"><input className={inputClass} value={gas} onChange={(e) => setGas(e.target.value)} /></Field>
          </div>
          <div className="mt-2"><Field label="Site"><input className={inputClass} value={lokasi} onChange={(e) => setLokasi(e.target.value)} /></Field></div>
          <Button onClick={simpan} className="mt-3 w-full">Save dive</Button>
        </Card>
      )}

      {/* Riwayat */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2 px-1">
          <h2 className="text-[13px] font-black uppercase tracking-wide text-brand">Log</h2>
          <span className="text-[10px] font-bold text-neutral-400">{ring.setahun} in the last 12 months</span>
        </div>
        {daftar.length === 0 && (
          <p className="rounded-2xl border border-neutral-200 p-4 text-center text-[12.5px] text-neutral-500 dark:border-white/10">
            No dives logged yet.
          </p>
        )}
        {daftar.map((s) => {
          const menit = lamaMenit(s)
          const tanya = konfirmasi === s.id
          return (
            <div key={s.id} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-black text-ink dark:text-white">
                    {s.kedalamanMaks} m{menit != null ? ` · ${menit} min` : ''}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {new Date(s.keluar).toLocaleString()}
                    {s.lokasi ? ` · ${s.lokasi}` : ''}
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-neutral-400">
                    {[s.kedalamanRata ? `avg ${s.kedalamanRata} m` : null, s.suhuC != null ? `${s.suhuC}°C` : null, s.gas]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                {tanya ? (
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => { setDaftar(hapusSelaman(s.id)); setKonfirmasi(null) }} className="min-h-[40px] rounded-lg bg-red-600 px-2.5 text-[11px] font-bold text-white">Delete</button>
                    <button onClick={() => setKonfirmasi(null)} className="min-h-[40px] rounded-lg bg-neutral-200 px-2.5 text-[11px] font-bold text-neutral-700">Keep</button>
                  </div>
                ) : (
                  <button onClick={() => setKonfirmasi(s.id)} aria-label={`Remove dive at ${s.lokasi ?? s.kedalamanMaks + ' m'}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600">×</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Card className="!p-4">
        <div className="text-[12px] font-black text-ink dark:text-white">This is not a dive computer</div>
        <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          There is deliberately no no-decompression limit, no tissue loading, and no stop schedule here. Those depend
          on your actual depth profile rather than just the deepest point, on the gas you breathed, on temperature and
          on how hard you worked — and getting them wrong injures people in ways that cannot be taken back. The
          computer on your wrist is the authority. This page counts time and keeps a record.
        </p>
      </Card>
    </div>
  )
}

export default Menyelam
