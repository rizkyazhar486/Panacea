import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge, Field, inputClass, Button } from '../components/ui'
import { IconShield } from '../components/icons'
import { useStore } from '../lib/store'
import {
  auditSeo, analyseAb, requiredSampleSize, segment, analyseSentiment,
  type Customer,
} from '../lib/ownerAnalytics'

// Owner tools: SEO audit, A/B testing, RFM segmentation, sentiment triage.
// Owner-only — these expose aggregate business data.

type Tab = 'seo' | 'ab' | 'segmen' | 'sentimen'

export function OwnerAnalytics() {
  const { account } = useStore()
  const [tab, setTab] = useState<Tab>('seo')

  if (!account) return null
  if (account.role !== 'owner' && !account.isOwner) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <Card className="!p-5">
          <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            Halaman ini hanya untuk pemilik platform.
          </p>
        </Card>
      </div>
    )
  }

  const TABS: { id: Tab; l: string }[] = [
    { id: 'seo', l: 'SEO' },
    { id: 'ab', l: 'A/B Test' },
    { id: 'segmen', l: 'Segmentasi' },
    { id: 'sentimen', l: 'Sentimen' },
  ]

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-2xl">📊</span>
        <div>
          <h1 className="text-lg font-black text-ink dark:text-white">Owner Analytics</h1>
          <p className="text-xs text-neutral-400">SEO, eksperimen, segmentasi, dan sentimen</p>
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${tab === t.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'seo' && <SeoTab />}
      {tab === 'ab' && <AbTab />}
      {tab === 'segmen' && <SegmentTab />}
      {tab === 'sentimen' && <SentimentTab />}
    </div>
  )
}

