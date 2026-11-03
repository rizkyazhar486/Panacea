import { useMemo, useState } from 'react'
import { Cell3D, keteranganCuplikan } from '../../components/Cell3D'
import {
  ORGANEL, JALUR_METABOLIK, RANTAI, ringkasJalur, neracaGlukosa, neracaAsamLemak,
  ATP_PER_NADH, ATP_PER_FADH2, PROTON_PER_ATP, type Antarjemput,
} from '../../lib/cellBio'
import { evaluateMitochondrialQualityControl } from '../../lib/discovery/mitochondrialUprMitophagyEngine'
import {
  AMR_EPITOPE_CATALOG,
  evaluateEpitopeBindingAffinity,
  type DeNovoBinderCandidate,
} from '../../domains/quantum-biology/index.ts'
import { SubcellularMitochondrialAutophagyConsole } from '../../domains/quantum-biology/ui/SubcellularMitochondrialAutophagyConsole.tsx'

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

type Tab = 'sel' | 'glikolisis' | 'tca' | 'rantai' | 'neraca' | 'mitokondria' | 'quantum-binder'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'sel', label: 'Cell' },
  { id: 'glikolisis', label: 'Glycolysis' },
  { id: 'tca', label: 'TCA cycle' },
  { id: 'rantai', label: 'Respiratory chain' },
  { id: 'neraca', label: 'ATP balance' },
  { id: 'mitokondria', label: 'Mitophagy & Dynamics' },
  { id: 'quantum-binder', label: 'Quantum AMR Binder' },
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

  // Mitophagy state
  const [deltaPsiMv, setDeltaPsiMv] = useState(-140)
  const [misfoldedRatio, setMisfoldedRatio] = useState(0.2)
  const [lysosomalPh, setLysosomalPh] = useState(4.8)
  const [atf5Active, setAtf5Active] = useState(true)

  const mitoFlux = useMemo(() => {
    return evaluateMitochondrialQualityControl({
      membranePotentialDeltaPsiMv: deltaPsiMv,
      matrixMisfoldedProteinRatio: misfoldedRatio,
      lysosomalAcidityPh: lysosomalPh,
      atf5RetrogradeSignalingActive: atf5Active,
    })
  }, [deltaPsiMv, misfoldedRatio, lysosomalPh, atf5Active])

  // Quantum AMR Binder state
  const [selectedTargetId, setSelectedTargetId] = useState('TARGET-MRSA-PBP2A')
  const [binderSequence, setBinderSequence] = useState('DYKIKTGFYDKLKDEYGYK')
  const [binderScaffold, setBinderScaffold] = useState<DeNovoBinderCandidate['designedScaffoldKind']>('NANOBODY_VHH')

  const currentEpitopeTarget = useMemo(() => {
    return AMR_EPITOPE_CATALOG.find((t) => t.targetId === selectedTargetId) ?? AMR_EPITOPE_CATALOG[0]
  }, [selectedTargetId])

  const bindingEval = useMemo(() => {
    try {
      const candidate: DeNovoBinderCandidate = {
        binderId: 'DESIGN-CANDIDATE-01',
        binderName: 'Custom De Novo Engineered Binder',
        sequence: binderSequence.trim().toUpperCase(),
        targetId: currentEpitopeTarget.targetId,
        computedMolecularWeightDa: binderSequence.length * 110,
        designedScaffoldKind: binderScaffold,
      }
      return {
        ok: true as const,
        result: evaluateEpitopeBindingAffinity(currentEpitopeTarget, candidate, '2026-11-03T12:00:00.000Z'),
      }
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }, [currentEpitopeTarget, binderSequence, binderScaffold])

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
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
            Reference-scale dimensions are typical estimates in micrometres, normalized against a 20 µm teaching cell;
            real dimensions vary by cell type, state and measurement method.
          </p>

          <div className="flex flex-wrap gap-1.5">
            {ORGANEL.map((o) => (
              <button
                key={o.kunci}
                type="button"
                aria-pressed={organel === o.kunci}
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
                <div className="text-sm font-black text-ink dark:text-white">{dipilih.nama}</div>
                <div className="shrink-0 text-[11px] font-bold text-neutral-500">
                  ≈{dipilih.ukuranUm} µm reference scale · {dipilih.membran === 0 ? 'no membrane' : `${dipilih.membran} membrane${dipilih.membran > 1 ? 's' : ''}`}
                </div>
              </div>
              <p className="mt-1 text-[12px] leading-snug text-neutral-600 dark:text-neutral-400">{dipilih.fungsi}</p>
              <p className="mt-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-800 dark:text-amber-300">
                {dipilih.klinis}
              </p>
              {dipilih.jumlah > 0 && (
                <p className="mt-1.5 text-[10px] text-neutral-500">
                  Reference count: about {dipilih.jumlah.toLocaleString()} per typical cell; actual abundance varies by cell type and state.
                </p>
              )}
            </div>
          )}

          {/* Jumlah yang digambar jauh lebih sedikit daripada jumlah rujukan.
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
              This view is a scale-constrained educational reconstruction, not a microscopy-derived segmentation or patient scan.
              It uses stated reference dimensions, counts and compartments; the primitive shapes are not ultrastructural evidence.
              Real microscopy-derived 3D datasets exist, but they are not bundled into this viewer under the current verified asset and licensing pipeline.
            </p>
          </div>
        </>
      )}

      {jalur && tahap && ringkas && (
        <>
          <div className="rounded-xl border border-neutral-100 p-3 dark:border-white/10">
            <div className="text-sm font-black text-ink dark:text-white">{jalur.nama}</div>
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
            <div className="mt-0.5 text-sm font-black text-ink dark:text-white">{tahap.enzim}</div>
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
                  <div className="text-sm font-black text-ink dark:text-white">Complex {k.nomor}</div>
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
                type="button"
                aria-pressed={antarjemput === a}
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
                  <span className="shrink-0 font-bold tabular-nums text-ink dark:text-white">{r.atp}</span>
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

      {tab === 'mitokondria' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SubcellularMitochondrialAutophagyConsole />

          <div style={{ borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#10b981' }}>
                  Pillar I · Mitochondrial Quality Control &amp; Dynamics
                </span>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff', marginTop: '0.25rem' }}>
                  PINK1-Parkin Mitophagy &amp; UPRmt Flux Simulator
                </h3>
              </div>
              <span style={{
                borderRadius: '9999px',
                padding: '0.25rem 0.625rem',
                fontSize: '9px',
                fontWeight: 800,
                backgroundColor:
                  mitoFlux.mitochondrialViabilityStatus === 'HEALTHY_POLARIZED' ? 'rgba(6,78,59,0.7)' :
                  mitoFlux.mitochondrialViabilityStatus === 'STRESSED_UPRMT_COMPENSATION' ? 'rgba(120,53,15,0.7)' :
                  mitoFlux.mitochondrialViabilityStatus === 'DEPOLARIZED_MITOPHAGY_COMMITTED' ? 'rgba(88,28,135,0.7)' : 'rgba(127,29,29,0.7)',
                color:
                  mitoFlux.mitochondrialViabilityStatus === 'HEALTHY_POLARIZED' ? '#6ee7b7' :
                  mitoFlux.mitochondrialViabilityStatus === 'STRESSED_UPRMT_COMPENSATION' ? '#fcd34d' :
                  mitoFlux.mitochondrialViabilityStatus === 'DEPOLARIZED_MITOPHAGY_COMMITTED' ? '#d8b4fe' : '#fca5a5',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                {mitoFlux.mitochondrialViabilityStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <p style={{ marginTop: '0.375rem', fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
              Simulates proteotoxic stress, retrograde nuclear compensation (ATF5/Hsp60), MFN1/2 fusion blockade, and autophagic clearance. Ref: {mitoFlux.metadata.referenceBasis}.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            <div style={{ borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem' }}>
              <label htmlFor="input-deltapsi" style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Membrane Potential (ΔΨm):</span>
                <span style={{ color: deltaPsiMv > -105 ? '#f87171' : '#34d399' }}>{deltaPsiMv} mV</span>
              </label>
              <input
                id="input-deltapsi"
                type="range" min="-180" max="-40" step="5" value={deltaPsiMv}
                onChange={(e) => setDeltaPsiMv(Number(e.target.value))}
                style={{ width: '100%', marginTop: '0.375rem' }}
              />
              <span style={{ fontSize: '9px', color: '#64748b', display: 'block', marginTop: '0.125rem' }}>
                Normal polarized: -180 to -140 mV. Depolarization &gt; -105 mV stabilizes PINK1 on OMM.
              </span>
            </div>

            <div style={{ borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem' }}>
              <label htmlFor="input-misfolded" style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Matrix Misfolded Ratio:</span>
                <span style={{ color: misfoldedRatio > 0.4 ? '#fbbf24' : '#60a5fa' }}>{(misfoldedRatio * 100).toFixed(0)}%</span>
              </label>
              <input
                id="input-misfolded"
                type="range" min="0" max="1" step="0.05" value={misfoldedRatio}
                onChange={(e) => setMisfoldedRatio(Number(e.target.value))}
                style={{ width: '100%', marginTop: '0.375rem' }}
              />
              <span style={{ fontSize: '9px', color: '#64748b', display: 'block', marginTop: '0.125rem' }}>
                Proteotoxic accumulation triggers ClpP protease &amp; mitochondrial UPRmt.
              </span>
            </div>

            <div style={{ borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem' }}>
              <label htmlFor="input-lysosomal-ph" style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <span>Lysosomal pH:</span>
                <span style={{ color: lysosomalPh > 5.5 ? '#f87171' : '#34d399' }}>{lysosomalPh.toFixed(1)}</span>
              </label>
              <input
                id="input-lysosomal-ph"
                type="range" min="4.0" max="7.0" step="0.1" value={lysosomalPh}
                onChange={(e) => setLysosomalPh(Number(e.target.value))}
                style={{ width: '100%', marginTop: '0.375rem' }}
              />
              <span style={{ fontSize: '9px', color: '#64748b', display: 'block', marginTop: '0.125rem' }}>
                Normal acidic digestion pH 4.5–5.0. De-acidification blocks degradation.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', textAlign: 'center' }}>
            <div style={{ padding: '0.625rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>PINK1/Parkin Priming</span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#38bdf8' }}>{mitoFlux.pink1ParkinPrimingScore.toFixed(2)}</span>
            </div>
            <div style={{ padding: '0.625rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>p-Ser65-Ub Rate</span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#a78bfa' }}>{mitoFlux.ubiquitinPhosphorylationRate.toFixed(2)}</span>
            </div>
            <div style={{ padding: '0.625rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>MFN1/2 Degradation</span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#f87171' }}>{mitoFlux.mfn1Mfn2DegradationPercentage.toFixed(0)}%</span>
            </div>
            <div style={{ padding: '0.625rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Autophagosome (LC3-II)</span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#34d399' }}>{(mitoFlux.autophagosomalEngulfmentRatio * 100).toFixed(0)}%</span>
            </div>
            <div style={{ padding: '0.625rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Lysosomal Clearance</span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fbbf24' }}>{mitoFlux.lysosomalClearanceCompletionPercentage.toFixed(0)}%</span>
            </div>
            <div style={{ padding: '0.625rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Hsp60 Induction</span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#e2e8f0' }}>{mitoFlux.uprmtRetrogradeResponse.chaperoneUpregulationFold.toFixed(2)}×</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'quantum-binder' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.875rem' }}>
            <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#06b6d4' }}>
              Pillar I · De Novo Therapeutics &amp; Quantum Biology
            </span>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff', marginTop: '0.25rem' }}>
              Marcus Electron Transfer &amp; De Novo AMR Epitope Binder
            </h3>
            <p style={{ marginTop: '0.375rem', fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
              Computes Marcus non-adiabatic electron transfer kinetics and Eisenberg-McLachlan solvation free energy for engineered nanobodies against priority AMR bacterial targets.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
            <div style={{ borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem' }}>
              <label htmlFor="select-target-id" style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '0.375rem' }}>
                Select Pathogen AMR Target:
              </label>
              <select
                id="select-target-id"
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                style={{ width: '100%', minHeight: '38px', padding: '0.375rem 0.5rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', fontSize: '11px', fontWeight: 600 }}
              >
                {AMR_EPITOPE_CATALOG.map((t) => (
                  <option key={t.targetId} value={t.targetId}>
                    {t.organism}: {t.targetName} ({t.pdbAccessionReference})
                  </option>
                ))}
              </select>
              <div style={{ marginTop: '0.5rem', fontSize: '10px', color: '#94a3b8' }}>
                <b>Epitope:</b> <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{currentEpitopeTarget.epitopeSequence}</span>
                <div style={{ marginTop: '0.125rem', color: '#64748b' }}>{currentEpitopeTarget.clinicalSignificance}</div>
              </div>
            </div>

            <div style={{ borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <label htmlFor="input-binder-seq" style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>De Novo Sequence (3–30 AA):</label>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button type="button" onClick={() => setBinderSequence('DYKIKTGFYDKLKDEYGYK')} style={{ fontSize: '9px', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', backgroundColor: '#1e293b', color: '#38bdf8', border: 'none', cursor: 'pointer' }}>VHH</button>
                  <button type="button" onClick={() => setBinderSequence('RWKWRFWKWLKKL')} style={{ fontSize: '9px', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', backgroundColor: '#1e293b', color: '#38bdf8', border: 'none', cursor: 'pointer' }}>Peptide</button>
                </div>
              </div>
              <input
                id="input-binder-seq"
                type="text"
                value={binderSequence}
                onChange={(e) => setBinderSequence(e.target.value.toUpperCase())}
                style={{ width: '100%', minHeight: '38px', padding: '0.375rem 0.5rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', fontSize: '12px', fontFamily: 'monospace', fontWeight: 700 }}
              />
              <div style={{ marginTop: '0.375rem', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                <span>Scaffold: {binderScaffold}</span>
                <span>Length: {binderSequence.trim().length} AA</span>
              </div>
            </div>
          </div>

          {bindingEval.ok ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ padding: '0.625rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Binding Free Energy ΔG</span>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: bindingEval.result.bindingFreeEnergy_dG_kcal_mol < 0 ? '#34d399' : '#f87171' }}>
                    {bindingEval.result.bindingFreeEnergy_dG_kcal_mol.toFixed(2)} kcal/mol
                  </span>
                </div>
                <div style={{ padding: '0.625rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Predicted Kd</span>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#38bdf8' }}>
                    {bindingEval.result.dissociationConstant_Kd_nM < 1000
                      ? `${bindingEval.result.dissociationConstant_Kd_nM.toFixed(1)} nM`
                      : `${(bindingEval.result.dissociationConstant_Kd_nM / 1000).toFixed(2)} µM`}
                  </span>
                </div>
                <div style={{ padding: '0.625rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Buried Surface Area</span>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fbbf24' }}>
                    {bindingEval.result.buriedSurfaceArea_A2.toFixed(0)} Å²
                  </span>
                </div>
                <div style={{ padding: '0.625rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Shape Comp. (Sc)</span>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#a78bfa' }}>
                    {bindingEval.result.shapeComplementarityScore.toFixed(2)}
                  </span>
                </div>
                <div style={{ padding: '0.625rem', borderRadius: '0.5rem', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>Efficacy Tier</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6ee7b7' }}>
                    {bindingEval.result.neutralizationEfficacyTier.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {bindingEval.result.electronTransferKinetics && (
                <div style={{ borderRadius: '0.5rem', border: '1px solid rgba(6,182,212,0.3)', backgroundColor: 'rgba(8,47,73,0.3)', padding: '0.75rem' }}>
                  <span style={{ fontSize: '9px', fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase' }}>
                    Marcus Electron Transfer Kinetics
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem', fontSize: '11px', color: '#cbd5e1' }}>
                    <div>Reorganization energy (λ): <b>{bindingEval.result.electronTransferKinetics.reorganizationEnergyLambda_eV} eV</b></div>
                    <div>Coupling matrix (Hda): <b>{bindingEval.result.electronTransferKinetics.electronicCouplingHda_meV} meV</b></div>
                    <div>Marcus rate constant (kET): <b style={{ color: '#34d399', fontFamily: 'monospace' }}>{bindingEval.result.electronTransferKinetics.rateConstant_kET_s1.toExponential(3)} s⁻¹</b></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#450a0a', border: '1px solid #991b1b', color: '#fca5a5', fontSize: '11px' }}>
              ⚠️ Design error: {bindingEval.error}
            </div>
          )}
        </div>
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