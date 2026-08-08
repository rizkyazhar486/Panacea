import { useMemo, useState } from 'react'
import { Card, SectionTitle, Field, inputClass } from '../components/ui'
import { IconHeart, IconActivity, IconTimer } from '../components/icons'
import {
  analisisSpo2, SEBAB_SPO2_KELIRU, INFO_EKG, GEJALA_EKG, ringkasEkg,
  rencanaJetLag, statusKehamilan, panduanOlahragaHamil, DISCLAIMER_HAMIL,
  panduanKursiRoda,
  type BacaanSpo2, type CatatanEkg, type KlasifikasiEkg,
} from '../lib/clinicalTrackers'

// ─────────────────────────────────────────────────────────────────────────────
// Pelacak Klinis — saturasi, EKG, jet lag, kehamilan, kursi roda.
//
// Semua memakai masukan yang dicatat sendiri, jadi tidak bergantung pada
// perangkat mana pun. Satu batas yang dijaga: halaman ini MENCATAT dan
// MENJELASKAN, tidak MENAFSIRKAN rekaman mentah — untuk EKG yang disimpan
// adalah label yang sudah dikeluarkan alat berizin, bukan pembacaan gelombang
// oleh perhitungan di sini.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'spo2' | 'ekg' | 'jetlag' | 'hamil' | 'kursiRoda'

const KEY_SPO2 = 'pmd_spo2_v1'
const KEY_EKG = 'pmd_ekg_v1'

