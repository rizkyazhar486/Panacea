import { useState } from 'react'
import { Card, SectionTitle } from '../../components/ui'
import {
  TAHAP, terbitkanOrder, tafsirkanLab, jadwalkanKontrol, RUJUKAN,
  type OrderTerbit, type TafsiranLab, type HasilLab,
} from '../../lib/emrPipeline'
import { periksa, cocokkanNama, semuaButir } from '../../lib/interaksi'
import type { Anamnesis, PhysicalExam, ProblemEntry } from '../../lib/types'

// Papan alur AI-EMR otonom. Lihat src/lib/emrPipeline.ts untuk pembagian kerja
// antara model bahasa dan aturan deterministik, dan kenapa dua tahap punya
// gerbang manusia yang tidak bisa dilewati.

interface Props {
  anamnesis: Anamnesis
  fisik: PhysicalExam
  masalah: ProblemEntry[]
  resep: string[]
  onSignResep?: () => void
  resepDitandatangani?: boolean
}

function LencanaPelaku({ pelaku }: { pelaku: 'ai' | 'dokter' | 'sistem' }) {
  const gaya = pelaku === 'ai'
    ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
    : pelaku === 'dokter'
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
    : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
  const teks = pelaku === 'ai' ? 'AI' : pelaku === 'dokter' ? 'Doctor' : 'Rules'
  return <span className={`shrink-0 rounded-full px-1.5 text-[10px] font-bold ${gaya}`}>{teks}</span>
}

