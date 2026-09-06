import { useMemo, useState } from 'react'
import { Cell3D, keteranganCuplikan } from '../../components/Cell3D'
import {
  ORGANEL, JALUR_METABOLIK, RANTAI, ringkasJalur, neracaGlukosa, neracaAsamLemak,
  ATP_PER_NADH, ATP_PER_FADH2, PROTON_PER_ATP, type Antarjemput,
} from '../../lib/cellBio'

// ─────────────────────────────────────────────────────────────────────────────
// LABORATORIUM SEL — organel dalam tiga dimensi, dan biokimia yang berjalan di
// dalam masing-masing.
//
// Kedua bagiannya sengaja disatukan. Gambar sel tanpa metabolismenya hanya
// daftar nama benda; metabolisme tanpa selnya hanya rantai panah yang tidak
// berada di mana pun. Yang menghubungkan keduanya adalah pertanyaan "di
// kompartemen mana reaksi ini terjadi", dan jawabannya menentukan segalanya —
// glikolisis berjalan di sitosol justru karena itulah sebabnya sel darah merah
// yang tidak punya mitokondria tetap hidup.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'sel' | 'glikolisis' | 'tca' | 'rantai' | 'neraca'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'sel', label: 'Cell' },
  { id: 'glikolisis', label: 'Glycolysis' },
  { id: 'tca', label: 'TCA cycle' },
  { id: 'rantai', label: 'Respiratory chain' },
  { id: 'neraca', label: 'ATP balance' },
]

