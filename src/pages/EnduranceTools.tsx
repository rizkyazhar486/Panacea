import { useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { hariIni } from '../lib/tanggal'
import { Card, SectionTitle, Field, inputClass } from '../components/ui'
import { IconActivity, IconHeart, IconTimer, IconRun } from '../components/icons'
import { getDemo } from '../lib/profile'
import {
  lajuKeringat, rencanaBahanBakar, hitungFtp, panduanDaya, saranIf,
  aklimatisasiPanas, aklimatisasiKetinggian, penaltiKetinggian,
  type Segmen, type TesFtp, type PaparanPanas, type PaparanKetinggian,
} from '../lib/enduranceTools'

// ─────────────────────────────────────────────────────────────────────────────
// Alat Endurance — bahan bakar, FTP, panduan daya, aklimatisasi.
//
// Tidak satu pun bagian halaman ini membaca ekspor jam tangan. Semuanya
// merencanakan sesuatu yang BELUM terjadi, sehingga masukannya memang harus
// datang dari pengguna. Itu juga yang membuatnya tetap berguna bagi orang yang
// bersepeda maupun berenang, memakai power meter merek apa pun, atau belum
// menyinkronkan apa pun.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'bahanBakar' | 'ftp' | 'panduan' | 'aklimatisasi'

const KEY_PANAS = 'pmd_paparan_panas_v1'
const KEY_TINGGI = 'pmd_paparan_ketinggian_v1'

function muat<T>(key: string): T[] {
  try { const v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
function simpan<T>(key: string, v: T[]) {
  try { localStorage.setItem(key, JSON.stringify(v.slice(-120))) } catch { /* kuota */ }
}

export function EnduranceTools() {
  const [tab, setTab] = useState<Tab>('bahanBakar')
  return (
    <div className="space-y-4">
      <SectionTitle icon={<IconActivity />} title="Endurance Tools"
        subtitle="Fuelling, FTP, power guidance and climate adaptation — all from your own inputs" />

      <Card>
        <p className="text-sm leading-relaxed text-neutral-600">
          This page <strong className="text-ink">needs no sync at all</strong>. Everything here plans
          something that has not happened yet — a race, a test, a heat exposure — so the inputs come from
          you by design. Useful for cycling and swimming even if your watch sends nothing.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        {([
          ['bahanBakar', '🥤 Fuelling'],
          ['ftp', '⚡ FTP & Power Zones'],
          ['panduan', '🏔️ Route Power Guide'],
          ['aklimatisasi', '🌡️ Heat & Altitude'],
        ] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${tab === k ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-neutral-500'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'bahanBakar' && <TabBahanBakar />}
      {tab === 'ftp' && <TabFtp />}
      {tab === 'panduan' && <TabPanduan />}
      {tab === 'aklimatisasi' && <TabAklimatisasi />}
    </div>
  )
}

// ── Bahan bakar ─────────────────────────────────────────────────────────────

function TabBahanBakar() {
  const demo = useMemo(() => getDemo(), [])
  const [durasi, setDurasi] = useState('180')
  const [intensitas, setIntensitas] = useState<'mudah' | 'sedang' | 'berat'>('sedang')
  const [suhu, setSuhu] = useState('30')
  const [sensitif, setSensitif] = useState(false)

  const [sebelum, setSebelum] = useState('')
  const [sesudah, setSesudah] = useState('')
  const [menitUji, setMenitUji] = useState('60')
  const [minum, setMinum] = useState('500')

  const keringat = useMemo(() => lajuKeringat({
    beratSebelumKg: Number(sebelum), beratSesudahKg: Number(sesudah),
    durasiMenit: Number(menitUji), minumMl: Number(minum),
  }), [sebelum, sesudah, menitUji, minum])

  const rencana = useMemo(() => rencanaBahanBakar({
    durasiMenit: Number(durasi) || 0,
    intensitas,
    beratKg: demo.weightKg || 65,
    lajuKeringatMlPerJam: keringat?.mlPerJam,
    suhuC: Number(suhu) || undefined,
    perutSensitif: sensitif,
  }), [durasi, intensitas, demo, keringat, suhu, sensitif])

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconTimer />} title="Sweat rate test" subtitle="Do it once, and every fluid plan afterwards uses your own number" />
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Weigh yourself unclothed before and after a session, and note how much you drank. Sweat rate
          varies by up to <strong className="text-ink">three times</strong> between people at the same
          temperature — which is why generic advice to &quot;drink 500 mL an hour&quot; can be far too
          little for one person and too much for another.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Weight before (kg)"><input className={inputClass} inputMode="decimal" value={sebelum} onChange={(e) => setSebelum(e.target.value)} placeholder="70.0" /></Field>
          <Field label="Weight after (kg)"><input className={inputClass} inputMode="decimal" value={sesudah} onChange={(e) => setSesudah(e.target.value)} placeholder="68.8" /></Field>
          <Field label="Session duration (min)"><input className={inputClass} inputMode="numeric" value={menitUji} onChange={(e) => setMenitUji(e.target.value)} /></Field>
          <Field label="Total drunk (mL)"><input className={inputClass} inputMode="numeric" value={minum} onChange={(e) => setMinum(e.target.value)} /></Field>
        </div>
        {keringat && (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm text-neutral-500">Your sweat rate</span>
              <span className="text-xl font-semibold tabular-nums text-ink">{keringat.mlPerJam} mL/h</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-neutral-500">{keringat.catatan}</p>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle icon={<IconRun />} title="Plan for one session" />
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Field label="Duration (min)"><input className={inputClass} inputMode="numeric" value={durasi} onChange={(e) => setDurasi(e.target.value)} /></Field>
          <Field label="Temperature (°C)"><input className={inputClass} inputMode="numeric" value={suhu} onChange={(e) => setSuhu(e.target.value)} /></Field>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['mudah', 'sedang', 'berat'] as const).map((i) => (
            <button key={i} onClick={() => setIntensitas(i)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${intensitas === i ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-neutral-500'}`}>
              {i}
            </button>
          ))}
          <button onClick={() => setSensitif((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${sensitif ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-white/10 text-neutral-500'}`}>
            Sensitive stomach
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Carbohydrate" value={`${rencana.karboPerJamGram}`} sub="g/jam" />
          <Stat label="Fluid" value={`${rencana.cairanPerJamMl}`} sub="mL/h" />
          <Stat label="Sodium" value={`${rencana.natriumPerJamMg}`} sub="mg/jam" />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Stat label="Total carbohydrate" value={`${rencana.totalKarboGram} g`} />
          <Stat label="Total fluid" value={`${rencana.totalCairanMl} mL`} />
        </div>

        {rencana.jadwal.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Schedule</div>
            <div className="mt-1.5 space-y-1">
              {rencana.jadwal.map((j) => (
                <div key={j.menit} className="flex gap-3 text-sm">
                  <span className="w-16 shrink-0 tabular-nums text-slate-500">min {j.menit}</span>
                  <span className="text-neutral-600">{j.isi}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 space-y-1.5">
          {rencana.dasar.map((d, i) => (
            <p key={i} className="text-sm leading-relaxed text-neutral-500"><span className="text-slate-600">· </span>{d}</p>
          ))}
        </div>
        {rencana.peringatan.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {rencana.peringatan.map((p, i) => (
              <p key={i} className="rounded-lg border border-amber-500/25 bg-amber-500/[0.07] p-2.5 text-sm leading-relaxed text-amber-900 dark:text-amber-100/90">{p}</p>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── FTP ─────────────────────────────────────────────────────────────────────

const PROTOKOL: { k: TesFtp; nama: string; cara: string }[] = [
  { k: 'tes20menit', nama: '20-minute test', cara: 'Warm up for 20 minutes, then ride 20 minutes as hard as you can hold EVENLY. Enter the average power for those 20 minutes. The most widely used, and the most painful.' },
  { k: 'tes8menit', nama: '2 × 8-minute test', cara: 'Two maximal 8-minute efforts with 10 minutes between. Enter the average of the better one. Shorter, but it demands good pacing.' },
  { k: 'ramp', nama: 'Ramp test', cara: 'Power is stepped up until you cannot continue. Enter the average power of the last completed minute. The easiest to execute, and the kindest to beginners.' },
  { k: 'manual', nama: 'I already know my FTP', cara: 'Enter your FTP value directly.' },
]

function TabFtp() {
  const demo = useMemo(() => getDemo(), [])
  const [metode, setMetode] = useState<TesFtp>('tes20menit')
  const [watt, setWatt] = useState('250')
  const [berat, setBerat] = useState(String(demo.weightKg || 65))

  const hasil = useMemo(() => hitungFtp({ metode, nilaiWatt: Number(watt), beratKg: Number(berat), sex: demo.sex }), [metode, watt, berat, demo])

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconActivity />} title="Calculate FTP" subtitle="The power you can hold for about an hour" />
        <Prosa kelas="mt-2 text-sm leading-relaxed text-neutral-500">FTP is the line separating &quot;hard but sustainable&quot; from &quot;fatigue piling up fast&quot;. Above it, lactate accumulates faster than it can be cleared and performance falls away sharply. It is the power equivalent of LTHR — just measured in watts.</Prosa>
        <div className="mt-3 space-y-1.5">
          {PROTOKOL.map((p) => (
            <button key={p.k} onClick={() => setMetode(p.k)}
              className={`w-full rounded-lg border p-2.5 text-left transition ${metode === p.k ? 'border-brand bg-brand/10' : 'border-white/10'}`}>
              <div className={`text-sm font-semibold ${metode === p.k ? 'text-brand-dark' : 'text-white'}`}>{p.nama}</div>
              <div className="text-[11px] leading-relaxed text-neutral-500">{p.cara}</div>
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label={metode === 'manual' ? 'FTP (watts)' : 'Test power (watts)'}>
            <input className={inputClass} inputMode="numeric" value={watt} onChange={(e) => setWatt(e.target.value)} />
          </Field>
          <Field label="Body weight (kg)"><input className={inputClass} inputMode="decimal" value={berat} onChange={(e) => setBerat(e.target.value)} /></Field>
        </div>
      </Card>

      {hasil && (
        <Card>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="FTP" value={`${hasil.ftp}`} sub="watt" />
            <Stat label="Watt per kg" value={hasil.wattPerKg != null ? `${hasil.wattPerKg}` : '—'} sub="W/kg" />
            <Stat label="Level" value={hasil.kategori ?? '—'} />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">{hasil.metode}</p>

          <div className="mt-4 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Power zones</div>
            {hasil.zona.map((z) => (
              <div key={z.z} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">Z{z.z} — {z.nama}</span>
                  <span className="text-sm tabular-nums text-neutral-600">{z.dari}{z.sampai != null ? `–${z.sampai}` : '+'} W</span>
                </div>
                <div className="text-[11px] leading-relaxed text-neutral-500">{z.tujuan}</div>
              </div>
            ))}
          </div>
          <Prosa kelas="mt-3 text-[11px] leading-relaxed text-slate-500">Watts per kilogram decide climbing ability; raw watts decide speed on the flat. That is why light riders excel in the mountains and larger riders excel on flat roads — both can have the same FTP.</Prosa>
        </Card>
      )}
    </div>
  )
}

// ── Panduan daya ────────────────────────────────────────────────────────────

function TabPanduan() {
  const demo = useMemo(() => getDemo(), [])
  const [ftp, setFtp] = useState('238')
  const [massa, setMassa] = useState(String((demo.weightKg || 65) + 9))
  const [durasiJam, setDurasiJam] = useState('2')
  const [segmen, setSegmen] = useState<Segmen[]>([
    { nama: 'Datar awal', jarakKm: 20, gradienPct: 0 },
    { nama: 'Tanjakan', jarakKm: 8, gradienPct: 7 },
    { nama: 'Turunan', jarakKm: 8, gradienPct: -6 },
    { nama: 'Datar akhir', jarakKm: 14, gradienPct: 0 },
  ])

  const anjuran = useMemo(() => saranIf(Number(durasiJam) || 2), [durasiJam])
  const [targetIf, setTargetIf] = useState<number | null>(null)
  const ifDipakai = targetIf ?? anjuran.if

  const hasil = useMemo(() => panduanDaya({
    segmen, ftp: Number(ftp) || 200, targetIf: ifDipakai, massaTotalKg: Number(massa) || 75,
  }), [segmen, ftp, ifDipakai, massa])

  const ubah = (i: number, patch: Partial<Segmen>) =>
    setSegmen((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconTimer />} title="Route power guide" subtitle="Target watts per segment, from the gradient profile" />
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Aturan intinya berlawanan dengan naluri kebanyakan orang: <strong className="text-ink">naik
          tanjakan pakai daya lebih tinggi, turun dan datar pakai lebih rendah</strong>. Saat menanjak
          kecepatan rendah sehingga hambatan udara kecil dan setiap watt tambahan langsung menghemat waktu;
          saat menurun, watt tambahan hampir seluruhnya terbuang melawan udara.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Field label="FTP (W)"><input className={inputClass} inputMode="numeric" value={ftp} onChange={(e) => setFtp(e.target.value)} /></Field>
          <Field label="Total weight (kg)"><input className={inputClass} inputMode="decimal" value={massa} onChange={(e) => setMassa(e.target.value)} /></Field>
          <Field label="Estimated hours"><input className={inputClass} inputMode="decimal" value={durasiJam} onChange={(e) => { setDurasiJam(e.target.value); setTargetIf(null) }} /></Field>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Berat total = badan + sepeda + perlengkapan. {anjuran.ket}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-500">Target intensity</span>
          {[0.65, 0.73, 0.8, 0.85, 0.95].map((v) => (
            <button key={v} onClick={() => setTargetIf(v)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums ${Math.abs(ifDipakai - v) < 0.001 ? 'border-brand bg-brand/10 text-brand-dark' : 'border-white/10 text-neutral-500'}`}>
              {v.toFixed(2)}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Route segments" subtitle="Split the route into flats, climbs and descents" />
        <div className="mt-2 space-y-2">
          {segmen.map((s, i) => (
            <div key={i} className="rounded-lg border border-white/10 p-2.5">
              <div className="grid grid-cols-3 gap-2">
                <Field label="Name"><input className={inputClass + ' !text-xs'} value={s.nama} onChange={(e) => ubah(i, { nama: e.target.value })} /></Field>
                <Field label="Distance (km)"><input className={inputClass + ' !text-xs'} inputMode="decimal" value={String(s.jarakKm)} onChange={(e) => ubah(i, { jarakKm: Number(e.target.value) || 0 })} /></Field>
                <Field label="Gradient (%)"><input className={inputClass + ' !text-xs'} inputMode="decimal" value={String(s.gradienPct)} onChange={(e) => ubah(i, { gradienPct: Number(e.target.value) || 0 })} /></Field>
              </div>
              {segmen.length > 1 && (
                <button onClick={() => setSegmen((x) => x.filter((_, j) => j !== i))}
                  className="mt-1 text-[11px] font-bold text-rose-600">Remove segment</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={() => setSegmen((s) => [...s, { nama: `Segmen ${s.length + 1}`, jarakKm: 5, gradienPct: 0 }])}
          className="mt-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-neutral-600">
          + Tambah segmen
        </button>
      </Card>

      <Card>
        <SectionTitle icon={<IconRun />} title="Target power" />
        <div className="mt-2 space-y-2">
          {hasil.segmen.map((s, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{s.nama}</span>
                <span className="text-lg font-semibold tabular-nums text-brand-dark">{s.targetWatt} W</span>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-neutral-500">
                <span>{s.pctFtp}% FTP</span><span>{s.jarakKm} km @ {s.gradienPct}%</span>
                <span>≈ {s.perkiraanKmh} km/j</span><span>≈ {s.perkiraanMenit.toFixed(0)} menit</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-neutral-500">{s.catatan}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="Estimated total" value={`${Math.floor(hasil.totalMenit / 60)}j ${Math.round(hasil.totalMenit % 60)}m`} />
          <Stat label="Distance" value={`${hasil.totalKm} km`} />
        </div>
        <div className="mt-3 space-y-1.5">
          {hasil.peringatan.map((p, i) => (
            <p key={i} className="rounded-lg border border-amber-500/25 bg-amber-500/[0.07] p-2.5 text-sm leading-relaxed text-amber-900 dark:text-amber-100/90">{p}</p>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Aklimatisasi ────────────────────────────────────────────────────────────

function TabAklimatisasi() {
  const [panas, setPanas] = useState<PaparanPanas[]>(() => muat<PaparanPanas>(KEY_PANAS))
  const [tinggi, setTinggi] = useState<PaparanKetinggian[]>(() => muat<PaparanKetinggian>(KEY_TINGGI))
  const tglHariIni = hariIni()
  const [pSuhu, setPSuhu] = useState('32')
  const [pMenit, setPMenit] = useState('60')
  const [tMeter, setTMeter] = useState('2500')
  const [tJam, setTJam] = useState('14')

  const statusPanas = useMemo(() => aklimatisasiPanas(panas), [panas])
  const statusTinggi = useMemo(() => aklimatisasiKetinggian(tinggi), [tinggi])
  const penalti = useMemo(() => penaltiKetinggian(Number(tMeter) || 0), [tMeter])

  const tambahPanas = () => {
    const next = [...panas, { tanggal: tglHariIni, suhuC: Number(pSuhu) || 0, menit: Number(pMenit) || 0 }]
    setPanas(next); simpan(KEY_PANAS, next)
  }
  const tambahTinggi = () => {
    const next = [...tinggi, { tanggal: tglHariIni, meter: Number(tMeter) || 0, jam: Number(tJam) || 0 }]
    setTinggi(next); simpan(KEY_TINGGI, next)
  }

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconHeart />} title="Heat acclimatisation" subtitle={`${statusPanas.label} · ${statusPanas.persen}%`} />
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-amber-500" style={{ width: `${statusPanas.persen}%` }} />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">{statusPanas.penjelasan}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-emerald-200/80">{statusPanas.saran}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Field label="Temperature (°C)"><input className={inputClass + ' !text-xs'} inputMode="numeric" value={pSuhu} onChange={(e) => setPSuhu(e.target.value)} /></Field>
          <Field label="Minutes"><input className={inputClass + ' !text-xs'} inputMode="numeric" value={pMenit} onChange={(e) => setPMenit(e.target.value)} /></Field>
          <div className="flex items-end"><button onClick={tambahPanas} className="w-full rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white">Log today</button></div>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          {panas.length} paparan tercatat. Hanya sesi di atas 27 °C dan minimal 30 menit yang dihitung —
          di bawah itu rangsangannya terlalu lemah untuk memicu adaptasi.
        </p>
      </Card>

      <Card>
        <SectionTitle icon={<IconActivity />} title="Altitude acclimatisation" subtitle={`${statusTinggi.label} · ${statusTinggi.persen}%`} />
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-sky-500" style={{ width: `${statusTinggi.persen}%` }} />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">{statusTinggi.penjelasan}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-emerald-200/80">{statusTinggi.saran}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Field label="Altitude (m)"><input className={inputClass + ' !text-xs'} inputMode="numeric" value={tMeter} onChange={(e) => setTMeter(e.target.value)} /></Field>
          <Field label="Hours spent there"><input className={inputClass + ' !text-xs'} inputMode="numeric" value={tJam} onChange={(e) => setTJam(e.target.value)} /></Field>
          <div className="flex items-end"><button onClick={tambahTinggi} className="w-full rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white">Log today</button></div>
        </div>
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-neutral-500">Aerobic capacity loss at {tMeter} m</span>
            <span className="text-lg font-semibold tabular-nums text-ink">−{penalti.pctVo2Turun}%</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-neutral-500">{penalti.ket}</p>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">{tinggi.length} paparan tercatat. Di bawah 1500 m tidak dihitung.</p>
      </Card>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-center">
      <div className="text-base font-semibold tabular-nums text-ink">{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  )
}

export default EnduranceTools
