import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconActivity } from '../components/icons'
import { getDemoTersimpan } from '../lib/profile'
import { hitungTdee, TUJUAN_GIZI, AKTIVITAS_GIZI, type TujuanGizi, type TingkatAktivitas } from '../lib/tdee'
import { susunPekan, type HariRencana } from '../lib/organizerLatihan'
import {
  MASUKAN, PERAN, BATAS_PELATIH, periksaKesiapan, sulihanTerpakai,
  type Masukan, type PeranPelatih, type Terisi,
} from '../lib/asupanPelatih'

// Empat peran, satu aturan: kumpulkan masukannya SEBELUM membuat rencana.
//
// Mesinnya sudah ada (hitungTdee, susunPekan). Yang ditambahkan di sini adalah
// penjaganya. Selama masih ada masukan wajib yang kosong, halaman ini MENYEBUT
// apa yang belum ada dan tidak mencetak satu angka pun -- karena angka yang
// dihitung dari nilai sulih adalah angka milik orang lain.

const PERAN_URUT: PeranPelatih[] = ['pelatih', 'transformasi', 'menu', 'gizi']

type NilaiForm = {
  usia: string; tinggi: string; berat: string; sex: '' | 'M' | 'F'
  tingkatAktivitas: '' | TingkatAktivitas
  tujuan: '' | TujuanGizi
  tingkatKebugaran: '' | 'pemula' | 'menengah' | 'lanjut'
  cedera: string; peralatan: string; jadwal: string
  jamTidur: string; kebiasaanMakan: string
  alergi: string; pantangan: string; preferensiMakan: string; anggaran: string
}

const KOSONG: NilaiForm = {
  usia: '', tinggi: '', berat: '', sex: '',
  tingkatAktivitas: '', tujuan: '', tingkatKebugaran: '',
  cedera: '', peralatan: '', jadwal: '',
  jamTidur: '', kebiasaanMakan: '',
  alergi: '', pantangan: '', preferensiMakan: '', anggaran: '',
}

// "Tidak ada" adalah jawaban yang sah untuk cedera, alergi dan pantangan --
// tetapi jawaban itu harus diberikan, bukan disimpulkan dari kolom kosong.
const BISA_TIDAK_ADA: Masukan[] = ['cedera', 'alergi', 'pantangan']
const ANGKA: Masukan[] = ['usia', 'tinggi', 'berat', 'jadwal', 'jamTidur', 'kebiasaanMakan']

const SATUAN: Partial<Record<Masukan, string>> = {
  usia: 'years', tinggi: 'cm', berat: 'kg', jadwal: 'days/week',
  jamTidur: 'hours/night', kebiasaanMakan: 'meals/day',
}

function keTerisi(f: NilaiForm): Terisi {
  const n = (s: string) => { const v = Number(s); return Number.isFinite(v) && v > 0 ? v : undefined }
  return {
    usia: n(f.usia), tinggi: n(f.tinggi), berat: n(f.berat), sex: f.sex || undefined,
    tingkatAktivitas: f.tingkatAktivitas || undefined, tujuan: f.tujuan || undefined,
    tingkatKebugaran: f.tingkatKebugaran || undefined,
    cedera: f.cedera || undefined, peralatan: f.peralatan || undefined, jadwal: n(f.jadwal),
    jamTidur: n(f.jamTidur), kebiasaanMakan: n(f.kebiasaanMakan),
    alergi: f.alergi || undefined, pantangan: f.pantangan || undefined,
    preferensiMakan: f.preferensiMakan || undefined, anggaran: f.anggaran || undefined,
  }
}

