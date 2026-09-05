import { useEffect, useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { api, type TranslateLanguage, type TranslateResult } from '../lib/api'

// Penerjemah kedokteran. Lihat server/src/translate.ts untuk perisai
// deterministik yang melindungi dosis, kode, dan nama obat — dan kenapa itu,
// bukan kepintaran modelnya, yang membuat terjemahan ini aman dipakai klinis.

export function Translator() {
  const [langs, setLangs] = useState<TranslateLanguage[]>([])
  const [registers, setRegisters] = useState<{ key: string; label: string }[]>([])
  const [from, setFrom] = useState('id')
  const [to, setTo] = useState('en')
  const [register, setRegister] = useState('klinis')
  const [text, setText] = useState('')
  const [hasil, setHasil] = useState<TranslateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ditahan, setDitahan] = useState('')

  useEffect(() => {
    api.translateLanguages()
      .then((r) => { setLangs(r.languages); setRegisters(r.registers) })
      .catch(() => { /* daftar bahasa cadangan di bawah */ })
  }, [])

  async function jalankan() {
    const t = text.trim()
    if (!t) return
    setLoading(true); setError(''); setDitahan(''); setHasil(null)
    try {
      setHasil(await api.translate(t, from, to, register))
    } catch (e) {
      const m = (e as Error).message
      // Terjemahan yang ditahan perisai dibedakan dari kegagalan biasa: yang
      // satu berarti ada dosis atau kode yang berubah, yang lain berarti
      // jaringan. Menyamakan keduanya menyembunyikan yang penting.
      if (m.includes('protected_terms_altered')) {
        setDitahan('The translation was withheld because the model altered protected content — a dose, code, unit or drug name. Nothing is shown rather than showing a clinically wrong translation. Try again, or shorten the text.')
      } else if (m.includes('ai_not_configured')) {
        setError('Translation needs the AI backend, which is not configured on this server yet.')
      } else {
        setError('Could not reach the translator right now.')
      }
    } finally {
      setLoading(false)
    }
  }

  function tukar() {
    setFrom(to); setTo(from)
    if (hasil) { setText(hasil.teks); setHasil(null) }
  }

  const daftar = langs.length ? langs : [
    { kode: 'en', nama: 'English', asli: 'English' },
    { kode: 'id', nama: 'Indonesian', asli: 'Bahasa Indonesia' },
  ]
  const pilihanRegister = registers.length ? registers : [
    { key: 'pasien', label: 'For the patient' },
    { key: 'klinis', label: 'For clinicians' },
    { key: 'akademik', label: 'Academic' },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <SectionTitle
        title="Medical Translator"
        subtitle="Thirteen languages, written the way a native clinician writes — with doses and codes locked"
      />

      <Card>
        <div className="flex items-end gap-2">
          <label className="min-w-0 flex-1">
            <span className="t-mikro font-bold uppercase tracking-wide text-neutral-500">From</span>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-0.5 h-11 w-full rounded-xl border border-neutral-200 bg-white px-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              {daftar.map((l) => <option key={l.kode} value={l.kode}>{l.asli}</option>)}
            </select>
          </label>
          <button
            onClick={tukar}
            aria-label="Swap languages"
            className="mb-0.5 h-11 shrink-0 rounded-xl border border-neutral-200 px-3 text-sm font-bold text-neutral-500 dark:border-white/10"
          >
            ⇄
          </button>
          <label className="min-w-0 flex-1">
            <span className="t-mikro font-bold uppercase tracking-wide text-neutral-500">To</span>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-0.5 h-11 w-full rounded-xl border border-neutral-200 bg-white px-2 text-sm text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              {daftar.map((l) => <option key={l.kode} value={l.kode}>{l.asli}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-3">
          <span className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Who is reading it</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {pilihanRegister.map((r) => (
              <button
                key={r.key}
                onClick={() => setRegister(r.key)}
                className={`min-h-[32px] rounded-full border px-3 text-xs font-bold transition ${
                  register === r.key
                    ? 'border-brand bg-brand text-white'
                    : 'border-neutral-200 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            This changes the register, never the content. A patient version explains its terms; a clinical version
            keeps them.
          </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={12000}
          placeholder="Paste discharge instructions, a referral letter, a lab report, patient education…"
          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-ink outline-none focus:border-brand dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">{text.length} / 12,000</span>
          <button
            onClick={jalankan}
            disabled={loading || !text.trim() || from === to}
            className="liquid-glass-btn liquid-glass-btn--primary h-11 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? 'Translating…' : 'Translate'}
          </button>
        </div>
        {from === to && <p className="mt-1 text-[11px] text-amber-600">Source and target languages are the same.</p>}
      </Card>

      {ditahan && (
        <Card className="!bg-red-50 dark:!bg-red-500/10">
          <div className="t-mikro font-bold uppercase tracking-wide text-red-600">Translation withheld</div>
          <p className="mt-1 text-sm leading-relaxed text-red-700 dark:text-red-300">{ditahan}</p>
        </Card>
      )}
      {error && <Card><p className="text-sm text-neutral-500">{error}</p></Card>}

      {hasil && (
        <Card>
          <div className="flex items-start justify-between gap-2">
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">
              {daftar.find((l) => l.kode === hasil.ke)?.asli}
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(hasil.teks)}
              className="shrink-0 rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] font-bold text-neutral-500 dark:border-white/10"
            >
              Copy
            </button>
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink dark:text-white">{hasil.teks}</p>

          {hasil.dilindungi.length > 0 && (
            <div className="mt-3">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">
                Locked, never sent to the model · {hasil.dilindungi.length}
              </div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-400">
                These were removed before translation and put back exactly. The model never saw them, so it could not
                change them. If any had gone missing, the translation would have been withheld.
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {hasil.dilindungi.map((d) => (
                  <span key={d} className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-ink dark:bg-white/10 dark:text-white">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasil.catatan.length > 0 && (
            <div className="mt-3">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Translator’s notes</div>
              <ul className="mt-0.5 space-y-0.5">
                {hasil.catatan.map((c, i) => (
                  <li key={i} className="text-[11px] leading-relaxed text-neutral-500">· {c}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <p className="text-[11px] leading-relaxed text-neutral-400">
        Doses, units, blood pressures, durations, ICD/ATC codes, ontology identifiers, URLs and drug names are
        removed before translation and restored afterwards. If even one fails to come back, the translation is
        rejected rather than published — a wrong dose in a language you do not read is invisible to you, and that is
        exactly the failure this is built to prevent. A translation is still not a substitute for a professional
        interpreter when consent or a diagnosis is being discussed.
      </p>
    </div>
  )
}

export default Translator