export function AutonomousFlow({ anamnesis, fisik, masalah, resep, onSignResep, resepDitandatangani }: Props) {
  const [hasil, setHasil] = useState<HasilLab[]>([])
  const orders = terbitkanOrder(anamnesis, fisik)
  const tafsiran: TafsiranLab[] = tafsirkanLab(hasil)
  const kontrol = jadwalkanKontrol(masalah, tafsiran, orders.some((o) => o.segera))

  // Keamanan resep diperiksa modul interaksi yang sudah ada — bukan ditanyakan
  // ke model. Interaksi obat punya jawaban yang benar dan bisa diuji.
  const butir = resep.map((r) => cocokkanNama(r)).filter((b): b is NonNullable<typeof b> => b !== null)
  const temuan = butir.length > 1 ? periksa(butir) : []

  function isiHasil(nama: string, nilai: string) {
    const n = Number(nilai)
    setHasil((prev) => {
      const lain = prev.filter((h) => h.nama !== nama)
      return Number.isFinite(n) && nilai !== '' ? [...lain, { nama, nilai: n }] : lain
    })
  }

  const fisikTerisi = Boolean(fisik.general || fisik.perSystem) && fisik.doctorVerified

  return (
    <Card>
      <SectionTitle
        title="Autonomous clinical flow"
        subtitle="Runs end to end — with two gates only a doctor can open"
      />

      {/* Papan pembagian kerja, ditampilkan lebih dulu dan tidak disembunyikan:
          siapa memutuskan apa adalah hal pertama yang harus jelas pada sistem
          yang ikut menulis resep. */}
      <div className="mt-3 space-y-1">
        {TAHAP.map((t) => {
          const selesai =
            t.key === 'anamnesis' ? Boolean(anamnesis.keluhanUtama)
            : t.key === 'diagnosis' ? masalah.length > 0
            : t.key === 'fisik' ? fisikTerisi
            : t.key === 'order' ? orders.length > 0
            : t.key === 'hasil' ? tafsiran.length > 0
            : t.key === 'resep' ? Boolean(resepDitandatangani)
            : true
          return (
            <div key={t.key} className={`flex items-start gap-2 rounded-lg p-2 ${
              t.gerbang ? 'border border-amber-300/60 bg-amber-50/60 dark:border-amber-500/25 dark:bg-amber-500/5' : 'bg-neutral-50 dark:bg-white/5'
            }`}>
              <span className={`mt-0.5 shrink-0 text-xs ${selesai ? 'text-brand' : 'text-neutral-300 dark:text-neutral-600'}`}>
                {selesai ? '●' : '○'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-ink dark:text-white">{t.label}</span>
                  <LencanaPelaku pelaku={t.pelaku} />
                  {t.gerbang && <span className="rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">Doctor gate</span>}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{t.alasan}</p>
              </div>
            </div>
          )
        })}
      </div>

      {!fisikTerisi && (
        <p className="mt-3 rounded-xl bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Waiting on the physical examination. Orders below come from the history alone until a doctor examines and
          verifies — findings on examination frequently change what should be ordered.
        </p>
      )}

      <div className="mt-4">
        <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">
          Ordered automatically &middot; {orders.length}
        </div>
        <p className="mt-0.5 text-[11px] text-neutral-400">
          Chosen by indication rules, each carrying the reason it was ordered. Nothing is ordered &ldquo;just in case&rdquo;.
        </p>
        <div className="mt-1.5 space-y-1">
          {orders.map((o: OrderTerbit) => (
            <div key={o.id} className={`rounded-lg p-2 ${o.segera ? 'bg-red-50 dark:bg-red-500/10' : 'bg-neutral-50 dark:bg-white/5'}`}>
              <div className="flex flex-wrap items-center gap-1.5">
                {o.segera && <span className="rounded-full bg-red-500/15 px-1.5 text-[10px] font-bold text-red-600 dark:text-red-400">Urgent</span>}
                <span className="text-xs font-bold text-ink dark:text-white">{o.pemeriksaan}</span>
                <span className="text-[10px] text-neutral-400">{o.jenis === 'lab' ? 'Laboratory' : 'Imaging'}</span>
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{o.indikasi} &middot; from {o.dari}</p>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="text-xs leading-relaxed text-neutral-500">
              No investigation is indicated by the history and examination as recorded. That is a result, not a gap —
              testing without an indication produces incidental findings that then have to be chased.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Results &amp; interpretation</div>
        <p className="mt-0.5 text-[11px] text-neutral-400">
          Values are compared against reference ranges arithmetically. A number is inside its range or it is not —
          this is never asked of a language model.
        </p>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          {RUJUKAN.slice(0, 8).map((r) => (
            <label key={r.nama} className="block">
              <span className="text-[10px] text-neutral-500">{r.nama} ({r.satuan})</span>
              <input
                type="number"
                step="any"
                onChange={(e) => isiHasil(r.nama, e.target.value)}
                placeholder={`${r.bawah}–${r.atas}`}
                className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-2 text-xs text-ink outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </label>
          ))}
        </div>
        {tafsiran.length > 0 && (
          <div className="mt-2 space-y-1">
            {tafsiran.map((t) => (
              <div key={t.nama} className={`rounded-lg p-2 ${
                t.status === 'normal' ? 'bg-neutral-50 dark:bg-white/5' : 'bg-amber-50 dark:bg-amber-500/10'
              }`}>
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className="text-xs font-bold text-ink dark:text-white">{t.nama}</span>
                  <span className={`text-xs font-black ${t.status === 'normal' ? 'text-neutral-500' : 'text-amber-700 dark:text-amber-400'}`}>
                    {t.nilai} {t.satuan}
                  </span>
                  <span className="text-[10px] text-neutral-400">ref {t.rentang}</span>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{t.arti}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Prescription</div>
        {resep.length === 0 && <p className="mt-0.5 text-xs text-neutral-500">Nothing drafted yet.</p>}
        {resep.length > 0 && (
          <>
            <ul className="mt-1 space-y-0.5">
              {resep.map((r, i) => (
                <li key={i} className="rounded-lg bg-neutral-50 p-2 text-xs text-ink dark:bg-white/5 dark:text-white">{r}</li>
              ))}
            </ul>
            {temuan.length > 0 && (
              <div className="mt-1.5 rounded-lg bg-red-50 p-2 dark:bg-red-500/10">
                <div className="t-mikro font-bold uppercase tracking-wide text-red-600">Interaction check</div>
                <ul className="mt-0.5 space-y-1">
                  {temuan.map((t, i) => (
                    <li key={i} className="text-[11px] leading-relaxed text-red-700 dark:text-red-300">
                      <span className="font-bold">{t.a.nama} + {t.b.nama}: </span>{t.judul}. {t.sebab}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-2 rounded-xl border border-amber-300/60 bg-amber-50/60 p-2.5 dark:border-amber-500/25 dark:bg-amber-500/5">
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                Drafted by AI and checked automatically for interactions. It is
                <span className="font-bold"> not valid until a doctor signs it.</span>
              </p>
              {resepDitandatangani ? (
                <p className="mt-1.5 text-[11px] font-bold text-brand">Signed &mdash; the prescription is now in effect.</p>
              ) : (
                <button onClick={onSignResep} className="mt-1.5 rounded-full bg-brand px-3 py-1.5 text-[11px] font-bold text-white">
                  Review &amp; sign
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className={`mt-4 rounded-xl p-2.5 ${kontrol.mendesak ? 'bg-red-50 dark:bg-red-500/10' : 'bg-brand/5 dark:bg-brand/10'}`}>
        <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Follow-up</div>
        <p className="mt-0.5 text-sm font-bold text-ink dark:text-white">
          {kontrol.hari === 0 ? 'Same day' : kontrol.hari === 1 ? 'Within 24 hours' : `In ${kontrol.hari} days`}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">{kontrol.alasan}</p>
      </div>

      <p className="mt-3 text-[10.5px] leading-relaxed text-neutral-400">
        Autonomous here means no data-copying is left for a human to do. It does not mean no doctor is responsible:
        the physical examination must be entered and verified by the examining doctor, and the prescription has no
        effect until signed. Order selection, reference-range flagging and interaction checking are done by explicit
        rules rather than a language model, because each of those has a checkable right answer.
      </p>
    </Card>
  )
}

export default AutonomousFlow
