import { useEffect, useMemo, useState } from 'react'
import { Card, SectionTitle, inputClass } from '../components/ui'
import { IconStethoscope } from '../components/icons'
import { ambilTersembunyi, saring, langgananFitur } from '../lib/fiturTersembunyi'

// ─────────────────────────────────────────────────────────────────────────────
// Clinical Hub — one searchable index for the clinical & AI suite, same pattern
// as Fitness Hub and Wellness Hub. Lets the "Clinical & AI" sidebar group stay
// short (it had grown to 9 entries for doctors) without any destination
// becoming unreachable. Pure catalog, no external API.
//
// Everything in the group is listed here, including the entries that stay in
// the sidebar — a hub that only holds the leftovers makes you remember which
// half a tool lives in.
// ─────────────────────────────────────────────────────────────────────────────

interface Tool { to: string; name: string; what: string; kw: string; tag: string }

export const GROUPS: { title: string; emoji: string; tools: Tool[] }[] = [
  {
    title: 'Ask & Decide',
    emoji: '🧠',
    tools: [
      { to: '/chatbot', name: 'AI Chatbot', what: 'Ask a health question and get a sourced, plain-language answer', kw: 'chatbot ai tanya chat asisten pertanyaan kesehatan', tag: 'AI' },
      { to: '/second-opinion', name: 'Second Opinion', what: 'Run a diagnosis or plan past a second, independent read', kw: 'second opinion pendapat kedua banding diagnosis rencana', tag: 'AI' },
      { to: '/evidence', name: 'Clinical Evidence', what: 'The published evidence behind a treatment or claim', kw: 'evidence bukti klinis jurnal studi penelitian guideline pedoman', tag: 'Core' },
      { to: '/trials', name: 'Clinical Trials Finder', what: 'Find trials you may be eligible to join', kw: 'clinical trials uji klinis penelitian rekrutmen eligible peserta', tag: 'Core' },
    ],
  },
  {
    title: 'Practice Tools',
    emoji: '🩺',
    tools: [
      { to: '/emr', name: 'AI-EMR', what: 'Electronic records with AI-assisted note writing', kw: 'emr rekam medis elektronik catatan note soap dokter', tag: 'Dokter' },
      { to: '/clinical', name: 'Clinical Data', what: 'Your patient panel and their clinical numbers', kw: 'clinical data pasien panel klinis dokter', tag: 'Dokter' },
      { to: '/planning', name: 'Planning', what: 'Schedule and plan patient care', kw: 'planning jadwal rencana perawatan dokter', tag: 'Dokter' },
      { to: '/clinical-calculators', name: 'Clinical Calculators', what: 'Scores and risk calculators used at the bedside', kw: 'kalkulator klinis skor risiko score calculator gcs curb wells', tag: 'Core' },
    ],
  },
  {
    title: 'Specialty & Learning',
    emoji: '📚',
    tools: [
      { to: '/sexual-health', name: 'Sexual Health & OB-GYN', what: 'Reproductive, sexual and obstetric health topics', kw: 'sexual health seksual obgyn kandungan kebidanan reproduksi kehamilan kontrasepsi ims sti', tag: 'Core' },
      { to: '/longevity-curriculum', name: 'Longevity Curriculum', what: 'Structured teaching material on longevity medicine', kw: 'longevity curriculum kurikulum kuliah materi ajar penuaan aging', tag: 'Dokter' },
    ],
  },
]

export function ClinicalHub() {
  const [query, setQuery] = useState('')
  // Fitur yang disembunyikan pengguna juga hilang dari hub, bukan hanya dari
  // menu — kalau tidak, "disembunyikan" hanya berarti pindah tempat.
  const [tersembunyi, setTersembunyi] = useState<string[]>(ambilTersembunyi)
  useEffect(() => langgananFitur(setTersembunyi), [])
  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    const dasar = GROUPS.map((g) => ({ ...g, tools: saring(g.tools, tersembunyi) })).filter((g) => g.tools.length > 0)
    if (!q) return dasar
    return dasar.map((g) => ({
      ...g,
      tools: g.tools.filter((t) => (t.name + ' ' + t.what + ' ' + t.kw).toLowerCase().includes(q)),
    })).filter((g) => g.tools.length > 0)
  }, [q, tersembunyi])

  const total = GROUPS.reduce((s, g) => s + g.tools.length, 0)

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconStethoscope size={20} />} title="Clinical Hub" subtitle={`${total} clinical & AI tools, searchable by what you need`} />
        <input
          className={`${inputClass} mt-3`}
          placeholder="Search: bukti, uji klinis, kalkulator, EMR…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </Card>

      {filtered.length === 0 && (
        <Card className="!p-5 text-center text-sm text-neutral-500">
          Nothing matches "{query}" — try "bukti", "kalkulator", or "EMR".
        </Card>
      )}

      {filtered.map((g) => (
        <Card key={g.title} className="!p-5">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">{g.emoji} {g.title}</div>
          <div className="mt-3 space-y-1.5">
            {g.tools.map((t) => (
              <a key={t.to} href={`#${t.to}`} className="group flex items-start justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 transition hover:bg-brand/10 dark:bg-white/5">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-ink group-hover:text-brand-dark dark:text-white">{t.name}</div>
                  <div className="text-[12px] leading-snug text-neutral-500">{t.what}</div>
                </div>
                <span className="mt-1 shrink-0 text-neutral-300 transition group-hover:text-brand-dark">→</span>
              </a>
            ))}
          </div>
        </Card>
      ))}

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Beberapa alat di sini ditujukan untuk tenaga kesehatan dan hanya muncul bila akun kamu terverifikasi.
        Semuanya bersifat edukatif dan bukan pengganti penilaian klinis langsung.
      </div>
    </div>
  )
}

export default ClinicalHub