export function CellLab() {
  const [tab, setTab] = useState<Tab>('sel')
  const [organel, setOrganel] = useState<string | null>(null)
  const [tahapAktif, setTahapAktif] = useState(0)
  const [antarjemput, setAntarjemput] = useState<Antarjemput>('malat-aspartat')

  const dipilih = ORGANEL.find((o) => o.kunci === organel)
  const neraca = useMemo(() => neracaGlukosa(antarjemput), [antarjemput])
  const palmitat = neracaAsamLemak(16)

  const jalur = tab === 'glikolisis' || tab === 'tca'
    ? JALUR_METABOLIK.find((j) => j.kunci === tab)!
    : null
  const tahap = jalur?.tahap[Math.min(tahapAktif, jalur.tahap.length - 1)]
  const ringkas = jalur ? ringkasJalur(jalur) : null

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setTahapAktif(0) }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold active:scale-95 ${
              tab === t.id ? 'bg-brand text-white' : 'border border-brand/30 bg-brand-50 text-brand-dark'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sel' && (
        <>
          <Cell3D disorot={organel} onPilih={setOrganel} tinggi={320} />
          <p className="text-[11px] leading-snug text-neutral-500">
            The cell is cut open — a whole sphere would show only the membrane. Tap an organelle to isolate it.
            Sizes are the real ones in micrometres, held to scale against a 20 µm cell.
          </p>

          <div className="flex flex-wrap gap-1.5">
            {ORGANEL.map((o) => (
              <button
                key={o.kunci}
                onClick={() => setOrganel(organel === o.kunci ? null : o.kunci)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold active:scale-95 ${
                  organel === o.kunci ? 'bg-brand text-white' : 'border border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-400'
                }`}
              >
                {o.nama}
              </button>
            ))}
          </div>

          {dipilih && (
            <div className="rounded-xl border border-brand/30 bg-brand/[0.04] p-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-sm font-black text-ink dark:text-ink">{dipilih.nama}</div>
                <div className="shrink-0 text-[11px] font-bold text-neutral-500">
                  {dipilih.ukuranUm} µm · {dipilih.membran === 0 ? 'no membrane' : `${dipilih.membran} membrane${dipilih.membran > 1 ? 's' : ''}`}
                </div>
              </div>
              <p className="mt-1 text-[12px] leading-snug text-neutral-600 dark:text-neutral-400">{dipilih.fungsi}</p>
              <p className="mt-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-800 dark:text-amber-300">
                {dipilih.klinis}
              </p>
              {dipilih.jumlah > 0 && (
                <p className="mt-1.5 text-[10px] text-neutral-500">About {dipilih.jumlah.toLocaleString()} per typical cell.</p>
              )}
            </div>
          )}

          {/* Jumlah yang digambar jauh lebih sedikit daripada jumlah nyata.
              Mengatakannya lebih berguna daripada membiarkan pembelajar
              menghitung mitokondria di layar. */}
          <div className="rounded-xl bg-neutral-100/60 p-3 dark:bg-white/5">
            <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">What is drawn</div>
            <ul className="mt-1 space-y-0.5">
              {keteranganCuplikan().map((k) => (
                <li key={k} className="text-[11px] leading-snug text-neutral-500">{k}</li>
              ))}
            </ul>
            <p className="mt-1.5 text-[11px] leading-snug text-neutral-500">
              This is a model built from real dimensions, not a scan. No openly licensed cell mesh exists,
              so what makes it honest is the numbers: diameters, counts and compartments, all stated.
            </p>
          </div>
        </>
      )}

      {jalur && tahap && ringkas && (
        <>
          <div className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
            <div className="text-sm font-black text-ink dark:text-ink">{jalur.nama}</div>
            <div className="text-[11px] text-neutral-500">
              {jalur.masukan} → {jalur.keluaran} · in the {jalur.kompartemen.replace(/-/g, ' ')}
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-neutral-600 dark:text-neutral-400">{jalur.ringkas}</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range" min={0} max={jalur.tahap.length - 1} value={Math.min(tahapAktif, jalur.tahap.length - 1)}
              onChange={(e) => setTahapAktif(Number(e.target.value))}
              className="w-full accent-brand" aria-label="Step"
            />
            <span className="shrink-0 text-[11px] font-bold text-neutral-500">{tahap.nomor}/{jalur.tahap.length}</span>
          </div>

          <div className="rounded-xl border border-brand/30 bg-brand/[0.04] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-brand">Step {tahap.nomor}</div>
            <div className="mt-0.5 text-sm font-black text-ink dark:text-ink">{tahap.enzim}</div>
            <div className="mt-1 text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
              {tahap.substrat} <span className="text-brand">→</span> {tahap.produk}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Tanda label={`ΔG°′ ${tahap.deltaG > 0 ? '+' : ''}${tahap.deltaG} kJ/mol`} />
              {tahap.takTerbalikkan && <Tanda label="Irreversible — a control point" nada="merah" />}
              {tahap.atp !== 0 && <Tanda label={`${tahap.atp > 0 ? '+' : ''}${tahap.atp} ATP`} nada={tahap.atp > 0 ? 'hijau' : 'merah'} />}
              {tahap.nadh > 0 && <Tanda label={`+${tahap.nadh} NADH`} nada="hijau" />}
              {tahap.fadh2 > 0 && <Tanda label={`+${tahap.fadh2} FADH₂`} nada="hijau" />}
              {tahap.gtp ? <Tanda label={`+${tahap.gtp} GTP`} nada="hijau" /> : null}
              {tahap.co2 ? <Tanda label={`−${tahap.co2} CO₂`} /> : null}
              {tahap.karbonMasuk !== tahap.karbonKeluar && (
                <Tanda label={`C${tahap.karbonMasuk} → C${tahap.karbonKeluar}`} />
              )}
            </div>
            {tahap.kofaktor.length > 0 && (
              <div className="mt-2 text-[11px] text-neutral-500">Cofactors: {tahap.kofaktor.join(', ')}</div>
            )}
            {tahap.pengaturan && (
              <p className="mt-2 text-[11px] leading-snug text-neutral-600 dark:text-neutral-400">{tahap.pengaturan}</p>
            )}
            {tahap.klinis && (
              <p className="mt-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-800 dark:text-amber-300">
                {tahap.klinis}
              </p>
            )}
          </div>

          <div className="rounded-xl bg-neutral-100/60 p-3 dark:bg-white/5">
            <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Per turn of this pathway</div>
            <div className="mt-1 text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
              {tab === 'glikolisis'
                ? 'Net 2 ATP and 2 NADH per glucose — steps 5 to 10 run twice, once for each triose'
                : `${ringkas.nadh} NADH, ${ringkas.fadh2} FADH₂, ${ringkas.gtp} GTP and 2 CO₂ per acetyl-CoA`}
            </div>
          </div>
        </>
      )}

      {tab === 'rantai' && (
        <>
          <div className="space-y-2">
            {RANTAI.map((k) => (
              <div key={k.nomor} className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-sm font-black text-ink dark:text-ink">Complex {k.nomor}</div>
                  <div className="shrink-0 text-[11px] font-bold text-brand-dark">
                    {k.protonDipompa > 0 ? `${k.protonDipompa} H⁺ pumped` : 'pumps no H⁺'}
                  </div>
                </div>
                <div className="text-[11px] text-neutral-500">{k.nama}</div>
                <p className="mt-1 text-[11px] leading-snug text-neutral-600 dark:text-neutral-400">{k.catatan}</p>
                <div className="mt-1.5 text-[11px] text-neutral-500">Blocked by: {k.penghambat.join(', ')}</div>
              </div>
            ))}
          </div>
          {/* Rasio P/O tidak diketik, ia diturunkan dari data protonnya sendiri. */}
          <div className="rounded-xl bg-neutral-100/60 p-3 text-[11px] leading-snug text-neutral-600 dark:bg-white/5 dark:text-neutral-400">
            NADH enters at Complex I and drives {RANTAI[0].protonDipompa + RANTAI[2].protonDipompa + RANTAI[3].protonDipompa} protons
            out; FADH₂ enters at Complex II, which pumps none, so it drives only {RANTAI[2].protonDipompa + RANTAI[3].protonDipompa}.
            At {PROTON_PER_ATP} protons per ATP that is {ATP_PER_NADH} against {ATP_PER_FADH2} — the entire reason the two carriers
            are not worth the same. These are the modern P/O ratios, not the older whole numbers 3 and 2.
          </div>
        </>
      )}

      {tab === 'neraca' && (
        <>
          <div className="flex gap-1.5">
            {(['malat-aspartat', 'gliserol-fosfat'] as Antarjemput[]).map((a) => (
              <button
                key={a}
                onClick={() => setAntarjemput(a)}
                className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-bold active:scale-95 ${
                  antarjemput === a ? 'bg-brand text-white' : 'border border-brand/30 bg-brand-50 text-brand-dark'
                }`}
              >
                {a === 'malat-aspartat' ? 'Malate-aspartate' : 'Glycerol-3-phosphate'}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-brand/30 bg-brand/[0.04] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-brand">One glucose, fully oxidised</div>
            <div className="mt-0.5 text-4xl font-black text-brand-dark">{neraca.total} <span className="text-sm">ATP</span></div>
            <div className="mt-2 space-y-1">
              {neraca.rincian.map((r) => (
                <div key={r.sumber} className="flex items-baseline justify-between gap-3 text-[11px]">
                  <span className="min-w-0 text-neutral-600 dark:text-neutral-400">{r.sumber}</span>
                  <span className="shrink-0 font-bold tabular-nums text-ink dark:text-ink">{r.atp}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-neutral-500">{neraca.catatan}</p>
          </div>

          {palmitat.ok && (
            <div className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Palmitate (C16), beta-oxidation</div>
              <div className="mt-0.5 text-2xl font-black text-brand-dark">{palmitat.total} <span className="text-sm">ATP</span></div>
              <p className="mt-1 text-[11px] leading-snug text-neutral-600 dark:text-neutral-400">
                {palmitat.siklus} cycles, not {palmitat.asetilKoA} — the last cycle yields two acetyl-CoA at once.
                Activation costs two ATP equivalents, because ATP goes to AMP and breaks two high-energy bonds, not one.
                That is {((palmitat.total ?? 0) / 16).toFixed(1)} ATP per carbon against {(neraca.total / 6).toFixed(1)} for
                glucose — which is why fat, not glycogen, is what the body stores energy in.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Tanda({ label, nada }: { label: string; nada?: 'hijau' | 'merah' }) {
  const kelas = nada === 'hijau'
    ? 'bg-brand-50 text-brand-dark border-brand/30'
    : nada === 'merah'
      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30'
      : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-white/5 dark:text-neutral-400 dark:border-white/10'
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${kelas}`}>{label}</span>
}

export default CellLab