function Kolom({ id, nilai, ubah }: { id: Masukan; nilai: NilaiForm; ubah: (k: keyof NilaiForm, v: string) => void }) {
  const def = MASUKAN[id]
  const label = (
    <span className="flex items-baseline justify-between gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-200">
      <span>{def.label}{def.wajib ? <span className="ml-1 text-rose-500">*</span> : <span className="ml-1 text-[10px] font-semibold text-neutral-400">optional</span>}</span>
      {SATUAN[id] && <span className="text-[10px] font-semibold text-neutral-400">{SATUAN[id]}</span>}
    </span>
  )
  const kelas = 'mt-1.5 min-h-11 w-full rounded-xl border border-neutral-300/70 bg-white px-3 text-sm font-semibold text-ink dark:border-white/15 dark:bg-white/[.06] dark:text-white'

  let kendali
  if (id === 'sex') {
    kendali = (
      <select value={nilai.sex} onChange={(e) => ubah('sex', e.target.value)} className={kelas} aria-label={def.label}>
        <option value="">Not answered</option>
        <option value="F">Female</option>
        <option value="M">Male</option>
      </select>
    )
  } else if (id === 'tingkatAktivitas') {
    kendali = (
      <select value={nilai.tingkatAktivitas} onChange={(e) => ubah('tingkatAktivitas', e.target.value)} className={kelas} aria-label={def.label}>
        <option value="">Not answered</option>
        {AKTIVITAS_GIZI.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
      </select>
    )
  } else if (id === 'tujuan') {
    kendali = (
      <select value={nilai.tujuan} onChange={(e) => ubah('tujuan', e.target.value)} className={kelas} aria-label={def.label}>
        <option value="">Not answered</option>
        {TUJUAN_GIZI.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
    )
  } else if (id === 'tingkatKebugaran') {
    kendali = (
      <select value={nilai.tingkatKebugaran} onChange={(e) => ubah('tingkatKebugaran', e.target.value)} className={kelas} aria-label={def.label}>
        <option value="">Not answered</option>
        <option value="pemula">Beginner</option>
        <option value="menengah">Intermediate</option>
        <option value="lanjut">Advanced</option>
      </select>
    )
  } else if (ANGKA.includes(id)) {
    kendali = (
      <input
        type="number" inputMode="decimal" min={0}
        value={nilai[id as keyof NilaiForm] as string}
        onChange={(e) => ubah(id as keyof NilaiForm, e.target.value)}
        className={kelas} aria-label={def.label} placeholder="—"
      />
    )
  } else {
    kendali = (
      <input
        type="text"
        value={nilai[id as keyof NilaiForm] as string}
        onChange={(e) => ubah(id as keyof NilaiForm, e.target.value)}
        className={kelas} aria-label={def.label}
        placeholder={BISA_TIDAK_ADA.includes(id) ? 'Type "none" if there are none' : '—'}
      />
    )
  }

  return (
    <label className="block">
      {label}
      {kendali}
      <span className="mt-1 block text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">{def.alasan}</span>
    </label>
  )
}

function Rencana({ peran, f }: { peran: PeranPelatih; f: NilaiForm }) {
  const gizi = useMemo(() => hitungTdee({
    beratKg: Number(f.berat), tinggiCm: Number(f.tinggi), umur: Number(f.usia), sex: f.sex || undefined,
    tujuan: (f.tujuan || 'rawat') as TujuanGizi,
    aktivitas: (f.tingkatAktivitas || 'sedang') as TingkatAktivitas,
    makanPerHari: Number(f.kebiasaanMakan) || undefined,
  }), [f])

  const pekan: HariRencana[] | null = useMemo(() => {
    if (peran === 'menu' || peran === 'gizi') return null
    const hari = Math.min(6, Math.max(3, Number(f.jadwal) || 3))
    return susunPekan({ hariLatihan: hari, fokus: 'seimbang', sesiLari: 0 }, null)
  }, [peran, f.jadwal])

  const perluGizi = peran !== 'pelatih'

  return (
    <div className="space-y-4">
      {perluGizi && (
        <Card>
          <h3 className="text-sm font-black text-ink dark:text-white">Daily energy and protein</h3>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { k: 'Resting (BMR)', v: `${gizi.bmr} kcal` },
              { k: 'Maintenance', v: `${gizi.tdee} kcal` },
              { k: 'Your target', v: `${gizi.target} kcal` },
              { k: 'Protein', v: `${gizi.proteinLo}–${gizi.proteinHi} g` },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl border border-neutral-200/70 bg-neutral-50/70 p-3 dark:border-white/10 dark:bg-white/[.03]">
                <div className="text-[10px] font-black uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">{x.k}</div>
                <div className="mt-1 text-[15px] font-black tabular-nums text-ink dark:text-white">{x.v}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            Carbohydrate {gizi.karboG} g · fat {gizi.lemakG} g · fibre {gizi.seratG} g · water about {gizi.airL} L.
            {Number(f.kebiasaanMakan) > 0
              ? ` Split across ${Number(f.kebiasaanMakan)} meals that is about ${gizi.perMakan.kkal} kcal and ${gizi.perMakan.protein} g protein each.`
              : ' Meals per day was left blank, so no per-meal split is shown rather than assuming three.'}
          </p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Computed with Mifflin-St Jeor (1990) from the age, height, weight and sex you entered; protein from the
            ISSN/ACSM per-kilogram ranges. No value here was substituted.
          </p>
        </Card>
      )}

      {pekan && (
        <Card>
          <h3 className="text-sm font-black text-ink dark:text-white">The training week</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {pekan.map((h) => (
              <div key={h.indeks} className="rounded-2xl border border-neutral-200/70 bg-neutral-50/70 p-3 dark:border-white/10 dark:bg-white/[.03]">
                <div className="text-[10px] font-black uppercase tracking-[.14em] text-neutral-500 dark:text-neutral-400">{h.hari}</div>
                <div className="text-sm font-black text-ink dark:text-white">{h.judul}</div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">{h.catatan}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Built by the same scheduling rules as the Organizer tab: no pattern on consecutive days, at least one
            full rest day. Sets and repetitions there are ordinary ranges, not a load prescribed for you.
            {f.cedera.trim() && ` You recorded: "${f.cedera.trim()}" — movements are not filtered automatically; exclude anything that touches it yourself.`}
            {f.peralatan.trim() && ` Equipment you listed: ${f.peralatan.trim()}.`}
          </p>
        </Card>
      )}

      {peran === 'menu' && (
        <Card>
          <h3 className="text-sm font-black text-ink dark:text-white">What the meal plan must avoid</h3>
          <ul className="mt-2 space-y-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            <li>· Allergies you recorded: {f.alergi.trim() || '—'}</li>
            <li>· Restrictions you recorded: {f.pantangan.trim() || '—'}</li>
            <li>· Preferences you recorded: {f.preferensiMakan.trim() || '—'}</li>
          </ul>
          <p className="mt-2 text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            These are shown back to you so a plan can be written around them. Panacea does not check any food
            against this list; no allergen screening happens here.
          </p>
        </Card>
      )}
    </div>
  )
}

export function PelatihAsupan() {
  const [peran, setPeran] = useState<PeranPelatih>('pelatih')
  const [f, setF] = useState<NilaiForm>(KOSONG)
  const [minta, setMinta] = useState(false)

  // Prefill HANYA dari nilai yang benar-benar disimpan. getDemo() akan
  // memberi 70 kg / 170 cm / 30 tahun kepada orang yang belum pernah
  // mengisi apa pun, dan halaman ini ada justru untuk mencegah itu.
  useEffect(() => {
    const d = getDemoTersimpan()
    setF((p) => ({
      ...p,
      usia: p.usia || (d.age ? String(d.age) : ''),
      tinggi: p.tinggi || (d.heightCm ? String(d.heightCm) : ''),
      berat: p.berat || (d.weightKg ? String(d.weightKg) : ''),
      sex: p.sex || (d.sex === 'M' || d.sex === 'F' ? d.sex : ''),
      jamTidur: p.jamTidur || (d.sleepH ? String(d.sleepH) : ''),
    }))
  }, [])

  const terisi = useMemo(() => keTerisi(f), [f])
  const siapSemua = useMemo(
    () => Object.fromEntries(PERAN_URUT.map((p) => [p, periksaKesiapan(p, terisi)])) as Record<PeranPelatih, ReturnType<typeof periksaKesiapan>>,
    [terisi],
  )
  const kesiapan = siapSemua[peran]
  const sulihan = useMemo(() => sulihanTerpakai(terisi), [terisi])
  const ubah = (k: keyof NilaiForm, v: string) => setF((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={<IconActivity />}
        title="Coach intake"
        subtitle="Answer first, plan second — nothing is computed from a value you did not give"
      />

      <Card>
        <h3 className="text-sm font-black text-ink dark:text-white">What do you want built?</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PERAN_URUT.map((p) => {
            const k = siapSemua[p]
            const aktif = p === peran
            return (
              <button
                key={p}
                type="button"
                onClick={() => { setPeran(p); setMinta(false) }}
                aria-pressed={aktif}
                className={`min-h-11 rounded-2xl border p-3 text-left ${
                  aktif ? 'border-brand bg-brand/[.08]' : 'border-neutral-300/70 dark:border-white/15'
                }`}
              >
                <div className="text-sm font-black text-ink dark:text-white">{PERAN[p].judul}</div>
                <div className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">{PERAN[p].ringkas}</div>
                <div className={`mt-1.5 text-[11px] font-bold ${k.siap ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>
                  {k.siap ? 'Ready' : `${k.kurangWajib.length} still needed`}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-black text-ink dark:text-white">{PERAN[peran].judul} — what it needs</h3>
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            {PERAN[peran].perlu.length - kesiapan.kurangWajib.length - kesiapan.kurangOpsional.length} of {PERAN[peran].perlu.length} answered
          </span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PERAN[peran].perlu.map((m) => <Kolom key={m} id={m} nilai={f} ubah={ubah} />)}
        </div>
      </Card>

      {!kesiapan.siap && (
        <Card>
          <h3 className="text-sm font-black text-amber-700 dark:text-amber-300">No plan yet — {kesiapan.kurangWajib.length} required {kesiapan.kurangWajib.length === 1 ? 'answer is' : 'answers are'} missing</h3>
          <ul className="mt-2 space-y-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            {kesiapan.kurangWajib.map((m) => <li key={m}>· {MASUKAN[m].label} — {MASUKAN[m].alasan}</li>)}
          </ul>
          {sulihan.length > 0 && (
            <p className="mt-3 text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              If this page produced a plan anyway, the calculator behind it would quietly substitute {sulihan.join(', ')} — 
              figures belonging to nobody. That is the reason it refuses instead.
            </p>
          )}
        </Card>
      )}

      {kesiapan.siap && !minta && (
        <Card>
          <p className="text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            Every required answer is in, and none of them was filled in for you.
            {kesiapan.kurangOpsional.length > 0 && ` Still blank, and left blank rather than guessed: ${kesiapan.kurangOpsional.map((m) => MASUKAN[m].label.toLowerCase()).join(', ')}.`}
          </p>
          <button
            type="button"
            onClick={() => setMinta(true)}
            className="mt-3 min-h-11 w-full rounded-2xl bg-brand px-4 text-sm font-black text-white"
          >
            Build the {PERAN[peran].judul.toLowerCase()}
          </button>
        </Card>
      )}

      {kesiapan.siap && minta && <Rencana peran={peran} f={f} />}

      <Card>
        <h3 className="text-sm font-black text-ink dark:text-white">Limits of everything above</h3>
        <ul className="mt-2 space-y-1.5 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {BATAS_PELATIH.map((b) => <li key={b}>· {b}</li>)}
        </ul>
      </Card>
    </div>
  )
}
