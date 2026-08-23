import { useEffect, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { Card, SectionTitle, inputClass, Badge } from '../components/ui'
import { IconSparkle } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Life Compass — a vision/mission/purpose planner. Combines two validated
// psychological frameworks (values clarification + implementation intentions)
// with a plain-language digest of how different wisdom traditions frame
// meaning and hardship — offered neutrally, side by side, for the user to
// draw from whichever resonates, alongside the secular psychology. Pure
// localStorage, no external API, no diagnosis or therapy.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'pmd_lifecompass_v1'
interface State {
  values: string[]
  vision: string
  mission: string
  goals: { domain: string; goal: string; nextStep: string }[]
}
const DOMAINS = ['Health', 'Career / Craft', 'Relationships', 'Growth & Learning', 'Contribution']
function load(): State {
  try { return { values: [], vision: '', mission: '', goals: DOMAINS.map((d) => ({ domain: d, goal: '', nextStep: '' })), ...JSON.parse(localStorage.getItem(LS_KEY) || '{}') } } catch { /* ignore */ }
  return { values: [], vision: '', mission: '', goals: DOMAINS.map((d) => ({ domain: d, goal: '', nextStep: '' })) }
}

const VALUE_OPTIONS = [
  'Keluarga', 'Kesehatan', 'Kebebasan', 'Penguasaan diri', 'Kejujuran', 'Iman', 'Rasa ingin tahu', 'Berguna bagi orang lain',
  'Keamanan finansial', 'Daya cipta', 'Keberanian', 'Kedisiplinan', 'Welas asih', 'Petualangan', 'Warisan', 'Ketenangan batin',
]

interface Wisdom { tradition: string; teaching: string }
const WISDOM: Wisdom[] = [
  { tradition: 'Stoisisme (Epiktetos, Marcus Aurelius)', teaching: 'Pisahkan yang berada dalam kendali Anda — usaha, sikap, pilihan — dari yang tidak: hasil, orang lain, dan masa lalu. Kecemasan akan masa depan sering lahir dari usaha mengendalikan yang tidak dapat dikendalikan; alihkan tenaga itu ke tindakan benar Anda yang berikutnya.' },
  { tradition: 'Islam', teaching: 'Tawakal — kerjakan segala yang ada dalam kemampuan Anda, lalu serahkan hasilnya kepada Allah. Usaha adalah tanggung jawab Anda; hasilnya tidak sepenuhnya beban Anda sendiri, dan justru itulah yang meringankan kecemasan.' },
  { tradition: 'Kristen', teaching: '"Janganlah kamu khawatir akan hari esok, karena hari esok mempunyai kesusahannya sendiri" (Matius 6:34) — ajakan yang berulang untuk tetap berada pada hari ini, disertai gagasan bahwa kesukaran dapat menumbuhkan ketekunan dan tahan uji (Roma 5:3-4).' },
  { tradition: 'Buddhisme', teaching: 'Penderitaan kerap lahir dari melekat pada satu gambaran tetap tentang bagaimana segalanya harus berakhir. Ketidakkekalan berlaku dua arah: kesukaran berlalu, dan begitu pula setiap kegagalan — tidak melekat pada hasil mengurangi penderitaan tanpa mengurangi usaha.' },
  { tradition: 'Hinduisme (Bhagawadgita)', teaching: '"Engkau berhak atas perbuatanmu, tetapi tidak pernah atas buah perbuatanmu" — bertindaklah sepenuh hati, tetapi lepaskan cengkeraman pada hasil tertentu; di situlah akar ketenangan pikiran.' },
  { tradition: 'Ikigai / ganbaru (Jepang)', teaching: 'Makna hidup berada pada irisan antara yang Anda cintai, yang Anda kuasai, yang dibutuhkan dunia, dan yang dapat menghidupi Anda — dan ketekunan yang ajek serta tidak gemerlap (ganbaru) dalam kesulitan itu sendiri dihargai, bukan hanya hasilnya.' },
  { tradition: 'Psikologi positif (pertumbuhan pascatrauma)', teaching: 'Penelitian Tedeschi & Calhoun menemukan bahwa banyak orang yang melewati kesukaran berat melaporkan pertumbuhan kejiwaan yang nyata sesudahnya — bukan meskipun bergulat dengannya, melainkan sebagian justru karena mengolahnya lewat pemaknaan dan dukungan orang sekitar.' },
]

export function LifeCompass() {
  const [s, setS] = useState<State>(load)
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)) } catch { /* ignore */ }
  }, [s])

  const toggleValue = (v: string) =>
    setS((x) => ({ ...x, values: x.values.includes(v) ? x.values.filter((y) => y !== v) : x.values.length < 5 ? [...x.values, v] : x.values }))

  const setGoal = (domain: string, field: 'goal' | 'nextStep', val: string) =>
    setS((x) => ({ ...x, goals: x.goals.map((g) => (g.domain === domain ? { ...g, [field]: val } : g)) }))

  const filledGoals = s.goals.filter((g) => g.goal.trim()).length

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconSparkle size={20} />} title="Life Compass" subtitle="Susun visi, misi, dan langkah berikutnya — agar masa depan terasa sebagai arah, bukan kecemasan" />
        <Prosa kelas="mt-2 text-[13px] leading-relaxed text-neutral-500">Kecemasan tentang masa depan kerap muncul karena tidak ada rencana untuk mengarahkannya. Halaman ini menuntun dua hal yang secara konsisten ditemukan bermanfaat dalam psikologi: menyebutkan apa yang benar-benar penting bagi Anda (penjernihan nilai), dan mengubah impian besar menjadi satu langkah nyata berikutnya (implementation intentions — terbukti meningkatkan pelaksanaan secara berarti dibanding sekadar menetapkan sasaran).</Prosa>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Langkah 1 — Nilai inti Anda (pilih paling banyak 5)</div>
        <p className="mt-1 text-[12px] text-neutral-500">Bukan yang Anda pikir <i>seharusnya</i> Anda hargai — melainkan yang benar-benar terasa tidak dapat ditawar bagi Anda.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {VALUE_OPTIONS.map((v) => (
            <button key={v} onClick={() => toggleValue(v)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${s.values.includes(v) ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'}`}>{v}</button>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Langkah 2 — Visi Anda (10-20 tahun dari sekarang)</div>
        <p className="mt-1 text-[12px] text-neutral-500">Bila segalanya berjalan sebaik yang masuk akal, seperti apa hidup Anda nanti?</p>
        <textarea className={`${inputClass} mt-2 min-h-[80px] resize-none`} placeholder="misalnya: Saya ingin menjadi dokter yang dikenal karena…" value={s.vision} onChange={(e) => setS((x) => ({ ...x, vision: e.target.value }))} />
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Langkah 3 — Misi Anda (apa yang Anda kerjakan, dan untuk siapa)</div>
        <p className="mt-1 text-[12px] text-neutral-500">Satu atau dua kalimat: apa yang Anda kerjakan, untuk siapa, dan mengapa itu berarti.</p>
        <textarea className={`${inputClass} mt-2 min-h-[70px] resize-none`} placeholder="misalnya: Saya membantu pasien memahami kesehatannya cukup jelas untuk mengambil kendali atasnya." value={s.mission} onChange={(e) => setS((x) => ({ ...x, mission: e.target.value }))} />
      </Card>

      <Card className="!p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Step 4 — One goal + one next step, per life domain</div>
          <Badge tone={filledGoals > 0 ? 'brand' : 'low'}>{filledGoals}/{DOMAINS.length} started</Badge>
        </div>
        <div className="mt-3 space-y-4">
          {s.goals.map((g) => (
            <div key={g.domain} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="text-[12px] font-black text-brand-dark">{g.domain}</div>
              <input className={`${inputClass} mt-1.5`} placeholder="Satu tujuan di bidang ini…" value={g.goal} onChange={(e) => setGoal(g.domain, 'goal', e.target.value)} />
              <input className={`${inputClass} mt-1.5`} placeholder="This week's concrete next step…" value={g.nextStep} onChange={(e) => setGoal(g.domain, 'nextStep', e.target.value)} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-5">
        <div className="text-xs font-black uppercase tracking-wide text-neutral-500">Saat Anda cemas akan masa depan</div>
        <Prosa kelas="mt-1 text-[12px] text-neutral-500">Tiap tradisi merumuskannya dengan cara berbeda — ditampilkan berdampingan, bukan untuk memberi tahu mana yang harus Anda yakini, melainkan agar Anda dapat mengambil dari yang mana pun yang berbicara kepada Anda.</Prosa>
        <div className="mt-3 space-y-3">
          {WISDOM.map((w) => (
            <div key={w.tradition} className="rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-white/5">
              <div className="text-[12px] font-black text-ink dark:text-ink">{w.tradition}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{w.teaching}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:bg-white/5">
        Kerangka: teori nilai Schwartz; penelitian implementation intention Gollwitzer (efek
        meta-analitik pada keterlaksanaan tujuan, Gollwitzer &amp; Sheeran, 2006); model pertumbuhan
        pascatrauma Tedeschi &amp; Calhoun. Ringkasan tiap tradisi kebijaksanaan di sini mau tidak mau
        singkat — telusuri sumber aslinya dan komunitas Anda sendiri untuk pemahaman yang utuh. Alat ini
        untuk perenungan, bukan terapi — bila kecemasan akan masa depan terasa memberatkan, hubungi juga
        tenaga kesehatan jiwa (lihat Periksa Kesehatan Jiwa di aplikasi ini).
      </div>
    </div>
  )
}

export default LifeCompass
