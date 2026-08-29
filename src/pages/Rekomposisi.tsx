import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle } from '../components/ui'
import { IconActivity } from '../components/icons'
import { getDemo } from '../lib/profile'
import { useVitalField } from '../lib/useVitals'
import {
  SASARAN, FASE_REKOMP, PEKAN, PENGUKURAN, giziFase, type FaseRekomp,
} from '../lib/rekomposisi'

// ─────────────────────────────────────────────────────────────────────────────
// Program rekomposisi — kalistenik dan dumbel.
//
// SASARAN YANG DIMINTA DITARUH PALING ATAS, BESERTA APA YANG WAJAR DIHARAPKAN.
// Bukan untuk menolak permintaannya — programnya tetap disusun sepenuhnya
// untuk mengejar arah yang sama — melainkan karena program yang mengejar
// angka yang tidak dapat dicapai akan dianggap gagal justru pada saat ia
// sedang berhasil, dan orang yang menyimpulkan begitu berhenti berlatih.
// ─────────────────────────────────────────────────────────────────────────────

const WARNA_FASE: Record<FaseRekomp, string> = {
  bangun: '#38bdf8',
  kikis: '#fb7185',
  rawat: '#34d399',
}

export function Rekomposisi() {
  const demo = useMemo(() => getDemo(), [])
  const [berat] = useVitalField('weightKg', demo.weightKg || 0)
  const [tinggi] = useVitalField('heightCm', demo.heightCm || 0)
  const [fase, setFase] = useState<FaseRekomp>(() => {
    try {
      const v = localStorage.getItem('pmd_rekomp_fase')
      return v === 'bangun' || v === 'kikis' || v === 'rawat' ? v : 'bangun'
    } catch {
      return 'bangun'
    }
  })
  const [hari, setHari] = useState(0)

  const gizi = useMemo(
    () => giziFase(fase, berat, tinggi, demo.age || 0, demo.sex),
    [fase, berat, tinggi, demo.age, demo.sex],
  )
  const faseKini = FASE_REKOMP.find((f) => f.id === fase)!

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <SectionTitle
        icon={<IconActivity size={20} />}
        title="Recomposition programme"
        subtitle="Calisthenics and dumbbells — legs, abdomen, core, chest, traps and neck"
      />

      {/* ── Sasaran, apa adanya ──────────────────────────────────────────── */}
      <Card className="!p-4">
        <div className="text-[12px] font-black text-ink dark:text-white">Your targets, and what to expect</div>
        <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-500">
          The programme below is built to chase exactly what you asked for. Two of the numbers are worth stating
          plainly first, because a plan aimed at an unreachable figure gets judged a failure at the exact moment it is
          working.
        </p>
        <div className="mt-3 space-y-2">
          {SASARAN.map((s) => (
            <div key={s.judul} className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
              <div className="text-[12px] font-black text-ink dark:text-white">{s.judul}</div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[11px] font-bold text-rose-500">asked: {s.diminta}</span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">realistic: {s.wajar}</span>
              </div>
              <p className="mt-1 text-[12px] leading-[1.6] text-neutral-600 dark:text-neutral-300">{s.kenapa}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Fase ─────────────────────────────────────────────────────────── */}
      <Card className="!p-4">
        <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">Current phase</div>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {FASE_REKOMP.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFase(f.id)
                try { localStorage.setItem('pmd_rekomp_fase', f.id) } catch { /* abaikan */ }
              }}
              aria-pressed={fase === f.id}
              /* Ketiga warna fase adalah warna MUDA (#38bdf8, #fb7185, #34d399).
                 Putih di atasnya 2,1:1. Yang terpilih memakai tinta gelap; yang
                 tidak terpilih tetap putih, sebab latarnya abu tembus di atas
                 kartu gelap. */
              className={`min-h-[44px] rounded-xl px-2 text-[12px] font-bold ${fase === f.id ? 'tinta-tetap' : 'text-neutral-700 dark:text-white'}`}
              style={{ background: fase === f.id ? WARNA_FASE[f.id] : 'rgba(120,120,120,0.35)' }}
            >
              {f.nama}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          <div className="text-[11px] font-bold text-neutral-500">{faseKini.lama}</div>
          <p className="text-[12.5px] leading-[1.6] text-ink dark:text-neutral-200">
            <b>Calories: </b>{faseKini.kalori}
          </p>
          <p className="text-[12.5px] leading-[1.6] text-ink dark:text-neutral-200">
            <b>Protein: </b>{faseKini.protein}
          </p>
          <p className="text-[12.5px] leading-[1.6] text-ink dark:text-neutral-200">
            <b>Training: </b>{faseKini.latihan}
          </p>
          <div className="rounded-xl bg-emerald-500/10 p-2.5">
            <div className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              It is working when
            </div>
            <ul className="mt-1 space-y-0.5">
              {faseKini.tanda.map((t, i) => (
                <li key={i} className="text-[12px] leading-snug text-ink dark:text-white">• {t}</li>
              ))}
            </ul>
          </div>
          <p className="rounded-xl bg-amber-500/10 p-2.5 text-[12px] leading-snug text-amber-900 dark:text-amber-200">
            <b>Move on: </b>{faseKini.pindah}
          </p>
        </div>
      </Card>

      {/* ── Angka gizi untuk fase ini ────────────────────────────────────── */}
      {gizi ? (
        <Card className="!p-4">
          <div className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Your numbers for this phase
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            {[
              { l: 'kcal', v: gizi.target, c: WARNA_FASE[fase] },
              { l: 'Protein', v: `${gizi.protein}g`, c: '#34d399' },
              { l: 'Carbs', v: `${gizi.karbo}g`, c: '#38bdf8' },
              { l: 'Fat', v: `${gizi.lemak}g`, c: '#fbbf24' },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-neutral-50 p-2 dark:bg-white/5">
                <div className="text-[9px] font-black uppercase tracking-wide text-neutral-400">{x.l}</div>
                <div className="tinta-aksen text-[17px] font-black leading-tight tabular-nums" style={{ ["--aksen" as string]: x.c }}>{x.v}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-snug text-neutral-500">
            Protein range {gizi.proteinLo}-{gizi.proteinHi} g. Computed from the same engine as Macro Lab, so the two
            screens can never disagree.
          </p>
        </Card>
      ) : (
        <Card className="!p-4">
          <p className="text-[12.5px] leading-snug text-neutral-500">
            Add your weight, height and age in the profile and the calorie and macro targets for each phase appear
            here. Without them any number would be someone else&apos;s.
          </p>
          <Link to="/profil" className="mt-2 inline-flex min-h-[44px] items-center text-[12px] font-bold text-brand">
            Open profile →
          </Link>
        </Card>
      )}

      {/* ── Pekan latihan ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h2 className="px-1 text-[13px] font-black uppercase tracking-wide text-brand">The training week</h2>
        <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {PEKAN.map((h, i) => (
            <button
              key={h.nama}
              onClick={() => setHari(i)}
              aria-pressed={hari === i}
              className={`min-h-[40px] shrink-0 rounded-full px-3 text-[12px] font-bold ${
                hari === i ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
              }`}
            >
              {h.nama}
            </button>
          ))}
        </div>

        <Card className="!p-4">
          <div className="text-[13px] font-black text-ink dark:text-white">{PEKAN[hari].fokus}</div>
          <div className="mt-0.5 text-[11px] text-neutral-500">{PEKAN[hari].sasaran}</div>
          <div className="mt-3 space-y-2">
            {PEKAN[hari].latihan.map((l) => (
              <div key={l.gerak} className="rounded-xl bg-neutral-50 p-2.5 dark:bg-white/5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 text-[12.5px] font-black text-ink dark:text-white">{l.gerak}</span>
                  <span className="shrink-0 text-[12px] font-black tabular-nums text-brand">{l.set}</span>
                </div>
                <p className="mt-1 text-[12px] leading-[1.55] text-neutral-600 dark:text-neutral-300">{l.catatan}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Pengukuran ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h2 className="px-1 text-[13px] font-black uppercase tracking-wide text-brand">What to measure</h2>
        {PENGUKURAN.map((u) => (
          <div key={u.apa} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="text-[12.5px] font-black text-ink dark:text-white">{u.apa}</div>
            <div className="mt-0.5 text-[11px] font-bold text-brand">{u.seberapaSering}</div>
            <p className="mt-1 text-[12px] leading-[1.6] text-neutral-600 dark:text-neutral-300">{u.kenapa}</p>
          </div>
        ))}
      </div>

      <Link
        to="/calisthenics"
        className="flex min-h-[44px] items-center justify-center rounded-2xl border border-neutral-200 text-[12px] font-bold text-brand dark:border-white/10"
      >
        The full calisthenics ladder — 109 movements →
      </Link>
    </div>
  )
}

export default Rekomposisi