/* ── SEO ───────────────────────────────────────────────────────────────────── */
function SeoTab() {
  const [i, setI] = useState({
    title: 'Panaceamed — Klinik AI Praktis untuk Akses Kesehatan Anda',
    metaDescription: '',
    h1Count: 1, wordCount: 450, imagesTotal: 8, imagesWithAlt: 5,
    hasCanonical: false, mobileFriendly: true, loadSeconds: 2.4,
    internalLinks: 6, httpsEnabled: true, hasStructuredData: false,
  })
  const r = useMemo(() => auditSeo(i), [i])
  const set = (p: Partial<typeof i>) => setI({ ...i, ...p })

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconShield size={18} />} title="Audit SEO" subtitle="Masukkan kondisi halaman yang ingin dinilai" />
        <div className="mt-3 grid gap-2">
          <Field label="Title tag"><input className={inputClass} value={i.title} onChange={(e) => set({ title: e.target.value })} /></Field>
          <Field label="Meta description"><input className={inputClass} value={i.metaDescription} onChange={(e) => set({ metaDescription: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Jumlah H1"><input className={inputClass} inputMode="numeric" value={i.h1Count} onChange={(e) => set({ h1Count: Number(e.target.value) || 0 })} /></Field>
            <Field label="Jumlah kata"><input className={inputClass} inputMode="numeric" value={i.wordCount} onChange={(e) => set({ wordCount: Number(e.target.value) || 0 })} /></Field>
            <Field label="Total gambar"><input className={inputClass} inputMode="numeric" value={i.imagesTotal} onChange={(e) => set({ imagesTotal: Number(e.target.value) || 0 })} /></Field>
            <Field label="Gambar ber-alt"><input className={inputClass} inputMode="numeric" value={i.imagesWithAlt} onChange={(e) => set({ imagesWithAlt: Number(e.target.value) || 0 })} /></Field>
            <Field label="Waktu muat (detik)"><input className={inputClass} inputMode="decimal" value={i.loadSeconds} onChange={(e) => set({ loadSeconds: Number(e.target.value) || 0 })} /></Field>
            <Field label="Tautan internal"><input className={inputClass} inputMode="numeric" value={i.internalLinks} onChange={(e) => set({ internalLinks: Number(e.target.value) || 0 })} /></Field>
          </div>
          {([['mobileFriendly', 'Ramah seluler'], ['httpsEnabled', 'HTTPS aktif'], ['hasCanonical', 'Ada canonical'], ['hasStructuredData', 'Ada data terstruktur']] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-white/5">
              <input type="checkbox" checked={i[k]} onChange={(e) => set({ [k]: e.target.checked } as never)} />
              <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">{l}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card className="!p-4">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-neutral-500">Skor pemeriksaan</span>
          <span className="text-2xl font-black text-ink dark:text-white">{r.score}<span className="text-sm text-neutral-400">/100</span></span>
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
          Skor ini hanya mengukur item teknis di daftar ini. SEO sesungguhnya ditentukan oleh isi
          yang benar-benar menjawab kebutuhan pembaca — skor 100 pada halaman yang isinya dangkal
          tidak akan menang di hasil pencarian.
        </p>
        <div className="mt-3 space-y-1.5">
          {r.findings.map((f) => (
            <div key={f.area} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-bold text-ink dark:text-white">{f.area}</span>
                <Badge tone={f.status === 'baik' ? 'normal' : f.status === 'kritis' ? 'critical' : 'high'}>{f.status}</Badge>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{f.detail}</p>
              {f.fix && <p className="mt-1 text-[11px] leading-relaxed text-brand-dark">{f.fix}</p>}
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ── A/B ───────────────────────────────────────────────────────────────────── */
function AbTab() {
  const [cv, setCv] = useState('4000')
  const [cc, setCc] = useState('200')
  const [vv, setVv] = useState('4000')
  const [vc, setVc] = useState('232')
  const [planned, setPlanned] = useState('4000')
  const [baseline, setBaseline] = useState('5')
  const [mde, setMde] = useState('1')

  const r = useMemo(() => analyseAb({
    controlVisitors: Number(cv) || 0, controlConversions: Number(cc) || 0,
    variantVisitors: Number(vv) || 0, variantConversions: Number(vc) || 0,
    plannedPerArm: Number(planned) || 0,
  }), [cv, cc, vv, vc, planned])

  const need = useMemo(() => requiredSampleSize(Number(baseline) || 0, Number(mde) || 0), [baseline, mde])

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconShield size={18} />} title="Hitung ukuran sampel dulu" subtitle="Ditentukan SEBELUM uji dimulai, bukan sesudah" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Konversi saat ini (%)"><input className={inputClass} inputMode="decimal" value={baseline} onChange={(e) => setBaseline(e.target.value)} /></Field>
          <Field label="Selisih terkecil yang berarti (pp)"><input className={inputClass} inputMode="decimal" value={mde} onChange={(e) => setMde(e.target.value)} /></Field>
        </div>
        <div className="mt-2 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-neutral-500">Butuh per kelompok</span>
            <span className="text-xl font-black text-ink dark:text-white">{need.toLocaleString('id-ID')}</span>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
            Pada kekuatan 80% dan tingkat signifikansi 5%. Tetapkan angka ini dulu, lalu jalankan
            sampai tercapai.
          </p>
        </div>
      </Card>

      <Card className="!p-4">
        <SectionTitle icon={<IconShield size={18} />} title="Hasil uji" subtitle="Uji z dua proporsi" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Kontrol — pengunjung"><input className={inputClass} inputMode="numeric" value={cv} onChange={(e) => setCv(e.target.value)} /></Field>
          <Field label="Kontrol — konversi"><input className={inputClass} inputMode="numeric" value={cc} onChange={(e) => setCc(e.target.value)} /></Field>
          <Field label="Variasi — pengunjung"><input className={inputClass} inputMode="numeric" value={vv} onChange={(e) => setVv(e.target.value)} /></Field>
          <Field label="Variasi — konversi"><input className={inputClass} inputMode="numeric" value={vc} onChange={(e) => setVc(e.target.value)} /></Field>
        </div>
        <div className="mt-2">
          <Field label="Sampel per kelompok yang direncanakan"><input className={inputClass} inputMode="numeric" value={planned} onChange={(e) => setPlanned(e.target.value)} /></Field>
        </div>

        <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
            <span className="text-neutral-500">Kontrol</span><span className="text-right font-bold text-ink dark:text-white">{r.controlRate.toFixed(2)}%</span>
            <span className="text-neutral-500">Variasi</span><span className="text-right font-bold text-ink dark:text-white">{r.variantRate.toFixed(2)}%</span>
            <span className="text-neutral-500">Selisih</span><span className="text-right font-bold text-ink dark:text-white">{r.absoluteLiftPp >= 0 ? '+' : ''}{r.absoluteLiftPp.toFixed(2)} pp</span>
            <span className="text-neutral-500">Nilai p</span><span className="text-right font-bold text-ink dark:text-white">{r.pValue < 0.0001 ? '<0,0001' : r.pValue.toFixed(4)}</span>
            <span className="text-neutral-500">Selang kepercayaan 95%</span><span className="text-right font-bold text-ink dark:text-white">{r.ciLowPp.toFixed(2)} … {r.ciHighPp.toFixed(2)} pp</span>
          </div>
          <div className="mt-2"><Badge tone={r.significant ? 'normal' : r.readyToCall ? 'neutral' : 'high'}>{r.verdict}</Badge></div>
        </div>

        {r.warning && (
          <div className="mt-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
            <div className="text-[11px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">Peringatan metodologi</div>
            <p className="mt-1 text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{r.warning}</p>
          </div>
        )}

        <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">
          Selang kepercayaan lebih berguna daripada nilai p: ia memberi tahu seberapa besar
          perbedaannya, bukan sekadar apakah ada perbedaan. Selang yang melewati nol berarti arahnya
          pun belum pasti.
        </p>
      </Card>
    </>
  )
}

/* ── Segmentasi ────────────────────────────────────────────────────────────── */
const SEG_KEY = 'pmd_owner_customers_v1'

function SegmentTab() {
  const [rows, setRows] = useState<Customer[]>(() => {
    try { return JSON.parse(localStorage.getItem(SEG_KEY) || '[]') } catch { return [] }
  })
  const [name, setName] = useState('')
  const [days, setDays] = useState('')
  const [uses, setUses] = useState('')
  const [spend, setSpend] = useState('')

  const segs = useMemo(() => segment(rows), [rows])

  function add() {
    if (!name.trim()) return
    const next = [...rows, {
      id: Math.random().toString(36).slice(2), name: name.trim(),
      daysSinceLastUse: Number(days) || 0, usesLast90Days: Number(uses) || 0, totalSpend: Number(spend) || 0,
    }]
    setRows(next)
    try { localStorage.setItem(SEG_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    setName(''); setDays(''); setUses(''); setSpend('')
  }

  return (
    <>
      <Card className="!p-4">
        <SectionTitle icon={<IconShield size={18} />} title="Segmentasi RFM" subtitle="Recency, Frequency, Monetary" />
        <div className="mt-3 grid gap-2">
          <Field label="Nama pengguna"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Hari sejak terakhir"><input className={inputClass} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} /></Field>
            <Field label="Pemakaian 90 hari"><input className={inputClass} inputMode="numeric" value={uses} onChange={(e) => setUses(e.target.value)} /></Field>
            <Field label="Total belanja"><input className={inputClass} inputMode="numeric" value={spend} onChange={(e) => setSpend(e.target.value)} /></Field>
          </div>
          <Button onClick={add}>Tambahkan</Button>
        </div>
      </Card>

      {segs.length > 0 && (
        <Card className="!p-4">
          <div className="text-[11px] font-black uppercase tracking-wide text-neutral-400">Hasil segmentasi</div>
          <div className="mt-2 space-y-2">
            {segs.map((s) => (
              <div key={s.customer.id} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-ink dark:text-white">{s.customer.name}</span>
                  <Badge tone={s.segment === 'Juara' ? 'normal' : s.segment === 'Hilang' ? 'critical' : s.segment === 'Berisiko pergi' ? 'high' : 'low'}>{s.segment}</Badge>
                </div>
                <div className="mt-0.5 text-[10px] text-neutral-400">
                  {s.customer.daysSinceLastUse} hari lalu · {s.customer.usesLast90Days}× dalam 90 hari
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{s.action}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}

/* ── Sentimen ──────────────────────────────────────────────────────────────── */
function SentimentTab() {
  const [text, setText] = useState('Aplikasinya sangat membantu dan mudah dipakai, tapi kadang lemot dan agak ribet saat login.')
  const r = useMemo(() => analyseSentiment(text), [text])

  return (
    <Card className="!p-4">
      <SectionTitle icon={<IconShield size={18} />} title="Analisis sentimen" subtitle="Alat pemilah, bukan pengganti membaca" />
      <textarea
        className={inputClass + ' mt-3 min-h-24'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tempel ulasan atau komentar pengguna…"
      />
      <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-neutral-500">Kesimpulan</span>
          <Badge tone={r.label === 'positif' ? 'normal' : r.label === 'negatif' ? 'critical' : 'neutral'}>{r.label}</Badge>
        </div>
        {r.matchedPositive.length > 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-400">Positif: {r.matchedPositive.join(', ')}</p>
        )}
        {r.matchedNegative.length > 0 && (
          <p className="mt-1 text-[11px] leading-relaxed text-rose-700 dark:text-rose-400">Negatif: {r.matchedNegative.join(', ')}</p>
        )}
      </div>
      <div className="mt-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
        <p className="text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-200">{r.caveat}</p>
      </div>
    </Card>
  )
}

export default OwnerAnalytics
