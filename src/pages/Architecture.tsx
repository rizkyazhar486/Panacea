import { Card, SectionTitle, Badge } from '../components/ui'
import { IconShield, IconSparkle, IconEMR, IconBook, IconCheck } from '../components/icons'
import { WEIGHTS, S_THRESHOLD } from '../lib/cdss'

const MODULES = [
  ['EHR & Data Ingest', 'Konektor HL7/FHIR — daftar obat, lab, alergi, vital. Normalisasi input.'],
  ['Patient Context Engine', 'Sosioekonomi, bahasa, riwayat kepatuhan, ketersediaan & biaya obat.'],
  ['Vertical Reasoner', 'Mesin aturan + pedoman: dosing, penyesuaian renal/hepatik, kontraindikasi (Kemenkes/WHO/NICE). Output deterministik + skor.'],
  ['DDI & Pharmacovigilance', 'Basis interaksi terkurasi + prediktor ML (severity + evidence), alert real-time.'],
  ['Biomedical Knowledge Graph', 'Relasi terstruktur obat–penyakit–lab–mekanisme untuk asosiasi lateral & telusur.'],
  ['Generative LLM Lateral', 'LLM selaras-domain (gaya Med-PaLM) — diagnosis banding, alternatif terapi, teks edukasi, dengan provenance.'],
  ['Safety Filter / Hard Constraints', 'Gerbang berbasis aturan menolak resep yang melanggar kontraindikasi/DDI/margin dosis. Override wajib berjustifikasi & tercatat.'],
  ['Ensemble & Scoring', 'Menggabungkan output vertical + lateral menjadi peringkat rencana (lihat formula).'],
  ['Explainability & Rationale', 'Penjelasan untuk klinisi (sitasi pedoman) & versi awam untuk pasien.'],
  ['Audit, Logging & M&M', 'Telusur penuh, versioning model, pelacakan luaran.'],
  ['Federated Learning Orchestrator', 'Update model lintas RS tanpa berbagi data mentah (DP + secure aggregation).'],
  ['Clinician & Patient UI', 'SMART on FHIR embed untuk klinisi + aplikasi edukasi/pengingat pasien.'],
]

const FLOW = [
  'Klinisi membuka rekam → data FHIR ke Data Ingest.',
  'Vertical Reasoner: pencocokan pedoman, kalkulasi dosis, penyesuaian renal/hepatik, cek alergi → rekomendasi + flag risiko.',
  'DDI Engine: cek obat saat ini vs usulan → severity + referensi.',
  'LLM Lateral: prompt terstruktur (konteks + output vertical + KG) → alternatif & draf edukasi + rasional.',
  'Ensemble & Scoring: peringkat gabungan (formula di bawah).',
  'Safety Filter: blokir kandidat tidak aman; klinisi melihat opsi tersisa + penjelasan.',
  'Klinisi memilih/menyunting → AI mencatat keputusan, memicu edukasi pasien, menjadwalkan follow-up, log audit.',
  'Federated Orchestrator: agregasi update model lintas situs — data mentah tetap di institusi.',
]

const ROADMAP = [
  ['MVP · 0–6 bln', 'Vertical rule engine + DDI engine + UI klinisi; audit logging; pilot 1 RS.', 'high'],
  ['Fase 2 · 6–12 bln', 'LLM lateral (saran read-only) + explainability + RAG dengan KG & DB pedoman.', 'normal'],
  ['Fase 3 · 12–24 bln', 'Federated learning, personalisasi edukasi pasien, submisi regulatori, rollout multi-situs.', 'brand'],
] as const

const METRICS = [
  ['Safety-first', 'Pelanggaran hard-constraint (target 0), DDI false-negative, sensitivitas deteksi kontraindikasi.'],
  ['Utilitas klinis', 'Acceptance rate klinisi, time-to-decision, guideline-concordant prescription rate.'],
  ['Luaran pasien', 'Kepatuhan, insiden ADE, readmisi 30 hari.'],
  ['Trust/Explainability', 'Skor kegunaan penjelasan (Likert), monitoring pasca-deploy.'],
]

const REG = [
  'Klarifikasi status alat kesehatan (Kemenkes/BPOM) — daftarkan bila perlu; labeli sebagai "decision support", bukan resep otonom.',
  'Audit logs, model cards, dataset cards.',
  'IRB lokal untuk validasi klinis; pilot prospektif sebelum produksi.',
  'Proses incident-reporting & M&M untuk kejadian terkait AI.',
]