function muat<T>(k: string): T[] {
  try { const v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
function simpan<T>(k: string, v: T[]) {
  try { localStorage.setItem(k, JSON.stringify(v.slice(-400))) } catch { /* kuota */ }
}

export function ClinicalTrackers() {
  const [tab, setTab] = useState<Tab>('spo2')
  return (
    <div className="space-y-4">
      <SectionTitle icon={<IconHeart />} title="Pelacak Klinis"
        subtitle="Saturation, ECG, jet lag, pregnancy, and wheelchair physiology" />

      <Card>
        <p className="text-sm leading-relaxed text-neutral-600">
          Semua di sini dicatat sendiri, jadi <strong className="text-ink">tidak bergantung pada perangkat
          mana pun</strong>. Halaman ini <strong className="text-ink">mencatat dan menjelaskan</strong>, dan
          sengaja tidak menafsirkan rekaman mentah — membaca EKG adalah wilayah alat berizin dan tenaga medis,
          dan menirunya justru berbahaya ketika hasilnya salah.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        {([
          ['spo2', '🫁 Saturasi'],
          ['ekg', '❤️ Catatan EKG'],
          ['jetlag', '✈️ Jet Lag'],
          ['hamil', '🤰 Kehamilan'],
          ['kursiRoda', '♿ Kursi Roda'],
        ] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${tab === k ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-neutral-500'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'spo2' && <TabSpo2 />}
      {tab === 'ekg' && <TabEkg />}
      {tab === 'jetlag' && <TabJetLag />}
      {tab === 'hamil' && <TabHamil />}
      {tab === 'kursiRoda' && <TabKursiRoda />}
    </div>
  )
}

// ── SpO2 ────────────────────────────────────────────────────────────────────

function TabSpo2() {
  const [list, setList] = useState<BacaanSpo2[]>(() => muat<BacaanSpo2>(KEY_SPO2))
  const [nilai, setNilai] = useState('97')
  const [nadi, setNadi] = useState('')
  const [konteks, setKonteks] = useState<BacaanSpo2['konteks']>('istirahat')
  const [meter, setMeter] = useState('')

  const analisis = useMemo(() => analisisSpo2(list), [list])

  const tambah = () => {
    const v = Number(nilai)
    if (!(v > 0 && v <= 100)) return
    const next = [...list, {
      waktu: new Date().toISOString(), spo2: v,
      nadi: Number(nadi) || undefined, konteks,
      ketinggianM: Number(meter) || undefined,
    }]
    setList(next); simpan(KEY_SPO2, next)
  }

  const warna = analisis.band === 'normal' ? '#34d399' : analisis.band === 'perhatian' ? '#fbbf24' : analisis.band === 'rendah' ? '#f87171' : '#94a3b8'

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconActivity />} title="Catat bacaan" subtitle="From a watch, a fingertip oximeter, or any device" />
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Field label="SpO₂ (%)"><input className={inputClass} inputMode="numeric" value={nilai} onChange={(e) => setNilai(e.target.value)} /></Field>
          <Field label="Nadi (opsional)"><input className={inputClass} inputMode="numeric" value={nadi} onChange={(e) => setNadi(e.target.value)} /></Field>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['istirahat', 'tidur', 'aktivitas', 'ketinggian'] as const).map((k) => (
            <button key={k} onClick={() => setKonteks(k)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${konteks === k ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-neutral-500'}`}>{k}</button>
          ))}
        </div>
        {konteks === 'ketinggian' && (
          <div className="mt-2"><Field label="Ketinggian (m)"><input className={inputClass} inputMode="numeric" value={meter} onChange={(e) => setMeter(e.target.value)} /></Field></div>
        )}
        <button onClick={tambah} className="mt-3 w-full rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white">Simpan bacaan</button>
      </Card>

      {analisis.band !== 'takAda' && (
        <Card>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold tabular-nums" style={{ color: warna }}>{analisis.terakhir!.spo2}%</div>
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-neutral-600">{analisis.arti}</p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Rata-rata" value={`${analisis.rerata}%`} />
            <Stat label="Terendah" value={`${analisis.terendah}%`} />
            <Stat label="Bacaan" value={`${analisis.jumlah}`} />
          </div>
          {analisis.batasKetinggian && (
            <p className="mt-3 rounded-lg border border-sky-500/25 bg-sky-500/[0.07] p-2.5 text-sm leading-relaxed text-sky-100/90">
              {analisis.batasKetinggian}
            </p>
          )}
          {analisis.tandaBahaya.length > 0 && (
            <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/[0.08] p-3">
              <div className="text-sm font-semibold text-rose-200">Periksakan segera bila disertai:</div>
              <ul className="mt-1.5 space-y-1">
                {analisis.tandaBahaya.map((t) => (
                  <li key={t} className="flex gap-2 text-sm text-rose-100/90"><span className="text-rose-500">•</span><span>{t}</span></li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <Card>
        <SectionTitle title="Before you panic: reasons a low reading can be wrong" />
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
          Alat di jam tangan dan oksimeter jari <strong className="text-ink">bukan alat diagnostik</strong>.
          Angka rendah yang berdiri sendiri tanpa gejala paling sering merupakan kesalahan pengukuran.
        </p>
        <ul className="mt-2 space-y-1">
          {SEBAB_SPO2_KELIRU.map((s) => (
            <li key={s} className="flex gap-2 text-sm text-neutral-500"><span className="text-slate-600">•</span><span>{s}</span></li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

// ── EKG ─────────────────────────────────────────────────────────────────────

function TabEkg() {
  const [list, setList] = useState<CatatanEkg[]>(() => muat<CatatanEkg>(KEY_EKG))
  const [klas, setKlas] = useState<KlasifikasiEkg>('sinus')
  const [nadi, setNadi] = useState('')
  const [gejala, setGejala] = useState<string[]>([])

  const ringkas = useMemo(() => ringkasEkg(list), [list])

  const tambah = () => {
    const next = [...list, { waktu: new Date().toISOString(), klasifikasi: klas, nadi: Number(nadi) || undefined, gejala }]
    setList(next); simpan(KEY_EKG, next); setGejala([])
  }
  const toggleGejala = (g: string) =>
    setGejala((x) => (g === 'Tidak ada gejala' ? ['Tidak ada gejala'] : x.includes(g) ? x.filter((y) => y !== g) : [...x.filter((y) => y !== 'Tidak ada gejala'), g]))

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm leading-relaxed text-neutral-600">
          Rekam EKG di aplikasi bawaan jam tangan Anda, lalu <strong className="text-ink">salin hasilnya ke
          sini</strong> beserta gejala saat itu. Yang berguna bagi dokter adalah <strong className="text-ink">pola
          dari waktu ke waktu</strong> — kapan terjadi, seberapa sering, dan apa yang Anda rasakan — bukan satu
          rekaman tunggal.
        </p>
      </Card>

      <Card>
        <SectionTitle icon={<IconHeart />} title="Record result" />
        <div className="mt-2 space-y-1.5">
          {(Object.keys(INFO_EKG) as KlasifikasiEkg[]).map((k) => (
            <button key={k} onClick={() => setKlas(k)}
              className={`w-full rounded-lg border p-2.5 text-left transition ${klas === k ? 'border-brand bg-brand/10' : 'border-white/10'}`}>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: INFO_EKG[k].warna }} />
                <span className={`text-sm font-semibold ${klas === k ? 'text-brand-dark' : 'text-white'}`}>{INFO_EKG[k].label}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-2"><Field label="Nadi saat rekaman (opsional)"><input className={inputClass} inputMode="numeric" value={nadi} onChange={(e) => setNadi(e.target.value)} /></Field></div>
        <div className="mt-2">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Gejala saat itu</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {GEJALA_EKG.map((g) => (
              <button key={g} onClick={() => toggleGejala(g)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${gejala.includes(g) ? 'border-brand bg-brand/10 text-brand-dark' : 'border-white/10 text-neutral-500'}`}>{g}</button>
            ))}
          </div>
        </div>
        <button onClick={tambah} className="mt-3 w-full rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white">Simpan catatan</button>
      </Card>

      <Card>
        <SectionTitle title={`Arti "${INFO_EKG[klas].label}"`} />
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{INFO_EKG[klas].arti}</p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-200/80"><span className="text-emerald-500/80">Langkah: </span>{INFO_EKG[klas].langkah}</p>
      </Card>

      {list.length > 0 && (
        <Card>
          <SectionTitle icon={<IconActivity />} title="History" subtitle={`${ringkas.total} rekaman`} />
          <p className={`mt-2 rounded-lg border p-3 text-sm leading-relaxed ${ringkas.darurat ? 'border-rose-500/30 bg-rose-500/[0.08] text-rose-100' : 'border-white/10 bg-white/[0.03] text-neutral-600'}`}>
            {ringkas.saran}
          </p>
          <div className="mt-3 space-y-1.5">
            {[...list].reverse().slice(0, 30).map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: INFO_EKG[c.klasifikasi].warna }} />
                <span className="font-semibold text-ink">{INFO_EKG[c.klasifikasi].label}</span>
                {c.nadi && <span className="text-slate-500">{c.nadi} bpm</span>}
                <span className="text-slate-500">{new Date(c.waktu).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                {c.gejala.length > 0 && <span className="w-full text-neutral-500">{c.gejala.join(', ')}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Jet lag ─────────────────────────────────────────────────────────────────

function TabJetLag() {
  const [asal, setAsal] = useState('7')
  const [tujuan, setTujuan] = useState('1')
  const [bangun, setBangun] = useState('06:00')
  const [siap, setSiap] = useState('3')

  const rencana = useMemo(() => rencanaJetLag({
    tzAsal: Number(asal) || 0, tzTujuan: Number(tujuan) || 0,
    jamBangunBiasa: bangun, hariPersiapan: Number(siap) || 0,
  }), [asal, tujuan, bangun, siap])

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconTimer />} title="Adjustment plan" />
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Field label="Zona waktu asal (UTC+)"><input className={inputClass} inputMode="numeric" value={asal} onChange={(e) => setAsal(e.target.value)} /></Field>
          <Field label="Zona waktu tujuan (UTC+)"><input className={inputClass} inputMode="numeric" value={tujuan} onChange={(e) => setTujuan(e.target.value)} /></Field>
          <Field label="Jam bangun biasa"><input className={inputClass} type="time" value={bangun} onChange={(e) => setBangun(e.target.value)} /></Field>
          <Field label="Hari persiapan"><input className={inputClass} inputMode="numeric" value={siap} onChange={(e) => setSiap(e.target.value)} /></Field>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Jakarta UTC+7 · Singapura UTC+8 · London UTC+0/+1 · Tokyo UTC+9 · New York UTC−5/−4</p>
        <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed text-neutral-600">{rencana.ringkas}</p>
      </Card>

      {rencana.langkah.length > 0 && (
        <Card>
          <SectionTitle title="Daily steps" />
          <div className="mt-2 space-y-2">
            {rencana.langkah.map((l) => (
              <div key={l.hari} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-sm font-semibold text-ink">{l.hari}</div>
                <ul className="mt-1 space-y-1">
                  {l.isi.map((x, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-neutral-500"><span className="text-slate-600">·</span><span>{x}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      {rencana.catatan.length > 0 && (
        <Card>
          <SectionTitle title="Kenapa waktunya penting" />
          <div className="mt-2 space-y-2">
            {rencana.catatan.map((c, i) => (
              <p key={i} className="text-sm leading-relaxed text-neutral-500">{c}</p>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ── Kehamilan ───────────────────────────────────────────────────────────────

function TabHamil() {
  const [hpht, setHpht] = useState('')
  const status = useMemo(() => (hpht ? statusKehamilan(hpht) : null), [hpht])
  const panduan = useMemo(() => panduanOlahragaHamil(status?.trimester ?? 1), [status])

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconTimer />} title="Usia kehamilan" />
        <div className="mt-2"><Field label="Hari pertama haid terakhir"><input className={inputClass} type="date" value={hpht} onChange={(e) => setHpht(e.target.value)} /></Field></div>
        {status && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Usia" value={`${status.usiaMinggu}m ${status.usiaHari}h`} />
            <Stat label="Trimester" value={`${status.trimester}`} />
            <Stat label="Perkiraan lahir" value={new Date(status.perkiraanLahir).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
          </div>
        )}
        {hpht && !status && <p className="mt-2 text-sm text-amber-200/90">Tanggal tidak menghasilkan usia kehamilan yang masuk akal.</p>}
      </Card>

      <Card>
        <SectionTitle icon={<IconActivity />} title={`Aktivitas — trimester ${status?.trimester ?? 1}`} />
        <p className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed text-neutral-600">{panduan.catatanTrimester}</p>
        <Daftar judul="Dianjurkan" isi={panduan.anjuran} warna="emerald" />
        <Daftar judul="Dihindari" isi={panduan.hindari} warna="amber" />
      </Card>

      <Card>
        <SectionTitle icon={<IconHeart />} title="Stop and contact a clinician if these appear" />
        <ul className="mt-2 space-y-1">
          {panduan.tandaBerhenti.map((t) => (
            <li key={t} className="flex gap-2 text-sm text-rose-100/90"><span className="text-rose-500">•</span><span>{t}</span></li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle title="Conditions where exercise is not advised" />
        <ul className="mt-2 space-y-1">
          {panduan.kontraindikasiMutlak.map((t) => (
            <li key={t} className="flex gap-2 text-sm text-neutral-600"><span className="text-slate-600">•</span><span>{t}</span></li>
          ))}
        </ul>
        <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] p-3 text-sm leading-relaxed text-amber-100/90">{DISCLAIMER_HAMIL}</p>
      </Card>
    </div>
  )
}

// ── Kursi roda ──────────────────────────────────────────────────────────────

function TabKursiRoda() {
  const [puncak, setPuncak] = useState('160')
  const panduan = useMemo(() => panduanKursiRoda(Number(puncak) || 160), [puncak])

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconHeart />} title="Zona mendorong" subtitle="Computed from peak heart rate while PUSHING, not from a formula" />
        <div className="mt-2"><Field label="Denyut puncak saat mendorong keras (bpm)"><input className={inputClass} inputMode="numeric" value={puncak} onChange={(e) => setPuncak(e.target.value)} /></Field></div>
        <div className="mt-3 space-y-1.5">
          {panduan.zona.map((z) => (
            <div key={z.z} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-ink">Z{z.z} — {z.nama}</span>
                <span className="text-sm tabular-nums text-neutral-600">{z.dari}–{z.sampai} bpm</span>
              </div>
              <div className="text-[11px] leading-relaxed text-neutral-500">{z.tujuan}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<IconActivity />} title="Menjaga bahu" />
        <div className="mt-2 space-y-2">
          {panduan.bahu.map((b) => (
            <div key={b.judul} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-semibold text-ink">{b.judul}</div>
              <p className="mt-1 text-sm leading-relaxed text-neutral-500">{b.isi}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="What to be aware of" />
        <div className="mt-2 space-y-2">
          {panduan.catatan.map((c, i) => (
            <p key={i} className={`rounded-lg border p-2.5 text-sm leading-relaxed ${/disrefleksia/i.test(c) ? 'border-rose-500/30 bg-rose-500/[0.08] text-rose-100/90' : 'border-white/10 text-neutral-500'}`}>{c}</p>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Daftar({ judul, isi, warna }: { judul: string; isi: string[]; warna: 'emerald' | 'amber' }) {
  return (
    <div className="mt-3">
      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{judul}</div>
      <ul className="mt-1.5 space-y-1">
        {isi.map((x) => (
          <li key={x} className={`flex gap-2 text-sm leading-relaxed ${warna === 'emerald' ? 'text-emerald-100/90' : 'text-amber-100/90'}`}>
            <span className={warna === 'emerald' ? 'text-emerald-500' : 'text-amber-500'}>•</span><span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-center">
      <div className="text-sm font-semibold tabular-nums text-ink">{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
    </div>
  )
}

export default ClinicalTrackers