export function Architecture() {
  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          icon={<IconShield size={20} />}
          title="Arsitektur CDSS Hibrida — Lateral + Vertical"
          subtitle="Fondasi Panaceamed.id: dukungan resep yang aman (doctor-in-the-loop) + edukasi pasien terpersonalisasi"
        />
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">Doctor-in-the-loop</Badge>
          <Badge tone="brand">SMART on FHIR</Badge>
          <Badge tone="brand">RAG + Knowledge Graph</Badge>
          <Badge tone="brand">Federated Learning + DP</Badge>
          <Badge tone="high">AI = decision support, bukan resep otonom</Badge>
        </div>
      </Card>

      {/* Ensemble formula */}
      <Card className="border-2 border-brand/20">
        <SectionTitle icon={<IconSparkle size={18} />} title="Ensemble & Gerbang Keamanan" />
        <div className="rounded-2xl bg-ink p-5 text-center font-mono text-white">
          <div className="text-lg">
            CombinedScore<sub>i</sub> = α·V<sub>i</sub> + β·L<sub>i</sub> + γ·S<sub>i</sub>
          </div>
          <div className="mt-2 text-sm text-white/70">
            α={WEIGHTS.alpha} · β={WEIGHTS.beta} · γ={WEIGHTS.gamma}
          </div>
          <div className="mt-4 text-base">
            FinalScore<sub>i</sub> = CombinedScore<sub>i</sub> &nbsp;jika&nbsp; S<sub>i</sub> ≥ {S_THRESHOLD};
            &nbsp; selain itu <span className="text-accent">BLOCKED</span>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Legend tag="V" title="Vertical" desc="Konkordansi pedoman, kebenaran dosis; kontraindikasi keras ⇒ V=0." color="#0b7a4b" />
          <Legend tag="L" title="Lateral" desc="Confidence LLM terkalibrasi, relevansi konteks, manfaat alternatif." color="#3b82f6" />
          <Legend tag="S" title="Safety" desc="DDI severity, alergi, margin renal/hepatik; kontraindikasi absolut ⇒ S=0." color="#00BF63" />
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-neutral-900 p-4 text-xs leading-relaxed text-neutral-100">
{`function evaluate_candidate(plan, patient):
    V = compute_vertical_score(plan, patient)
    L = compute_lateral_score(plan, patient)
    S = compute_safety_score(plan, patient)   # DDI, allergy, renal/hepatic
    combined = α*V + β*L + γ*S
    if S < S_threshold:
        reject_with_reason("Safety gate: DDI/allergy/contraindication")
    else:
        return {score: combined, V, L, S, evidence: collate_evidence(plan)}
# Override rencana yang ditolak ⇒ wajib justifikasi klinisi (tersimpan di audit log).`}
        </pre>
        <p className="mt-2 text-xs text-neutral-400">
          → Diimplementasikan langsung pada modul <b>Planning</b> (CDSS Safety Engine).
        </p>
      </Card>

      {/* Modules */}
      <Card>
        <SectionTitle icon={<IconEMR size={18} />} title="Modul (Microservices)" subtitle="12 layanan inti" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map(([t, d], i) => (
            <div key={t} className="rounded-xl border border-neutral-100 p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand text-xs font-bold text-white">
                  {i + 1}
                </span>
                <h4 className="text-sm font-bold leading-tight">{t}</h4>
              </div>
              <p className="text-xs text-neutral-500">{d}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Data flow */}
      <Card>
        <SectionTitle title="Alur Data" subtitle="EHR → reasoning → DDI → LLM lateral → ensemble → safety gate → klinisi" />
        <ol className="space-y-2">
          {FLOW.map((f, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-dark">
                {i + 1}
              </span>
              <span className="text-neutral-600">{f}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Roadmap */}
        <Card>
          <SectionTitle title="Roadmap MVP → Skala" />
          <div className="space-y-3">
            {ROADMAP.map(([phase, desc, tone]) => (
              <div key={phase} className="rounded-xl border border-neutral-100 p-3">
                <Badge tone={tone}>{phase}</Badge>
                <p className="mt-1.5 text-sm text-neutral-600">{desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Eval metrics */}
        <Card>
          <SectionTitle icon={<IconBook size={18} />} title="Metrik Evaluasi" />
          <div className="space-y-2.5">
            {METRICS.map(([t, d]) => (
              <div key={t}>
                <div className="text-sm font-bold">{t}</div>
                <p className="text-xs text-neutral-500">{d}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Regulatory */}
      <Card>
        <SectionTitle icon={<IconShield size={18} />} title="Checklist Regulatori & Deployment" />
        <ul className="space-y-2">
          {REG.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-neutral-600">
              <IconCheck size={16} className="mt-0.5 shrink-0 text-brand" />
              {r}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-neutral-400">
          Privasi & training: federated learning untuk update adapter LLM & prediktor DDI; data tetap
          lokal, dikombinasikan dengan Differential Privacy & secure aggregation. Evaluasi pada test-set
          berfokus keamanan sebelum rollout, dengan versioning & jalur rollback.
        </p>
      </Card>
    </div>
  )
}

function Legend({ tag, title, desc, color }: { tag: string; title: string; desc: string; color: string }) {
  return (
    <div className="rounded-xl border border-neutral-100 p-3">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: color }}>
          {tag}
        </span>
        <span className="text-sm font-bold">{title}</span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">{desc}</p>
    </div>
  )
}
